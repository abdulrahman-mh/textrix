// import { PluginRegister } from '../../types';
// import { sanitizeHref } from 'util/sanitizeUri';

// export default function mention(): PluginRegister {
//   return {
//     name: 'mention',
//     priority: 100,
//     extendNodeSchema() {
//       return {
//         mention: {
//           content: 'inline*',
//           group: 'inline',
//           inline: true,
//           selectable: false,
//           atom: true,
//           attrs: {
//             userid: { default: null },
//             href: { default: null },
//             'data-action': { default: 'show-user-card' },
//             'data-action-type': { default: 'hover' },
//           },
//           parseDOM: [
//             {
//               tag: 'a[data-user-id]',
//               getAttrs(dom) {
//                 const userid = dom.getAttribute('data-user-id');
//                 const href = sanitizeHref(dom.getAttribute('href'));

//                 // prevent XSS attacks
//                 if (!href || !userid) return false;

//                 return {
//                   href: href,
//                   userid,
//                   'data-action': dom.getAttribute('data-action') || 'show-user-card',
//                   'data-action-type': dom.getAttribute('data-action-type') || 'hover',
//                 };
//               },
//             },
//           ],
//           toDOM(node) {
//             const uri = sanitizeHref(node.attrs.href);

//             // prevent XSS attacks
//             if (!uri) {
//               // strip out the href
//               return ['a', { ...node.attrs, class: 'mention', href: '' }, 0];
//             }

//             return ['a', { ...node.attrs, class: 'mention' }, 0];
//           },
//         },
//       };
//     },
//   };
// }
