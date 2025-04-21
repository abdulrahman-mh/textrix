import type { Mark, Node as ProseMirrorNode, ParseRule } from 'prosemirror-model';
import type { GlobalAttribute, SchemaOptions } from '../types';

export function fromString(value: any): any {
  if (typeof value !== 'string') return value;
  if (value.match(/^[+-]?(?:\d*\.)?\d+$/)) return Number(value);
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}

/**
 * This function merges extension attributes into parserule attributes (`attrs` or `getAttrs`).
 * Cancels when `getAttrs` returns `false`.
 * @param parseRule ProseMirror ParseRule
 * @param extensionAttributes List of attributes to inject
 */
export function injectExtensionAttributesToParseRule(
  parseRule: ParseRule,
  extensionAttributes: GlobalAttribute[],
): ParseRule {
  if ('style' in parseRule) {
    return parseRule;
  }

  return {
    ...parseRule,
    getAttrs: (node: HTMLElement) => {
      const oldAttributes = parseRule.getAttrs ? parseRule.getAttrs(node) : parseRule.attrs;

      if (oldAttributes === false) {
        return false;
      }

      const newAttributes: Record<string, any> = {};
      for (const item of extensionAttributes) {
        const value = item.attribute.parseDOM
          ? item.attribute.parseDOM(node)
          : fromString(node.getAttribute(item.name));

        if (value !== null && value !== undefined) {
          newAttributes[item.name] = value;
        }
      }

      return { ...oldAttributes, ...newAttributes };
    },
  };
}

/** Merge `class`, `style`, and other attributes */
export function mergeAttributes(...objects: Record<string, any>[]): Record<string, any> {
  return objects
    .filter((item) => !!item)
    .reduce<Record<string, any>>((mergedAttributes, item) => {
      for (const [key, value] of Object.entries(item)) {
        if (!(key in mergedAttributes)) {
          mergedAttributes[key] = value;
          continue;
        }

        if (key === 'class') {
          const valueClasses = value ? String(value).split(' ') : [];
          const existingClasses = mergedAttributes[key] ? String(mergedAttributes[key]).split(' ') : [];

          for (const valueClass of valueClasses) {
            if (!existingClasses.includes(valueClass)) {
              existingClasses.push(valueClass);
            }
          }

          mergedAttributes[key] = existingClasses.join(' ');
        } else if (key === 'style') {
          const newStyles = value
            ? String(value)
                .split(';')
                .map((style) => style.trim())
                .filter(Boolean)
            : [];
          const existingStyles = mergedAttributes[key]
            ? String(mergedAttributes[key])
                .split(';')
                .map((style) => style.trim())
                .filter(Boolean)
            : [];

          const styleMap = new Map<string, string>();

          for (const style of existingStyles) {
            const [property, val] = style.split(':').map((part) => part.trim());
            if (property && val) {
              styleMap.set(property, val);
            }
          }

          for (const style of newStyles) {
            const [property, val] = style.split(':').map((part) => part.trim());
            if (property && val) {
              styleMap.set(property, val);
            }
          }

          mergedAttributes[key] = Array.from(styleMap.entries())
            .map(([property, val]) => `${property}: ${val}`)
            .join('; ');
        } else {
          mergedAttributes[key] = value;
        }
      }

      return mergedAttributes;
    }, {});
}

export function getRenderedAttributes(
  nodeOrMark: ProseMirrorNode | Mark,
  attributes: GlobalAttribute[],
  options: SchemaOptions,
): Record<string, any> {
  return attributes
    .filter((attribute) => attribute.type === nodeOrMark.type.name)
    .filter((item) => item.attribute.rendered ?? true)
    .filter(({ attribute: { renderedOnMode: mode } }) => !mode || (mode === 'published') === !!options.published)
    .map((item) => {
      if (!item.attribute.toDOM) {
        return {
          [item.name]: nodeOrMark.attrs[item.name],
        };
      }

      return item.attribute.toDOM(nodeOrMark.attrs) || {};
    })
    .reduce((attributes, attribute) => mergeAttributes(attributes, attribute), {});
}
