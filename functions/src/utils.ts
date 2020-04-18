import * as admin from 'firebase-admin';

import { TwitterClient, TweetUserType } from './TwitterClient';
import { AccountType, AccountTypeList, BotClient } from './BotClient';

export const createGenreHashtag = (words: string[]) => {
  const LowPriorityWord = ['ハイビジョン', '独占配信', '4時間以上作品', '単体作品'];
  const hashtagList: string[] = [];
  const lowHashtagList: string[] = [];
  words.forEach(word => {
    const splitWords = word.split('\u30fb');
    splitWords.forEach(w => {
      const hashtag = `#${w}`;
      if (LowPriorityWord.includes(w)) {
        lowHashtagList.push(hashtag);
      } else {
        hashtagList.push(hashtag);
      }
    });
  });
  return hashtagList.concat(lowHashtagList);
};

export const retweetRandom = async (account: AccountType) => {
  const bot = BotClient.get(account);
  const client = TwitterClient.get(bot.twitterConfig);
  const targetAccount = AccountTypeList[Math.floor(Math.random() * AccountTypeList.length)];
  const tweets = await client.getUserTimeline(targetAccount);
  const sortedTweets = tweets.sort((a, b) => (a.favorite_count > b.favorite_count ? -1 : 1));
  const targetTweet = sortedTweets.find(tweet => !tweet.retweeted);
  if (targetTweet) {
    await client.postRetweet(targetTweet.id_str);
  }
};

export const favoriteRandom = async (account: AccountType) => {
  const bot = BotClient.get(account);
  const client = TwitterClient.get(bot.twitterConfig);
  const targetAccount = AccountTypeList[Math.floor(Math.random() * AccountTypeList.length)];
  const tweets = await client.getUserTimeline(targetAccount);
  const sortedTweets = tweets.sort((a, b) => (a.favorite_count > b.favorite_count ? -1 : 1));
  const targetTweet = sortedTweets.find(tweet => !tweet.favorited);
  if (targetTweet) {
    await client.postFavorite(targetTweet.id_str);
  }
};

export const autoFollow = async (account: AccountType) => {
  const bot = BotClient.get(account);

  const ref = admin
    .firestore()
    .collection('twitter')
    .doc(bot.documentPath);
  const doc = await ref.get();
  const listId: string | undefined = doc.data()?.listId;

  if (!listId) {
    console.log('NEED listId!');
    return;
  }

  const client = TwitterClient.get(bot.twitterConfig);
  const { friends_count } = await client.getAccount();
  if (friends_count >= 4900) {
    return;
  }

  const tweets = await client.getListTweets(listId);
  const sortedTweets = tweets.sort((a, b) => (a.retweet_count > b.retweet_count ? -1 : 1));

  const LIMIT = 5;
  let users: TweetUserType[] = [];
  for (const tweet of sortedTweets.slice(0, LIMIT)) {
    const result = await client.getRetweetUser(tweet.id_str);
    const tmpUsers = result.map(r => r.user);
    users = users.concat(tmpUsers);
  }

  const userObject: { [id_str: string]: TweetUserType } = {};
  users.forEach(user => {
    if (user.following || user.follow_request_sent || user.blocked_by) {
      return;
    }
    if (user.followers_count > user.friends_count) {
      return;
    }
    userObject[user.id_str] = user;
  });

  const sortedUsers = Object.values(userObject).sort((a, b) =>
    a.friends_count / a.followers_count > b.friends_count / b.followers_count ? -1 : 1,
  );

  const FOLLOW_NUM = 9;
  for (const user of sortedUsers.slice(0, FOLLOW_NUM)) {
    console.log('follow:', `@${user.screen_name}`);
    await client.postFollow(user.id_str);
  }
};

export const getRandomNum = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const getFavorite = async (account: AccountType) => {
  const bot = BotClient.get(account);
  const client = TwitterClient.get(bot.twitterConfig);

  const tweetId = '1250739677268791298';
  const response = await client.getFavoriteUsers(tweetId);
  console.log(response);
};
