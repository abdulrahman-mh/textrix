import { Feature, type PublicMenuitemOptions } from '../../Feature';
import floatingMenuPlugin from './floatingMenuPlugin';

export interface FloatingMenuOptions {
  /** Insert an image from the device. */
  image?: Omit<PublicMenuitemOptions, 'divider'> | false;

  /** Insert an image from Unsplash. */
  unsplash?: Omit<PublicMenuitemOptions, 'divider'> | false;

  /** Embed a video (YouTube, Vimeo, etc.). */
  video?: Omit<PublicMenuitemOptions, 'divider'> | false;

  /** Embed external content (tweets, CodePen, etc.). */
  embed?: Omit<PublicMenuitemOptions, 'divider'> | false;

  /** Insert a formatted code block. */
  codeBlock?: Omit<PublicMenuitemOptions, 'divider'> | false;

  /** Add a horizontal divider (new section) CTRL+Enter. */
  newPart?: Omit<PublicMenuitemOptions, 'divider'> | false;

  [key: string]: Omit<PublicMenuitemOptions, 'divider'> | false | undefined;
}

/** Make a toolbar appear automagically on empty lines. */
export const FloatingMenu = Feature.create<FloatingMenuOptions>({
  name: 'floatingMenu',
  priority: -100,

  addFloatingMenuItems() {
    return [
      {
        name: 'floatingMenu',
        title: this.editor.options.messages.addContent,
      },
    ];
  },

  addPlugins() {
    const menuitems = this.features
      .flatMap((feature) => {
        if (!feature.config?.addFloatingMenuItems) return [];

        return feature.config.addFloatingMenuItems.call({
          name: feature.config.name,
          editor: this.editor,
          options: feature.options,
          storage: feature.storage,
          schema: this.schema,
          view: this.view,
          commands: this.commands,
          features: this.features,
        });
      })
      .filter((item) => item && this.options?.[item.name] !== false)
      .map((item) => ({
        ...item,
        ...(this.options?.[item.name] || {}),
      }))
      .sort((a, b) => (b.priority || 100) - (a.priority || 100));

    return [floatingMenuPlugin(this.editor, menuitems)];
  },
});
