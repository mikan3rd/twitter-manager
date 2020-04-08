import * as Twitter from 'twitter';
import * as functions from 'firebase-functions';

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
} = TWITTER_ENV;

export class TwitterClient {
  static get(account: 'av_video_bot' | 'ero_video_bot') {
    if (account === 'av_video_bot') {
      return this.avVideoBotClient();
    }
    if (account === 'ero_video_bot') {
      return this.eroVideoBotClient();
    }
    throw new Error(`NOT FOUND: ${account}`);
  }

  private static avVideoBotClient() {
    return new Twitter({
      consumer_key: av_video_bot_consumer_key,
      consumer_secret: av_video_bot_consumer_secret,
      access_token_key: av_video_bot_access_token_key,
      access_token_secret: av_video_bot_access_token_secret,
    });
  }

  private static eroVideoBotClient() {
    return new Twitter({
      consumer_key: ero_video_bot_consumer_key,
      consumer_secret: ero_video_bot_consumer_secret,
      access_token_key: ero_video_bot_access_token_key,
      access_token_secret: ero_video_bot_access_token_secret,
    });
  }
}
