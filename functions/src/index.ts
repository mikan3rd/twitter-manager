import admin from "firebase-admin";
import * as functions from "firebase-functions";

import { AccountTypeList } from "./BotClient";

admin.initializeApp();

import { tweetAvPackage } from "./AvActressBot";
import { tweetAvMovie } from "./AvMovieBot";
import { autoFavoriteFollow, autoRetweetFollow, favoriteRandom, retweetRandom } from "./utils";

export const bulkPostTweet = functions
  .region("asia-northeast1")
  .runWith({ timeoutSeconds: 540, memory: "1GB" })
  .pubsub.schedule("1 * * * *")
  .timeZone("Asia/Tokyo")
  .onRun(async (context) => {
    try {
      await tweetAvPackage();
    } catch (e) {
      console.error(e);
    }
    try {
      await tweetAvMovie("ero_video_bot", "rank");
    } catch (e) {
      console.error(e);
    }
    try {
      await tweetAvMovie("recent_av_bot", "date");
    } catch (e) {
      console.error(e);
    }
  });

export const bulkRetweetAndFavorite = functions
  .region("asia-northeast1")
  .runWith({ timeoutSeconds: 540 })
  .pubsub.schedule("31 * * * *")
  .timeZone("Asia/Tokyo")
  .onRun(async (context) => {
    for (const account of AccountTypeList) {
      try {
        await retweetRandom(account);
      } catch (e) {
        console.error(e);
      }
      try {
        await favoriteRandom(account);
      } catch (e) {
        console.error(e);
      }
    }
  });

export const bulkFollow = functions
  .region("asia-northeast1")
  .runWith({ timeoutSeconds: 540, memory: "1GB" })
  .pubsub.schedule("10 18,21 * * *")
  .timeZone("Asia/Tokyo")
  .onRun(async (context) => {
    for (const account of AccountTypeList) {
      try {
        await autoRetweetFollow(account);
      } catch (e) {
        console.error(e);
      }
      try {
        await autoFavoriteFollow(account);
      } catch (e) {
        console.error(e);
      }
    }
  });

export const tweetAvPackageTest = functions.region("asia-northeast1").https.onRequest(async (request, response) => {
  await tweetAvPackage();
  response.send("SUCCESS: tweetAvPackageTest");
});

export const tweetAvMovieTest = functions
  .region("asia-northeast1")
  .runWith({ memory: "1GB" })
  .https.onRequest(async (request, response) => {
    await tweetAvMovie("ero_video_bot", "rank");
    response.send("SUCCESS: tweetAvMovieTest");
  });

export const tweetRecentMovieTest = functions
  .region("asia-northeast1")
  .runWith({ memory: "1GB" })
  .https.onRequest(async (request, response) => {
    await tweetAvMovie("recent_av_bot", "date");
    response.send("SUCCESS: tweetRecentMovieTest");
  });

export const retweetTest = functions.region("asia-northeast1").https.onRequest(async (request, response) => {
  await retweetRandom("recent_av_bot");
  response.send("SUCCESS: retweetTest");
});

export const favoriteTest = functions.region("asia-northeast1").https.onRequest(async (request, response) => {
  await favoriteRandom("recent_av_bot");
  response.send("SUCCESS: favoriteTest");
});

export const autoRetweetFollowTest = functions.region("asia-northeast1").https.onRequest(async (request, response) => {
  await autoRetweetFollow("recent_av_bot");
  response.send("SUCCESS: autoRetweetFollowTest");
});

export const autoFavoriteFollowTest = functions
  .region("asia-northeast1")
  .runWith({ memory: "1GB" })
  .https.onRequest(async (request, response) => {
    await autoFavoriteFollow("av_video_bot");
    response.send("SUCCESS: autoFavoriteFollowTest");
  });
