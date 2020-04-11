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
