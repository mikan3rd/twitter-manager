import * as admin from 'firebase-admin';

import { DMMApiClient, ItemActressType, ItemType, ItemGenreType, ActressType } from './DMMApiClient';
import { TwitterClient } from './TwitterClient';
import { createGenreHashtag } from './utils';

const ref = admin
  .firestore()
  .collection('twitter')
  .doc('av_actress_bot');

export const tweetAvPackage = async () => {
  const actressInfo = await getTargetActress();
  const actressItems = await getActressItems(Number(actressInfo.id));
  const status = getAvPackageStatus(actressInfo, actressItems);
  const images = actressItems.map(item => item['imageURL']['large']);

  const client = TwitterClient.get('av_video_bot');
  const mediaIds = await client.uploadImages(images);
  const result = await client.postTweet({ status, mediaIds });
};

const getTargetActress = async () => {
  const doc = await ref.get();
  let selectedActressIds: number[] = doc.data()?.selectedActressIds || [];

  const LIMIT = 10;
  let targetActress;
  let firstActress;
  for (const i of Array(LIMIT).keys()) {
    console.log(`${i + 1} / ${LIMIT}`);
    const itemResponse = await DMMApiClient.getItemList({
      keyword: '単体作品',
      offset: i * 100 + 1,
    });
    const {
      data: {
        result: { items },
      },
    } = itemResponse;

    const actressNestedList = items
      .filter(item => item.iteminfo.actress)
      .map(item => item.iteminfo.actress as ItemActressType[]);
    const actressList = ([] as ItemActressType[]).concat(...actressNestedList);

    for (const tmpActress of actressList) {
      if (!firstActress) {
        const result = await getActressInfo(tmpActress.id);
        if (result) {
          firstActress = result;
        }
      }
      if (selectedActressIds.includes(tmpActress.id)) {
        continue;
      }
      const actress = await getActressInfo(tmpActress.id);
      if (actress) {
        targetActress = actress;
        break;
      }
      selectedActressIds = selectedActressIds.concat([tmpActress.id]);
    }

    if (targetActress) {
      break;
    }
  }

  if (!targetActress) {
    console.log('New Actress Not Found!');
    targetActress = firstActress as ActressType;
    selectedActressIds = [];
  }

  selectedActressIds = selectedActressIds.concat([Number(targetActress.id)]);
  console.log(targetActress.id, targetActress.name);
  console.log('selectedActressIds:', selectedActressIds.length);

  await ref.set({ selectedActressIds }, { merge: true });

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
    keyword: '単体作品',
    article: 'actress',
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
  let mainContentList = ['', `【女優】${name}`];
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
  mainContentList = mainContentList.concat(['']);
  const linkContentList = ['', '【この女優の動画はコチラ！】', actressInfo['listURL']['digital']];
  const nestedGenreList = actressItems
    .filter(item => item.iteminfo.genre)
    .map(item => item.iteminfo.genre as ItemGenreType[]);

  const genreList = ([] as ItemGenreType[]).concat(...nestedGenreList);
  const genreObject: {
    [name: string]: { genre: ItemGenreType; count: number };
  } = {};
  genreList.forEach(genre => {
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
    .map(item => item.genre.name);
  const hashtagList = createGenreHashtag([name, ...sortedGenreList]);

  let status = '';
  while (true) {
    status = mainContentList.concat([hashtagList.join(' '), ...linkContentList]).join('\n');
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
