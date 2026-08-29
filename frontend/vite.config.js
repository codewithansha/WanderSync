import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://earnest-communication-production-e683.up.railway.app',
        changeOrigin: true
      },
      '/uploads': {
        target: 'https://earnest-communication-production-e683.up.railway.app',
        changeOrigin: true
      }

    }
  }
});
