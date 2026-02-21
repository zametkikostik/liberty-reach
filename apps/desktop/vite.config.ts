import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@liberty-reach/crypto': path.resolve(__dirname, '../../packages/crypto/src'),
      '@liberty-reach/p2p': path.resolve(__dirname, '../../packages/p2p/src'),
      '@liberty-reach/protocol': path.resolve(__dirname, '../../packages/protocol/src'),
      '@liberty-reach/ui': path.resolve(__dirname, '../../packages/ui/src'),
    },
  },
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
  },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    target: ['es2021', 'chrome100', 'safari13'],
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG,
    outDir: 'dist',
  },
});
