/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      typography: () => ({
        DEFAULT: {
          css: {
            "--tw-prose-body": "rgb(13,13,13)",
            "--tw-prose-invert-body": "#B0B2C3",
            "--tw-prose-bullets": "rgb(13,13,13)",
            "--tw-prose-invert-bullets": "#B0B2C3",
          },
        },
      }),
    },
  },
};
