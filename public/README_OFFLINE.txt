========================================
关卡编辑器 - 离线使用说明
========================================

【推荐方法】直接双击打开（无需服务器）：
1. 双击 index.html 文件
2. 浏览器会自动打开关卡编辑器
3. 开始使用

如果直接打开不行，可以使用备用方法：

【备用方法】使用本地服务器：

Windows 用户：
1. 双击 start.bat 启动本地服务器
2. 等待服务器启动（会显示 "Local: http://localhost:3000"）
3. 在浏览器中打开 http://localhost:3000
4. 开始使用关卡编辑器

Linux/Mac 用户：
1. 在终端中运行：chmod +x start.sh && ./start.sh
2. 等待服务器启动（会显示 "Local: http://localhost:3000"）
3. 在浏览器中打开 http://localhost:3000
4. 开始使用关卡编辑器

停止服务器：
- 在命令行窗口中按 Ctrl+C

注意事项：
- 首次运行 start.bat 时，npx 会自动下载 serve 工具（需要网络连接）
- 之后运行无需网络连接
- 如果端口 3000 被占用，可以修改 start.bat 中的端口号

文件说明：
- index.html: 主页面
- assets/: 资源文件目录
- start.bat: Windows 启动脚本
- start.sh: Linux/Mac 启动脚本
- README_OFFLINE.txt: 本说明文件

技术说明：
- 本项目已配置 base: './'，使用相对路径
- 使用 IIFE 格式构建，不依赖 ES 模块，可以直接双击打开
- 所有资源使用相对路径，CSS 已内联到 JS 文件中
- 如果遇到问题，可以使用 start.bat/start.sh 启动本地服务器（备用方法）
- 使用 npx serve 提供本地静态服务器（备用方法）

支持的浏览器：
- Chrome 111+
- Firefox 114+
- Edge 111+
- Safari 16.4+




