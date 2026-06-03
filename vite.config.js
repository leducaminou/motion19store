import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'assets',
    emptyOutDir: false,
    rollupOptions: {
      input: 'src/main.js',
      output: {
        entryFileNames: 'bundle.js',
        assetFileNames: 'bundle.css',
        format: 'iife',
        name: 'M19Bundle',
      },
    },
  },
});
