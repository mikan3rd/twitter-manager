import axios from 'axios';
import * as functions from 'firebase-functions';

const DMM_ENV = functions.config().dmm;
const DMM_API_ID = DMM_ENV.api_id;
const DMM_AFFILIATE_ID = DMM_ENV.affiliate_id;
const DMM_ENDPOINT = 'https://api.dmm.com/affiliate/v3';

type ItemResponse = {
  result: {
    status: number;
    result_count: number;
    total_count: number;
    first_position: number;
    items: ItemType[];
  };
};

export type ItemType = {
  service_code: string;
  service_name: string;
  floor_code: string;
  floor_name: string;
  category_name: string;
  content_id: string;
  product_id: string;
  title: string;
  volume: string;
  review: {
    count: number;
    average: number;
  };
  URL: string;
  URLsp: string;
  affiliateURL: string;
  affiliateURLsp: string;
  imageURL: {
    list: string;
    small: string;
    large: string;
  };
  sampleImageURL: {
    sample_s: { image: string[] };
  };
  sampleMovieURL?: {
    size_720_480: string;
  };
  prices: {};
  date: string;
  iteminfo: { actress: ItemActressType[]; genre: ItemGenreType };
};

export type ItemActressType = { id: number; name: string; ruby: string };
export type ItemGenreType = { id: number; name: string };

type ActressSearchResponse = {
  result: {
    status: number;
    result_count: number;
    total_count: number;
    first_position: number;
    actress: ActressType[];
  };
};

export type ActressType = {
  id: string;
  name: string;
  ruby: string;
  bust: string;
  cup: string;
  waist: string;
  hip: string;
  height: string;
  birthday: string;
  blood_type: string;
  hobby: string;
  prefectures: string;
  imageURL: {
    small: string;
    large: string;
  };
  listURL: {
    digital: string;
    monthly: string;
    ppm: string;
    mono: string;
    rental: string;
  };
};

export class DMMApiClient {
  static async getItemList({
    site = 'FANZA',
    service = 'digital',
    floor = 'videoa',
    sort = 'rank',
    keyword = null,
    article = null,
    articleId = null,
    hits = 100,
    offset = 1,
  }: {
    site?: 'FANZA' | 'DMM.com';
    service?: string;
    floor?: string;
    sort?: string;
    keyword?: string | null;
    article?: string | null;
    articleId?: number | null;
    hits?: number;
    offset?: number;
  }) {
    const url = `${DMM_ENDPOINT}/ItemList`;
    const params = {
      api_id: DMM_API_ID,
      affiliate_id: DMM_AFFILIATE_ID,
      site,
      service,
      floor,
      sort,
      keyword,
      article,
      article_id: articleId,
      hits,
      offset,
      output: 'json',
    };
    return await axios.get<ItemResponse>(url, { params });
  }

  static async getActressSearch({
    keyword = null,
    actressId = null,
  }: {
    keyword?: string | null;
    actressId?: number | null;
  }) {
    const url = `${DMM_ENDPOINT}/ActressSearch`;
    const params = {
      api_id: DMM_API_ID,
      affiliate_id: DMM_AFFILIATE_ID,
      actress_id: actressId,
      keyword: keyword,
      output: 'json',
    };
    return await axios.get<ActressSearchResponse>(url, { params });
  }
}
