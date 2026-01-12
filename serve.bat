@echo off
chcp 65001 >nul
echo ===================================
echo   启动本地服务器
echo ===================================
echo.

REM 检查是否已构建
if not exist "dist" (
    echo 检测到未构建，开始构建项目...
    echo.
    call npm run build
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo ✗ 构建失败，请检查错误信息
        pause
        exit /b 1
    )
    echo.
    echo ✓ 构建完成
    echo.
)

REM 检查 serve 是否已安装
where npx >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ✗ 错误: 未检测到 npm/npx
    pause
    exit /b 1
)

echo 启动本地服务器...
echo.
echo 服务器地址: http://localhost:3000
echo.
echo 按 Ctrl+C 停止服务器
echo.

cd dist
npx serve -l 3000

cd ..
pause














