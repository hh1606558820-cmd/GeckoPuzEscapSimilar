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
  build: {
    // 确保使用相对路径
    assetsDir: 'assets',
    // 生成兼容 file:// 协议的代码
    rollupOptions: {
      output: {
        // 使用 IIFE 格式，避免 ES 模块在 file:// 协议下的 CORS 问题
        format: 'iife',
        // 确保所有资源路径都是相对路径
        assetFileNames: 'assets/[name].[ext]',
        chunkFileNames: 'assets/[name].js',
        entryFileNames: 'assets/[name].js',
        // 内联所有代码到一个文件，避免动态导入
        inlineDynamicImports: true,
      },
    },
  },
})

