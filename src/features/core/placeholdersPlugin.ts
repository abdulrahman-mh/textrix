import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import type { Node as ProseMirrorNode } from 'prosemirror-model';
import type { Editor } from '../../Editor';


export function placeholdersPlugin(editor: Editor) {
  const {
    messages: { titleLabel: title, mainPlaceholder: tellYourStory, imgCaption, embedCaption },
  } = editor.options;

  const headingTypes = ['paragraph', 'h3', 'h4'];
  const generalTypes = ['figcaption'];
  const validTypes = [...headingTypes, ...generalTypes];

  // Initial value to True, to render placeholders when editor first initialize
  let allowAnyTr = true;

  function getMessage({
    defaultMessage,
    childCount,
    index,
    node,
    parent,
  }: {
    defaultMessage?: string;
    childCount: number;
    index: number;
    node: ProseMirrorNode;
    parent?: ProseMirrorNode | null;
  }) {
    if (defaultMessage) return defaultMessage;

    if (node.type.name === 'figcaption' && parent && parent.content.size > 0) {
      return parent.firstChild?.type.name === 'image' ? imgCaption : embedCaption;
    }

    if (headingTypes.includes(node.type.name)) {
      if (childCount === 1) return tellYourStory;
      if (childCount <= 2) return index === 0 ? title : tellYourStory;
    }

    return null;
  }

  function isValidPlaceholder({ node, index }: { node: ProseMirrorNode; index: number }) {
    return (
      (generalTypes.includes(node.type.name) || (index <= 2 && headingTypes.includes(node.type.name))) &&
      !node.textContent
    );
  }

  let secondPlaceholderHidden = false;

  return new Plugin({
    key: new PluginKey('placeholders'),

    state: {
      init() {
        return { decorations: DecorationSet.empty, placeholders: new Map() };
      },
      apply(tr, state, oldState, newState) {
        // Handle `removePlaceholder` metadata
        const removeMeta = tr.getMeta('removePlaceholder');
        if (removeMeta && removeMeta.pos !== undefined) {
          state.placeholders.set(removeMeta.pos, false);
        }

        // Process `addPlaceholder` metadata
        const addMeta = tr.getMeta('addPlaceholder');
        if (addMeta?.pos !== undefined) {
          state.placeholders.set(addMeta.pos, {
            message: addMeta.message,
            class: addMeta.class,
          });
          if (addMeta.removeOnAnyTr) {
            allowAnyTr = true;
          }
        }

        if (!tr.docChanged && !state.placeholders.size && !allowAnyTr) return state; // Skip unnecessary updates

        const newDecorations: Decoration[] = [];
        const childCount = newState.doc.childCount;
        const oldChildCount = oldState.doc.childCount;

        newState.doc.descendants((node, pos, parent, index) => {
          if (!validTypes.includes(node.type.name)) return;

          const placeholder = state.placeholders.get(pos);

          // Skip disabled placeholders
          if (placeholder === false) {
            if (index === 1) {
              secondPlaceholderHidden = true;
            }
            return false;
          }

          // Handle custom placeholders
          if (placeholder) {
            const placeholderMessage = getMessage({
              defaultMessage: placeholder.message,
              childCount,
              index,
              node,
              parent,
            });

            if (placeholderMessage) {
              newDecorations.push(
                Decoration.node(pos, pos + node.nodeSize, {
                  'data-placeholder': placeholderMessage,
                  class: placeholder.class,
                }),
              );

              return false;
            }
          }

          if (!isValidPlaceholder({ node, index })) return;
          let placeholderMessage = getMessage({ childCount, index, node, parent });

          // Custom handling of first two lines placeholders
          if (childCount === 1) {
            placeholderMessage = tellYourStory;
            secondPlaceholderHidden = false;
          } else if (childCount === 2) {
            if (index === 0) {
              placeholderMessage = title;
            } else if (index === 1 && oldChildCount <= 2) {
              const wasEmptyBefore =
                index < oldState.doc.childCount && oldState.doc.child(index)?.textContent !== node.textContent;

              placeholderMessage =
                !secondPlaceholderHidden || oldChildCount === 1 || wasEmptyBefore ? tellYourStory : null;
            } else {
              placeholderMessage = null;
              secondPlaceholderHidden = true;
            }

            if (placeholderMessage === tellYourStory) {
              secondPlaceholderHidden = false;
            }
          }

          if (placeholderMessage) {
            newDecorations.push(Decoration.node(pos, pos + node.nodeSize, { 'data-placeholder': placeholderMessage }));
          }
        });

        if (allowAnyTr && !state.placeholders.size) allowAnyTr = false;
        state.placeholders.clear();

        return {
          decorations: DecorationSet.create(newState.doc, newDecorations),
          placeholders: state.placeholders,
        };
      },
    },

    props: {
      decorations(state) {
        return this.getState(state)!.decorations;
      },
    },
  });
}
