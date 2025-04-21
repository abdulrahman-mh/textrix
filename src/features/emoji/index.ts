import { Feature } from '../../Feature';
import { InputRule } from '../../InputRule';
import { emojiSuggestionPlugin } from './emojiSuggestionPlugin';
import { emojiGet } from './helpers';

export const Emoji = Feature.create({
  name: 'emojiSuggestion',

  addPlugins() {
    return [emojiSuggestionPlugin(this.editor, this.view)];
  },

  addInputRules() {
    return [
      new InputRule({
        find: /:([^:]+):$/,
        handler: ({ state, range, match }) => {
          const emojiName = match[1];
          const emoji = emojiGet(emojiName);

          if (!emoji) return;

          const start = range.from - 1;
          const end = range.to + 1;

          state.tr.insertText(emoji.emoji, start, end);
        },
      }),
    ];
  },
});
