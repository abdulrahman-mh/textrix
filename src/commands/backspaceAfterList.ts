import type { EditorState, Transaction } from "prosemirror-state";
import { TextSelection } from "prosemirror-state";
import type { Node as ProseMirrorNode } from "prosemirror-model";

/**
 * Custom backspace behavior when cursor is at the start of a paragraph that follows a list.
 * Handles two cases:
 * 1. If the last list item is empty, removes it and shifts the paragraph up
 * 2. If the last list item has content, moves the paragraph content to the end of the last list item
 */
export function backspaceAfterList(
  state: EditorState,
  dispatch?: (tr: Transaction) => void
): boolean {
  const { selection, doc } = state;
  const { $from, empty } = selection;

  // Only handle backspace at the very start of a paragraph
  if (
    !empty ||
    $from.parentOffset !== 0 ||
    $from.parent.type.name !== "paragraph"
  ) {
    return false;
  }

  // Find the node immediately before the current paragraph
  let prevNodePos: number | null = null;
  let prevNode: ProseMirrorNode | null = null;

  const beforeCurrentParagraph = $from.before();

  if (beforeCurrentParagraph > 0) {
    doc.nodesBetween(0, beforeCurrentParagraph, (node, pos) => {
      if (pos + node.nodeSize === beforeCurrentParagraph) {
        prevNode = node;
        prevNodePos = pos;
        return false; // Stop iteration
      }
    });
  }

  if (!prevNode || prevNodePos === null) {
    return false;
  }

  const listNode = prevNode as ProseMirrorNode;

  // Check if the previous node is a list
  if (
    listNode.type.name !== "bulletList" &&
    listNode.type.name !== "orderedList"
  ) {
    return false;
  }

  const lastListItem = listNode.lastChild;
  if (!lastListItem || lastListItem.type.name !== "listItem") {
    return false;
  }

  const lastParagraph = lastListItem.firstChild;
  if (!lastParagraph || lastParagraph.type.name !== "paragraph") {
    return false;
  }

  // Check if the last list item is empty
  const isLastListItemEmpty = lastParagraph.textContent.trim() === "";

  if (!dispatch) {
    return true;
  }

  const tr = state.tr;
  const currentParagraphPos = $from.before();
  const currentParagraphNode = $from.parent;

  if (isLastListItemEmpty) {
    // Case 1: Remove the empty list item and shift paragraph up

    // Check if this is the only listItem in the list
    const isOnlyListItem = listNode.childCount === 1;

    if (isOnlyListItem) {
      // If this is the only listItem, remove the entire list
      const listStartPos = prevNodePos;
      const listEndPos = listStartPos + listNode.nodeSize;
      tr.delete(listStartPos, listEndPos);
    } else {
      // If there are other listItems, just remove the last one

      // Calculate position of the last list item
      let lastListItemPos = prevNodePos + 1;
      for (let i = 0; i < listNode.childCount - 1; i++) {
        lastListItemPos += listNode.child(i).nodeSize;
      }

      const lastListItemEndPos = lastListItemPos + lastListItem.nodeSize;
      tr.delete(lastListItemPos, lastListItemEndPos);
    }

    // Set cursor position at the beginning of the paragraph (which should now be shifted up)
    const mappedParagraphPos = tr.mapping.map(currentParagraphPos, -1);
    const newCursorPos = tr.doc.resolve(mappedParagraphPos + 1); // +1 to get inside the paragraph
    tr.setSelection(new TextSelection(newCursorPos));
  } else {
    // Case 2: Move paragraph content to the end of the last list item

    // Calculate position of the last paragraph in the list
    let lastListItemPos = prevNodePos + 1;
    for (let i = 0; i < listNode.childCount - 1; i++) {
      lastListItemPos += listNode.child(i).nodeSize;
    }

    const paragraphStartPos = lastListItemPos + 1;
    const endOfLastParagraph = paragraphStartPos + lastParagraph.nodeSize - 1;

    const insertionPos = endOfLastParagraph;
    const currentParagraphContent = currentParagraphNode.content;

    if (currentParagraphContent.size > 0) {
      tr.insert(insertionPos, currentParagraphContent);
    }

    const mappedFrom = tr.mapping.map(currentParagraphPos);
    const mappedTo = tr.mapping.map(
      currentParagraphPos + currentParagraphNode.nodeSize
    );
    tr.delete(mappedFrom, mappedTo);

    const targetPos = tr.mapping.map(insertionPos, -1);
    tr.setSelection(new TextSelection(tr.doc.resolve(targetPos)));
  }

  dispatch(tr.scrollIntoView());
  return true;
}
