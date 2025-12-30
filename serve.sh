#!/bin/bash

echo "==================================="
echo "  启动本地服务器"
echo "==================================="
echo ""

# 检查是否已构建
if [ ! -d "dist" ]; then
    echo "检测到未构建，开始构建项目..."
    echo ""
    npm run build
    if [ $? -ne 0 ]; then
        echo ""
        echo "✗ 构建失败，请检查错误信息"
        exit 1
    fi
    echo ""
    echo "✓ 构建完成"
    echo ""
fi

# 检查 serve 是否可用
if ! command -v npx &> /dev/null; then
    echo "✗ 错误: 未检测到 npm/npx"
    exit 1
fi

echo "启动本地服务器..."
echo ""
echo "服务器地址: http://localhost:3000"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

cd dist
npx serve -l 3000

cd ..











