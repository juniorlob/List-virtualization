/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/core': resolve(__dirname, './src/core'),
      '@/hooks': resolve(__dirname, './src/hooks'),
      '@/components': resolve(__dirname, './src/components'),
      '@/adapters': resolve(__dirname, './src/adapters'),
      '@/demo': resolve(__dirname, './src/demo'),
      '@/utils': resolve(__dirname, './src/utils'),
    },
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.ts',
        '**/*.test.tsx',
        'src/demo/',
      ],
    },
  },
})
