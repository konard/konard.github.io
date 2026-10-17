import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The site is served from the root of https://konard.github.io, and the
// deploy job publishes build/ with actions/deploy-pages (see .github/workflows/github-pages.yml).
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'build',
    sourcemap: true,
  },
  server: {
    port: 3000,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
    include: ['src/**/*.test.{js,jsx}'],
    testTimeout: 10000,
  },
});
