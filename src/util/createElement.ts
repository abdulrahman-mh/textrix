// Helper function to create an HTML Element
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options: { className?: string; attributes?: Record<string, string>; children?: (HTMLElement | string)[] } = {},
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (options.className) el.className = options.className;

  for (const [key, value] of Object.entries(options.attributes || {})) {
    if (value !== null && value !== 'null' && value !== undefined && value !== 'undefined') el.setAttribute(key, value);
  }

  for (const child of options.children || []) {
    el.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }

  return el;
}

// function createElement<K extends keyof HTMLElementTagNameMap>(
//   tag: K,
//   options: {
//     className?: string;
//     attributes?: Record<string, string>;
//     children?: (HTMLElement | string)[] | string;
//   } = {},
// ): HTMLElementTagNameMap[K] {
//   const el = document.createElement(tag);
//   if (options.className) el.className = options.className;

//   for (const [key, value] of Object.entries(options.attributes || {})) {
//     if (value != null && value !== 'null' && value !== 'undefined') {
//       el.setAttribute(key, value);
//     }
//   }

//   if (typeof options.children === 'string') {
//     // Parse string HTML content into actual DOM elements
//     const template = document.createElement('template');
//     template.innerHTML = options.children.trim();
//     el.append(...template.content.childNodes);
//   } else {
//     for (const child of options.children || []) {
//       el.append(typeof child === 'string' ? document.createTextNode(child) : child);
//     }
//   }

//   return el;
// }
