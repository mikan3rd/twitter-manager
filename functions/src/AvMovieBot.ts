import axios from 'axios';
import * as admin from 'firebase-admin';
import * as puppeteer from 'puppeteer';
import * as ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as ffmpeg_static from 'ffmpeg-static';
import * as ffprobe_static from 'ffprobe-static';

import { DMMApiClient, ItemType, ItemSortType } from './DMMApiClient';
import { TwitterClient } from './TwitterClient';
import { createGenreHashtag } from './utils';

ffmpeg.setFfmpegPath(ffmpeg_static);
ffmpeg.setFfprobePath(ffprobe_static.path);

const targetDocumentPath = 'av_movie_bot';
const targetAccount = 'ero_video_bot';

export const tweetAvMovie = async () => {
  const target = await getTargetItem(targetDocumentPath, 'rank');
  const { item, filePath, mediaType, totalBytes } = target;
  const status = getAvMovieStatus(item);

  const client = TwitterClient.get(targetAccount);
  const mediaId = await uploadTwitterMedia(client, filePath, mediaType, totalBytes);
  const result = await client.postTweet({ status, mediaIds: [mediaId] });
};

export const getTargetItem = async (documentPath: string, sort: ItemSortType) => {
  const ref = admin
    .firestore()
    .collection('twitter')
    .doc(documentPath);

  const doc = await ref.get();
  let selecteContendIds: string[] = doc.data()?.selecteContendIds || [];

  const LIMIT = 10;
  let targetItem;
  let tmpPath = '';
  let mediaType = '';
  let totalBytes = 0;

  for (const i of Array(LIMIT).keys()) {
    const response = await DMMApiClient.getItemList({ offset: i * 100 + 1, sort });
    const {
      data: {
        result: { items },
      },
    } = response;
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

      console.log(size_720_480);
      const videoResponse = await axios.get(url, { responseType: 'arraybuffer' });

      const { headers, data } = videoResponse;
      mediaType = headers['content-type'];
      totalBytes = Number(headers['content-length']);

      const fileName = `${documentPath}${path.extname(url)}`;
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
      console.log(`${i + 1} / ${LIMIT}`);
      break;
    }
  }

  // TODO: 取得できなかった場合に対応
  if (targetItem) {
    selecteContendIds = selecteContendIds.concat([targetItem.content_id]);
    console.log('content_id:', targetItem.content_id);
  }

  console.log('selecteContendIds:', selecteContendIds.length);

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

  const playerSelector = '.dgm-btn-playerCover';
  await page.waitForSelector(playerSelector);
  const playButton = await page.$(playerSelector);
  if (playButton) {
    await playButton.click();
  }

  const pauseSelector = '.playpause';
  await page.waitForSelector(pauseSelector);
  const pauseButton = await page.$(pauseSelector);
  if (pauseButton) {
    await pauseButton.click();
  }

  const butttonSelector = '.btn-bitrate';
  await page.waitForSelector(butttonSelector);
  const bitrateButton = await page.$(butttonSelector);
  if (bitrateButton) {
    const bitrate = await (await bitrateButton.getProperty('textContent')).jsonValue();
    console.log(bitrate);
  }

  await page.evaluate(() => {
    const ele = document.querySelector<HTMLElement>('.box-bitrate');
    if (ele) {
      ele.style.display = 'block';
    }
  });

  // const targetXpath = "//a[contains(text(), '1000kbps')]";
  // await page.waitForXPath(targetXpath);
  // const [target] = await page.$x(targetXpath);
  // if (target) {
  //   await target.click();
  // }

  const videoElementHandle = await page.$('video');
  if (!videoElementHandle) {
    return null;
  }
  const url = (await (await videoElementHandle.getProperty('src')).jsonValue()) as string;
  await browser.close();
  return url;
};

export const uploadTwitterMedia = async (
  client: TwitterClient,
  filePath: string,
  mediaType: string,
  totalBytes: number,
) => {
  const mediaId = await client.uploadVideoInit(totalBytes, mediaType);

  const mediaData = fs.readFileSync(filePath);
  const _5MB = 1048576 * 5;
  const chunkNum = Math.ceil(totalBytes / _5MB);
  for (let index = 0; index < chunkNum; index++) {
    const chunk = mediaData.slice(_5MB * index, _5MB * (index + 1));
    await client.uploadVideoAppend(mediaId, chunk, index);
  }

  await client.uploadVideoFinalize(mediaId);
  await client.uploadVideoStatus(mediaId);

  fs.unlinkSync(filePath);

  return mediaId;
};

export const getAvMovieStatus = (item: ItemType) => {
  const {
    title,
    affiliateURL,
    iteminfo: { actress, genre, series },
  } = item;

  let itemTitle = title;

  const linkContentList = ['', `【この動画の詳細はコチラ！】`, affiliateURL];

  let actressContentList: string[] = [];
  if (actress) {
    const acressList = actress.map(target => `#${target.name}`);
    actressContentList = ['', '【女優】', ...acressList];
  }

  let genreContentList: string[] = [];
  if (genre) {
    const genreList = genre.map(g => g.name);
    const hashtagList = createGenreHashtag(genreList);
    genreContentList = ['', '【ジャンル】', ...hashtagList];
  }

  itemTitle = itemTitle.trim();
  let mainContentList = [itemTitle];

  let status = '';
  while (true) {
    status = mainContentList.concat([...actressContentList, ...genreContentList, ...linkContentList]).join('\n');

    if (status.length < 278) {
      break;
    }

    if (genreContentList.length > 0) {
      if (genreContentList.length <= 3) {
        genreContentList = [];
      } else {
        genreContentList.pop();
      }
    } else if (actressContentList.length > 0) {
      if (actressContentList.length <= 3) {
        actressContentList = [];
      } else {
        actressContentList.pop();
      }
    } else {
      const overNum = status.length - 275;
      if (overNum <= 0) {
        throw new Error('overNum is invalid');
      }
      itemTitle = itemTitle.slice(0, overNum * -1) + '...';
      mainContentList = [itemTitle];
    }
  }

  return status;
};