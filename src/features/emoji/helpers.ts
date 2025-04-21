import EmojiList from './emojiList.json';
export { EmojiList };

export const emojiSearch = (keyword: string) => {
  const normalizedName = /:.+:/.test(keyword) ? keyword.slice(1, -1) : keyword;

  return EmojiList.filter(({ name }) => name.match(normalizedName));
};

export const emojiGet = (keyword: string) => {
  return EmojiList.find(({ name }) => name === keyword);
};
