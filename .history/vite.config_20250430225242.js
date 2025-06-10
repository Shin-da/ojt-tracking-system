import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/OJT%20TRACKER/', // Ensure the base path matches the subdirectory
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'], // Separate vendor libraries
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Increase the chunk size warning limit
  },
});