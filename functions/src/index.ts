import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

import { tweetAvPackage } from './AvActressBot';
import { tweetAvMovie } from './AvMovieBot';
import { tweetRecentMovie } from './RecentMovieBot';
import { retweetRandom, favoriteRandom } from './utils';

export const bulkPostTweet = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 540, memory: '1GB' })
  .https.onRequest(async (request, response) => {
    await tweetAvPackage();
    await tweetAvMovie();
    await tweetRecentMovie();
    response.send('SUCCESS: bulkPostTweet');
  });

export const bulkRetweetAndFavorite = functions.region('asia-northeast1').https.onRequest(async (request, response) => {
  await retweetRandom('av_video_bot');
  await retweetRandom('ero_video_bot');
  await retweetRandom('recent_av_bot');

  await favoriteRandom('av_video_bot');
  await favoriteRandom('ero_video_bot');
  await favoriteRandom('recent_av_bot');

  response.send('SUCCESS: bulkRetweetAndFavorite');
});

export const tweetAvPackageTest = functions.region('asia-northeast1').https.onRequest(async (request, response) => {
  await tweetAvPackage();
  response.send('SUCCESS: tweetAvPackageTest');
});

export const tweetAvMovieTest = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 60, memory: '1GB' })
  .https.onRequest(async (request, response) => {
    await tweetAvMovie();
    response.send('SUCCESS: tweetAvMovieTest');
  });

export const tweetRecentMovieTest = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 60, memory: '1GB' })
  .https.onRequest(async (request, response) => {
    await tweetRecentMovie();
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
