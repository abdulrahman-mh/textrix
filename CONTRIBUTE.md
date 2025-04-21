# 🚀 Contributing to Textrix

We welcome all kinds of contributions, you can: fix bugs, edit the doc (README & Lib Guide), create new theme, create new feature or plugin, edit existing themes, edit core features & existing features, and any thing 😊

**Report Issues and Request Changes**: If you find a bug, please report it includes examples of current behavior and what you believe to be the correct behavior.

## Development Server

We have a development code to help you to test your code on `./dev` dir, we bundle it using `webpack`,
you can import the Editor and configure it as you want with features and themes to test your new code.

Running dev server:

```bash
npm run dev
```

And open <http://localhost:8080/> in you browser

## Adding New Theme

You can add new theme in `./src/styles` dir, Name your file with your theme name, and when build this themes moved to `dist/themes/*` dir, You can import any css to your theme includes `core.css` for example.

**Textrix Website** in `./website` he also has the doc.

**Textrix Demo** <https://github.com/abdulrahman-mh/textrix-demo>
