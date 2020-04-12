import { TwitterClient, AccountType, AccountTypeList } from './TwitterClient';

export const createGenreHashtag = (words: string[]) => {
  const LowPriorityWord = ['ハイビジョン', '独占配信', '4時間以上作品'];
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
  const client = TwitterClient.get(account);
  const targetAccount = AccountTypeList[Math.floor(Math.random() * AccountTypeList.length)];
  const tweets = await client.getUserTimeline(targetAccount);
  const sortedTweets = tweets.sort((a, b) => (a.favorite_count > b.favorite_count ? -1 : 1));
  const targetTweet = sortedTweets.find(tweet => !tweet.retweeted);
  if (targetTweet) {
    await client.postRetweet(targetTweet.id_str);
  }
};

export const favoriteRandom = async (account: AccountType) => {
  const client = TwitterClient.get(account);
  const targetAccount = AccountTypeList[Math.floor(Math.random() * AccountTypeList.length)];
  const tweets = await client.getUserTimeline(targetAccount);
  const sortedTweets = tweets.sort((a, b) => (a.favorite_count > b.favorite_count ? -1 : 1));
  const targetTweet = sortedTweets.find(tweet => !tweet.favorited);
  if (targetTweet) {
    await client.postFavorite(targetTweet.id_str);
  }
};
