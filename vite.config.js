// Vite-instellingen.
// Het project heeft drie pagina's; Vite moet ze alle drie bouwen.
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  // Relatieve paden, zodat de gebouwde site ook in een submap werkt
  base: './',
  build: {
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, 'index.html'),
        join: resolve(import.meta.dirname, 'join.html'),
        display: resolve(import.meta.dirname, 'display.html'),
        affiche: resolve(import.meta.dirname, 'affiche.html'),
      },
    },
  },
});
