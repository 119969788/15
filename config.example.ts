/**
 * 配置文件示例
 * 复制此文件为 config.ts 并填入你的配置
 */

export const config = {
  // 私钥（必需）
  PRIVATE_KEY: '0x你的私钥',
  
  // 网络（可选，默认polygon）
  NETWORK: 'polygon',
  
  // 标的资产（可选，默认ETH）
  UNDERLYING: 'ETH', // 或 'BTC'
  
  // 最大持仓数量（可选，默认100）
  MAX_POSITION_SIZE: 100,
  
  // 交易配置
  TRADING: {
    buyPrice: 0.80,   // 赔率80买入
    sellPrice: 0.90,  // 赔率90卖出
    duration: '15m',  // 15分钟市场
  },
};
