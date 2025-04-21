import type { EditorState, Transaction } from 'prosemirror-state';
import isNodeActive from '../helpers/isNodeActive';
import { setBlockType } from 'prosemirror-commands';
import type { NodeType } from 'prosemirror-model';

const toggleNode =
  (type: NodeType, toggleType: NodeType, attributes = {}) =>
  (state: EditorState, dispatch?: (tr: Transaction) => void) => {
    // const type = getNodeType(typeOrName, state.schema);
    // const toggleType = getNodeType(toggleTypeOrName, state.schema);
    const isActive = isNodeActive(state, type, attributes);

    let attributesToCopy: Record<string, any> | undefined;

    if (state.selection.$anchor.sameParent(state.selection.$head)) {
      // only copy attributes if the selection is pointing to a node of the same type
      attributesToCopy = state.selection.$anchor.parent.attrs;
    }

    if (isActive) {
      return setBlockType(state.schema.nodes[toggleType.name], attributesToCopy)(state, dispatch);
    }

    // If the node is not active, we want to set the new node type with the given attributes
    // Copying over the attributes from the current node if the selection is pointing to a node of the same type
    return setBlockType(state.schema.nodes[type.name], { ...attributesToCopy, ...attributes })(state, dispatch);
  };

export default toggleNode;
