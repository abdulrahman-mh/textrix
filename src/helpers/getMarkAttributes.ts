import type { Mark, MarkType } from 'prosemirror-model';
import type { EditorState } from 'prosemirror-state';

export function getMarkAttributes(state: EditorState, type: MarkType): Record<string, any> {
  const { from, to, empty } = state.selection;
  const marks: Mark[] = [];

  if (empty) {
    if (state.storedMarks) {
      marks.push(...state.storedMarks);
    }

    marks.push(...state.selection.$head.marks());
  } else {
    state.doc.nodesBetween(from, to, (node) => {
      marks.push(...node.marks);
    });
  }

  const mark = marks.find((markItem) => markItem.type.name === type.name);

  if (!mark) {
    return {};
  }

  return { ...mark.attrs };
}
