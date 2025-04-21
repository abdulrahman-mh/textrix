import { Plugin, PluginKey } from 'prosemirror-state';
import { find, type MultiToken, tokenize } from 'linkifyjs';

import { combineTransactionSteps } from '../../helpers/combineTransactionSteps';
import { findChildrenInRange } from '../../helpers/findNodes';
import { getChangedRanges } from '../../helpers/getChangedRanges';
import { getMarksBetween } from '../..//helpers/getMarksBetween';
import setMark from '../../commands/setMark';
import { sanitizeHref } from './sanitizeUri';
import type { NodeWithPos } from '../../types';

/**
 * Check if the provided tokens form a valid link structure, which can either be a single link token
 * or a link token surrounded by parentheses or square brackets.
 *
 * This ensures that only complete and valid text is hyperlinked, preventing cases where a valid
 * top-level domain (TLD) is immediately followed by an invalid character, like a number. For
 * example, with the `find` method from Linkify, entering `example.com1` would result in
 * `example.com` being linked and the trailing `1` left as plain text. By using the `tokenize`
 * method, we can perform more comprehensive validation on the input text.
 */
function isValidLinkStructure(tokens: Array<ReturnType<MultiToken['toObject']>>) {
  if (tokens.length === 1) {
    return tokens[0].isLink;
  }

  if (tokens.length === 3 && tokens[1].isLink) {
    return ['()', '[]'].includes(tokens[0].value + tokens[2].value);
  }

  return false;
}

/**
 * This plugin allows you to automatically add links to your editor.
 */
const autolink = new Plugin({
  key: new PluginKey('autolink'),
  appendTransaction: (transactions, oldState, newState) => {
    /**
     * Does the transaction change the document?
     */
    const docChanges = transactions.some((transaction) => transaction.docChanged) && !oldState.doc.eq(newState.doc);

    /**
     * Prevent autolink if the transaction is not a document change or if the transaction has the meta `preventAutolink`.
     */
    const preventAutolink = transactions.some((transaction) => transaction.getMeta('preventAutolink'));

    /**
     * Prevent autolink if the transaction is not a document change
     * or if the transaction has the meta `preventAutolink`.
     */
    if (!docChanges || preventAutolink) {
      return;
    }

    const { tr } = newState;
    const transform = combineTransactionSteps(oldState.doc, [...transactions]);
    const changes = getChangedRanges(transform);

    for (const { newRange } of changes) {
      // Now let’s see if we can add new links.
      const nodesInChangedRanges = findChildrenInRange(newState.doc, newRange, (node) => node.isTextblock);

      let textBlock: NodeWithPos | undefined;
      let textBeforeWhitespace: string | undefined;

      if (nodesInChangedRanges.length > 1) {
        // Grab the first node within the changed ranges (ex. the first of two paragraphs when hitting enter).
        textBlock = nodesInChangedRanges[0];
        textBeforeWhitespace = newState.doc.textBetween(
          textBlock.pos,
          textBlock.pos + textBlock.node.nodeSize,
          undefined,
          ' ',
        );
      } else if (
        nodesInChangedRanges.length &&
        // We want to make sure to include the block seperator argument to treat hard breaks like spaces.
        newState.doc
          .textBetween(newRange.from, newRange.to, ' ', ' ')
          .endsWith(' ')
      ) {
        textBlock = nodesInChangedRanges[0];
        textBeforeWhitespace = newState.doc.textBetween(textBlock.pos, newRange.to, undefined, ' ');
      }

      if (textBlock && textBeforeWhitespace) {
        const wordsBeforeWhitespace = textBeforeWhitespace.split(' ').filter((s) => s !== '');

        if (wordsBeforeWhitespace.length <= 0) {
          continue;
        }

        const lastWordBeforeSpace = wordsBeforeWhitespace[wordsBeforeWhitespace.length - 1];
        const lastWordAndBlockOffset = textBlock.pos + textBeforeWhitespace.lastIndexOf(lastWordBeforeSpace);

        if (!lastWordBeforeSpace) {
          continue;
        }

        // No default protocol
        const linksBeforeSpace = tokenize(lastWordBeforeSpace).map((t) => t.toObject(''));

        if (!isValidLinkStructure(linksBeforeSpace)) {
          continue;
        }

        for (const link of linksBeforeSpace) {
          // Only process links starting with http:// or https://
          if (!link.isLink || !/^https?:\/\//.test(link.href)) continue;

          // Calculate link position.
          const from = lastWordAndBlockOffset + link.start + 1;
          const to = lastWordAndBlockOffset + link.end + 1;

          // ignore link inside code mark
          if (newState.schema.marks.code && newState.doc.rangeHasMark(from, to, newState.schema.marks.code)) {
            continue;
          }

          if (!sanitizeHref(link.value)) continue;

          if (getMarksBetween(from, to, newState.doc).some((item) => item.mark.type === newState.schema.marks.link)) {
            continue;
          }

          // Add link mark.
          tr.addMark(from, to, newState.schema.marks.link.create({ href: link.href }));
        }
      }
    }

    if (!tr.steps.length) {
      return;
    }

    return tr;
  },
  props: {
    // Adds a link to the current selection if the pasted content only contains an url.
    handlePaste(view, event, slice) {
      const { state, dispatch } = view;
      const { tr } = state;

      const { selection } = tr;
      const { empty, from, to } = selection;

      if (empty) {
        return false;
      }

      let textContent = '';

      // biome-ignore lint/complexity/noForEach: <explanation>
      slice.content.forEach((node) => {
        textContent += node.textContent;
      });

      const link = find(textContent, { defaultProtocol: '' }).find(
        (item) => item.isLink && item.value === textContent && /^https?:\/\//.test(item.value),
      );

      if (!textContent || !link) {
        return false;
      }

      setMark(state.schema.marks.link, { href: link.href })(state, dispatch);

      return true;
    },
  },
});

export default autolink;
