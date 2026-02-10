import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/__tests__/**/*.test.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      // Match tsconfig baseUrl: "./src"
      tools: path.resolve(__dirname, 'src/tools'),
      components: path.resolve(__dirname, 'src/components'),
      stores: path.resolve(__dirname, 'src/stores'),
      hooks: path.resolve(__dirname, 'src/hooks'),
      types: path.resolve(__dirname, 'src/types'),
    },
  },
});
