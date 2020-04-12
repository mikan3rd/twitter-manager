import { getTargetItem, uploadTwitterMedia, getAvMovieStatus } from './AvMovieBot';
import { TwitterClient } from './TwitterClient';

const targetDocumentPath = 'recent_av_bot';
const targetAccount = 'recent_av_bot';

export const tweetRecentMovie = async () => {
  const target = await getTargetItem(targetDocumentPath, 'date');
  if (!target) {
    return;
  }
  const { item, filePath, mediaType, totalBytes } = target;
  const status = getAvMovieStatus(item);

  const client = TwitterClient.get(targetAccount);
  const mediaId = await uploadTwitterMedia(client, filePath, mediaType, totalBytes);
  const result = await client.postTweet({ status, mediaIds: [mediaId] });
};
