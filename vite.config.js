import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      tailwindcss(),
      react()
    ],
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        "/api": {
          // Use environment variable, fallback to localhost
          target: env.VITE_API_URL || "http://localhost:3001",
          changeOrigin: true,
          secure: false, // Allow self-signed certs in dev
          // Don't rewrite - keep /api prefix
          // rewrite: (path) => path.replace(/^\/api/, ""), // ❌ Remove this
        },
      },
    },
  };
})