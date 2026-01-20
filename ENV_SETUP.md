# 环境变量配置说明

## 创建 .env 文件

在项目根目录创建 `.env` 文件，内容如下：

```env
# 私钥（必需）- 你的钱包私钥，用于签名交易
PRIVATE_KEY=0x你的私钥

# 网络（可选，默认polygon）
# 可选值: polygon, ethereum
NETWORK=polygon

# 标的资产（可选，默认ETH）
# 可选值: ETH, BTC
UNDERLYING=ETH

# 最大持仓数量（可选，默认100）
# 每次交易的最大数量
MAX_POSITION_SIZE=100
```

## 配置说明

### PRIVATE_KEY（必需）

你的钱包私钥，用于签名和提交交易。

**⚠️ 安全提示**：
- 不要将私钥提交到Git仓库
- 不要分享你的私钥给任何人
- 建议使用专门用于交易的账户，不要使用主账户

### NETWORK（可选）

使用的区块链网络，默认为 `polygon`。

Polymarket主要在Polygon网络上运行，一般不需要修改。

### UNDERLYING（可选）

要交易的标的资产，默认为 `ETH`。

可选值：
- `ETH` - 以太坊
- `BTC` - 比特币

### MAX_POSITION_SIZE（可选）

每次交易的最大持仓数量，默认为 `100`。

建议根据你的资金量设置合理的值，从小额开始测试。

## 示例配置

### 最小配置（仅必需项）

```env
PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

### 完整配置

```env
PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
NETWORK=polygon
UNDERLYING=ETH
MAX_POSITION_SIZE=50
```

## 验证配置

运行程序前，确保：
1. `.env` 文件已创建
2. `PRIVATE_KEY` 已正确设置
3. 私钥对应的账户有足够的余额（用于交易和Gas费）

## 故障排查

**问题：程序提示"请设置环境变量 PRIVATE_KEY"**
- 检查 `.env` 文件是否存在
- 检查 `PRIVATE_KEY` 是否正确设置
- 确保 `.env` 文件在项目根目录

**问题：交易失败，提示余额不足**
- 检查账户余额
- 确保账户有足够的USDC用于交易
- 确保账户有足够的MATIC用于Gas费
