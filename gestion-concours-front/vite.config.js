import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8081', // Mets ici le port de ton backend Spring Boot
        changeOrigin: true,
      },
    },
  },
});