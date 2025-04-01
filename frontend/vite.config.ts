import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    // Configuración del proxy para evitar problemas CORS durante el desarrollo
    proxy: {
      '/api': {
        target: 'http://localhost/oh-sansi/backend/public',
        changeOrigin: true,
        // No reescribimos la ruta ya que la API espera /api/v1
        rewrite: (path) => path,
      }
    }
  }
});
