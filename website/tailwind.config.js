/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      typography: () => ({
        DEFAULT: {
          css: {
            '--tw-prose-headings': 'var(--color-text-dark)',
            '--tw-prose-body': 'var(--color-text-dark)',
            '--tw-prose-pre-bg': 'var(--color-code-block)',
          },
        },
      }),
    },
  },
};
