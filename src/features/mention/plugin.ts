// import { Suggestion, SuggestionOptions } from './suggestion';
// import { computePosition } from '@floating-ui/dom';

// type User = string;

// export const options: SuggestionOptions<User> = {
//   items({ query }) {
//     // prettier-ignore
//     const names = [
//       'Lea Thompson',
//       'Cyndi Lauper',
//       'Tom Cruise',
//       'Madonna',
//       'Jerry Hall',
//       'Joan Collins',
//       'Winona Ryder',
//       'Christina Applegate',
//       'Alyssa Milano',
//       'Molly Ringwald',
//       'Ally Sheedy',
//       'Debbie Harry',
//       'Olivia Newton-John',
//       'Elton John',
//       'Michael J. Fox',
//       'Axl Rose',
//       'Emilio Estevez',
//       'Ralph Macchio',
//       'Rob Lowe',
//       'Jennifer Grey',
//       'Mickey Rourke',
//       'John Cusack',
//       'Matthew Broderick',
//       'Justine Bateman',
//       'Lisa Bonet',
//     ];

//     query = query.toLowerCase();
//     return names
//       .filter((item) => item.toLowerCase().includes(query))
//       .sort((a, b) => a.toLowerCase().indexOf(query) - b.toLowerCase().indexOf(query))
//       .slice(0, 5);
//   },
//   render() {
//     let mentionMenu: HTMLElement | undefined;
//     let popup;
//     let command: any;

//     function removeMenu() {
//       mentionMenu?.remove();
//       mentionMenu = undefined;
//     }

//     return {
//       onStart(props) {
//         command = props.command;
//       },
//       onUpdate({ items, clientRect, decorationNode, editor, command: newCommand }) {
//         if (!mentionMenu) {
//           mentionMenu = document.createElement('div');
//           editor.dom.parentElement?.appendChild(mentionMenu);
//         }
//         mentionMenu.textContent = items.join('');

//         computePosition(decorationNode as any, mentionMenu).then(({ x, y }) => {
//           Object.assign(mentionMenu!.style, {
//             left: `${x}px`,
//             top: `${y}px`,
//           });
//         });

//         command = newCommand;
//       },
//       onKeyDown({ event }) {
//         if (event.key === 'Escape') {
//           removeMenu();
//           return true;
//         } else if (event.key === 'Enter') {
//           if (command) {
//             command({ id: 'Test', href: 'http://example.com', name: 'Name' });
//             return true;
//           }
//         }

//         return false;
//       },
//       onExit() {
//         removeMenu();
//       },
//     };
//   },
// };

// export const SuggestionPlugin = (options?: Pick<SuggestionOptions, 'items' | 'command' | 'render'>) =>
//   Suggestion({
//     char: '@',
//     allowSpaces: true,
//     command: ({ editor, range, props }) => {
//       // increase range.to by one when the next node is of type "text"
//       // and starts with a space character
//       const nodeAfter = editor.state.selection.$to.nodeAfter;
//       const overrideSpace = nodeAfter?.text?.startsWith(' ');

//       if (overrideSpace) {
//         range.to += 1;
//       }

//       const { name, ...otherProps } = props;

//       editor.dispatch(
//         editor.state.tr.replaceWith(range.from, range.to, [
//           editor.state.schema.node('mention', props, editor.state.schema.text(name || 'Username')),
//           editor.state.schema.text(' '),
//         ]),
//       );

//       // get reference to `window` object from editor element, to support cross-frame JS usage
//       editor.dom.ownerDocument.defaultView?.getSelection()?.collapseToEnd();
//     },
//     allow: ({ state, range }) => {
//       // Max search len 39 letters
//       const $from = state.doc.resolve(range.from);
//       const type = state.schema.nodes.mention;
//       const allow = !!$from.parent.type.contentMatch.matchType(type);

//       return allow;
//     },
//     ...options,
//   });
