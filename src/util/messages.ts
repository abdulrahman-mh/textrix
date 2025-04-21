/** Enhanced Editor Messages with Simplified Keys */
const messages = {
  /** Placeholder for the title input field */
  titlePlaceholder: 'Title',

  /** The main placeholder of the editor */
  mainPlaceholder: 'Tell your story...',

  /** Label shown when the title field is focused */
  titleLabel: 'Title',

  /** Label shown when the subtitle field is focused */
  subtitleLabel: 'Subtitle',

  /** Label shown when the kicker field is focused */
  kickerLabel: 'Kicker',

  // Highlight menu options
  /** Text for bold formatting button */
  bold: 'Bold',

  /** Text for italic formatting button */
  italic: 'Italic',

  /** Text for hyperlink button */
  link: 'Link',

  /** Text placeholder for highlight menu link input */
  linkPlaceholder: 'Paste or type a link…',

  /** Text for increasing title size */
  bigTitle: 'Big title',

  /** Text for decreasing title size */
  smallTitle: 'Small title',

  /** Text for blockquote button */
  quote: 'Blockquote',

  // Media content display options
  /** Display media within the text column width */
  mediaInset: 'Display media within text column',

  /** Display media slightly beyond the text column width */
  mediaOutset: 'Expand media beyond text column',

  /** Display media across the full screen width */
  mediaFill: 'Stretch media to fill screen',

  /** Button label for setting image alt text */
  altTextButton: 'Alt text',

  /** Describe the image for accessibility */
  altDescription: 'Describe the image for accessibility',

  // Inline tooltip options
  /** The inline tooltip */
  addContent: 'Add an image, video, embed, or new part',

  /** Tooltip for adding an image */
  addImage: 'Add an image',

  /** Tooltip for adding an image from Unsplash */
  unsplashImage: 'Add an image from Unsplash',

  /** Placeholder for Unsplash search input */
  unsplashSearch: 'Type keywords to search Unsplash, and press Enter',

  /** Tooltip for adding a video */
  addVideo: 'Add a video',

  /** Placeholder for entering a video URL */
  videoUrl: 'Paste a YouTube, Vimeo, or other video link, and press Enter',

  /** Tooltip for embedding external content */
  addEmbed: 'Add an embed',

  /** Placeholder for entering an embed content URL */
  embedUrl: 'Paste a link to embed content from another site (e.g. X) and press Enter',

  /** Tooltip for adding a code block */
  codeBlock: 'Add a new code block',

  /** Tooltip for adding a new content part */
  addPart: 'Add a new part',

  /** Placeholder for image caption */
  imgCaption: 'Type caption for image (optional)',

  /** Placeholder for embed caption */
  embedCaption: 'Type caption for embed (optional)',
} as const;

export type Messages = typeof messages;
export default messages;
