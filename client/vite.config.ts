import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

const certDir = path.resolve('..');

function getHttpsConfig() {
  try {
    const keyPath = path.join(certDir, 'localhost-key.pem');
    const certPath = path.join(certDir, 'localhost.pem');
    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      return {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      };
    }
  } catch {
    // сертификаты не найдены — запускаем без HTTPS
  }
  return undefined;
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    https: getHttpsConfig(),
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
