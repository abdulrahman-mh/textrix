import type { Schema } from 'prosemirror-model';
import { type EditorState, Plugin, PluginKey, type TextSelection } from 'prosemirror-state';

import type { Editor } from './Editor';
import { createChainableState } from './helpers/createChainableState';
import { getTextContentFromNodes } from './helpers/getTextContentFromNodes';
import type { Commands, ExtendedRegExpMatchArray, Range } from './types';
import { isRegExp } from './helpers/isRegExp';
import type { EditorView } from 'prosemirror-view';

export type InputRuleMatch = {
  index: number;
  text: string;
  replaceWith?: string;
  match?: RegExpMatchArray;
  data?: Record<string, any>;
};

export type InputRuleFinder = RegExp | ((text: string) => InputRuleMatch | null);

export class InputRule {
  find: InputRuleFinder;

  handler: (props: {
    state: EditorState;
    range: Range;
    match: ExtendedRegExpMatchArray;
    commands: Commands;
  }) => void;

  constructor(config: {
    find: InputRuleFinder;
    handler: (props: {
      state: EditorState;
      range: Range;
      match: ExtendedRegExpMatchArray;
      commands: Commands;
    }) => void;
  }) {
    this.find = config.find;
    this.handler = config.handler;
  }
}

const inputRuleMatcherHandler = (text: string, find: InputRuleFinder): ExtendedRegExpMatchArray | null => {
  if (isRegExp(find)) {
    return find.exec(text);
  }

  const inputRuleMatch = find(text);

  if (!inputRuleMatch) {
    return null;
  }

  const result: ExtendedRegExpMatchArray = [inputRuleMatch.text];

  result.index = inputRuleMatch.index;
  result.input = text;
  result.data = inputRuleMatch.data;

  if (inputRuleMatch.replaceWith) {
    if (!inputRuleMatch.text.includes(inputRuleMatch.replaceWith)) {
      console.warn('[Textrix warn]: "inputRuleMatch.replaceWith" must be part of "inputRuleMatch.text".');
    }

    result.push(inputRuleMatch.replaceWith);
  }

  return result;
};

function run(config: {
  editor: Editor;
  view: EditorView;
  schema: Schema;
  commands: Commands;
  from: number;
  to: number;
  text: string;
  rules: InputRule[];
  plugin: Plugin;
}): boolean {
  const { editor, view, schema, commands, from, to, text, rules, plugin } = config;

  if (view.composing) return false;

  const $from = view.state.doc.resolve(from);

  if (
    // check for code node
    $from.parent.type.spec.code ||
    // check for code mark
    !!($from.nodeBefore || $from.nodeAfter)?.marks.find((mark) => mark.type.spec.code)
  ) {
    return false;
  }

  const textBefore = getTextContentFromNodes($from) + text;

  for (const rule of rules) {
    const match = inputRuleMatcherHandler(textBefore, rule.find);
    if (!match) continue;

    const tr = view.state.tr;
    const state = createChainableState({ state: view.state, transaction: tr });
    const range = { from: from - (match[0].length - text.length), to };

    const handler = rule.handler({ state, range, match, commands });

    // stop if there are no changes
    if (handler === null || !tr.steps.length) continue;

    // Apply input rule changes
    view.dispatch(tr);

    // store transform as meta data
    // so we can undo input rules within the `undoInputRules` command
    view.dispatch(view.state.tr.setMeta(plugin, { transform: tr, from, to, text }));
    return true;
  }

  return false;
}

/**
 * Create an input rules plugin. When enabled, it will cause text
 * input that matches any of the given rules to trigger the rule’s
 * action.
 */
export function inputRulesPlugin(props: {
  editor: Editor;
  view: EditorView;
  schema: Schema;
  commands: Commands;
  rules: InputRule[];
}): Plugin {
  const { editor, rules, commands, view, schema } = props;
  const plugin = new Plugin({
    key: new PluginKey('inputRules'),
    state: {
      init() {
        return null;
      },
      apply(tr, prev) {
        const stored = tr.getMeta(plugin);

        if (stored) {
          return stored;
        }

        return tr.selectionSet || tr.docChanged ? null : prev;
      },
    },

    props: {
      handleTextInput(view, from, to, text) {
        return run({
          editor,
          view,
          schema,
          commands,
          from,
          to,
          text,
          rules,
          plugin,
        });
      },

      handleDOMEvents: {
        compositionend: (view) => {
          setTimeout(() => {
            const { $cursor } = view.state.selection as TextSelection;

            if ($cursor) {
              run({
                editor,
                view,
                schema,
                commands,
                from: $cursor.pos,
                to: $cursor.pos,
                text: '',
                rules,
                plugin,
              });
            }
          });

          return false;
        },
      },

      // add support for input rules to trigger on enter
      // this is useful for example for code blocks
      handleKeyDown(view, event) {
        if (event.key !== 'Enter') {
          return false;
        }

        const { $cursor } = view.state.selection as TextSelection;

        if ($cursor) {
          return run({
            editor,
            view,
            schema,
            commands,
            from: $cursor.pos,
            to: $cursor.pos,
            text: '\n',
            rules,
            plugin,
          });
        }

        return false;
      },
    },

    isInputRules: true,
  }) as Plugin;

  return plugin;
}
