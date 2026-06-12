import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR can be toggled via the `DISABLE_HMR` environment variable.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Optionally disable file watching when HMR is turned off to reduce CPU usage.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
