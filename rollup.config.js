import { visualizer } from 'rollup-plugin-visualizer';
import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import terser from '@rollup/plugin-terser';
import json from '@rollup/plugin-json';

// Helper function for UMD builds
const createUMDBuild = (input, output, name) => ({
  input,
  output: {
    file: output,
    format: 'umd',
    sourcemap: true,
    name,
  },
  plugins: [
    json(),
    resolve(),
    commonjs(),
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/**',
    }),
    typescript({
      tsconfig: './tsconfig.json',
      useTsconfigDeclarationDir: true,
    }),
    terser(),
  ],
});

export default [
  // CJS & ES Builds (for NPM users)
  {
    input: {
      index: 'src/index.ts', // Main editor
      features: 'src/features/index.ts', // Exports all features for NPM
    },
    output: [
      {
        dir: 'dist/cjs',
        format: 'cjs',
        interop: 'compat',
        // sourcemap: true,
        exports: 'named',
        entryFileNames: '[name].cjs',
      },
      {
        dir: 'dist/es',
        format: 'es',
        // sourcemap: true,
        exports: 'named',
        entryFileNames: '[name].js',
      },
    ],
    plugins: [
      json(),
      resolve(),
      commonjs(),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**',
      }),
      typescript({
        tsconfig: './tsconfig.json',
        useTsconfigDeclarationDir: true,
      }),
      terser(),
      visualizer({
        gzipSize: true,
        filename: 'build-stats/index.html',
        title: 'Textrix Build',
      }),
    ],
  },

  // UMD Builds for CDN
  createUMDBuild('src/index.ts', 'dist/umd/editor.min.js', 'Editor'),

  // Common Features (Bundled)
  createUMDBuild('src/features/common.ts', 'dist/umd/features/common.min.js', 'CommonFeatures'),

  // Individual Features (Separated)
  createUMDBuild('src/features/media/index.ts', 'dist/umd/features/media.min.js', 'Media'),
  createUMDBuild(
    'src/features/bubbleMenu/index.ts',
    'dist/umd/features/bubbleMenu.min.js',
    'BubbleMenu'
  ),
  createUMDBuild(
    'src/features/floatingMenu/index.ts',
    'dist/umd/features/floatingMenu.min.js',
    'FloatingMenu'
  ),
  createUMDBuild(
    'src/features/codeBlock/index.ts',
    'dist/umd/features/codeBlock.min.js',
    'CodeBlock'
  ),
  createUMDBuild('src/features/emoji/index.ts', 'dist/umd/features/emoji.min.js', 'Emoji'),
];
