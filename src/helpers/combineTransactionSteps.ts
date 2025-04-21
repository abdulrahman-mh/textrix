import type { Node } from 'prosemirror-model';
import type { Transaction } from 'prosemirror-state';
import { Transform } from 'prosemirror-transform';

/**
 * Returns a new `Transform` based on all steps of the passed transactions.
 * @param oldDoc The ProseMirror node to start from.
 * @param transactions The transactions to combine.
 * @returns A new `Transform` with all steps of the passed transactions.
 */
export function combineTransactionSteps(oldDoc: Node, transactions: Transaction[]): Transform {
  const transform = new Transform(oldDoc);

  // Using for...of for better readability and Biome compliance
  for (const transaction of transactions) {
    for (const step of transaction.steps) {
      transform.step(step);
    }
  }

  return transform;
}
