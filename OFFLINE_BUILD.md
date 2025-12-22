# 离线打包说明

## 配置说明

项目已配置为支持离线使用：
- Vite 配置中设置了 `base: './'`，使得打包后的资源使用相对路径
- **重要**：修改 `base` 配置后必须重新运行 `npm run build`
- 使用 `publicDir: 'public'` 配置，`public` 目录中的文件会自动复制到 `dist` 根目录

## 打包步骤

1. **构建生产版本**：
   ```bash
   npm run build
   ```

2. **打包成 ZIP**：
   - 进入 `dist` 目录
   - 将 `dist` 目录下的所有文件打包成 ZIP 文件
   - 例如：`level-editor-offline.zip`
   - **必须包含**：`index.html`、`assets/` 目录、`start.bat`、`README_OFFLINE.txt`

## 使用方法（Windows）

1. **解压 ZIP 文件**到任意目录
2. **双击 `start.bat`** 启动本地服务器
3. **等待服务器启动**（会显示 "Local: http://localhost:3000"）
4. **在浏览器中打开** `http://localhost:3000`
5. 开始使用关卡编辑器

## 停止服务器

- 在命令行窗口中按 `Ctrl+C`

## 注意事项

- **必须通过本地服务器访问**（不能直接双击 `index.html`，会出现白屏）
- 首次运行 `start.bat` 时，`npx` 会自动下载 `serve` 工具（需要网络连接）
- 之后运行无需网络连接
- 如果端口 3000 被占用，可以修改 `start.bat` 中的端口号
- 支持现代浏览器（Chrome、Firefox、Edge 等）

## 文件结构

打包后的 `dist` 目录结构：
```
dist/
├── index.html
├── start.bat          # 启动脚本（Windows）
├── README_OFFLINE.txt # 离线使用说明
└── assets/
    ├── index-XXXXX.js
    └── index-XXXXX.css
```

打包 ZIP 时应包含以上所有文件和目录。

## 技术说明

- 使用 `npx serve` 提供本地静态服务器
- 端口默认 3000，可在 `start.bat` 中修改
- 项目已配置 `base: './'`，使用相对路径

