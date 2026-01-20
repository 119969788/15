#!/bin/bash

# 15分钟市场套利程序启动脚本

echo "🚀 启动15分钟市场套利程序..."

# 检查.env文件
if [ ! -f .env ]; then
    echo "⚠️  未找到.env文件，请先配置环境变量"
    echo "参考.env.example创建.env文件"
    exit 1
fi

# 检查node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 运行程序
echo "▶️  运行程序..."
npm run dev
