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
  recent_av_bot_consumer_key,
  recent_av_bot_consumer_secret,
  recent_av_bot_access_token_key,
  recent_av_bot_access_token_secret,
} = TWITTER_ENV;

export const AccountTypeList = ['av_video_bot', 'ero_video_bot', 'recent_av_bot'] as const;
export type AccountType = typeof AccountTypeList[number];

export class BotClient {
  account: AccountType;
  twitterConfig: Twitter.AccessTokenOptions;
  documentPath: string;

  constructor(account: AccountType, twitterConfig: Twitter.AccessTokenOptions, documentPath: string) {
    this.account = account;
    this.twitterConfig = twitterConfig;
    this.documentPath = documentPath;
  }

  static get(account: AccountType) {
    if (account === 'av_video_bot') {
      return this.avVideoBot(account);
    }
    if (account === 'ero_video_bot') {
      return this.eroVideoBot(account);
    }
    if (account === 'recent_av_bot') {
      return this.recentVideoBot(account);
    }
    throw new Error(`NOT FOUND: ${account}`);
  }

  private static avVideoBot(account: AccountType) {
    const twitterConfig = {
      consumer_key: av_video_bot_consumer_key,
      consumer_secret: av_video_bot_consumer_secret,
      access_token_key: av_video_bot_access_token_key,
      access_token_secret: av_video_bot_access_token_secret,
    };
    return new BotClient(account, twitterConfig, 'av_actress_bot');
  }

  private static eroVideoBot(account: AccountType) {
    const twitterConfig = {
      consumer_key: ero_video_bot_consumer_key,
      consumer_secret: ero_video_bot_consumer_secret,
      access_token_key: ero_video_bot_access_token_key,
      access_token_secret: ero_video_bot_access_token_secret,
    };
    return new BotClient(account, twitterConfig, 'av_movie_bot');
  }

  private static recentVideoBot(account: AccountType) {
    const twitterConfig = {
      consumer_key: recent_av_bot_consumer_key,
      consumer_secret: recent_av_bot_consumer_secret,
      access_token_key: recent_av_bot_access_token_key,
      access_token_secret: recent_av_bot_access_token_secret,
    };
    return new BotClient(account, twitterConfig, 'recent_av_bot');
  }
}
