import { Feature } from '../../Feature';
import { bubbleMenuPlugin } from './bubbleMenuPlugin';
import type { PublicMenuitemOptions } from '../../Feature';

export interface BubbleMenuOptions {
  /** Bold text format */
  bold?: PublicMenuitemOptions | false;
  /** Italic text format */
  italic?: PublicMenuitemOptions | false;
  /** Hyperlinks */
  link?: PublicMenuitemOptions | false;
  /** Large heading */
  h3?: PublicMenuitemOptions | false;
  /** Small heading */
  h4?: PublicMenuitemOptions | false;
  /** Blockquotes & pull quotes */
  quote?: PublicMenuitemOptions | false;

  [key: string]: PublicMenuitemOptions | false | undefined;
}

/** Add a toolbar that pops up above the text and media */
export const BubbleMenu = Feature.create<BubbleMenuOptions>({
  name: 'bubbleMenu',
  priority: -100,

  addPlugins() {
    const menuitems = this.features
      .flatMap((feature) => {
        if (!feature.config?.addBubbleMenuItems) return [];

        return feature.config.addBubbleMenuItems.call({
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

    return [
      bubbleMenuPlugin({
        menuitems,
        editor: this.editor,
        view: this.view,
      }),
    ];
  },
});
