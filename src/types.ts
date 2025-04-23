import type {
  ResolvedPos,
  Node as ProseMirrorNode,
  Mark,
  ParseOptions,
  NodeSpec,
  DOMOutputSpec,
  MarkSpec,
} from "prosemirror-model";
import type { EditorView } from "prosemirror-view";
import type { Messages } from "./util/messages";
import type { Editor } from "./Editor";
import type { Icons } from "./util/icons";
import type { Feature } from "./Feature";

// biome-ignore lint/suspicious/noEmptyInterface: <explanation>
export interface Commands {}

export interface SchemaOptions extends EditorOptionsBase {
  /** Enable it if you want to generate a published content */
  published?: boolean;
}

// biome-ignore lint/suspicious/noEmptyInterface: <explanation>
interface EditorOptionsBase {}

export interface EditorOptions extends EditorOptionsBase {
  readonly element: Element | HTMLElement;
  content: Content;

  /**
   * Add Features or Plugins to the editor
   *
   * @example
   * features: [
   *    BubbleMenu,    // Add bubble menu
   *    Media,         // Adds support for embedding media (images, videos, etc.)
   *    Unsplash,      // Integrates with Unsplash
   * ]
   */
  features?: Feature[];

  /**
   * Toggle default formats. Disable formats by setting values to false.
   *
   * @example
   * // This disables `<h3>` and blockquotes while keeping all other formats active.
   * formats: { h3: false, quote: false }
   */
  formats?: Partial<Record<keyof Formats, boolean>>;

  /**
   * Enables Markdown shortcuts.
   *
   * Converts Markdown-style text into rich formatting as you type or paste.
   *
   * Example shortcuts:
   * - `**bold**` → **bold**
   * - `*italic*` → *italic*
   * - `# Heading` → Heading
   * - `- List item` → • List item
   *
   * @default true
   */
  markdownShortcuts?: boolean;

  /**
   * Custom messages or translations for the editor's UI elements.
   * This is useful for localization or customizing default messages.
   * @example { mainPlaceholder: 'Tell your story...' }
   */
  messages: Messages;

  /** Called when editor content is updated. */
  onUpdate?: ({ editor }: { editor: Editor }) => void;

  parseOptions?: ParseOptions;
  /**
   * Additional attributes for the editor container element.
   * @example { role: 'textbox', id: 'editor-1' }
   */
  editorAttributes?: Record<string, string>;

  /** Called when text selection changes, e.g to show words or characters count */
  onSelectionUpdate?: ({
    editor,
    isEmpty,
    charCount,
    wordCount,
  }: {
    editor: Editor;
    isEmpty: boolean;
    charCount: number;
    wordCount: number;
  }) => void;

  editable?: boolean;

  /** Override default icons (SVG/HTML). */
  icons: Icons;

  /**
   * If `true`, the editor will check the content for errors on initialization.
   * Calling `onContentError` callback
   * Which can be used to show a warning or error message to the user.
   * @default false
   */
  errorOnInvalidContent?: boolean;
  onContentError?: ({
    editor,
    error,
  }: {
    editor: Editor;
    error: Error;
  }) => void;
  /**
   * Enables or disables automatic text direction detection based on the typed text.
   * useful for multilingual content.
   *
   * @default true
   */
  autoTextDirection?: boolean;
}

export interface Formats {
  /** Enables core editor functionality (Required). */
  core: false;

  /** Large heading (`<h3>`). */
  h3: false;
  /** Small heading (`<h4>`). */
  h4: false;

  /** Bold text (`<strong>`). */
  bold: false;
  /** Italic text (`<em>`). */
  italic: false;
  /** Hyperlinks (`<a>`). */
  link: false;

  /** Blockquotes and pull quotes (`<blockquote>`). */
  quote: false;
  /** Line break (`<br>`). */
  br: false;
  /** Inline code (`<code>`). */
  code: false;

  /** Section divider (`<hr>`). */
  divider: false;
  /** Bullet and numbered lists (`<ul>`, `<ol>`). */
  lists: false;
}

// @ts-ignore
export interface NodeExtendedSpec extends NodeSpec {
  toDOM?: (props: {
    node: ProseMirrorNode;
    HTMLAttributes: Record<string, any>;
  }) => DOMOutputSpec;
}

// @ts-ignore
export interface MarkExtendedSpec extends MarkSpec {
  toDOM?: (props: {
    mark: Mark;
    HTMLAttributes: Record<string, any>;
  }) => DOMOutputSpec;
}

export interface EmbedMedia {
  mediaId: string;
  title?: string;
  description?: string;
  authorName?: string;
  href?: string;
  domain?: string;
  iframeWidth?: number;
  iframeHeight?: number;
  thumbnailUrl?: string;
  thumbnailWidth?: number;
  thumbnailHeight?: number;
  thumbnailImageId?: string;
  iframeSrc?: string;
  /** Additional iframe element attributes */
  iframeAttr?: Record<string, string>;
}

export type Range = {
  from: number;
  to: number;
};

export type MarkRange = {
  mark: Mark;
  from: number;
  to: number;
};

export type NodeRange = {
  node: ProseMirrorNode;
  from: number;
  to: number;
};

export interface Trigger {
  char: string;
  allowSpaces: boolean;
  allowToIncludeChar: boolean;
  allowedPrefixes: string[] | null;
  startOfLine: boolean;
  $position: ResolvedPos;
}

export type SuggestionMatch = {
  range: Range;
  query: string;
  text: string;
} | null;

export interface SuggestionKeyDownProps {
  view: EditorView;
  event: KeyboardEvent;
  range: Range;
}

export type Predicate = (node: ProseMirrorNode) => boolean;

export type NodeWithPos = {
  node: ProseMirrorNode;
  pos: number;
};

export type ChangedRange = {
  oldRange: Range;
  newRange: Range;
};

export type HTMLContent = string;

export type JSONContent = {
  type?: string;
  attrs?: Record<string, any>;
  content?: JSONContent[];
  marks?: {
    type: string;
    attrs?: Record<string, any>;
    [key: string]: any;
  }[];
  text?: string;
  [key: string]: any;
};

export type Content = HTMLContent | JSONContent | JSONContent[] | null;

export type FocusPosition = "start" | "end" | "all" | number | boolean | null;

export type TextSerializer = (props: {
  node: ProseMirrorNode;
  pos: number;
  parent: ProseMirrorNode;
  index: number;
  range: Range;
}) => string;

export type ExtendedRegExpMatchArray = RegExpMatchArray & {
  data?: Record<string, any>;
};

export type Image = {
  url: string;
  naturalWidth: number;
  naturalHeight: number;
  file: File;
};

export interface Attribute {
  default: any;
  rendered?: boolean;
  renderedOnMode?: "published" | "edit";
  toDOM?: (attributes: Record<string, any>) => Record<string, any>;
  parseDOM?: (element: HTMLElement) => any;
}

export interface GlobalAttribute {
  type: string;
  name: string;
  isModeMatch?: boolean;
  attribute: Attribute;
}

export type AddGlobalAttributes = Array<{
  mode?: "published" | "edit";
  types: string[];
  attributes: Record<string, Attribute>;
}>;

export interface GetHTMLOptions {
  /** If true, removes the title, subtitle, and kicker from the output (if they exist). */
  stripHeadlines?: boolean;
}
