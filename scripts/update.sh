#!/bin/bash

# 更新脚本 - 拉取最新代码并重启程序
# 使用方法: bash scripts/update.sh

set -e

echo "🔄 更新15分钟市场套利程序..."

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 检查是否在项目目录
if [ ! -f "package.json" ]; then
    echo "错误: 请在项目根目录运行此脚本"
    exit 1
fi

# 拉取最新代码
echo -e "${YELLOW}拉取最新代码...${NC}"
git pull

# 安装新依赖
echo -e "${YELLOW}检查依赖更新...${NC}"
npm install

# 重新编译
echo -e "${YELLOW}重新编译...${NC}"
npm run build

# 重启PM2进程
echo -e "${YELLOW}重启程序...${NC}"
pm2 restart 15min-arbitrage

echo -e "${GREEN}✓ 更新完成！${NC}"
pm2 status
