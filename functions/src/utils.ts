import * as admin from 'firebase-admin';
import * as puppeteer from 'puppeteer';
import axios from 'axios';

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

export const autoRetweetFollow = async (account: AccountType) => {
  const bot = BotClient.get(account);
  const client = TwitterClient.get(bot.twitterConfig);

  const tweets = await getTargetListTweets(client, bot.documentPath);
  if (!tweets) {
    return;
  }

  const sortedTweets = tweets.sort((a, b) => (a.retweet_count > b.retweet_count ? -1 : 1));

  const LIMIT = 5;
  let users: TweetUserType[] = [];
  for (const tweet of sortedTweets.slice(0, LIMIT)) {
    const result = await client.getRetweetUser(tweet.id_str);
    const tmpUsers = result.map(r => r.user);
    users = users.concat(tmpUsers);
  }
  await autoFollow(client, users);
};

export const autoFavoriteFollow = async (account: AccountType) => {
  const bot = BotClient.get(account);
  const client = TwitterClient.get(bot.twitterConfig);

  const tweets = await getTargetListTweets(client, bot.documentPath);
  if (!tweets) {
    return;
  }

  const sortedTweets = tweets.sort((a, b) => (a.favorite_count > b.favorite_count ? -1 : 1));

  const token = await getTwitterToken(bot.username, bot.password);
  if (!token) {
    return;
  }

  const { authorization, csrfToken, cookie } = token;

  const LIMIT = 5;
  let users: TweetUserType[] = [];
  for (const tweet of sortedTweets.slice(0, LIMIT)) {
    const response = await axios({
      method: 'GET',
      url: 'https://api.twitter.com/2/timeline/liked_by.json',
      headers: { Authorization: authorization, 'x-csrf-token': csrfToken, Cookie: cookie },
      params: { tweet_id: tweet.id_str, include_followed_by: true, include_blocked_by: true },
    });

    const tmpUsers: TweetUserType[] = Object.values(response.data.globalObjects.users);
    users = users.concat(tmpUsers);
  }
  await autoFollow(client, users);
};

const getTargetListTweets = async (client: TwitterClient, documentPath: string) => {
  const ref = admin
    .firestore()
    .collection('twitter')
    .doc(documentPath);
  const doc = await ref.get();
  const listId: string | undefined = doc.data()?.listId;

  if (!listId) {
    console.log('NEED listId!');
    return;
  }

  const { friends_count } = await client.getAccount();
  if (friends_count >= 4900) {
    return;
  }

  const tweets = await client.getListTweets(listId);
  return tweets;
};

const autoFollow = async (client: TwitterClient, users: TweetUserType[]) => {
  const userObject: { [id_str: string]: TweetUserType } = {};
  users.forEach(user => {
    if (user.following || user.follow_request_sent || user.blocked_by || user.followed_by) {
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

  console.log('sortedUsers:', sortedUsers.length);

  const FOLLOW_NUM = 9;
  for (const user of sortedUsers.slice(0, FOLLOW_NUM)) {
    console.log('follow:', `@${user.screen_name}`);
    await client.postFollow(user.id_str);
  }
};

const getTwitterToken = async (username?: string, password?: string) => {
  if (!username || !password) {
    return;
  }

  let authorization = '';
  let csrfToken = '';

  const browser = await puppeteer.launch({
    headless: true,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required'],
  });

  const page = await browser.newPage();

  await page.setRequestInterception(true);
  page.on('request', async request => {
    const headers = request.headers();
    if (headers['authorization']) {
      authorization = headers['authorization'];
    }
    if (headers['x-csrf-token']) {
      csrfToken = headers['x-csrf-token'];
    }
    await request.continue();
  });

  await page.goto('https://twitter.com/login');

  const usernameSelector = 'input[name="session[username_or_email]"]';
  await page.waitForSelector(usernameSelector);
  await page.type(usernameSelector, username);

  const passwordSelector = 'input[name="session[password]"]';
  await page.waitForSelector(passwordSelector);
  await page.type(passwordSelector, password);

  const loginButtonSelector = 'div[data-testid="LoginForm_Login_Button"]';
  await page.click(loginButtonSelector);

  const cookies = await page.cookies();
  const cookie = cookies.map(c => `${c.name}=${c.value}`).join('; ');

  return { csrfToken, authorization, cookie };
};

export const getRandomNum = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};
