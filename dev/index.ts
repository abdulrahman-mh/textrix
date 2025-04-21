import '../src/styles/textrix.css'; // Default Textrix themes
import { Editor } from '../src/Editor';
import { BubbleMenu, Media, FloatingMenu, CodeBlock, Emoji } from '../src/features';
import { uploadImage } from './helpers/uploadImage';
import { fetchMediaEmbedData } from './helpers/fetchMediaEmbedData';
import { buildSchema, generateHTML } from '../src';

// Initialize Editor
const editor = new Editor({
  element: document.body,
  content: JSON.parse('{"type":"doc","content":[{"type":"h3","attrs":{"name":"c7emkdb7n","dir":null}},{"type":"paragraph","attrs":{"name":"75ga24v2f","dir":null}},{"type":"figure","attrs":{"width":null},"content":[{"type":"image","attrs":{"name":"5zf9dx77c","src":"https://fakeimg.pl/711x591/?text=711 * 591","alt":null,"title":null,"imageId":null,"width":1064,"fullWidth":null,"height":540,"layout":"inset-center"}},{"type":"figcaption","content":[{"type":"text","text":"fsdfsdfsfsdfsdfsfsfsdfsdf"}]}]},{"type":"paragraph","attrs":{"name":"221hl0w9g","dir":"ltr"},"content":[{"type":"text","text":"fsdsdfsfs"}]}]}'),
  features: [
    BubbleMenu.configure({bold: false}),
    Media.configure({ uploadImage, fetchMediaEmbedData }),
    FloatingMenu,
    CodeBlock,
    Emoji,
  ],
});

// Button creation helper function
const createButton = (text: string, onClick: () => void) => {
  const button = document.createElement('button');
  button.innerText = text;
  button.onclick = onClick;
  return button;
};

const buttonContainer = document.createElement('div');
buttonContainer.className = 'button-container';

// Add buttons to container
const buttons = [
  { text: 'Export JSON', action: () => console.log(JSON.stringify(editor.getJSON())) },
  { text: 'Export HTML', action: () => console.log(editor.getHTML({ stripHeadlines: false })) },
  { text: 'Export Metadata', action: () => console.log(JSON.stringify(editor.getMetadata())) },
  {
    text: 'Export HTML (Server)',
    action: () => {
      const schema = buildSchema();
      const html = generateHTML(editor.getJSON(), schema, { stripHeadlines: false });
      console.log(html);
    },
  },
];

buttons.forEach(({ text, action }) => buttonContainer.appendChild(createButton(text, action)));

// Append button container to the body
document.body.appendChild(buttonContainer);
