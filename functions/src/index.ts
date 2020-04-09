import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

import { tweetAvPackage } from './AvActressBot';
import { tweetAvMovie } from './AvMovieBot';
import { tweetRecentMovie } from './RecentMovieBot';

export const bulkPostTweet = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 540, memory: '1GB' })
  .https.onRequest(async (request, response) => {
    await tweetAvPackage();
    await tweetAvMovie();
    await tweetRecentMovie();
    response.send('SUCCESS: bulkPostTweet');
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
