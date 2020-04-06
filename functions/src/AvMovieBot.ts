import * as Twitter from 'twitter';
import axios from 'axios';
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as puppeteer from 'puppeteer';
import * as ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as ffmpeg_static from 'ffmpeg-static';
import * as ffprobe_static from 'ffprobe-static';

ffmpeg.setFfmpegPath(ffmpeg_static);
ffmpeg.setFfprobePath(ffprobe_static.path);

import { DMMApiClient, ItemType } from './DMMApiClient';

const ref = admin
  .firestore()
  .collection('twitter')
  .doc('av_movie_bot');

const TWITTER_ENV = functions.config().twitter;
const CONSUMER_KEY = TWITTER_ENV.ero_video_bot_consumer_key;
const CONSUMER_SECRET = TWITTER_ENV.ero_video_bot_consumer_secret;
const ACCESS_TOKEN_KEY = TWITTER_ENV.ero_video_bot_access_token_key;
const ACCESS_TOKEN_SECRET = TWITTER_ENV.ero_video_bot_access_token_secret;

export const tweetAvMovie = async () => {
  const target = await getTargetItem();
  const mediaId = await uploadTwitterMedia(target);
  const { item } = target;
  const result = await postTweet({ status: `${item.title}`, mediaIds: [mediaId] });
};

const getTargetItem = async () => {
  const doc = await ref.get();
  let selecteContendIds: string[] = doc.data()?.selecteContendIds || [];

  const response = await DMMApiClient.getItemList({ offset: 1 });
  const {
    data: {
      result: { items },
    },
  } = response;

  const _15MB = 1048576 * 15;
  let targetItem;
  let tmpPath = '';
  let mediaType = '';
  let totalBytes = 0;
  for (const item of items) {
    const { content_id, sampleMovieURL } = item;
    if (selecteContendIds.includes(content_id)) {
      continue;
    }
    if (!sampleMovieURL) {
      continue;
    }
    const { size_720_480 } = sampleMovieURL;

    const url = await getMoviewUrl(size_720_480);
    if (!url) {
      selecteContendIds = selecteContendIds.concat([content_id]);
      continue;
    }

    const videoResponse = await axios.get(url, { responseType: 'arraybuffer' });

    const { headers, data } = videoResponse;
    mediaType = headers['content-type'];
    totalBytes = Number(headers['content-length']);

    if (Number(totalBytes) > _15MB) {
      selecteContendIds = selecteContendIds.concat([content_id]);
      continue;
    }

    const fileName = `av_movie_bot${path.extname(url)}`;
    tmpPath = path.join(os.tmpdir(), fileName);
    fs.writeFileSync(tmpPath, data);

    const format: ffmpeg.FfprobeFormat = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(tmpPath, (err, metadata) => {
        if (err) {
          reject(err);
        }
        resolve(metadata.format);
      });
    });

    const { duration } = format;
    if (!duration || duration > 140) {
      selecteContendIds = selecteContendIds.concat([content_id]);
      continue;
    }

    targetItem = item;
    break;
  }

  if (targetItem) {
    selecteContendIds = selecteContendIds.concat([targetItem.content_id]);
    console.log(targetItem.sampleMovieURL?.size_720_480);
  }

  await ref.set({ selecteContendIds }, { merge: true });
  return { item: targetItem as ItemType, filePath: tmpPath, mediaType, totalBytes };
};

const getMoviewUrl = async (targetUrl: string) => {
  const browser = await puppeteer.launch({
    headless: true,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required'],
  });

  const page = await browser.newPage();

  await page.goto(targetUrl);
  const elementHandle = await page.$('iframe');
  if (!elementHandle) {
    return null;
  }

  const iframeUrl = (await (await elementHandle.getProperty('src')).jsonValue()) as string;
  await page.goto(iframeUrl);

  await page.waitForSelector('.modal-overlay');
  await page.evaluate(() => {
    const doms = document.querySelectorAll<HTMLElement>('.modal-overlay');
    doms.forEach((ele, index) => {
      console.log(`modal: ${index + 1}`);
      ele.style.display = 'none';
    });
  });

  const playButton = await page.$('.dgm-btn-playerCover');
  if (playButton) {
    await playButton.click();
  }

  const pauseSelectot = '.playpause';
  await page.waitForSelector(pauseSelectot);
  const pauseButton = await page.$(pauseSelectot);
  if (pauseButton) {
    await pauseButton.click();
  }

  await page.evaluate(() => {
    const ele = document.querySelector<HTMLElement>('.box-bitrate');
    if (ele) {
      ele.style.display = 'block';
    }
  });

  const targetXpath = "//a[contains(text(), '1000kbps')]";
  await page.waitForXPath(targetXpath);
  const [target] = await page.$x(targetXpath);
  if (target) {
    await target.click();
  }
  const videoElementHandle = await page.$('video');
  if (!videoElementHandle) {
    return null;
  }
  const url = (await (await videoElementHandle.getProperty('src')).jsonValue()) as string;
  await browser.close();
  return url;
};

const uploadTwitterMedia = async ({
  filePath,
  mediaType,
  totalBytes,
}: {
  filePath: string;
  mediaType: string;
  totalBytes: number;
}) => {
  const client = new Twitter({
    consumer_key: CONSUMER_KEY,
    consumer_secret: CONSUMER_SECRET,
    access_token_key: ACCESS_TOKEN_KEY,
    access_token_secret: ACCESS_TOKEN_SECRET,
  });

  const initResponse = await client.post('media/upload', {
    command: 'INIT',
    total_bytes: totalBytes,
    media_type: mediaType,
    media_category: 'tweet_video',
  });
  const mediaId = initResponse['media_id_string'];

  const mediaData = fs.readFileSync(filePath);
  const chunkSize = 1048576 * 5;
  const chunkNum = Math.ceil(totalBytes / chunkSize);
  for (let index = 0; index < chunkNum; index++) {
    const chunk = mediaData.slice(chunkSize * index, chunkSize * (index + 1));
    await client.post('media/upload', {
      command: 'APPEND',
      media_id: mediaId,
      media: chunk,
      segment_index: index,
    });
  }

  await client.post('media/upload', {
    command: 'FINALIZE',
    media_id: mediaId,
  });

  while (true) {
    const statusResponse = await client.get('media/upload', {
      command: 'STATUS',
      media_id: mediaId,
    });
    const {
      processing_info: { state, check_after_secs, progress_percent, error },
    } = statusResponse;
    if (state === 'succeeded') {
      break;
    }
    if (state === 'failed') {
      throw new Error(error);
    }
    await new Promise(resolve => setTimeout(resolve, 1000 * (check_after_secs + 5)));
  }

  fs.unlinkSync(filePath);

  return mediaId;
};

const postTweet = async ({ status, mediaIds = [] }: { status: string; mediaIds?: string[] }) => {
  const client = new Twitter({
    consumer_key: CONSUMER_KEY,
    consumer_secret: CONSUMER_SECRET,
    access_token_key: ACCESS_TOKEN_KEY,
    access_token_secret: ACCESS_TOKEN_SECRET,
  });
  const params = {
    status,
    media_ids: mediaIds.join(','),
  };
  return await client.post('statuses/update', params);
};
