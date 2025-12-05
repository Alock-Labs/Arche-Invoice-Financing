import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const proxyTarget =
  process.env.VITE_JSON_API_PROXY_TARGET ?? 'http://localhost:7575';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/v1': {
        target: proxyTarget,
        changeOrigin: true,
        secure: false
      }
    }
  }
});