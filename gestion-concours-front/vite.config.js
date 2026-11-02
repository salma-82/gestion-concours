import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    // VS Code Dev Tunnels uses a dynamic *.devtunnels.ms hostname and
    // terminates HTTPS before traffic reaches Vite.
 allowedHosts: ['.devtunnels.ms', '.trycloudflare.com'],

    // Keep HMR on the page's origin. Vite then uses ws://localhost:5173
    // locally and wss://<tunnel-host> through the HTTPS tunnel.

    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
    },
  },
});
