#!/bin/bash

# 检查 @catalyst-team/poly-sdk 包的结构

echo "检查 @catalyst-team/poly-sdk 包结构..."
echo ""

PACKAGE_DIR="node_modules/@catalyst-team/poly-sdk"

if [ ! -d "$PACKAGE_DIR" ]; then
    echo "❌ 包未安装"
    exit 1
fi

echo "📦 包目录: $PACKAGE_DIR"
echo ""

echo "📄 package.json 内容:"
cat "$PACKAGE_DIR/package.json" | head -50
echo ""

echo "📁 目录结构:"
ls -la "$PACKAGE_DIR" | head -20
echo ""

echo "🔍 查找可能的入口文件:"
find "$PACKAGE_DIR" -maxdepth 2 -name "*.js" -o -name "*.ts" -o -name "index.*" | head -10
echo ""

echo "📋 main 字段:"
cat "$PACKAGE_DIR/package.json" | grep -E '"main"|"module"|"exports"|"types"' || echo "未找到"
echo ""
