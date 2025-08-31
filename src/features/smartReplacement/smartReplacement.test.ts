import { describe, it, expect } from 'vitest';
import { Editor } from '../../Editor';
import { SmartReplacement } from './index';

describe('SmartReplacement Feature', () => {
  it('should replace double dash with em dash', () => {
    const editor = new Editor({
      element: document.createElement('div'),
      features: [SmartReplacement],
    });

    // Simulate typing "--"
    const { state } = editor.view;
    const tr = state.tr.insertText('--', state.selection.from);
    editor.view.dispatch(tr);

    // The text should be replaced with em dash
    expect(editor.view.state.doc.textContent).toContain('—');
  });

  it('should not replace single dash', () => {
    const editor = new Editor({
      element: document.createElement('div'),
      features: [SmartReplacement],
    });

    // Simulate typing single dash
    const { state } = editor.view;
    const tr = state.tr.insertText('-', state.selection.from);
    editor.view.dispatch(tr);

    // The text should remain as single dash
    expect(editor.view.state.doc.textContent).toBe('-');
  });

  it('should work in combination with other features', () => {
    const editor = new Editor({
      element: document.createElement('div'),
      features: [SmartReplacement],
    });

    // Type some text followed by double dash
    let { state } = editor.view;
    let tr = state.tr.insertText('Hello world', state.selection.from);
    editor.view.dispatch(tr);

    // Add double dash
    state = editor.view.state;
    tr = state.tr.insertText('--', state.selection.from);
    editor.view.dispatch(tr);

    // Should contain em dash
    expect(editor.view.state.doc.textContent).toContain('Hello world—');
  });
});
