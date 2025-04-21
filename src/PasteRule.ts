import { type EditorState, Plugin } from 'prosemirror-state';
import type { Editor } from './Editor';
import { createChainableState } from './helpers/createChainableState';
import type { Commands, ExtendedRegExpMatchArray, Range } from './types';
import { isRegExp } from './helpers/isRegExp';

export type PasteRuleMatch = {
  index: number;
  text: string;
  replaceWith?: string;
  match?: RegExpMatchArray;
  data?: Record<string, any>;
};

export type PasteRuleFinder =
  | RegExp
  | ((text: string, event?: ClipboardEvent | null) => PasteRuleMatch[] | null | undefined);

export class PasteRule {
  find: PasteRuleFinder;

  handler: (props: {
    state: EditorState;
    range: Range;
    match: ExtendedRegExpMatchArray;
    commands: Commands;
    pasteEvent: ClipboardEvent | null;
  }) => void;

  constructor(config: {
    find: PasteRuleFinder;
    handler: (props: {
      state: EditorState;
      range: Range;
      match: ExtendedRegExpMatchArray;
      commands: Commands;
      pasteEvent: ClipboardEvent | null;
    }) => void;
  }) {
    this.find = config.find;
    this.handler = config.handler;
  }
}

const pasteRuleMatcherHandler = (
  text: string,
  find: PasteRuleFinder,
  event?: ClipboardEvent | null,
): ExtendedRegExpMatchArray[] => {
  if (isRegExp(find)) return [...text.matchAll(find)];

  const matches = find(text, event) ?? [];
  return matches.map(({ text, index, replaceWith, data }) => {
    const result: ExtendedRegExpMatchArray = [text];
    result.index = index;
    result.input = text;
    result.data = data;

    if (replaceWith && !text.includes(replaceWith)) {
      console.warn('[Textrix warn]: "replaceWith" must be part of "text".');
    }

    if (replaceWith) result.push(replaceWith);
    return result;
  });
};

function applyPasteRules({
  commands,
  state,
  from,
  to,
  rules,
  pasteEvent,
}: {
  commands: Commands;
  state: EditorState;
  from: number;
  to: number;
  rules: PasteRule[];
  pasteEvent: ClipboardEvent | null;
}) {
  const tr = state.tr;
  const chainAbleState = createChainableState({ state, transaction: tr });
  let ruleApplied = false;

  state.doc.nodesBetween(from, to, (node, pos) => {
    if (!node.isTextblock || node.type.spec.code) return;

    const resolvedFrom = Math.max(from, pos);
    const resolvedTo = Math.min(to, pos + node.content.size);
    const textToMatch = node.textBetween(resolvedFrom - pos, resolvedTo - pos, undefined, '\ufffc');

    for (const rule of rules) {
      for (const match of pasteRuleMatcherHandler(textToMatch, rule.find, pasteEvent)) {
        if (match.index === undefined) continue;

        const start = resolvedFrom + match.index + 1;
        const end = start + match[0].length;

        const range = {
          from: tr.mapping.map(start),
          to: tr.mapping.map(end),
        };

        const handler = rule.handler({ commands, state: chainAbleState, range, match, pasteEvent });

        if (handler !== null) {
          ruleApplied = true;
        }
      }
    }
  });

  return ruleApplied && tr.steps.length ? tr : null;
}

export function pasteRulesPlugin({
  rules,
  commands,
}: { editor: Editor; commands: Commands; rules: PasteRule[] }): Plugin {
  let isPastedFromProseMirror = false;
  let pasteEvent = typeof ClipboardEvent !== 'undefined' ? new ClipboardEvent('paste') : null;

  return new Plugin({
    props: {
      handleDOMEvents: {
        paste: (_view, event: Event) => {
          const html = (event as ClipboardEvent).clipboardData?.getData('text/html');

          pasteEvent = event as ClipboardEvent;

          isPastedFromProseMirror = !!html?.includes('data-pm-slice');

          return false;
        },
      },
    },

    appendTransaction: (transactions, oldState, state) => {
      const transaction = transactions[0];
      const isPaste = transaction.getMeta('uiEvent') === 'paste' && !isPastedFromProseMirror;

      if (!isPaste) {
        return;
      }

      const from = oldState.doc.content.findDiffStart(state.doc.content);
      const to = oldState.doc.content.findDiffEnd(state.doc.content);

      // stop if there is no changed range
      if (typeof from !== 'number' || !to || from === to.b) {
        return;
      }

      return applyPasteRules({
        rules,
        state,
        commands,
        from: Math.max(from - 1, 0),
        to: to.b - 1,
        pasteEvent,
      });
    },
  });
}
