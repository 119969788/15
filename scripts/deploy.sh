#!/bin/bash

# 服务器部署脚本
# 使用方法: bash scripts/deploy.sh

set -e  # 遇到错误立即退出

echo "🚀 开始部署15分钟市场套利程序..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查Node.js
echo -e "${YELLOW}检查Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: 未安装Node.js，请先安装Node.js${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js版本: $(node --version)${NC}"

# 检查npm
echo -e "${YELLOW}检查npm...${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "${RED}错误: 未安装npm${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm版本: $(npm --version)${NC}"

# 检查.env文件
echo -e "${YELLOW}检查环境变量配置...${NC}"
if [ ! -f .env ]; then
    echo -e "${RED}错误: 未找到.env文件${NC}"
    echo -e "${YELLOW}请创建.env文件并配置PRIVATE_KEY${NC}"
    exit 1
fi
echo -e "${GREEN}✓ .env文件存在${NC}"

# 安装依赖
echo -e "${YELLOW}安装依赖...${NC}"
npm install
echo -e "${GREEN}✓ 依赖安装完成${NC}"

# 编译TypeScript
echo -e "${YELLOW}编译TypeScript...${NC}"
npm run build
if [ ! -d "dist" ]; then
    echo -e "${RED}错误: 编译失败，dist目录不存在${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 编译完成${NC}"

# 创建日志目录
echo -e "${YELLOW}创建日志目录...${NC}"
mkdir -p logs
echo -e "${GREEN}✓ 日志目录已创建${NC}"

# 检查PM2
echo -e "${YELLOW}检查PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}PM2未安装，正在安装...${NC}"
    npm install -g pm2
fi
echo -e "${GREEN}✓ PM2已安装${NC}"

# 停止旧进程（如果存在）
echo -e "${YELLOW}停止旧进程...${NC}"
pm2 stop 15min-arbitrage 2>/dev/null || true
pm2 delete 15min-arbitrage 2>/dev/null || true

# 启动程序
echo -e "${YELLOW}启动程序...${NC}"
pm2 start ecosystem.config.js
echo -e "${GREEN}✓ 程序已启动${NC}"

# 保存PM2进程列表
echo -e "${YELLOW}保存PM2进程列表...${NC}"
pm2 save
echo -e "${GREEN}✓ 进程列表已保存${NC}"

# 显示状态
echo -e "\n${GREEN}部署完成！${NC}\n"
echo -e "${YELLOW}程序状态:${NC}"
pm2 status

echo -e "\n${YELLOW}常用命令:${NC}"
echo -e "  查看日志: ${GREEN}pm2 logs 15min-arbitrage${NC}"
echo -e "  查看状态: ${GREEN}pm2 status${NC}"
echo -e "  重启程序: ${GREEN}pm2 restart 15min-arbitrage${NC}"
echo -e "  停止程序: ${GREEN}pm2 stop 15min-arbitrage${NC}"
echo -e "  监控面板: ${GREEN}pm2 monit${NC}"
