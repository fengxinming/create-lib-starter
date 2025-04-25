import ts from '@rollup/plugin-typescript';
import { globSync } from 'tinyglobby';
import { defineConfig } from 'vite';
import pluginExternal from 'vite-plugin-external';

import { dependencies } from './package.json';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    pluginExternal({
      nodeBuiltins: true,
      externalizeDeps: Object.keys(dependencies)
    }),
    ts({
      tsconfig: './tsconfig.build.json'
    })
  ],
  build: {
    lib: {
      entry: globSync(['./src/*.ts', '!./src/types.ts']),
      formats: ['es', 'cjs'],
      fileName: '[name]'
    },
    minify: false
  }
});
