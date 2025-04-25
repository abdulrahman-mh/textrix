/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      typography: () => ({
        DEFAULT: {
          css: {
            '--tw-prose-headings': '#191918',
            '--tw-prose-body': '#191918',
            '--tw-prose-pre-bg': '#f5f5f5',
          },
        },
      }),

      colors: {
        // Flattened gray
        gray: {
          100: '#fcfbfb',
          200: '#f6f5f4',
          300: '#dfdcd9',
          400: '#a39e98',
          500: '#78736f',
          600: '#615d59',
          700: '#494744',
          800: '#31302e',
          900: '#191918',
        },

        // Custom flattened colors
        blue: {
          500: '#097fe8',
        },

        // Text
        'text-dark': '#191918',
        'text-secondary': '#6b7280',

        // Alpha overlays
        'alpha-hover': 'rgba(0, 0, 0, 0.05)',
        'alpha-black100': 'rgba(0, 0, 0, 0.05)',
        'alpha-black200': 'rgba(0, 0, 0, 0.1)',

        // Button colors (flattened)
        'button-primary': '#0582ff',
        'button-primary-hover': '#045ac3',
        'button-primary-active': '#045ac3',
        'button-primary-text': '#ffffff',

        'button-secondary': '#ebf5fe',
        'button-secondary-hover': '#d6e1f5',
        'button-secondary-text': '#087fe7',

        'button-tertiary-hover': '#eaeaea',

        // Border + code
        'border-default': '#e5e7eb',

        'code-block': '#f5f5f5',
        'code-inline': '#818b981f',
      },
    },
  },
};
