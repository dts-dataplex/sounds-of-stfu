import { defineConfig } from 'vite';
import chatsuboSignaling from './vite-plugin-chatsubo-signaling.js';

export default defineConfig({
  plugins: [chatsuboSignaling()],
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
