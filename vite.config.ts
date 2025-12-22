import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  base: './', // 使用相对路径，支持离线打开（file:// 协议）
  // 注意：修改 base 后必须重新运行 npm run build
  publicDir: 'public', // public 目录中的文件会直接复制到 dist 根目录
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})

