import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

import { tweetAvPackage } from './AvActressBot';
import { tweetAvMovie } from './AvMovieBot';

export const bulkPostTweet = functions.region('asia-northeast1').https.onRequest(async (request, response) => {
  await tweetAvPackage();
  response.send('SUCCESS!');
});

export const tweetAvMovieTest = functions.region('asia-northeast1').https.onRequest(async (request, response) => {
  await tweetAvMovie();
  response.send('SUCCESS!');
});
