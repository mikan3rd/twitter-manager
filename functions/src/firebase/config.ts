import * as cloudFunctions from "firebase-functions";

type Config = {
  twitter: {
    consumer_key: string;
    consumer_secret: string;
  };
  dmm: {
    api_id: string;
    affiliate_id: string;
  };
};

export const CONFIG = cloudFunctions.config() as Config;
