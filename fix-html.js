import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// 读取构建后的 HTML 文件
const htmlPath = join(process.cwd(), 'dist', 'index.html');
let html = readFileSync(htmlPath, 'utf-8');

// 移除 type="module" 和 crossorigin 属性，因为使用 IIFE 格式不需要这些
html = html.replace(
  /<script type="module" crossorigin src="\.\/assets\/index\.js"><\/script>/,
  ''
);

// 移除 CSS 的 crossorigin（如果有）
html = html.replace(
  /<link rel="stylesheet" crossorigin href="\.\/assets\/index\.css">/,
  ''
);

// 将脚本移到 body 末尾，确保 DOM 已加载
html = html.replace(
  /<\/body>/,
  '    <script src="./assets/index.js"></script>\n  </body>'
);

// 写回文件
writeFileSync(htmlPath, html, 'utf-8');
console.log('✅ HTML 文件已修复：移除了 type="module"，脚本已移到 body 末尾');
