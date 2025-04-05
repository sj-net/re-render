import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['esm', 'cjs', 'iife'], // esm for modern, cjs for node, iife for script tag
    globalName: 'reRenderCore', // required for IIFE builds
    target: 'es2020',
    sourcemap: true,
    dts: true, // generate types
    minify: true,
    clean: true,
    external: ['immer', 'lodash.merge', 'lodash.clonedeep', 'deep-diff'],

});
