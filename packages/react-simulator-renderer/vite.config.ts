/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    react({ tsDecorators: true }),
    dts({
      entryRoot: 'src/',
    }),
  ],
  define: {
    'process.env': {},
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
  preview: {
    port: 5655,
    strictPort: true,
  },
  build: {
    lib: {
      entry: './src/index.ts',
      fileName: (format, entryName) => `react-simulator-renderer.${format}.js`,
      name: '___ReactSimulatorRenderer___',
      cssFileName: `react-simulator-renderer`,
    },
    rollupOptions: {
      output: {
        exports: 'named',
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          moment: 'moment',
          lodash: '_',
          'prop-types': 'PropTypes',
        },
      },
      external: ['react', 'react-dom', 'prop-types', 'moment', 'lodash'],
    },
  },
  // https://cn.vite.dev/guide/migration.html#sass-now-uses-modern-api-by-default
  css: {
    preprocessorOptions: {
      scss: {
        api: 'legacy',
      },
    },
  },
});
