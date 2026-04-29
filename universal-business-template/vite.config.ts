import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-vite-plugin';

export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    react(),
  ],
  define: {
    'import.meta.env.VITE_TENANT_ID': JSON.stringify(process.env.VITE_TENANT_ID ?? 'electrician-demo'),
  },
});
