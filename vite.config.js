import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [],
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    exclude: ['@xenova/transformers', 'onnxruntime-web'],
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
