import { defineConfig } from 'vite';

export default defineConfig({
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
          'ai-models': ['@xenova/transformers'],
        },
      },
    },
  },
});
