# 15分钟市场套利程序

基于 [poly-sdk](https://github.com/cyl19970726/poly-sdk) 开发的15分钟市场套利交易程序，实现**赔率80买、90卖**的自动交易策略。

## 功能特点

- ✅ 自动监控15分钟市场（ETH/BTC等）
- ✅ 价格达到0.80时自动买入
- ✅ 买入后立即挂0.90卖出单
- ✅ 实时监控订单状态
- ✅ 自动切换活跃市场

## 安装

```bash
# 安装依赖
npm install
# 或
pnpm install
```

## 配置

1. 复制环境变量文件：
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，填入你的私钥：
```
PRIVATE_KEY=0x你的私钥
UNDERLYING=ETH  # 可选：ETH, BTC等
MAX_POSITION_SIZE=100  # 可选：最大持仓数量
```

## 使用方法

### 开发模式运行
```bash
npm run dev
```

### 生产模式运行
```bash
# 先编译
npm run build

# 再运行
npm start
```

## 交易策略

程序会执行以下策略：

1. **监控市场**：持续查找活跃的15分钟市场（如"ETH 15分钟涨跌"）
2. **买入信号**：当YES token价格 ≤ 0.80时，自动买入
3. **卖出挂单**：买入成功后，立即挂0.90的卖出限价单
4. **利润计算**：预期利润 = (0.90 - 0.80) / 0.80 = 12.5%

## 风险提示

⚠️ **重要风险提示**：

1. **市场风险**：15分钟市场波动极大，价格可能不会反弹到0.90
2. **流动性风险**：市场深度不足可能导致滑点
3. **时间风险**：15分钟市场很快到期，可能来不及成交
4. **技术风险**：API延迟、网络问题可能导致订单失败

**建议**：
- 从小额开始测试
- 设置止损机制
- 监控市场流动性
- 不要投入超过你能承受损失的资金

## 配置参数

可以在代码中修改以下参数：

```typescript
const config: TradingConfig = {
  buyPrice: 0.80,        // 买入价格（赔率80）
  sellPrice: 0.90,       // 卖出价格（赔率90）
  underlying: 'ETH',     // 标的资产
  duration: '15m',       // 市场时长
  minProfitRate: 0.10,   // 最小利润率
  maxPositionSize: 100,  // 最大持仓数量
};
```

## 日志说明

程序运行时会输出以下信息：

- `🔄 切换到新市场` - 检测到新的活跃市场
- `✅ 发现买入机会` - 价格达到买入条件
- `📈 执行买入` - 正在提交买入订单
- `📉 挂卖出单` - 正在提交卖出订单
- `✅ 订单已成交` - 订单成功成交

## 依赖

- `@catalyst-team/poly-sdk` - Polymarket SDK
- `ethers` - 以太坊交互
- `dotenv` - 环境变量管理

## 参考

- [poly-sdk GitHub](https://github.com/cyl19970726/poly-sdk)
- [Polymarket 文档](https://docs.polymarket.com/)

## License

MIT
