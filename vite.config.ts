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
      '@/scripts': resolve(__dirname, './src/scripts'),
    },
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
  build: {
    lib: {
      // Entry point for the library
      entry: resolve(__dirname, 'src/components/virtualized-list/index.tsx'),
      name: 'VirtualizedList',
      // Generate multiple formats
      formats: ['es', 'cjs', 'umd'],
      fileName: (format) => {
        if (format === 'es') return 'virtualized-list.js'
        if (format === 'cjs') return 'virtualized-list.cjs'
        if (format === 'umd') return 'virtualized-list.umd.js'
        return `virtualized-list.${format}.js`
      },
    },
    rollupOptions: {
      // Externalize dependencies that shouldn't be bundled
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        // Provide global variables for UMD build
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
        },
      },
    },
    // Generate source maps for debugging
    sourcemap: true,
    // Ensure CSS is extracted
    cssCodeSplit: false,
  },
})
