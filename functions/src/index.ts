import * as functions from 'firebase-functions';

import { tweetAvPackage } from './AvActressBot';

export const bulkPostTweet = functions
  .region('asia-northeast1')
  .https.onRequest(async (request, response) => {
    await tweetAvPackage();
    response.send('SUCCESS!');
  });
