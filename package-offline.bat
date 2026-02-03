@echo off
chcp 65001 >nul
echo ========================================
echo 关卡编辑器 - 单机网页版打包工具
echo ========================================
echo.

echo [1/3] 正在构建项目...
call npm run build
if errorlevel 1 (
    echo 构建失败！请检查错误信息。
    pause
    exit /b 1
)
echo 构建完成！
echo.

echo [2/3] 检查必要文件...
if not exist "dist\index.html" (
    echo 错误：dist\index.html 不存在！
    pause
    exit /b 1
)
if not exist "dist\start.bat" (
    echo 警告：dist\start.bat 不存在，正在复制...
    copy "public\start.bat" "dist\start.bat" >nul
)
if not exist "dist\start.sh" (
    if exist "public\start.sh" (
        echo 正在复制 start.sh（Linux/Mac 启动脚本）...
        copy "public\start.sh" "dist\start.sh" >nul
    )
)
if not exist "dist\README_OFFLINE.txt" (
    echo 警告：dist\README_OFFLINE.txt 不存在，正在复制...
    copy "public\README_OFFLINE.txt" "dist\README_OFFLINE.txt" >nul
)
if not exist "dist\使用说明.txt" (
    if exist "dist\使用说明.txt" (
        echo 使用说明.txt 已存在
    ) else (
        echo 正在创建使用说明.txt...
        echo ======================================== > "dist\使用说明.txt"
        echo 关卡编辑器 - 单机网页版使用说明 >> "dist\使用说明.txt"
        echo ======================================== >> "dist\使用说明.txt"
        echo. >> "dist\使用说明.txt"
        echo 本版本可以直接双击打开，无需启动服务器！ >> "dist\使用说明.txt"
        echo. >> "dist\使用说明.txt"
        echo 使用方法： >> "dist\使用说明.txt"
        echo 1. 双击 index.html 文件 >> "dist\使用说明.txt"
        echo 2. 浏览器会自动打开关卡编辑器 >> "dist\使用说明.txt"
        echo 3. 开始使用 >> "dist\使用说明.txt"
    )
)
echo 文件检查完成！
echo.

echo [3/3] 正在创建 ZIP 压缩包...
REM 使用更可靠的日期格式（YYYYMMDD）
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set "zipname=level-editor-offline-%datetime:~0,8%.zip"

REM 使用 PowerShell 创建 ZIP（Windows 10+ 内置支持）
powershell -Command "Compress-Archive -Path 'dist\*' -DestinationPath '%zipname%' -Force"

if exist "%zipname%" (
    echo.
    echo ========================================
    echo 打包成功！
    echo ========================================
    echo 压缩包名称: %zipname%
    echo 压缩包位置: %cd%\%zipname%
    echo.
    echo 使用方法：
    echo 1. 解压 %zipname% 到任意目录
    echo 2. 直接双击 index.html 打开（推荐，无需服务器）
    echo    或者双击 start.bat 启动本地服务器（备用方法）
    echo 3. 开始使用关卡编辑器
    echo ========================================
) else (
    echo.
    echo 警告：ZIP 压缩包创建失败！
    echo 请手动将 dist 目录打包为 ZIP 文件。
    echo.
    echo 需要包含的文件：
    echo - index.html（可以直接双击打开）
    echo - assets\ 目录（包含所有文件）
    echo - start.bat（备用启动方法）
    echo - start.sh（Linux/Mac 备用启动方法）
    echo - README_OFFLINE.txt
    echo - 使用说明.txt
)

echo.
pause
