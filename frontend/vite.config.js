import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
  },
  // Configuração dos testes (Vitest)
  test: {
    environment: 'jsdom',               // simula um navegador dentro do Node 
    setupFiles: './src/testes/setup.js' // corre antes de cada ficheiro de teste
  },
})
