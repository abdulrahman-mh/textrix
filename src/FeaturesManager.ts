import type { Editor } from './Editor';
import type { Feature } from './Feature';
import { keymap } from 'prosemirror-keymap';
import { type MarkSpec, type NodeSpec, Schema, type SchemaSpec, type TagParseRule } from 'prosemirror-model';
import type { Command, Plugin } from 'prosemirror-state';
import type { Commands, EditorOptions, Formats, GlobalAttribute, SchemaOptions } from './types';
import { getRenderedAttributes, injectExtensionAttributesToParseRule } from './helpers/globalAttributes';
import type { EditorView } from 'prosemirror-view';

import buildEditorKeyMaps from './features/keymap';
import { type InputRule, inputRulesPlugin } from './InputRule';
import { type PasteRule, pasteRulesPlugin } from './PasteRule';
import { type PopoverRule, popoverPlugin } from './features/popover';

import Core from './features/core';
import Quote from './features/blockquote';
import Bold from './features/bold';
import Br from './features/br';
import Code from './features/code';
import H3 from './features/h3';
import H4 from './features/h4';
import Hr from './features/hr';
import Italic from './features/italic';
import Link from './features/link';
import Lists from './features/lists';

export class FeaturesManager {
  features: Feature[];
  schema: Schema;
  commands: Commands = {} as Commands;
  view!: EditorView;

  constructor(private editor: Editor) {
    this.features = FeaturesManager.resolve(editor.options, editor.options.features);
    this.schema = FeaturesManager.buildSchema(this.features, {});
  }

  public setupView(view: EditorView) {
    this.view = view;
  }

  public setupFeatures() {
    for (const feature of this.features) {
      // Setup storage
      if (feature.storage) {
        this.editor.storage[feature.config.name] = feature.storage;
      }

      // Setup Commands
      if (feature.config.addCommands) {
        Object.assign(
          this.commands,
          feature.config.addCommands.call({
            editor: this.editor,
            name: feature.config.name,
            options: feature.options,
            storage: feature.storage,
            schema: this.schema,
            view: this.view,
            features: this.features,
          }),
        );
      }
    }
  }

  static getCoreFeatures(): Feature[] {
    return [Core, Quote, Bold, Br, Code, H3, H4, Hr, Italic, Link, Lists];
  }

  static resolve(options: Partial<EditorOptions>, extraFeatures: Feature[] = []): Feature[] {
    // Filter disabled formats from `editor.formats` option
    const formattingItems = FeaturesManager.getCoreFeatures().filter(
      (item) => options.formats?.[item.config.name as keyof Formats] !== false,
    );

    const features: Feature[] = [...formattingItems, ...extraFeatures];

    const resolved = FeaturesManager.sort(features);
    const names = resolved.map((feature) => feature.config.name);
    const duplicatedNames = [...new Set(names.filter((name, i, arr) => arr.indexOf(name) !== i))];

    if (duplicatedNames.length) {
      console.warn(
        `[Textrix warn]: Duplicate feature names found: [${duplicatedNames.map((name) => `'${name}'`).join(', ')}]. This may cause conflicts.`,
      );
    }

    return resolved;
  }

  static buildSchema(features: Feature[], options: SchemaOptions) {
    const globalAttrsMapping: GlobalAttribute[] = [];

    for (const feature of features) {
      const globalAttributes = feature.config.addGlobalAttributes?.({ options });
      if (!globalAttributes) continue;

      for (const { types, mode, attributes } of globalAttributes) {
        for (const type of types) {
          for (const [name, attribute] of Object.entries(attributes)) {
            globalAttrsMapping.push({
              type,
              name,
              attribute,
              isModeMatch: !mode || (mode === 'published') === !!options.published,
            });
          }
        }
      }
    }

    const nodes: Record<string, SchemaSpec['nodes']> = Object.fromEntries(
      features.flatMap((feature) => {
        if (!feature.config.extendNodeSchema) return [];

        const context = {
          name: feature.config.name,
          options: feature.options,
          schemaOptions: options,
        };

        const extendedNodes = feature.config.extendNodeSchema.call(context);

        return Object.entries(extendedNodes).map(([key, schema]) => {
          const attributes = globalAttrsMapping.filter(
            (attribute) => attribute.type === key && attribute.isModeMatch !== false,
          );

          for (const [name, attribute] of Object.entries(schema.attrs || {})) {
            attributes.push({
              type: key,
              name,
              attribute: {
                default: attribute?.default,
                rendered: true,
              },
            });
          }

          schema.attrs = Object.fromEntries(attributes.map((attr) => [attr.name, { default: attr.attribute.default }]));

          if (schema.parseDOM) {
            schema.parseDOM = schema.parseDOM.map((rule) =>
              injectExtensionAttributesToParseRule(rule, attributes),
            ) as TagParseRule[];
          }

          const { toDOM } = schema;
          if (toDOM) {
            const originalAttrs = [];

            (schema.toDOM as NodeSpec['toDOM']) = (node) =>
              toDOM({ node, HTMLAttributes: getRenderedAttributes(node, attributes, options) });
          }

          return [key, schema];
        });
      }),
    );

    const marks: Record<string, MarkSpec['marks']> = Object.fromEntries(
      features.flatMap((feature) => {
        if (!feature.config.extendMarkSchema) return [];

        const context = {
          name: feature.config.name,
          options: feature.options,
          schemaOptions: options,
        };

        const extendedMarks = feature.config.extendMarkSchema.call(context);

        return Object.entries(extendedMarks).map(([key, schema]) => {
          const attributes = globalAttrsMapping.filter((attribute) => attribute.type === key && attribute.isModeMatch);

          for (const [name, attribute] of Object.entries(schema.attrs || {})) {
            attributes.push({
              type: key,
              name,
              attribute: {
                default: attribute?.default,
                rendered: true,
              },
            });
          }

          schema.attrs = Object.fromEntries(attributes.map((attr) => [attr.name, { default: attr.attribute.default }]));

          if (schema.parseDOM) {
            schema.parseDOM = schema.parseDOM.map((rule) => injectExtensionAttributesToParseRule(rule, attributes));
          }

          const { toDOM } = schema;
          if (toDOM) {
            (schema.toDOM as MarkSpec['toDOM']) = (mark, inline) =>
              toDOM({ mark, HTMLAttributes: getRenderedAttributes(mark, attributes, options) });
          }

          return [key, schema];
        });
      }),
    );

    return new Schema({ nodes, marks });
  }

  /** Sort features by priority */
  static sort(features: Feature[]): Feature[] {
    return [...features].sort((a, b) => (b.config.priority || 100) - (a.config.priority || 100));
  }

  /** Get all ProseMirror plugins */
  get plugins(): Plugin[] {
    const plugins: Plugin[] = [];
    const inputRules: InputRule[] = [];
    const pasteRules: PasteRule[] = [];
    const popoverRules: PopoverRule[] = [];
    const keyMaps: Record<string, Command> = {};

    const { editor, commands, view, schema, features } = this;

    for (const feature of features) {
      const context = {
        name: feature.config.name,
        editor,
        options: feature.options,
        storage: feature.storage,
        schema,
        view,
        commands,
        features: this.features,
      };

      // Keyboard shortcuts
      if (feature.config.addKeyboardShortcuts) {
        Object.assign(keyMaps, feature.config.addKeyboardShortcuts.call(context));
      }

      // Input rules
      if (feature.config.addInputRules) {
        inputRules.push(...feature.config.addInputRules.call(context));
      }

      // Paste rules
      if (feature.config.addPasteRules) {
        pasteRules.push(...feature.config.addPasteRules.call(context));
      }

      // Popover rules
      if (feature.config.addPopoversRules) {
        popoverRules.push(...feature.config.addPopoversRules.call(context));
      }

      // ProseMirror Plugins
      if (feature.config.addPlugins) {
        plugins.push(...feature.config.addPlugins.call(context));
      }
    }

    return [
      inputRulesPlugin({ rules: inputRules, editor, view, schema, commands }),
      pasteRulesPlugin({ rules: pasteRules, editor, commands }),
      popoverPlugin(editor, popoverRules),
      ...plugins,
      keymap({ ...buildEditorKeyMaps({ schema, commands, editor }), ...keyMaps }),
    ];
  }
}
