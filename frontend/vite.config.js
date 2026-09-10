import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve("./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
        proxyTimeout: 300000,  // 5 min — Whisper + 2× Groq LLM can take 30-90s
        timeout: 300000,
      },
    },
  },
});