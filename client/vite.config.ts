import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

const certDir = path.resolve('..');

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    https: {
      key: fs.readFileSync(path.join(certDir, 'localhost-key.pem')),
      cert: fs.readFileSync(path.join(certDir, 'localhost.pem')),
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
