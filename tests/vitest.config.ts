import path from 'node:path';

export default {
  base: '/ebook-sample-book/',
  esbuild: {
    jsx: 'automatic',
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, '../client/src'),
      '@shared': path.resolve(import.meta.dirname, '../shared'),
    },
  },
  test: {
    environment: 'node',
  },
};
