import babel from '@rollup/plugin-babel';
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

const banner = `/*!
 * @donglan/mVue v${pkg.version}
 * (c) ${new Date().getFullYear()} donglan
 * @license MIT
 */`;

export default {
  input: './src/index.ts',
  output: [
    {
      file: pkg.main,
      format: 'cjs',
      banner
    },
    {
      file: pkg.module,
      format: 'es',
      banner
    },
    {
      file: 'dist/mvue.global.js',
      format: 'iife',
      name: 'MVue',
      banner
    },
    {
      file: 'dist/mvue.global.prod.js',
      format: 'iife',
      name: 'MVue',
      banner,
      plugins: [terser()]
    }
  ],
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: 'dist',
    }),
    babel({
      babelHelpers: 'bundled',
      extensions: ['.js', '.ts']
    }),
    resolve()
  ]
}; 