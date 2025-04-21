import type { Editor } from '../../Editor';
import { Plugin, PluginKey } from 'prosemirror-state';

export function editablePlugin(editor: Editor) {
  return new Plugin({
    key: new PluginKey('editable'),
    props: {
      editable: () => editor.isEditable,
    },
  });
}
