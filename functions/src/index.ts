import { PubSub } from "@google-cloud/pubsub";
import dayjs from "dayjs";
import admin from "firebase-admin";

import "dayjs/locale/ja";
dayjs.locale("ja");

admin.initializeApp();

import { tweetAvPackage } from "./AvActressBot";
// import { tweetAvMovie } from "./AvMovieBot";
// import { AccountTypeList } from "./BotClient";
import { toBufferJson } from "./common/utils";
import { AccountType, AccountsDB } from "./firebase/firestore";
import { functions, scheduleFunctions } from "./firebase/functions";
import { Topic } from "./firebase/pubsub";
// import { autoFavoriteFollow, autoRetweetFollow, favoriteRandom, retweetRandom } from "./utils";

export const bulkPostTweet = scheduleFunctions({ timeoutSeconds: 120 })("1 * * * *").onRun(async (context) => {
  const docs = await AccountsDB.get();
  const accountList: AccountType[] = [];
  docs.forEach((doc) => {
    const account = doc.data() as AccountType;
    accountList.push(account);
  });

  const pubSub = new PubSub();
  for (const account of accountList) {
    switch (account.botType) {
      case "AvActress":
        await pubSub.topic(Topic.PostAvActress).publish(toBufferJson(account));
        break;

      default:
        break;
    }
  }
});

export const postAvActressPubSub = functions.pubsub.topic(Topic.PostAvActress).onPublish(async (message) => {
  const account = message.json as AccountType;
  await tweetAvPackage(account);
});

// export const bulkPostTweet = scheduleFunctions({ timeoutSeconds: 540, memory: "1GB" })("1 * * * *").onRun(
//   async (context) => {
//     try {
//       await tweetAvPackage();
//     } catch (e) {
//       console.error(e);
//     }
//     try {
//       await tweetAvMovie("ero_video_bot", "rank");
//     } catch (e) {
//       console.error(e);
//     }
//     try {
//       await tweetAvMovie("recent_av_bot", "date");
//     } catch (e) {
//       console.error(e);
//     }
//   },
// );

// export const bulkRetweetAndFavorite = scheduleFunctions({ timeoutSeconds: 540 })("31 * * * *").onRun(
//   async (context) => {
//     for (const account of AccountTypeList) {
//       try {
//         await retweetRandom(account);
//       } catch (e) {
//         console.error(e);
//       }
//       try {
//         await favoriteRandom(account);
//       } catch (e) {
//         console.error(e);
//       }
//     }
//   },
// );

// export const bulkFollow = scheduleFunctions({ timeoutSeconds: 540, memory: "1GB" })("10 18,21 * * *").onRun(
//   async (context) => {
//     for (const account of AccountTypeList) {
//       try {
//         await autoRetweetFollow(account);
//       } catch (e) {
//         console.error(e);
//       }
//       try {
//         await autoFavoriteFollow(account);
//       } catch (e) {
//         console.error(e);
//       }
//     }
//   },
// );

// export const tweetAvPackageTest = functions.https.onRequest(async (request, response) => {
//   await tweetAvPackage();
//   response.send("SUCCESS: tweetAvPackageTest");
// });

// export const tweetAvMovieTest = functions.runWith({ memory: "1GB" }).https.onRequest(async (request, response) => {
//   await tweetAvMovie("ero_video_bot", "rank");
//   response.send("SUCCESS: tweetAvMovieTest");
// });

// export const tweetRecentMovieTest = functions.runWith({ memory: "1GB" }).https.onRequest(async (request, response) => {
//   await tweetAvMovie("recent_av_bot", "date");
//   response.send("SUCCESS: tweetRecentMovieTest");
// });

// export const retweetTest = functions.https.onRequest(async (request, response) => {
//   await retweetRandom("recent_av_bot");
//   response.send("SUCCESS: retweetTest");
// });

// export const favoriteTest = functions.https.onRequest(async (request, response) => {
//   await favoriteRandom("recent_av_bot");
//   response.send("SUCCESS: favoriteTest");
// });

// export const autoRetweetFollowTest = functions.https.onRequest(async (request, response) => {
//   await autoRetweetFollow("recent_av_bot");
//   response.send("SUCCESS: autoRetweetFollowTest");
// });

// export const autoFavoriteFollowTest = functions
//   .runWith({ memory: "1GB" })
//   .https.onRequest(async (request, response) => {
//     await autoFavoriteFollow("av_video_bot");
//     response.send("SUCCESS: autoFavoriteFollowTest");
//   });
