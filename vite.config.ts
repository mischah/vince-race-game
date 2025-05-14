import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/RaceGameElement.ts'),
      name: 'RaceGameElement',
      fileName: 'race-game-element',
      formats: ['es'],
    },
    rollupOptions: {
      // Externe Abhängigkeiten ausschließen (hier keine nötig)
      external: [],
      output: {
        // Keine UMD/IIFE, sondern ES-Module für Web Components
        entryFileNames: 'race-game-element.js',
        assetFileNames: '[name][extname]',
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext',
    minify: false,
  },
});
