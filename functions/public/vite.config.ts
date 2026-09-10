import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  server: {
    port: 5173,
    watch: {
      ignored: ['**/dist/**', '**/scratch/**', '**/.firebase/**', '**/*.log'],
    },
  },
  optimizeDeps: {
    entries: ['./index.html', './index.tsx', './App.tsx'],
  },
  build: {
    outDir: '../../public',
    emptyOutDir: true,
  },
});
