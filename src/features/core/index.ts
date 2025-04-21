import { Feature } from '../../Feature';
import { extendNodeSchema } from './coreSchema';
import { editablePlugin } from './editablePlugin';
import { focusPlugin } from './focusPlugin';
import { addGlobalAttributes } from './globalAttributes';
import { headlinePlugin } from './headlinePlugin';
import { emptyNodesPlugin } from './emptyNodesPlugin';
import { placeholdersPlugin } from './placeholdersPlugin';
import { textDirectionPlugin } from './textDirectionPlugin';
import { trailingNodePlugin } from './trailingNodePlugin';
import { uniqueIdPlugin } from './uniqueIdPlugin';
import { history } from 'prosemirror-history';

const Core = Feature.create({
  name: 'core',
  priority: 999,

  addGlobalAttributes({ options }) {
    return addGlobalAttributes(options);
  },

  extendNodeSchema() {
    return extendNodeSchema(this);
  },

  addPlugins() {
    const plugins = [
      history(),
      editablePlugin(this.editor),
      focusPlugin(this.editor),
      headlinePlugin(this.editor),
      trailingNodePlugin(),
      placeholdersPlugin(this.editor),
      uniqueIdPlugin(),
      emptyNodesPlugin(),
    ];

    if (this.editor.options.autoTextDirection) {
      plugins.push(textDirectionPlugin());
    }

    return plugins;
  },
});

export default Core;
