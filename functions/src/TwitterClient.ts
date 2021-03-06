import axios from "axios";
import Twitter from "twitter";

import { CONFIG } from "./firebase/config";
import { logger } from "./firebase/functions";

export type TweetObjectType = {
  id_str: string;
  retweeted: boolean;
  retweet_count: number;
  favorited: boolean;
  favorite_count: number;
  user: TweetUserType;
};

export type TweetUserType = {
  id_str: string;
  screen_name: string;
  followers_count: number;
  friends_count: number;
  follow_request_sent: boolean;
  following: boolean;
  blocked_by: boolean;
  followed_by: boolean;
  lang: string;
};

export class TwitterClient {
  client: Twitter;

  constructor(client: Twitter) {
    this.client = client;
  }

  static get(params: {
    accessTokenKey: Twitter.AccessTokenOptions["access_token_key"];
    accessTokenSecret: Twitter.AccessTokenOptions["access_token_secret"];
  }) {
    const { accessTokenKey, accessTokenSecret } = params;
    const client = new Twitter({
      consumer_key: CONFIG.twitter.consumer_key,
      consumer_secret: CONFIG.twitter.consumer_secret,
      access_token_key: accessTokenKey,
      access_token_secret: accessTokenSecret,
    });
    return new TwitterClient(client);
  }

  async getAccount() {
    const response = await this.client.get("account/verify_credentials", {});
    return response as TweetUserType;
  }

  async getUserTimeline(screenName: string, includeRts = false, count = 200) {
    const response = await this.client.get("statuses/user_timeline", {
      screen_name: screenName,
      count,
      include_rts: includeRts,
    });
    return response as TweetObjectType[];
  }

  async getListTweets(listId: string, includeRts = false, count = 200) {
    const response = await this.client.get("lists/statuses", {
      list_id: listId,
      count,
      include_rts: includeRts,
    });
    return response as TweetObjectType[];
  }

  async getRetweetUser(tweetId: string, count = 100) {
    const response = await this.client.get(`statuses/retweets/${tweetId}`, { count, trim_user: false });
    return response as TweetObjectType[];
  }

  async getFavoriteUsers(tweetId: string) {
    return await this.client.get(`/timeline/liked_by`, { tweet_id: tweetId });
  }

  async postTweet({ status, mediaIds = [] }: { status: string; mediaIds?: string[] }) {
    return await this.client.post("statuses/update", {
      status,
      media_ids: mediaIds.join(","),
    });
  }

  async uploadImages(images: string[]) {
    const mediaIds: string[] = [];
    for (const imageUrl of images) {
      const { data } = await axios.get(imageUrl, { responseType: "arraybuffer" });
      try {
        const { media_id_string } = await this.client.post("media/upload", { media: data });
        mediaIds.push(media_id_string);
        if (mediaIds.length >= 4) {
          break;
        }
      } catch (e) {
        logger.error(e);
        throw Error("Please check abobe log!!");
      }
    }
    return mediaIds;
  }

  async uploadVideoInit(totalBytes: number, mediaType: string) {
    const response = await this.client.post("media/upload", {
      command: "INIT",
      total_bytes: totalBytes,
      media_type: mediaType,
      media_category: "tweet_video",
    });
    return response["media_id_string"] as string;
  }

  async uploadVideoAppend(mediaId: string, media: Buffer, segmentIndex: number) {
    return await this.client.post("media/upload", {
      command: "APPEND",
      media_id: mediaId,
      media,
      segment_index: segmentIndex,
    });
  }

  async uploadVideoFinalize(mediaId: string) {
    return await this.client.post("media/upload", {
      command: "FINALIZE",
      media_id: mediaId,
    });
  }

  async uploadVideoStatus(mediaId: string) {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const statusResponse = await this.client.get("media/upload", {
        command: "STATUS",
        media_id: mediaId,
      });
      const {
        processing_info: { state, check_after_secs, error },
      } = statusResponse;
      if (state === "succeeded") {
        break;
      }
      if (state === "failed") {
        throw new Error(String(error));
      }
      await new Promise((resolve) => setTimeout(resolve, 1000 * (check_after_secs + 5)));
    }
  }

  async postRetweet(tweetId: string) {
    return await this.client.post(`statuses/retweet/${tweetId}`, {});
  }

  async postFavorite(tweetId: string) {
    return await this.client.post(`favorites/create`, { id: tweetId });
  }

  async postFollow(userId: string) {
    return await this.client.post(`friendships/create`, { user_id: userId });
  }
}
