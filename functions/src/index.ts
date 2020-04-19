import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

import { AccountTypeList } from './BotClient';

admin.initializeApp();

import { tweetAvPackage } from './AvActressBot';
import { tweetAvMovie } from './AvMovieBot';
import { retweetRandom, favoriteRandom, autoRetweetFollow, autoFavoriteFollow } from './utils';

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

export const bulkFollow = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 540, memory: '512MB' })
  .https.onRequest(async (request, response) => {
    for (const account of AccountTypeList) {
      await autoRetweetFollow(account);
      await autoFavoriteFollow(account);
    }
    response.send('SUCCESS: bulkFollow');
  });

export const tweetAvPackageTest = functions.region('asia-northeast1').https.onRequest(async (request, response) => {
  await tweetAvPackage();
  response.send('SUCCESS: tweetAvPackageTest');
});

export const tweetAvMovieTest = functions
  .region('asia-northeast1')
  .runWith({ memory: '1GB' })
  .https.onRequest(async (request, response) => {
    await tweetAvMovie('ero_video_bot', 'rank');
    response.send('SUCCESS: tweetAvMovieTest');
  });

export const tweetRecentMovieTest = functions
  .region('asia-northeast1')
  .runWith({ memory: '1GB' })
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

export const autoRetweetFollowTest = functions.region('asia-northeast1').https.onRequest(async (request, response) => {
  await autoRetweetFollow('recent_av_bot');
  response.send('SUCCESS: autoRetweetFollowTest');
});

export const autoFavoriteFollowTest = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 120, memory: '512MB' })
  .https.onRequest(async (request, response) => {
    await autoFavoriteFollow('recent_av_bot');
    response.send('SUCCESS: autoFavoriteFollowTest');
  });
