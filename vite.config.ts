import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      events: 'eventemitter3',
    },
  },
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress wallet provider conflict warnings
        if (
          warning.message.includes('Cannot redefine property') ||
          warning.message.includes('Circular dependency') ||
          warning.message.includes('eventemitter3')
        ) {
          return;
        }
        warn(warning);
      },
    },
  },
  optimizeDeps: {
    include: ['eventemitter3'], // Ensure eventemitter3 is properly bundled
  },
}));
