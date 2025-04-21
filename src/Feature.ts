import type { Editor } from './Editor';
import type { Schema } from 'prosemirror-model';
import type { Command, EditorState, Plugin } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { mergeDeep } from './helpers/mergeDeep';
import type {
  Commands,
  Attribute,
  SchemaOptions,
  NodeExtendedSpec,
  MarkExtendedSpec,
  Formats,
  AddGlobalAttributes,
} from './types';
import type { InputRule } from './InputRule';
import type { PasteRule } from './PasteRule';
import type { PopoverRule } from './features/popover';

export interface PublicMenuitemOptions {
  /** HTML content inside the item, can be SVG Markup */
  icon: string;

  /** To set a menu divider after this item */
  divider?: boolean;

  /** Optional set the priority of the menu item, used to place it */
  priority?: number;
}

/** Bubble or Floating menu item */
export interface Menuitem extends PublicMenuitemOptions {
  /** Unique item name use for `data-action` attribute */
  name: string;

  /** Text highlight OR Media focus item */
  type?: 'text' | 'media';

  /** Item title attribute */
  title: string;

  /** Optional set `data-action-value` attribute */
  dataActionValue?: string;

  /** Executes the menu item's action */
  execute?: Command;

  /** Checks if the item is currently active */
  isActive?: (state: EditorState) => boolean;

  /** Determines if the item can be activated */
  canActivate?: (state: EditorState) => boolean;

  /** Determines if the item should be visible */
  isVisible?: (state: EditorState) => boolean;
}

interface Context<Options = any, Storage = any> {
  /** Feature unique name */
  name: string;

  /** The editor view instance */
  view: EditorView;

  /** The ProseMirror schema */
  schema: Schema;

  /** The feature options */
  options: Options;

  /** The editor storage */
  storage: Storage;

  /** The editor instance */
  editor: Editor;

  /** Set of available commands */
  commands: Commands;

  /** List of available editor features */
  features: Feature[];
}

export interface FeatureConfig<Options = any, Storage = any> {
  /** Feature unique name */
  name: string;

  priority?: number;

  /** Add default options */
  addOptions?: (this: Pick<Context, 'name'>) => Options;

  /**
   * Ad new storage.
   *
   * @example
   * addStorage() {
   *   return {
   *     prefetchedUsers: [],
   *     loading: false,
   *   };
   * }
   */
  addStorage?: (this: Pick<Context<Options>, 'name' | 'options'>) => Storage;

  /** Adds new commands */
  addCommands?: (this: Omit<Context<Options, Storage>, 'commands'>) => Partial<Commands>;

  /** Add ProseMirror plugins */
  addPlugins?: (this: Context<Options, Storage>) => Plugin[];

  /**
   * Defines keyboard shortcuts.
   *
   * @example
   * addKeyboardShortcuts(() => ({
   *   "Mod+b": toggleBold,
   *   "Mod+i": toggleItalic,
   * }));
   */
  addKeyboardShortcuts?: (this: Context<Options, Storage>) => Record<string, Command>;

  /**
   * Define input rules.
   *
   * @example
   * addInputRules(() => ([
   *   emDashRule,
   *   smartQuotesRule
   * ]));
   */
  addInputRules?: (this: Context<Options, Storage>) => InputRule[];

  /**
   * Define paste rules.
   *
   * @example
   * addPasteRules(() => ([
   *   pasteEmDashRule,
   * ]));
   */
  addPasteRules?: (this: Context<Options, Storage>) => PasteRule[];

  /** Extend ProseMirror node schema */
  extendNodeSchema?: (this: { name: string; schemaOptions: SchemaOptions; options: Options }) => Record<
    string,
    NodeExtendedSpec
  >;

  /** Extend ProseMirror mark schema */
  extendMarkSchema?: (this: { name: string; schemaOptions: SchemaOptions; options: Options }) => Record<
    string,
    MarkExtendedSpec
  >;

  /**
   * This function adds globalAttributes to specific nodes.
   * @example
   * addGlobalAttributes() {
   *   return [
   *     {
   *        // Apply in this mode
   *        mode: "published",
   *        // Extend these nodes
   *        types: [
   *          'heading',
   *          'paragraph',
   *        ],
   *        // … with those attributes
   *        attributes: {
   *          textAlign: {
   *            default: 'left',
   *            toDOM: attributes => ({
   *              style: `text-align: ${attributes.textAlign}`,
   *            }),
   *            parseDOM: element => element.style.textAlign || 'left',
   *          },
   *        },
   *     },
   *   ]
   * }
   */
  addGlobalAttributes?: ({ options }: { options: SchemaOptions }) => AddGlobalAttributes;

  addPopoversRules?: (this: Context<Options, Storage>) => PopoverRule[];

  addBubbleMenuItems?: (this: Context<Options, Storage>) => Menuitem[];
  addFloatingMenuItems?: (this: Context<Options, Storage>) => Menuitem[];

  [key: string]: any;
}

export class Feature<Options = any, Storage = any> {
  config: FeatureConfig<Options, Storage>;
  options?: Options;
  storage?: Storage;

  constructor(config: FeatureConfig<Options, Storage>) {
    this.config = { ...config };

    if (config.addOptions) {
      this.options = config.addOptions.call({ name: config.name });
    }

    if (config.addStorage) {
      this.storage = config.addStorage.call({
        name: config.name,
        options: this.options as Options,
      });
    }
  }

  static create<O = any, S = any>(config: FeatureConfig<O, S>): Feature<O, S> {
    return new Feature<O, S>(config);
  }

  configure(options: Partial<Options> = {}): Feature<Options, Storage> {
    return new Feature<Options, Storage>({
      ...this.config,
      addOptions: () => mergeDeep(this.options as Record<string, any>, options) as Options,
    });
  }
}
