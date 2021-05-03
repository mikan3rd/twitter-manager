import { ActressType, DMMApiClient, ItemActressType, ItemGenreType, ItemType } from "./DMMApiClient";
import { TwitterClient } from "./TwitterClient";
import { AccountType, AvActressBotsDB } from "./firebase/firestore";
import { logger } from "./firebase/functions";
import { AvActressBot } from "./models/AvActressBot";
import { createGenreHashtag } from "./utils";

export const tweetAvPackage = async (account: AccountType) => {
  const { accessToken, secret } = account;

  const actressInfo = await getTargetActress(account);
  const actressItems = await getActressItems(Number(actressInfo.id));
  const status = getAvPackageStatus(actressInfo, actressItems);
  const images = actressItems.map((item) => item["imageURL"]["large"]);

  const client = TwitterClient.get({ accessTokenKey: accessToken, accessTokenSecret: secret });
  const mediaIds = await client.uploadImages(images);
  await client.postTweet({ status, mediaIds });
};

const getTargetActress = async (account: AccountType) => {
  const doc = await AvActressBotsDB.doc(account.userId).get();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const avActressBot = new AvActressBot(account.userId, doc.data() as any);

  const LIMIT = 10;
  let targetActress: ActressType | undefined;
  let firstActress: ActressType | undefined;
  for (const i of Array(LIMIT).keys()) {
    const itemResponse = await DMMApiClient.getItemList({
      keyword: "単体作品",
      offset: i * 100 + 1,
    });
    const {
      data: {
        result: { items },
      },
    } = itemResponse;

    const actressNestedList = items
      .filter((item) => item.iteminfo.actress)
      .map((item) => item.iteminfo.actress as ItemActressType[]);
    const actressList = ([] as ItemActressType[]).concat(...actressNestedList);

    for (const tmpActress of actressList) {
      if (!firstActress) {
        const result = await getActressInfo(tmpActress.id);
        if (result) {
          firstActress = result;
        }
      }
      if (avActressBot.selectedActressIds.includes(tmpActress.id)) {
        continue;
      }
      const actress = await getActressInfo(tmpActress.id);
      if (actress) {
        targetActress = actress;
        break;
      }
      avActressBot.addSelectedActressIds([tmpActress.id]);
    }

    if (targetActress) {
      logger.log(`${i + 1} / ${LIMIT}`);
      break;
    }
  }

  if (!targetActress) {
    logger.log("New Actress Not Found!");
    if (firstActress) {
      targetActress = firstActress;
    }
    avActressBot.clearSelectedActressIds();
  }

  if (targetActress) {
    avActressBot.addSelectedActressIds([Number(targetActress.id)]);
    logger.log(targetActress.id, targetActress.name);
  }
  logger.log("selectedActressIds:", avActressBot.selectedActressIds.length);

  await avActressBot.saveFirestore();

  if (!targetActress) {
    throw Error("targetActress was not fonund!!");
  }

  return targetActress;
};

const getActressInfo = async (actressId: number) => {
  const actressResponse = await DMMApiClient.getActressSearch({ actressId });
  const {
    data: {
      result: { result_count, actress },
    },
  } = actressResponse;
  if (result_count === 0) {
    return null;
  }
  return actress[0];
};

const getActressItems = async (actressId: number) => {
  const response = await DMMApiClient.getItemList({
    keyword: "単体作品",
    article: "actress",
    articleId: actressId,
  });
  const {
    data: {
      result: { items },
    },
  } = response;
  return items;
};

const getAvPackageStatus = (actressInfo: ActressType, actressItems: ItemType[]) => {
  const { name, ruby, height, cup, bust, waist, hip, hobby, birthday, prefectures } = actressInfo;
  let mainContentList = ["", `【女優】${name}`];
  if (ruby && ruby !== name) {
    mainContentList = mainContentList.concat([`【よみがな】${ruby}`]);
  }
  if (height) {
    mainContentList = mainContentList.concat([`【身長】${height}cm`]);
  }
  if (cup) {
    mainContentList = mainContentList.concat([`【カップ】${cup}カップ`]);
  }
  if (bust && waist && hip) {
    mainContentList = mainContentList.concat([`【サイズ】B:${bust} W:${waist} H:${hip}`]);
  }
  if (birthday) {
    mainContentList = mainContentList.concat([`【誕生日】${birthday}`]);
  }
  if (prefectures) {
    mainContentList = mainContentList.concat([`【出身地】${prefectures}`]);
  }
  if (hobby) {
    mainContentList = mainContentList.concat([`【趣味】${hobby}`]);
  }
  mainContentList = mainContentList.concat([""]);
  const linkContentList = ["", "【この女優の動画はコチラ！】", actressInfo["listURL"]["digital"]];
  const nestedGenreList = actressItems
    .filter((item) => item.iteminfo.genre)
    .map((item) => item.iteminfo.genre as ItemGenreType[]);

  const genreList = ([] as ItemGenreType[]).concat(...nestedGenreList);
  const genreObject: {
    [name: string]: { genre: ItemGenreType; count: number };
  } = {};
  genreList.forEach((genre) => {
    const genreId = genre.id;
    const target = genreObject[genreId];
    if (target) {
      genreObject[genreId].count = target.count + 1;
    } else {
      genreObject[genreId] = { genre, count: 1 };
    }
  });
  const sortedGenreList = Object.values(genreObject)
    .sort((a, b) => (a.count > b.count ? -1 : 1))
    .map((item) => item.genre.name);
  const hashtagList = createGenreHashtag([name, ...sortedGenreList]);

  let status = "";
  // eslint-disable-next-line no-constant-condition
  while (true) {
    status = mainContentList.concat([hashtagList.join("\n"), ...linkContentList]).join("\n");
    if (status.length < 278) {
      break;
    }
    if (hashtagList.length > 0) {
      hashtagList.pop();
    } else if (mainContentList.length > 0) {
      mainContentList.pop();
    }
  }
  return status;
};
