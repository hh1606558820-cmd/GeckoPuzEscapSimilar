@echo off
echo 正在启动本地服务器...
echo 请在浏览器中打开: http://localhost:4173
echo 按 Ctrl+C 停止服务器
echo.
npx serve dist -l 4173
pause
