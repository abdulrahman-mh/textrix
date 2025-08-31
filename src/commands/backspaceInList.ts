import type { EditorState, Transaction } from "prosemirror-state";
import { TextSelection } from "prosemirror-state";
import { liftListItem } from "prosemirror-schema-list";

/**
 * Custom backspace behavior for list items.
 * When pressing backspace at the start of a list item,
 * converts the list item to a paragraph and splits the list if necessary.
 */
export function backspaceInList(
  state: EditorState,
  dispatch?: (tr: Transaction) => void
): boolean {
  const { selection } = state;
  const { $from, empty } = selection;

  if ($from.depth >= 2) {
  }

  // Only handle Backspace at the very start of a paragraph inside a list item
  if (
    !empty ||
    $from.parentOffset !== 0 ||
    $from.parent.type.name !== "paragraph" ||
    $from.depth < 2 ||
    $from.node(-1).type.name !== "listItem"
  ) {
    return false;
  }

  if (!dispatch) return true;

  // Use the canonical list lift to preserve all edge cases and correct list splitting
  const didLift = liftListItem(state.schema.nodes.listItem)(state, (tr) => {
    // Clean up any stray marker text like "-" that could remain from user input
    const $cursor = tr.selection.$from;
    const paraPos = $cursor.before();
    const paragraph = $cursor.parent;

    if (paragraph.type.name === "paragraph") {
      const text = paragraph.textContent;

      // If the paragraph only contains a single bullet-like character, clear it
      if (/^[-+*]\s?$/.test(text)) {
        const from = paraPos + 1; // inside the paragraph
        const to = paraPos + paragraph.nodeSize - 1;
        tr.delete(from, to);
        tr.setSelection(TextSelection.create(tr.doc, paraPos + 1));
      }
    }

    dispatch(tr.scrollIntoView());
  });

  return didLift;
}
