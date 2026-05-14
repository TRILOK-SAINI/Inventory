import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// https://inventory-d067.onrender.com ------ for server
// http://localhost:5000 ------------- for localhost
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(),],
  //  server: {
  //   proxy: {
  //     "/api": {
  //       target: "http://localhost:5000",
  //       changeOrigin: true,
  //       secure: false,
  //     },
  //   },
  // },
})
