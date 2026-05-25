import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      all: true,
      exclude: [
        '.eslintrc.cjs',
        'postcss.config.js',
        'tailwind.config.js',
        'src/main.jsx',
        'src/App.jsx',
        'src/components/layout/**',
        'src/contexts/**',
        'src/hooks/**',
        'src/pages/Home.jsx',
        'src/pages/WorldDetail.jsx',
        'src/services/**',
      ],
    },
  },
});
