import type { NodeWithPos, Predicate, Range } from '../types';
import type { Selection } from 'prosemirror-state';
import type { Node as ProseMirrorNode, ResolvedPos } from 'prosemirror-model';

/**
 * Finds the closest parent node to a resolved position that matches a predicate.
 * @param $pos The resolved position to search from
 * @param predicate The predicate to match
 * @returns The closest parent node to the resolved position that matches the predicate
 * @example ```js
 * findParentNodeClosestToPos($from, node => node.type.name === 'paragraph')
 * ```
 */
export function findParentNodeClosestToPos(
  $pos: ResolvedPos,
  predicate: Predicate,
):
  | {
      pos: number;
      start: number;
      depth: number;
      node: ProseMirrorNode;
    }
  | undefined {
  for (let i = $pos.depth; i > 0; i -= 1) {
    const node = $pos.node(i);

    if (predicate(node)) {
      return {
        pos: i > 0 ? $pos.before(i) : 0,
        start: $pos.start(i),
        depth: i,
        node,
      };
    }
  }
}

/**
 * Finds the closest parent node to the current selection that matches a predicate.
 * @param predicate The predicate to match
 * @returns A command that finds the closest parent node to the current selection that matches the predicate
 * @example ```js
 * findParentNode(node => node.type.name === 'paragraph')
 * ```
 */
export function findParentNode(predicate: Predicate) {
  return (selection: Selection) => findParentNodeClosestToPos(selection.$from, predicate);
}

/**
 * Finds child nodes within a ProseMirror node that match a predicate.
 */
export function findChildren(node: ProseMirrorNode, predicate: Predicate): NodeWithPos[] {
  const result: NodeWithPos[] = [];
  node.descendants((child, pos) => {
    if (predicate(child)) {
      result.push({ node: child, pos });
    }
  });
  return result;
}

/**
 * Same as `findChildren` but searches only within a `range`.
 * @param node The Prosemirror node to search in
 * @param range The range to search in
 * @param predicate The predicate to match
 * @returns An array of nodes with their positions
 */
export function findChildrenInRange(node: ProseMirrorNode, range: Range, predicate: Predicate): NodeWithPos[] {
  const nodesWithPos: NodeWithPos[] = [];

  // if (range.from === range.to) {
  //   const nodeAt = node.nodeAt(range.from)

  //   if (nodeAt) {
  //     nodesWithPos.push({
  //       node: nodeAt,
  //       pos: range.from,
  //     })
  //   }
  // }

  node.nodesBetween(range.from, range.to, (child, pos) => {
    if (predicate(child)) {
      nodesWithPos.push({
        node: child,
        pos,
      });
    }
  });

  return nodesWithPos;
}
