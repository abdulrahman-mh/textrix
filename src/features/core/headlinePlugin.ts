import type { Node } from 'prosemirror-model';
import { type EditorState, Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { focusPluginKey } from './focusPlugin';
import type { Range } from '../../types';
import type { Editor } from '../../Editor';
import { createElement } from '../../util/createElement';

export const HeadingPluginKey = new PluginKey<{ decorations: DecorationSet; indexes: Record<string, number> }>(
  'headlineSet',
);

function createHeadingLabel(message: string) {
  return createElement('span', { className: 'heading-label', attributes: { 'data-heading-label': message } });
}

function checkHasFocus(focusRange: Range, currentRange: Range) {
  return currentRange.from >= focusRange.from && currentRange.to <= focusRange.to;
}

/** Heading decoration to resolve and mark the title, subtitle, and kicker from the doc */
function getDecorations(
  state: EditorState,
  editor: Editor,
): { decorations: DecorationSet; indexes: Record<string, number> } {
  const { doc } = state;
  const decorations: Decoration[] = [];
  const labelsDecorations: Decoration[] = [];
  const indexes: Record<string, number> = {};

  let prevNode: { node: Node; pos: number; index: number } | null = null;
  let isDone = false;
  let hasFocus = false;

  const focusState = focusPluginKey.getState(state);
  const focusRange = { from: focusState?.from ?? 0, to: focusState?.to ?? 0 };

  doc.forEach((node, pos, index) => {
    if (isDone) return;

    const name = node.type.name;

    if (name === 'paragraph' && node.textContent.trim() === '' && !prevNode) return;

    if (name === 'h3' && (!prevNode || prevNode.node.type.name !== 'h3')) {
      // Title
      decorations.push(Decoration.node(pos, pos + node.nodeSize, { class: 'title' }));
      labelsDecorations.push(Decoration.widget(pos + 1, () => createHeadingLabel(editor.options.messages.titleLabel)));
      indexes.title = index;

      hasFocus ||= checkHasFocus(focusRange, { from: pos, to: pos + node.nodeSize });

      if (prevNode?.node.type.name === 'h4') {
        const range = { from: prevNode.pos, to: prevNode.pos + prevNode.node.nodeSize };

        // Kicker
        decorations.push(Decoration.node(range.from, range.to, { class: 'kicker' }));
        labelsDecorations.push(
          Decoration.widget(range.from + 1, () => createHeadingLabel(editor.options.messages.kickerLabel)),
        );
        indexes.kicker = prevNode.index;

        hasFocus ||= checkHasFocus(focusRange, range);
      }

      prevNode = { node, pos, index };
    } else if (name === 'h4' && (!prevNode || prevNode.node.type.name !== 'h4')) {
      if (prevNode?.node.type.name === 'h3') {
        // Subtitle
        decorations.push(Decoration.node(pos, pos + node.nodeSize, { class: 'subtitle' }));
        labelsDecorations.push(
          Decoration.widget(pos + 1, () => createHeadingLabel(editor.options.messages.subtitleLabel)),
        );
        indexes.subtitle = index;

        hasFocus ||= checkHasFocus(focusRange, { from: pos, to: pos + node.nodeSize });
        isDone = true;
        return;
      }

      prevNode = { node, pos, index };
    } else {
      isDone = true;
    }
  });

  if (hasFocus) decorations.push(...labelsDecorations);

  return { decorations: DecorationSet.create(doc, decorations), indexes };
}

export function headlinePlugin(editor: Editor) {
  return new Plugin({
    key: HeadingPluginKey,
    state: {
      init(_, state) {
        return getDecorations(state, editor);
      },
      apply(tr, value, oldState, newState) {
        return getDecorations(newState, editor);
      },
    },
    props: {
      decorations(state) {
        return HeadingPluginKey.getState(state)?.decorations ?? DecorationSet.empty;
      },
    },
  });
}
