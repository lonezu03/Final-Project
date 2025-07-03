import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'window',  // Thêm dòng này để thay thế global bằng window trong môi trường trình duyệt
  },
})
