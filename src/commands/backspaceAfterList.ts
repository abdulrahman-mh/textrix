import type { EditorState, Transaction } from "prosemirror-state";
import { TextSelection } from "prosemirror-state";
import type { Node as ProseMirrorNode } from "prosemirror-model";

/**
 * Finds the position of a specific list item within the document.
 */
function findListItemPosition(
  doc: ProseMirrorNode,
  targetListItem: ProseMirrorNode,
  startPos: number = 0
): number | null {
  let foundPos: number | null = null;

  doc.nodesBetween(startPos, doc.nodeSize - 2, (node, pos) => {
    if (node === targetListItem) {
      foundPos = pos;
      return false; // Stop iteration
    }
  });

  return foundPos;
}

/**
 * Finds the deepest nested list item in a list structure.
 * Traverses down nested lists to find the last item at the deepest level.
 */
function findDeepestLastListItem(listNode: ProseMirrorNode): {
  listItem: ProseMirrorNode;
  paragraph: ProseMirrorNode;
} | null {
  let currentListItem = listNode.lastChild;

  if (!currentListItem || currentListItem.type.name !== "listItem") {
    return null;
  }

  // Keep traversing down nested lists to find the deepest one
  while (currentListItem) {
    const paragraph = currentListItem.firstChild;
    if (!paragraph || paragraph.type.name !== "paragraph") {
      break;
    }

    // Check if this list item has nested lists
    let hasNestedList = false;
    let nestedList: ProseMirrorNode | null = null;

    for (let i = 1; i < currentListItem.childCount; i++) {
      const child: ProseMirrorNode = currentListItem.child(i);
      if (
        child.type.name === "bulletList" ||
        child.type.name === "orderedList"
      ) {
        hasNestedList = true;
        nestedList = child;
        break;
      }
    }

    if (hasNestedList && nestedList) {
      // Go deeper into the nested list
      const nestedLastItem: ProseMirrorNode | null = nestedList.lastChild;
      if (nestedLastItem && nestedLastItem.type.name === "listItem") {
        currentListItem = nestedLastItem;
        continue;
      }
    }

    // No more nested lists, this is our deepest item
    return {
      listItem: currentListItem,
      paragraph: paragraph,
    };
  }

  return null;
}

/**
 * Custom backspace behavior when cursor is at the start of a paragraph that follows a list.
 * Handles two cases:
 * 1. If the deepest nested list item is empty, removes it and shifts the paragraph up
 * 2. If the deepest nested list item has content, moves the paragraph content to the end of it
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

  // Find the deepest nested list item instead of just the last top-level item
  const deepestItem = findDeepestLastListItem(listNode);
  if (!deepestItem) {
    return false;
  }

  const { listItem: lastListItem, paragraph: lastParagraph } = deepestItem;

  // Check if the deepest list item is empty
  const isLastListItemEmpty = lastParagraph.textContent.trim() === "";

  if (!dispatch) {
    return true;
  }

  const tr = state.tr;
  const currentParagraphPos = $from.before();
  const currentParagraphNode = $from.parent;

  if (isLastListItemEmpty) {
    // Case 1: Remove the empty list item and shift paragraph up

    // Find the position of the deepest list item to remove it
    const lastListItemPos = findListItemPosition(doc, lastListItem);
    if (lastListItemPos !== null) {
      const lastListItemEndPos = lastListItemPos + lastListItem.nodeSize;
      tr.delete(lastListItemPos, lastListItemEndPos);
    }

    // Set cursor position at the beginning of the paragraph (which should now be shifted up)
    const mappedParagraphPos = tr.mapping.map(currentParagraphPos, -1);
    const newCursorPos = tr.doc.resolve(mappedParagraphPos + 1); // +1 to get inside the paragraph
    tr.setSelection(new TextSelection(newCursorPos));
  } else {
    // Case 2: Move paragraph content to the end of the deepest list item

    // Find the position of the deepest list item's paragraph
    const lastListItemPos = findListItemPosition(doc, lastListItem);
    if (lastListItemPos !== null) {
      const paragraphStartPos = lastListItemPos + 1; // +1 to get inside the list item
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
  }

  dispatch(tr.scrollIntoView());
  return true;
}
