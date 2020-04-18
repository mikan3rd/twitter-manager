import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

import { AccountTypeList } from './BotClient';

admin.initializeApp();

import { tweetAvPackage } from './AvActressBot';
import { tweetAvMovie } from './AvMovieBot';
import { retweetRandom, favoriteRandom, autoFollow, getFavorite } from './utils';

export const bulkPostTweet = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 540, memory: '1GB' })
  .https.onRequest(async (request, response) => {
    await tweetAvPackage();
    await tweetAvMovie('ero_video_bot', 'rank');
    await tweetAvMovie('recent_av_bot', 'date');
    response.send('SUCCESS: bulkPostTweet');
  });

export const bulkRetweetAndFavorite = functions.region('asia-northeast1').https.onRequest(async (request, response) => {
  for (const account of AccountTypeList) {
    await retweetRandom(account);
    await favoriteRandom(account);
  }
  response.send('SUCCESS: bulkRetweetAndFavorite');
});

export const bulkFollow = functions.region('asia-northeast1').https.onRequest(async (request, response) => {
  for (const account of AccountTypeList) {
    await autoFollow(account);
  }
  response.send('SUCCESS: bulkFollow');
});

export const tweetAvPackageTest = functions.region('asia-northeast1').https.onRequest(async (request, response) => {
  await tweetAvPackage();
  response.send('SUCCESS: tweetAvPackageTest');
});

export const tweetAvMovieTest = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 60, memory: '1GB' })
  .https.onRequest(async (request, response) => {
    await tweetAvMovie('ero_video_bot', 'rank');
    response.send('SUCCESS: tweetAvMovieTest');
  });

export const tweetRecentMovieTest = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 60, memory: '1GB' })
  .https.onRequest(async (request, response) => {
    await tweetAvMovie('recent_av_bot', 'date');
    response.send('SUCCESS: tweetRecentMovieTest');
  });

export const retweetTest = functions.region('asia-northeast1').https.onRequest(async (request, response) => {
  await retweetRandom('recent_av_bot');
  response.send('SUCCESS: retweetTest');
});

export const favoriteTest = functions.region('asia-northeast1').https.onRequest(async (request, response) => {
  await favoriteRandom('recent_av_bot');
  response.send('SUCCESS: favoriteTest');
});

export const followTest = functions.region('asia-northeast1').https.onRequest(async (request, response) => {
  await autoFollow('recent_av_bot');
  response.send('SUCCESS: followTest');
});

export const getFavoriteUserTest = functions.region('asia-northeast1').https.onRequest(async (request, response) => {
  await getFavorite('recent_av_bot');
  response.send('SUCCESS: getFavoriteUserTest');
});
