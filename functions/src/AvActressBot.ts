import * as Twitter from 'twitter';
import axios from 'axios';
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

import { DMMApiClient, ItemActressType, ItemType, ItemGenreType, ActressType } from './DMMApiClient';

const ref = admin
  .firestore()
  .collection('twitter')
  .doc('av_actress_bot');

const TWITTER_ENV = functions.config().twitter;
const CONSUMER_KEY = TWITTER_ENV.av_video_bot_consumer_key;
const CONSUMER_SECRET = TWITTER_ENV.av_video_bot_consumer_secret;
const ACCESS_TOKEN_KEY = TWITTER_ENV.av_video_bot_access_token_key;
const ACCESS_TOKEN_SECRET = TWITTER_ENV.av_video_bot_access_token_secret;

export const tweetAvPackage = async () => {
  const actressInfo = await getTargetActress();
  const actressItems = await getActressItems(Number(actressInfo.id));
  const status = getAvPackageStatus(actressInfo, actressItems);
  const images = actressItems.map(item => item['imageURL']['large']);
  const mediaIds = await uploadImages(images);
  const result = await postTweet({ status, mediaIds });
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

  // TODO: ナカグロで分ける
  const genreList = ([] as ItemGenreType[]).concat(...nestedGenreList);
  const genreObject: {
    [id: number]: { genre: ItemGenreType; count: number };
  } = {};
  genreList.forEach(genre => {
    if (genreObject[genre.id]) {
      genreObject[genre.id] = {
        genre,
        count: genreObject[genre.id].count + 1,
      };
    } else {
      genreObject[genre.id] = { genre, count: 1 };
    }
  });
  const sortedGenreList = Object.values(genreObject)
    .sort((a, b) => (a.count > b.count ? -1 : 1))
    .map(item => `#${item.genre.name}`);

  const hashtagList = [`#${name}`, ...sortedGenreList];
  let status = '';
  while (true) {
    status = mainContentList.concat([hashtagList.join(' '), ...linkContentList]).join('\n');
    if (status.length < 280) {
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

const uploadImages = async (images: string[]) => {
  const client = new Twitter({
    consumer_key: CONSUMER_KEY,
    consumer_secret: CONSUMER_SECRET,
    access_token_key: ACCESS_TOKEN_KEY,
    access_token_secret: ACCESS_TOKEN_SECRET,
  });

  const mediaIds: string[] = [];
  for (const imageUrl of images) {
    const { data } = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const { media_id_string } = await client.post('media/upload', {
      media: data,
    });
    mediaIds.push(media_id_string);
    if (mediaIds.length >= 4) {
      break;
    }
  }
  return mediaIds;
};

const postTweet = async ({ status, mediaIds = [] }: { status: string; mediaIds?: string[] }) => {
  const client = new Twitter({
    consumer_key: CONSUMER_KEY,
    consumer_secret: CONSUMER_SECRET,
    access_token_key: ACCESS_TOKEN_KEY,
    access_token_secret: ACCESS_TOKEN_SECRET,
  });
  const params = {
    status,
    media_ids: mediaIds.join(','),
  };
  return await client.post('statuses/update', params);
};
