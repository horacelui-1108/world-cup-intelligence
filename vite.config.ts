import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'plugin-inspect-react-code'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  // inspectAttr 會注入 code-path data 屬性（開發用 DOM → source 定位），
  // 只限 development；production bundle 唔應該有 code-path 屬性
  plugins: [process.env.NODE_ENV === 'development' ? inspectAttr() : null, react()],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
