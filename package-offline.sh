#!/bin/bash

echo "========================================"
echo "关卡编辑器 - 单机网页版打包工具"
echo "========================================"
echo ""

echo "[1/3] 正在构建项目..."
npm run build
if [ $? -ne 0 ]; then
    echo "构建失败！请检查错误信息。"
    exit 1
fi
echo "构建完成！"
echo ""

echo "[2/3] 检查必要文件..."
if [ ! -f "dist/index.html" ]; then
    echo "错误：dist/index.html 不存在！"
    exit 1
fi
if [ ! -f "dist/start.bat" ]; then
    if [ -f "public/start.bat" ]; then
        echo "正在复制 start.bat（Windows 启动脚本）..."
        cp "public/start.bat" "dist/start.bat"
    fi
fi
if [ ! -f "dist/start.sh" ]; then
    if [ -f "public/start.sh" ]; then
        echo "正在复制 start.sh（Linux/Mac 启动脚本）..."
        cp "public/start.sh" "dist/start.sh"
        chmod +x "dist/start.sh"
    fi
fi
if [ ! -f "dist/README_OFFLINE.txt" ]; then
    if [ -f "public/README_OFFLINE.txt" ]; then
        echo "正在复制 README_OFFLINE.txt..."
        cp "public/README_OFFLINE.txt" "dist/README_OFFLINE.txt"
    fi
fi
echo "文件检查完成！"
echo ""

echo "[3/3] 正在创建 ZIP 压缩包..."
ZIPNAME="level-editor-offline-$(date +%Y%m%d).zip"
cd dist
zip -r "../$ZIPNAME" . > /dev/null
cd ..

if [ -f "$ZIPNAME" ]; then
    echo ""
    echo "========================================"
    echo "打包成功！"
    echo "========================================"
    echo "压缩包名称: $ZIPNAME"
    echo "压缩包位置: $(pwd)/$ZIPNAME"
    echo ""
    echo "使用方法："
    echo "1. 解压 $ZIPNAME 到任意目录"
    echo "2. 双击 start.bat 启动本地服务器（Windows）"
    echo "   或运行: npx serve -p 3000（Linux/Mac）"
    echo "3. 在浏览器中打开 http://localhost:3000"
    echo "========================================"
else
    echo ""
    echo "警告：ZIP 压缩包创建失败！"
    echo "请手动将 dist 目录打包为 ZIP 文件。"
    echo ""
    echo "需要包含的文件："
    echo "- index.html"
    echo "- assets/ 目录（包含所有文件）"
    echo "- start.bat"
    echo "- README_OFFLINE.txt"
fi

echo ""
