import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress "use client" directive warnings from framer-motion and other libraries
        if (
          warning.code === 'MODULE_LEVEL_DIRECTIVE' &&
          (warning.message.includes('"use client"') || warning.message.includes("'use client'"))
        ) {
          return;
        }
        warn(warning);
      },
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
});
