import * as Twitter from 'twitter';
import axios from 'axios';
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as puppeteer from 'puppeteer';

import { DMMApiClient, ItemType, ItemGenreType } from './DMMApiClient';

const ref = admin
  .firestore()
  .collection('twitter')
  .doc('av_movie_bot');

const TWITTER_ENV = functions.config().twitter;
const CONSUMER_KEY = TWITTER_ENV.av_video_bot_consumer_key;
const CONSUMER_SECRET = TWITTER_ENV.av_video_bot_consumer_secret;
const ACCESS_TOKEN_KEY = TWITTER_ENV.av_video_bot_access_token_key;
const ACCESS_TOKEN_SECRET = TWITTER_ENV.av_video_bot_access_token_secret;

export const tweetAvMovie = async () => {
  const item = await getTargetItem();
};

const getTargetItem = async () => {
  const response = await DMMApiClient.getItemList({ offset: 1 });
  const {
    data: {
      result: { items },
    },
  } = response;

  let targetItem;
  for (const item of items) {
    const { content_id, sampleMovieURL } = item;
    if (!sampleMovieURL) {
      continue;
    }
    const { size_720_480 } = sampleMovieURL;
    console.log('content_id:', content_id);
    console.log(size_720_480);

    const url = await getMoviewUrl(size_720_480);
    if (!url) {
      continue;
    }
    console.log(url);

    targetItem = item;
    break;
  }
  return targetItem as ItemType;
};

const getMoviewUrl = async (targetUrl: string) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  await page.goto(targetUrl);
  const elementHandle = await page.$('iframe');
  if (!elementHandle) {
    return null;
  }
  const frame = await elementHandle.contentFrame();
  if (!frame) {
    return null;
  }
  const videoElementHandle = await frame.$('video');
  if (!videoElementHandle) {
    return null;
  }
  const url = (await (await videoElementHandle.getProperty('src')).jsonValue()) as string;
  await browser.close();
  return url;
};
