import { Plugin, PluginKey } from 'prosemirror-state';
import { BubbleMenus } from './bubbleMenu';
import type { EditorView } from 'prosemirror-view';
import type { Editor } from '../../Editor';
import type { Menuitem } from '../../Feature';

export function bubbleMenuPlugin(config: { editor: Editor; view: EditorView; menuitems: Menuitem[] }) {
  return new Plugin({
    key: new PluginKey('bubbleMenu'),
    view: () => new BubbleMenus(config),
  });
}
