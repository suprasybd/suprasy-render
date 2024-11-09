const commonjs = require('@rollup/plugin-commonjs');
const resolve = require('@rollup/plugin-node-resolve');
const peerDepsExternal = require('rollup-plugin-peer-deps-external');
const typescript = require('@rollup/plugin-typescript');
const postcss = require('rollup-plugin-postcss');

module.exports = {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: false
    },
    {
      file: 'dist/index.mjs',
      format: 'esm',
      sourcemap: false
    }
  ],
  plugins: [
    peerDepsExternal(),
    resolve({
      extensions: ['.js', '.jsx', '.ts', '.tsx']
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: './dist',
      sourceMap: false,
      noEmitOnError: false,
      exclude: ['node_modules/**']
    }),
    postcss({
      modules: true,
      extract: false,
      minimize: true
    })
  ],
  external: [
    'react',
    'react-dom',
    'slate',
    'slate-react',
    'slate-history',
    '@emotion/css',
    'classnames',
    'is-hotkey',
    'lucide-react',
    'react-player'
  ]
}; 