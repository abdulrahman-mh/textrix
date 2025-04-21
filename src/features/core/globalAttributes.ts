import type { AddGlobalAttributes, SchemaOptions } from '../../types';
import { textDirectionTypes } from './textDirectionPlugin';
import { uniqueIdTypes } from './uniqueIdPlugin';

export function addGlobalAttributes(options: SchemaOptions): AddGlobalAttributes {
  const attributes: AddGlobalAttributes = [
    {
      types: uniqueIdTypes,
      attributes: {
        name: {
          default: null,
          // Don't render `name` attribute on published content
          renderedOnMode: 'edit',
          parseDOM: (element) => element.getAttribute('name'),
          toDOM: (attributes) => {
            if (!attributes.name) {
              return {};
            }
            return { name: attributes.name };
          },
        },
      },
    },
    {
      types: ['paragraph', 'h3', 'h4'],
      mode: 'published',
      attributes: {
        // Allow add additional classes on published (e.g title, subtitle, kicker)
        class: {
          default: null,
        },
      },
    },
    {
      types: ['mention'],
      attributes: {
        'data-user-id': {
          default: null,
          parseDOM: (element) => element.getAttribute('data-user-id'),
          toDOM: (attributes) => ({ 'data-user-id': attributes['data-user-id'] }),
        },
        'data-tooltip-position': {
          default: null,
          renderedOnMode: 'edit',
          parseDOM: (element) => element.getAttribute('data-tooltip-position'),
          toDOM: (attributes) => ({ 'data-tooltip-position': attributes['data-tooltip-position'] }),
        },
        'data-tooltip-type': {
          default: null,
          renderedOnMode: 'edit',
          parseDOM: (element) => element.getAttribute('data-tooltip-type'),
          toDOM: (attributes) => ({ 'data-tooltip-type': attributes['data-tooltip-type'] }),
        },
      },
    },
    {
      types: ['link'],
      attributes: {
        'data-tooltip': {
          default: null,
          renderedOnMode: 'edit',
          parseDOM: (element) => element.getAttribute('data-tooltip'),
          toDOM: (attributes) => ({ 'data-tooltip': attributes['data-tooltip'] }),
        },
        'data-tooltip-position': {
          default: null,
          renderedOnMode: 'edit',
          parseDOM: (element) => element.getAttribute('data-tooltip-position'),
          toDOM: (attributes) => ({ 'data-tooltip-position': attributes['data-tooltip-position'] }),
        },
      },
    },
    {
      types: textDirectionTypes,
      attributes: {
        dir: {
          default: null,
          rendered: true,
          parseDOM: (element) => element.getAttribute('dir'),
          toDOM: (attributes) => ({ dir: attributes.dir }),
        },
      },
    },
  ];

  return attributes;
}
