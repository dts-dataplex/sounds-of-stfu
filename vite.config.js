import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';
import path from 'path';
import signalingServerPlugin from './vite-plugin-signaling.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [signalingServerPlugin()],
  server: {
    // Allow external hosts (ngrok, tunnels, etc.)
    allowedHosts: true,
  },
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    // Exclude transformers from pre-bundling to let it handle its own deps
    exclude: ['@huggingface/transformers'],
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
  // Stub Node.js-only modules for browser
  resolve: {
    alias: {
      'onnxruntime-node': path.resolve(__dirname, 'src/ai/stubs/onnxruntime-node-stub.js'),
    },
  },
});
