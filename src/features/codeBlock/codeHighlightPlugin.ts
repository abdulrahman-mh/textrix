import { Decoration, DecorationSet } from 'prosemirror-view';
import { type EditorState, Plugin, PluginKey, type Transaction } from 'prosemirror-state';
import hljs from 'highlight.js/lib/common';
import dart from 'highlight.js/lib/languages/dart';
import { findChildren } from '../../helpers/findNodes';
import { HastEmitter } from './HastEmitter';
import type { NodeWithPos } from '../../types';

// Register Dart programming language
hljs.registerLanguage('dart', dart);

// Configure HLJS to use custom Emitter
hljs.configure({ __emitter: HastEmitter, classPrefix: 'hljs-' });

export { hljs };

export const registered = hljs.listLanguages();

export function isLanguageRegistered(lang: string) {
  return registered.includes(lang);
}

const DEFAULT_LANGUAGE = 'typescript';

/**
 * Recursively parses HLJS highlighted nodes and extracts text with their classes.
 */
function parseNodes(nodes: any[], className: string[] = []): { text: string; classes: string[] }[] {
  return nodes.flatMap((node) => {
    const classes = [...className, ...(node.properties?.className || [])];
    if (node.children) {
      return parseNodes(node.children, classes);
    }
    return { text: node.value || '', classes };
  });
}

/**
 * Creates decorations for syntax-highlighted code blocks.
 */
function getDecorations(state: EditorState, tr: Transaction, allBlocks?: NodeWithPos[]): DecorationSet {
  const { doc } = state;
  const decorations: Decoration[] = [];
  const updatedLangs = new Map();

  const blocks = allBlocks ?? findChildren(doc, (node) => node.type.name === 'codeBlock');

  for (const block of blocks) {
    const { language: selectedLanguage } = block.node.attrs;
    const mode = Number(block.node.attrs.mode);

    const textContent = block.node.textContent;

    let result: any;
    let language = selectedLanguage || DEFAULT_LANGUAGE;

    if (mode === 0) {
      // No Highlight
      continue;
    }

    if (mode === 1) {
      // Auto Highlight
      result = hljs.highlightAuto(textContent, registered);

      language = result.language || DEFAULT_LANGUAGE;

      if (language && language !== selectedLanguage) {
        updatedLangs.set(block.pos, language);
      }
    }

    if (mode === 2) {
      // Selected Language Highlight
      if (isLanguageRegistered(language)) {
        result = hljs.highlight(textContent, { language, ignoreIllegals: true });
      } else {
        // Fallback
        result = hljs.highlightAuto(textContent, registered);
        language = result.language || DEFAULT_LANGUAGE;
      }
    }

    if (!result) continue;

    let from = block.pos + 1;

    for (const { text, classes } of parseNodes(result._emitter.root.children)) {
      const to = from + text.length;
      if (classes.length) {
        decorations.push(Decoration.inline(from, to, { class: classes.join(' ') }));
      }
      from = to;
    }
  }

  if (updatedLangs.size > 0) {
    tr.setMeta('updatedLangs', updatedLangs);
  }

  return DecorationSet.create(doc, decorations);
}

const name = 'codeBlock';

/**
 * Plugin for syntax highlighting using Highlight.js.
 */
export const codeHighlightPlugin = new Plugin({
  key: new PluginKey('codeHighlight'),

  state: {
    init: (_, state) => getDecorations(state, state.tr),
    apply: (transaction, decorationSet, oldState, newState) => {
      const oldNodeName = oldState.selection.$head.parent.type.name;
      const newNodeName = newState.selection.$head.parent.type.name;
      const oldNodes = findChildren(oldState.doc, (node) => node.type.name === name);
      const newNodes = findChildren(newState.doc, (node) => node.type.name === name);

      if (
        transaction.docChanged &&
        // Apply decorations if:
        // selection includes named node,
        ([oldNodeName, newNodeName].includes(name) ||
          // OR transaction adds/removes named node,
          newNodes.length !== oldNodes.length ||
          // OR transaction has changes that completely encapsulte a node
          // (for example, a transaction that affects the entire document).
          // Such transactions can happen during collab syncing via y-prosemirror, for example.
          transaction.steps.some((step) => {
            // @ts-ignore
            return (
              // @ts-ignore
              step.from !== undefined &&
              // @ts-ignore
              step.to !== undefined &&
              oldNodes.some((node) => {
                // @ts-ignore
                return (
                  // @ts-ignore
                  node.pos >= step.from &&
                  // @ts-ignore
                  node.pos + node.node.nodeSize <= step.to
                );
              })
            );
          }))
      ) {
        return getDecorations(newState, transaction, newNodes);
      }

      return decorationSet.map(transaction.mapping, transaction.doc);
    },
  },
  props: {
    decorations(state) {
      return this.getState(state);
    },
  },
  appendTransaction(transactions, oldState, newState) {
    const updatedLangs = transactions[0].getMeta('updatedLangs');
    const tr = newState.tr;

    if (updatedLangs && updatedLangs instanceof Map && updatedLangs.size) {
      updatedLangs.forEach((lang, pos) => {
        const node = newState.doc.nodeAt(pos);
        if (node && node.type.name === 'codeBlock' && node.attrs.language !== lang) {
          tr.setNodeAttribute(pos, 'language', lang);
        }
      });
    }

    return tr.docChanged ? tr : null;
  },
});
