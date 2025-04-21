import { Plugin, PluginKey } from 'prosemirror-state';
import type { Editor } from '../../Editor';
import { FloatingMenu } from './floatingMenu';
import type { Menuitem } from '../../Feature';

export default function floatingMenuPlugin(editor: Editor, menuitems: Menuitem[]) {
  return new Plugin({
    key: new PluginKey('floatingMenu'),
    view: (editorView) => {
      return new FloatingMenu(editor, editorView, menuitems);
    },
  });
}
