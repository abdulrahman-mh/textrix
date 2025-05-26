# TODOS:

- E2E & Unit Tests to the editor.
- Images upload loading plugin.
- Text Highlight.
- Strike Text.
- Tiptap like Typography Extension.
- Drop caps.
- Mentions.
- Superscript.
- Tables.
- TK reminders.
- Private Notes.
- Unsplash.
- Notion like tooltips & functionality.
- **Collaboration Editing**.
- Handle changes on every transaction happen, using tr steps.
- Support images floating with text.
- Find a way to make the image immediately shows when insert it after upload.
- Support Base64-encoded images on the editor.
- On history undo/redo, if there an image on the new content upload it again as a local image file or as a URL.
- Handle emoji list using InputRules instead of suggestion.
- Add Medium dark them, Find it on Medium mobile app by enable it.
- Bug: When select an image (inside a grid or not) and start type unexpected behavior is happen?.
- When dragging a media, Using decorations add transition effect on two nodes that the drop cursor between theme (like Medium do).
- Add `data-full-width` attribute to images, and use it when zoom on the image in publishing.
- Menu icons in css pseudo-element, to make the theme can customize the icons also.
- In media plugin, create an option on the editor to check if still there an images uploading
- Filter trailing/leading empty nodes from publishing content, includes empty figcaption and other.

- Use Content Security Policy (CSP) on Published.

  A strict CSP can prevent inline JavaScript execution:

  ```
  Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'
  ```

## **Resources**:

- https://github.com/humhub/humhub-prosemirror/blob/master/src/editor/core/plugins/loader/plugin.js
- https://github.com/carlosvaldesweb/tiptap-extension-upload-image
- https://gitlab.com/emergence-engineering/prosemirror-image-plugin
