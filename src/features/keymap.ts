import { undo, redo } from 'prosemirror-history';
import {
  newlineInCode,
  createParagraphNear,
  liftEmptyBlock,
  splitBlock,
  joinBackward,
  joinForward,
  selectNodeBackward,
  selectNodeForward,
  deleteSelection,
  selectTextblockStart,
  selectTextblockEnd,
} from 'prosemirror-commands';
import { splitListItem, sinkListItem, liftListItem } from 'prosemirror-schema-list';

import normalizeNode from '../commands/normalizeNode';
import { deletePlaceholder } from '../commands/deletePlaceholder';
import { undoInputRule } from '../commands/undoInputRule';
import { isiOS, isMacOS } from '../helpers/isMacOS';

import type { Editor } from '../Editor';
import type { Schema } from 'prosemirror-model';
import type { Commands } from '../types';
import { AllSelection, type Command } from 'prosemirror-state';

const chainCommands =
  (...commands: Array<Command | undefined | null>): Command =>
  (state, dispatch, view) => {
    for (const command of commands) {
      if (command?.(state, dispatch, view)) {
        return true;
      }
    }
    return false;
  };

const selectAll: Command = (state, dispatch) => {
  const { tr } = state;
  if (dispatch) dispatch(tr.setSelection(new AllSelection(tr.doc)));
  return true;
};

export default function buildEditorKeyMaps({
  schema,
  commands,
}: { schema: Schema; commands: Commands; editor: Editor }) {
  const isMac = isMacOS() || isiOS();
  const keys: Record<string, any> = {};

  // Backspace Commands
  const backspace = chainCommands(
    undoInputRule,
    normalizeNode,
    deleteSelection,
    joinBackward,
    selectNodeBackward,
    deletePlaceholder,
  );
  keys['Backspace'] = keys['Mod-Backspace'] = keys['Shift-Backspace'] = backspace;

  // Delete Commands
  const del = chainCommands(deleteSelection, joinForward, selectNodeForward);
  keys['Mod-Delete'] = del;

  keys['Enter'] = chainCommands(
    newlineInCode,
    commands?.newLineInMedia,
    schema.nodes.listItem ? splitListItem(schema.nodes.listItem) : null,
    createParagraphNear,
    liftEmptyBlock,
    splitBlock,
  );
  keys['Mod-Enter'] = chainCommands(newlineInCode, commands.setHorizontalRule);

  // Lists Commands
  const { listItem } = schema.nodes;
  if (listItem) {
    const liftList = liftListItem(listItem);
    const sinkList = sinkListItem(listItem);

    keys['Mod-['] = liftList;
    keys['Shift-Tab'] = liftList;
    keys['Mod-]'] = sinkList;
    keys['Tab'] = chainCommands(commands.tabInCode, sinkList);
  } else {
    keys['Tab'] = commands.tabInCode;
  }

  // Selection Commands
  keys['Mod-a'] = selectAll;

  if (isMac) {
    keys['Ctrl-h'] = keys['Alt-Backspace'] = backspace;
    keys['Ctrl-d'] = keys['Ctrl-Alt-Backspace'] = keys['Alt-Delete'] = keys['Alt-d'] = del;
    keys['Ctrl-a'] = selectTextblockStart;
    keys['Ctrl-e'] = selectTextblockEnd;
  }

  // Undo/Redo Commands
  keys['Mod-z'] = undo;
  keys['Mod-Shift-z'] = keys['Mod-y'] = redo;

  return keys;
}
