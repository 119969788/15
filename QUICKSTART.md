# 快速开始指南

## 5分钟快速上手

### 步骤1：安装依赖

```bash
npm install
```

### 步骤2：配置环境变量

创建 `.env` 文件：

```env
PRIVATE_KEY=0x你的私钥
```

### 步骤3：运行程序

```bash
npm run dev
```

## 完整流程

### 1. 克隆/下载项目

```bash
git clone <项目地址>
cd 15
```

### 2. 安装依赖

```bash
npm install
# 或
pnpm install
```

### 3. 配置环境

创建 `.env` 文件（参考 `ENV_SETUP.md`）：

```env
PRIVATE_KEY=0x你的私钥
UNDERLYING=ETH
MAX_POSITION_SIZE=100
```

### 4. 运行程序

**开发模式**（推荐）：
```bash
npm run dev
```

**生产模式**：
```bash
npm run build
npm start
```

**使用启动脚本**（Windows）：
```bash
scripts\start.bat
```

**使用启动脚本**（Linux/Mac）：
```bash
chmod +x scripts/start.sh
./scripts/start.sh
```

## 程序工作流程

1. ✅ 程序启动，加载配置
2. 🔍 查找活跃的15分钟市场（ETH/BTC）
3. 📊 监控市场价格（每2秒检查一次）
4. 💰 当价格 ≤ 0.80时，自动买入
5. 📈 买入成功后，立即挂0.90卖出单
6. ✅ 监控订单状态，等待成交

## 预期结果

当程序检测到买入机会时，你会看到类似输出：

```
🔄 切换到新市场: Will ETH price be above $X in 15 minutes?
市场ID: 0x...
当前市场: Will ETH price be above $X in 15 minutes?
YES价格: 0.7950, 目标买入价: 0.8
✅ 发现买入机会! 价格: 0.7950 <= 0.8
📈 执行买入: Token=0x..., 价格=0.8, 数量=100
✅ 买入订单已提交: 0x...
📉 挂卖出单: Token=0x..., 价格=0.9, 数量=100
✅ 卖出订单已提交: 0x...
```

## 常见问题

**Q: 程序找不到市场？**
A: 等待新的15分钟市场开始，或检查网络连接。

**Q: 订单提交失败？**
A: 检查私钥是否正确，账户是否有足够余额。

**Q: 如何修改买入/卖出价格？**
A: 编辑 `src/index.ts` 中的 `buyPrice` 和 `sellPrice` 参数。

**Q: 如何停止程序？**
A: 按 `Ctrl+C` 停止程序。

## 下一步

- 阅读 [README.md](README.md) 了解详细功能
- 阅读 [USAGE.md](USAGE.md) 了解使用说明
- 阅读 [ENV_SETUP.md](ENV_SETUP.md) 了解环境配置

## 风险提示

⚠️ **请务必注意**：
- 从小额开始测试
- 不要投入超过你能承受损失的资金
- 15分钟市场波动极大，存在亏损风险
- 建议先在测试环境验证策略
