import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [],
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    exclude: ['@xenova/transformers'],
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          peerjs: ['peerjs'],
        },
      },
    },
  },
  // Ensure WASM files are properly served
  assetsInclude: ['**/*.wasm'],
});
