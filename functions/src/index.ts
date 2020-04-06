import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

import { tweetAvPackage } from './AvActressBot';
import { tweetAvMovie } from './AvMovieBot';

export const bulkPostTweet = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 540, memory: '512MB' })
  .https.onRequest(async (request, response) => {
    await tweetAvPackage();
    await tweetAvMovie();
    response.send('SUCCESS: bulkPostTweet');
  });

export const tweetAvPackageTest = functions.region('asia-northeast1').https.onRequest(async (request, response) => {
  await tweetAvPackage();
  response.send('SUCCESS: tweetAvPackageTest');
});

export const tweetAvMovieTest = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 60, memory: '512MB' })
  .https.onRequest(async (request, response) => {
    await tweetAvMovie();
    response.send('SUCCESS: tweetAvMovieTest');
  });
