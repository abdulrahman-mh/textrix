/**
 * - We trying to create a image placeholder until upload ends, and then show the final image
 * - We can retry & cancel the upload
 * - While uploading we can't drag and drop on each placeholder row,
 * so if the row (3 or less images in images-grid) includes any uncompleted upload, so this row still can't interact with it
 *
 */

// import { Schema } from 'prosemirror-model';
// import { EditorState, Plugin, PluginKey } from 'prosemirror-state';
// import { Decoration, DecorationSet, EditorView } from 'prosemirror-view';

// export interface UploadFn {
//   (file: File): Promise<string>;
// }

// const uploadFn: UploadFn = async () => new Promise((resolve) => setTimeout(resolve, 100000000));

// let imagePreview = '';

// //Plugin for placeholder
// const placeholderPlugin = new Plugin({
//   state: {
//     init() {
//       return DecorationSet.empty;
//     },
//     apply(tr, set) {
//       // Adjust decoration positions to changes made by the transaction
//       set = set.map(tr.mapping, tr.doc);
//       // See if the transaction adds or removes any placeholders
//       const action = tr.getMeta(placeholderPlugin);
//       if (action && action.add) {
//         const widget = document.createElement('div');
//         const img = document.createElement('img');
//         widget.classList.value = 'image-uploading';
//         img.src = imagePreview;
//         widget.appendChild(img);
//         const deco = Decoration.widget(action.add.pos, widget, {
//           id: action.add.id,
//         });
//         set = set.add(tr.doc, [deco]);
//       } else if (action && action.remove) {
//         set = set.remove(set.find(undefined, undefined, (spec) => spec.id == action.remove.id));
//       }
//       return set;
//     },
//   },
//   props: {
//     decorations(state) {
//       return this.getState(state);
//     },
//   },
// });

// //Find the placeholder in editor
// function findPlaceholder(state: EditorState, id: object) {
//   const decos = placeholderPlugin.getState(state);
//   const found = decos?.find(undefined, undefined, (spec) => spec.id == id);

//   return found?.length ? found[0].from : null;
// }

// function startImageUpload(view: EditorView, file: File, schema: Schema) {
//   imagePreview = URL.createObjectURL(file);
//   // A fresh object to act as the ID for this upload
//   const id = {};

//   // Replace the selection with a placeholder
//   const tr = view.state.tr;
//   if (!tr.selection.empty) tr.deleteSelection();
//   tr.setMeta(placeholderPlugin, { add: { id, pos: tr.selection.from } });
//   view.dispatch(tr);
//   uploadFn(file).then(
//     (url) => {
//       const pos = findPlaceholder(view.state, id);
//       // If the content around the placeholder has been deleted, drop
//       // the image
//       if (pos == null) return;
//       // Otherwise, insert it at the placeholder's position, and remove
//       // the placeholder
//       view.dispatch(view.state.tr.replaceWith(pos, pos, schema.nodes.uploadImage.create({ src: url })).setMeta(placeholderPlugin, { remove: { id } }));
//     },
//     (e) => {
//       // On failure, just clean up the placeholder
//       view.dispatch(tr.setMeta(placeholderPlugin, { remove: { id } }));
//     },
//   );
// }
// export { startImageUpload };

// export default placeholderPlugin;
