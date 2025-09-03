import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // keep the /api prefix (backend expects /api/upload etc.)
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
        // no rewrite
      }
    }
  }
});
