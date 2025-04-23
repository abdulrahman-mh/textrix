import type { MDXComponents } from 'mdx/types';
import Link from 'next/link';
import Notice from './app/ui/notice';
import ExternalLink from './app/ui/ExternalLink';

// This file allows you to provide custom React components
// to be used in MDX files. You can import and use any
// React component you want, including inline styles,
// components from other libraries, and more.

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Allows customizing built-in components, e.g. to add styling.
    // h1: ({ children }) => (
    //   <h1 style={{ color: 'red', fontSize: '48px' }}>{children}</h1>
    // ),
    // img: (props) => (
    //   <Image
    //     sizes="100vw"
    //     style={{ width: '100%', height: 'auto' }}
    //     {...(props as ImageProps)}
    //   />
    // ),
    Notice,
    a: (props) => {
      const isExternal = props.href?.startsWith('http');

      if (isExternal) {
        return (
          <a {...props} target="_blank" rel="noreferrer noopener" className="transition-colors inline-flex items-center border-none">
            <span>{props.children}</span>
            <ExternalLink className="ml-1 h-5 w-5 text-gray-800 dark:text-gray-400" aria-label="Opens in new tab" />
          </a>
        );
      }
      return <Link {...props} />;
    },
    ...components,
  };
}
