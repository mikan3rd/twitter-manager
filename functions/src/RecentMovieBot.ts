import { getTargetItem, uploadTwitterMedia, getAvMovieStatus, postTweet } from './AvMovieBot';

const targetDocumentPath = 'recent_av_bot';
const targetAccount = 'recent_av_bot';

export const tweetRecentMovie = async () => {
  const target = await getTargetItem(targetDocumentPath, 'date');
  const mediaId = await uploadTwitterMedia({ ...target, account: targetAccount });
  const status = getAvMovieStatus(target.item);
  const result = await postTweet({ account: targetAccount, status, mediaIds: [mediaId] });
};
