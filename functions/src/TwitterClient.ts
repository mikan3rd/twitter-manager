import * as Twitter from 'twitter';
import * as functions from 'firebase-functions';
import axios from 'axios';

const TWITTER_ENV = functions.config().twitter;

const {
  av_video_bot_consumer_key,
  av_video_bot_consumer_secret,
  av_video_bot_access_token_key,
  av_video_bot_access_token_secret,
  ero_video_bot_consumer_key,
  ero_video_bot_consumer_secret,
  ero_video_bot_access_token_key,
  ero_video_bot_access_token_secret,
  recent_av_bot_consumer_key,
  recent_av_bot_consumer_secret,
  recent_av_bot_access_token_key,
  recent_av_bot_access_token_secret,
} = TWITTER_ENV;

export const AccountTypeList = ['av_video_bot', 'ero_video_bot', 'recent_av_bot'] as const;
export type AccountType = typeof AccountTypeList[number];

export class TwitterClient {
  account: AccountType;
  client: Twitter;

  constructor(account: AccountType, client: Twitter) {
    this.account = account;
    this.client = client;
  }

  static get(account: AccountType) {
    if (account === 'av_video_bot') {
      return this.avVideoBotClient(account);
    }
    if (account === 'ero_video_bot') {
      return this.eroVideoBotClient(account);
    }
    if (account === 'recent_av_bot') {
      return this.recentVideoBotClient(account);
    }
    throw new Error(`NOT FOUND: ${account}`);
  }

  private static avVideoBotClient(account: AccountType) {
    const client = new Twitter({
      consumer_key: av_video_bot_consumer_key,
      consumer_secret: av_video_bot_consumer_secret,
      access_token_key: av_video_bot_access_token_key,
      access_token_secret: av_video_bot_access_token_secret,
    });
    return new TwitterClient(account, client);
  }

  private static eroVideoBotClient(account: AccountType) {
    const client = new Twitter({
      consumer_key: ero_video_bot_consumer_key,
      consumer_secret: ero_video_bot_consumer_secret,
      access_token_key: ero_video_bot_access_token_key,
      access_token_secret: ero_video_bot_access_token_secret,
    });
    return new TwitterClient(account, client);
  }

  private static recentVideoBotClient(account: AccountType) {
    const client = new Twitter({
      consumer_key: recent_av_bot_consumer_key,
      consumer_secret: recent_av_bot_consumer_secret,
      access_token_key: recent_av_bot_access_token_key,
      access_token_secret: recent_av_bot_access_token_secret,
    });
    return new TwitterClient(account, client);
  }

  async getAccount() {
    return await this.client.get('account/verify_credentials');
  }

  async getUserTimeline(screenName: string, includeRts = false, count = 200) {
    const params = {
      screen_name: screenName,
      count,
      include_rts: includeRts,
    };
    const response = await this.client.get('statuses/user_timeline', params);
    return response as { id_str: string; retweeted: boolean; favorite_count: number }[];
  }

  async postTweet({ status, mediaIds = [] }: { status: string; mediaIds?: string[] }) {
    const params = {
      status,
      media_ids: mediaIds.join(','),
    };
    return await this.client.post('statuses/update', params);
  }

  async uploadImages(images: string[]) {
    const mediaIds: string[] = [];
    for (const imageUrl of images) {
      const { data } = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const { media_id_string } = await this.client.post('media/upload', {
        media: data,
      });
      mediaIds.push(media_id_string);
      if (mediaIds.length >= 4) {
        break;
      }
    }
    return mediaIds;
  }

  async uploadVideoInit(totalBytes: number, mediaType: string) {
    const response = await this.client.post('media/upload', {
      command: 'INIT',
      total_bytes: totalBytes,
      media_type: mediaType,
      media_category: 'tweet_video',
    });
    return response['media_id_string'] as string;
  }

  async uploadVideoAppend(mediaId: string, media: Buffer, segmentIndex: number) {
    return await this.client.post('media/upload', {
      command: 'APPEND',
      media_id: mediaId,
      media,
      segment_index: segmentIndex,
    });
  }

  async uploadVideoFinalize(mediaId: string) {
    return await this.client.post('media/upload', {
      command: 'FINALIZE',
      media_id: mediaId,
    });
  }

  async uploadVideoStatus(mediaId: string) {
    while (true) {
      const statusResponse = await this.client.get('media/upload', {
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
        throw new Error(String(error));
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * (check_after_secs + 5)));
    }
  }

  async postRetweet(tweetId: string) {
    return await this.client.post(`statuses/retweet/${tweetId}`, {});
  }
}