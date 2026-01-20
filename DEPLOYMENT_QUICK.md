# 服务器快速部署指南

## 一键部署（推荐）

```bash
# 1. 克隆项目
git clone https://github.com/119969788/15.git
cd 15

# 2. 配置环境变量
nano .env
# 填入: PRIVATE_KEY=0x你的私钥

# 3. 运行部署脚本
bash scripts/deploy.sh
```

## 手动部署步骤

### 1. 安装Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2. 克隆并安装

```bash
git clone https://github.com/119969788/15.git
cd 15
npm install
```

### 3. 配置环境

```bash
nano .env
# 添加: PRIVATE_KEY=0x你的私钥
chmod 600 .env
```

### 4. 编译和启动

```bash
npm run build
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # 按提示执行命令
```

## 常用命令

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs 15min-arbitrage

# 重启
pm2 restart 15min-arbitrage

# 停止
pm2 stop 15min-arbitrage

# 更新代码
bash scripts/update.sh
```

## 详细教程

完整部署教程请查看：[SERVER_DEPLOY.md](SERVER_DEPLOY.md)
