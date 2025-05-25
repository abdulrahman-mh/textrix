import { EditorState, type Transaction } from 'prosemirror-state';
import { Fragment, type Node as ProseMirrorNode } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';

import type { EditorOptions, GetHTMLOptions, JSONContent } from './types';
import { focus } from './commands/focus';
import { createDocument } from './helpers/createDocument';
import { resolveFocusPosition } from './helpers/resolveFocusPosition';
import { getHTMLFromFragment } from './helpers/getHTMLFromFragment';
import { getText } from './helpers/getText';
import { getTextSerializersFromSchema } from './helpers/getTextSerializersFromSchema';
import { isNodeEmpty } from './helpers/isNodeEmpty';

import icons from './util/icons';
import messages from './util/messages';
import { FeaturesManager } from './FeaturesManager';
import { generateID } from './features/core/uniqueIdPlugin';
import { HeadingPluginKey } from './features/core/headlinePlugin';
import { getMetadata } from './util/getMetadata';
import { applyHeadlineClassesToNode } from './helpers/applyHeadlineClasses';

export class Editor {
  private view!: EditorView;
  private featuresManager: FeaturesManager;

  /** The editor storage */
  public storage: Record<string, any> = {};

  /** The editor options */
  public options: EditorOptions;

  constructor(options?: Partial<EditorOptions>) {
    this.options = {
      element: document.createElement('div'),
      content: options?.content ?? this.getInitialContent(),
      messages: { ...(options?.messages || {}), ...messages },
      icons: { ...(options?.icons || {}), ...icons },
      editable: true,
      markdownShortcuts: true,
      autoTextDirection: true,
      ...options,
    };

    this.featuresManager = new FeaturesManager(this);
    this.createView();

    window.setTimeout(() => {
      if (this.isDestroyed) return;
      focus('end')({ editor: this, view: this.view });
    }, 0);

    this.attachListeners();
  }

  /**
   * Creates a ProseMirror view.
   */
  private createView(): void {
    let doc: ProseMirrorNode;

    try {
      doc = createDocument(this.options.content, this.featuresManager.schema, this.options.parseOptions, {
        errorOnInvalidContent: this.options.errorOnInvalidContent,
      });
    } catch (e) {
      if (
        !(e instanceof Error) ||
        !['[textrix error]: Invalid JSON content', '[textrix error]: Invalid HTML content'].includes(e.message)
      ) {
        // Not the content error we were expecting
        throw e;
      }

      // Content error callback
      // this.options.onContentError?.({ editor: this, error: e as Error });

      // Content is invalid, but attempt to create it anyway, stripping out the invalid parts
      doc = createDocument(this.options.content, this.featuresManager.schema, this.options.parseOptions, {
        errorOnInvalidContent: false,
      });
    }
    const selection = resolveFocusPosition(doc, 'end');

    this.view = new EditorView(this.options.element, {
      attributes: { role: 'textbox', ...this.options.editorAttributes },
      state: EditorState.create({ doc, selection: selection || undefined }),
      dispatchTransaction: this.dispatchTransaction.bind(this),
      handleDrop: () => true, // Prevent default ProseMirror drop behavior
    });

    this.featuresManager.setupView(this.view);
    this.featuresManager.setupFeatures();

    const newState = this.view.state.reconfigure({
      plugins: this.featuresManager.plugins,
    });

    this.view.updateState(newState);

    this.view.dom.className = `textrix editing ${this.view.dom.className}`;
  }

  /**
   * Dispatches editor state transactions
   */
  private dispatchTransaction(transaction: Transaction): void {
    // if the editor / the view of the editor was destroyed
    // the transaction should not be dispatched as there is no view anymore.
    if (this.isDestroyed) {
      return;
    }

    const state = this.view.state.apply(transaction);
    this.view.updateState(state);

    const selectionHasChanged = !this.view.state.selection.eq(state.selection);

    if (selectionHasChanged && this.options.onSelectionUpdate) {
      const { from, to, empty } = state.selection;
      const selectedText = empty ? '' : state.doc.textBetween(from, to, ' ');
      const charCount = selectedText.length;
      const wordCount = selectedText.trim().split(/\s+/).filter(Boolean).length;

      this.options.onSelectionUpdate({
        editor: this,
        isEmpty: empty,
        charCount,
        wordCount,
      });
    }

    if (!transaction.docChanged || transaction.getMeta('preventUpdate')) {
      return;
    }

    // TODO: sends the transaction to sync doc on the server
    this.options.onUpdate?.({ editor: this });
  }

  /**
   * Update editor options.
   *
   * @param options A list of options
   */
  public setOptions(options: Partial<EditorOptions> = {}): void {
    this.options = {
      ...this.options,
      ...options,
    };

    if (!this.view || this.isDestroyed) {
      return;
    }

    if (options.editorAttributes) {
      this.view.setProps({ attributes: options.editorAttributes });
    }

    this.view.updateState(
      this.view.state.reconfigure({
        plugins: this.featuresManager.plugins,
      }),
    );
  }

  /**
   * Update editable state of the editor.
   *
   * @param editable Enable or disable editing.
   */
  public setEditable(editable: boolean): void {
    this.setOptions({ editable });
  }

  /**
   * Updates the editor content
   */
  public setContent() {}

  /**
   * Updates the editor messages
   */
  public setMessages() {}

  /**
   * Returns the editor’s initial content
   */
  public getInitialContent(): JSONContent {
    return {
      type: 'doc',
      content: [
        { type: 'h3', attrs: { name: generateID() } },
        { type: 'paragraph', attrs: { name: generateID() } },
      ],
    };
  }

  /**
   * Get the document as JSON.
   */
  public getJSON(): JSONContent {
    return this.view.state.doc.toJSON();
  }

  /**
   * Get the document as published HTML.
   */
  public getHTML(options?: GetHTMLOptions): string {
    const schema = FeaturesManager.buildSchema(this.featuresManager.features, {
      published: true,
    });

    let content = this.view.state.doc.content
    let cleanup: any

    const headlinePositions = HeadingPluginKey.getState(this.view.state)?.indexes;
    if (options?.stripHeadlines && headlinePositions) {
      const { title, subtitle, kicker } = headlinePositions;
      content = Fragment.fromArray(content.content.filter((_, index) => ![title, subtitle, kicker].includes(index)));
    } else if (headlinePositions) {
      cleanup = applyHeadlineClassesToNode(content, headlinePositions);
    }

    const htmlContent = getHTMLFromFragment(content, schema);
    cleanup?.()
    return `<div class="textrix">${htmlContent}</div>`;
  }

  /**
   * Get the document as text.
   */
  public getText(options?: { blockSeparator?: string }): string {
    const { blockSeparator = '\n\n' } = options || {};

    return getText(this.view.state.doc, {
      blockSeparator,
      textSerializers: {
        ...getTextSerializersFromSchema(this.featuresManager.schema),
      },
    });
  }

  /**
   * Get the document metadata, including headline set and featured image.
   */
  public getMetadata() {
    const schema = FeaturesManager.buildSchema(this.featuresManager.features, {
      published: true,
    });
    return getMetadata(this.view, schema);
  }

  /**
   * Checks if the editor has no content.
   */
  public get isEmpty(): boolean {
    return isNodeEmpty(this.view.state.doc);
  }

  /**
   * Checks if the editor is currently editable.
   */
  public get isEditable(): boolean {
    return Boolean(this.options.editable && this.view && this.view?.editable);
  }

  /**
   * Check if the editor is already destroyed.
   */
  public get isDestroyed(): boolean {
    // @ts-ignore
    return !this.view?.docView;
  }

  /**
   * Destroy the editor.
   */
  public destroy(): void {
    if (this.view) {
      this.view.destroy();
    }
    this.removeAllListeners();
  }

  /**
   * Attach event listeners.
   */
  private attachListeners(): void {}

  /**
   * Remove all event listeners.
   */
  private removeAllListeners(): void {}
}
