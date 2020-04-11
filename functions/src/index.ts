import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

import { tweetAvPackage } from './AvActressBot';
import { tweetAvMovie } from './AvMovieBot';
import { tweetRecentMovie } from './RecentMovieBot';
import { retweetOtherAccount } from './utils';

export const bulkPostTweet = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 540, memory: '1GB' })
  .https.onRequest(async (request, response) => {
    await tweetAvPackage();
    await tweetAvMovie();
    await tweetRecentMovie();
    response.send('SUCCESS: bulkPostTweet');
  });

export const bulkRetweet = functions.region('asia-northeast1').https.onRequest(async (request, response) => {
  await retweetOtherAccount('av_video_bot');
  await retweetOtherAccount('ero_video_bot');
  await retweetOtherAccount('recent_av_bot');
  response.send('SUCCESS: bulkRetweet');
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

export const retweetTest = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 60 })
  .https.onRequest(async (request, response) => {
    await retweetOtherAccount('recent_av_bot');
    response.send('SUCCESS: retweetTest');
  });
