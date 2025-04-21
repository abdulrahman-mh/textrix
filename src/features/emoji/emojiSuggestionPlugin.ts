import type { EditorView } from 'prosemirror-view';
import type { Editor } from '../../Editor';
import { Suggestion, type SuggestionProps } from '../suggestion';
import PopoverHandler from '../popover';
import { createElement } from '../../util/createElement';
import { emojiSearch } from './helpers';

let currentProps: SuggestionProps;
let selectedIndex: number | null = 0;
let popup: { container: HTMLElement; content: HTMLElement; arrow: HTMLElement } | undefined;

function selectEmoji() {
  if (selectedIndex === null) return false;
  if (currentProps?.items[selectedIndex]) {
    currentProps.command({ emoji: currentProps.items[selectedIndex].emoji });
  }
  return true;
}

function cleanPopup() {
  if (popup) {
    popup.container.remove();
    popup = undefined;
  }
}

function updateSelection() {
  const items = popup?.content.querySelectorAll('li');
  if (!items) return;

  items.forEach((item, index) => {
    if (index === selectedIndex) {
      item.classList.add('selected');
    } else {
      item.classList.remove('selected');
    }
  });
}

export const emojiSuggestionPlugin = (editor: Editor, view: EditorView) =>
  Suggestion<{ name: string; emoji: string }>({
    char: ':',
    allowSpaces: false,
    allowToIncludeChar: false,
    editor,
    view,
    command: ({ view, range, props }) => {
      // increase range.to by one when the next node is of type "text"
      // and starts with a space character
      const nodeAfter = view.state.selection.$to.nodeAfter;
      const overrideSpace = nodeAfter?.text?.startsWith(' ');

      if (overrideSpace) {
        range.to += 1;
      }

      view.dispatch(view.state.tr.replaceWith(range.from, range.to, view.state.schema.text(`${props.emoji} `)));

      // get reference to `window` object from editor element, to support cross-frame JS usage
      view.dom.ownerDocument.defaultView?.getSelection()?.collapseToEnd();
    },
    allow({ query }) {
      return query.length > 0 && emojiSearch(query).length > 0;
    },
    items({ query }) {
      if (query === ':' || query === '') return [];
      return emojiSearch(query).slice(0, 8);
    },
    render() {
      function updateMenu(props: SuggestionProps) {
        if (!popup) {
          popup = PopoverHandler.createPopover('emoji-list');
          popup.container.classList.add('is-active');
          view.dom.parentElement?.appendChild(popup.container);
        }

        const ul = createElement('ul');
        popup!.content.replaceChildren(ul);

        props.items.forEach((emoji, index) => {
          const li = createElement('li', {
            className: index === selectedIndex ? 'selected' : undefined,
            children: [
              createElement('span', { children: [emoji.emoji] }),
              createElement('span', { children: [emoji.name] }),
            ],
            attributes: { 'data-index': String(index) },
          });

          li.addEventListener('mouseover', () => {
            selectedIndex = index;
            updateSelection();
          });
          li.addEventListener('mouseleave', () => {
            selectedIndex = null;
            updateSelection();
          });

          ul.appendChild(li);
        });

        ul.addEventListener('mousedown', (event) => {
          const target = (event.target as HTMLElement).closest('li');
          if (!target) return;

          event.preventDefault();
          selectedIndex = Number(target.dataset.index);
          selectEmoji();
        });

        updateSelection();
        PopoverHandler.updatePosition(props.decorationNode as HTMLElement, popup!.container, popup!.arrow);
      }

      return {
        onStart(props) {
          currentProps = props;
          selectedIndex = 0; // Reset selection on new menu
          updateMenu(props); // Show and update the menu immediately
        },
        onUpdate(props) {
          currentProps = props;
          updateMenu(props);
        },
        onKeyDown({ event }) {
          if (event.key === 'Escape') {
            cleanPopup();
            return true;
          }

          if (event.key === 'Enter') {
            return selectEmoji();
          }

          if (event.key === 'ArrowDown') {
            selectedIndex = ((selectedIndex ?? -1) + 1) % currentProps.items.length;
            updateSelection();
            return true;
          }

          if (event.key === 'ArrowUp') {
            selectedIndex = ((selectedIndex ?? 0) - 1 + currentProps.items.length) % currentProps.items.length;
            updateSelection();
            return true;
          }

          return false;
        },
        onExit() {
          cleanPopup();
        },
      };
    },
  });
