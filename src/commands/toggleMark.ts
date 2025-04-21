import type { MarkType } from 'prosemirror-model';
import type { EditorState, Transaction } from 'prosemirror-state';

import { isMarkActive } from '../helpers/isMarkActive';
import unsetMark from './unsetMark';
import setMark from './setMark';

const toggleMark =
  (
    type: MarkType,
    attributes: Record<string, any> = {},
    options: {
      /**
       * Removes the mark even across the current selection. Defaults to `false`.
       */
      extendEmptyMarkRange?: boolean;
    } = {},
  ) =>
  (state: EditorState, dispatch?: (tr: Transaction) => void) => {
    const { extendEmptyMarkRange = false } = options;
    const isActive = isMarkActive(state, type, attributes);

    if (isActive) {
      return unsetMark(type, { extendEmptyMarkRange })(state, dispatch);
    }

    return setMark(type, attributes)(state, dispatch);
  };

export default toggleMark;
