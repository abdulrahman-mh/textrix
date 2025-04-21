/**
 * @deprecated
 * Use pastRule instead
 */

// import { tokenize } from 'linkifyjs';
// import { Plugin, PluginKey } from 'prosemirror-state';
// import { sanitizeHref } from './sanitizeUri';

// let isPastedFromProseMirror = false;
// let pasteEvent = typeof ClipboardEvent !== 'undefined' ? new ClipboardEvent('paste') : null;

// const pastRules = () =>
//   new Plugin({
//     key: new PluginKey('pastRules'),
//     appendTransaction: (trs, oldState, state) => {
//       const transaction = trs[0];
//       const isPaste = transaction.getMeta('uiEvent') === 'paste' && !isPastedFromProseMirror;

//       if (!isPaste) {
//         return;
//       }

//       // handle actual paste/drop
//       const from = oldState.doc.content.findDiffStart(state.doc.content);
//       const to = oldState.doc.content.findDiffEnd(state.doc.content);

//       // stop if there is no changed range
//       if (!(typeof from === 'number') || !to || from === to.b) {
//         return;
//       }

//       // Start Process the Event
//       const tr = state.tr;

//       const finalFrom = Math.max(from - 1, 0);
//       const finalTo = to.b - 1;

//       let isChange = false;

//       state.doc.nodesBetween(finalFrom, finalTo, (node, pos) => {
//         if (!node.isTextblock || node.type.spec.code) {
//           return;
//         }
//         const resolvedFrom = Math.max(from - 1, pos);
//         const resolvedTo = Math.min(finalTo, pos + node.content.size);
//         const textToMatch = node.textBetween(resolvedFrom - pos, resolvedTo - pos, undefined, '\ufffc');

//         const links = tokenize(textToMatch).map((t) => t.toObject(''));

//         links
//           .filter((link) => link.isLink)
//           .filter((link) => /^https?:\/\//.test(link.href))
//           .map((link) => ({
//             ...link,
//             from: resolvedFrom + link.start + 1,
//             to: resolvedFrom + link.end + 1,
//           }))
//           .filter((link) => sanitizeHref(link.value))
//           .forEach((link) => {
//             isChange = true;
//             tr.addMark(
//               state.tr.mapping.map(link.from),
//               state.tr.mapping.map(link.to),
//               state.schema.marks.link.create({
//                 href: link.href,
//               }),
//             );
//           });
//       });

//       if (!isChange || !tr.steps.length) {
//         return;
//       }

//       return tr;
//     },
//     props: {
//       handleDOMEvents: {
//         paste(_view, event) {
//           const html = (event as ClipboardEvent).clipboardData?.getData('text/html');

//           pasteEvent = event as ClipboardEvent;

//           isPastedFromProseMirror = !!html?.includes('data-pm-slice');

//           return false;
//         },
//       },
//     },
//   });

// export default pastRules;
