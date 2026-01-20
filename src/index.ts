// 兼容多种导入方式
import * as dotenv from 'dotenv';
import { ethers } from 'ethers';
import { createRequire } from 'module';

// 使用 CommonJS require 来加载包（避免 ESM exports 问题）
const require = createRequire(import.meta.url);

// 直接使用 require 加载（避免 ESM exports 配置问题）
let PolySDK: any;
try {
  const sdkModule = require('@catalyst-team/poly-sdk');
  
  // 尝试多种可能的导出方式
  if (typeof sdkModule === 'function') {
    PolySDK = sdkModule;
  } else if (sdkModule.default) {
    PolySDK = sdkModule.default;
  } else if (sdkModule.PolySDK) {
    PolySDK = sdkModule.PolySDK;
  } else {
    PolySDK = sdkModule;
  }
  
  // 验证 PolySDK 是否有效
  if (!PolySDK || (typeof PolySDK !== 'function' && typeof PolySDK !== 'object')) {
    throw new Error('PolySDK 未正确导出');
  }
} catch (error: any) {
  console.error('❌ 无法加载 @catalyst-team/poly-sdk');
  console.error('错误信息:', error.message);
  console.error('\n🔧 解决方案:');
  console.error('1. 检查包是否正确安装:');
  console.error('   npm list @catalyst-team/poly-sdk');
  console.error('2. 重新安装包:');
  console.error('   npm uninstall @catalyst-team/poly-sdk');
  console.error('   npm install @catalyst-team/poly-sdk@latest');
  console.error('3. 检查包的导出:');
  console.error('   node -e "const require=require(\'module\').createRequire(process.cwd()+\'/package.json\'); const sdk=require(\'@catalyst-team/poly-sdk\'); console.log(Object.keys(sdk));"');
  throw error;
}

// 加载环境变量
dotenv.config();

interface TradingConfig {
  buyPrice: number;      // 买入价格 (赔率80 = 0.80)
  sellPrice: number;     // 卖出价格 (赔率90 = 0.90)
  underlying: string;     // 标的资产，如 'ETH', 'BTC'
  duration: string;       // 市场时长，如 '15m'
  minProfitRate: number;  // 最小利润率
  maxPositionSize: number; // 最大持仓数量
}

class FifteenMinArbitrageBot {
  private sdk: PolySDK;
  private config: TradingConfig;
  private currentMarket: any = null;
  private positions: Map<string, any> = new Map();
  private isRunning: boolean = false;

  constructor(config: TradingConfig) {
    this.config = config;
    
    // 初始化SDK
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('请设置环境变量 PRIVATE_KEY');
    }

    this.sdk = new PolySDK({
      privateKey: privateKey,
      network: process.env.NETWORK || 'polygon',
    });
  }

  /**
   * 查找当前活跃的15分钟市场
   */
  async findActiveMarket(): Promise<any> {
    try {
      // 搜索15分钟市场
      const markets = await this.sdk.gammaApi.searchMarkets({
        query: `${this.config.underlying} ${this.config.duration}`,
        limit: 50,
      });

      // 筛选出活跃的15分钟市场
      const activeMarkets = markets.filter((market: any) => {
        const isActive = market.active && !market.resolved;
        const is15m = market.duration === this.config.duration || 
                     market.question?.includes('15m') ||
                     market.question?.includes('15分钟');
        const isUnderlying = market.underlying?.toUpperCase() === this.config.underlying.toUpperCase();
        
        return isActive && is15m && isUnderlying;
      });

      if (activeMarkets.length === 0) {
        console.log('未找到活跃的15分钟市场');
        return null;
      }

      // 选择流动性最好的市场（按交易量排序）
      const sortedMarkets = activeMarkets.sort((a: any, b: any) => {
        return (b.volume || 0) - (a.volume || 0);
      });

      return sortedMarkets[0];
    } catch (error) {
      console.error('查找市场失败:', error);
      return null;
    }
  }

  /**
   * 获取市场订单簿
   */
  async getOrderbook(marketId: string): Promise<any> {
    try {
      // 使用SDK的getOrderbook方法
      const orderbook = await this.sdk.getOrderbook(marketId);
      return orderbook;
    } catch (error) {
      // 如果失败，尝试使用gammaApi
      try {
        const market = await this.sdk.gammaApi.getMarket(marketId);
        if (market?.tokens) {
          // 获取YES token的订单簿
          const yesToken = market.tokens.find((t: any) => t.outcome === 'Yes');
          if (yesToken?.tokenId) {
            return await this.sdk.getOrderbook(yesToken.tokenId);
          }
        }
      } catch (e) {
        console.error('获取订单簿失败:', error);
      }
      return null;
    }
  }

  /**
   * 检查买入机会（价格 <= 0.80）
   */
  async checkBuyOpportunity(market: any): Promise<boolean> {
    try {
      // 获取YES token
      const yesToken = market.tokens?.find((t: any) => t.outcome === 'Yes');
      if (!yesToken) {
        console.log('未找到YES token');
        return false;
      }

      // 获取订单簿 - 使用tokenId而不是marketId
      const tokenId = yesToken.tokenId || yesToken.id;
      const orderbook = await this.getOrderbook(tokenId);
      
      if (!orderbook) {
        // 如果订单簿为空，尝试使用token的当前价格
        const currentPrice = yesToken.price || parseFloat(yesToken.price || '0');
        if (currentPrice > 0 && currentPrice <= this.config.buyPrice) {
          console.log(`✅ 发现买入机会! 当前价格: ${currentPrice.toFixed(4)} <= ${this.config.buyPrice}`);
          return true;
        }
        return false;
      }

      // 获取最佳卖价（ask price）
      let bestAsk: number | null = null;
      
      if (orderbook.asks && orderbook.asks.length > 0) {
        bestAsk = parseFloat(orderbook.asks[0].price || orderbook.asks[0][0] || '0');
      } else if (orderbook.ask && orderbook.ask.length > 0) {
        bestAsk = parseFloat(orderbook.ask[0].price || orderbook.ask[0][0] || '0');
      } else if (yesToken.price) {
        // 使用token的当前价格作为参考
        bestAsk = parseFloat(yesToken.price);
      }

      if (!bestAsk || bestAsk === 0) {
        return false;
      }

      const marketQuestion = market.question || market.title || '未知市场';
      console.log(`当前市场: ${marketQuestion}`);
      console.log(`YES价格: ${bestAsk.toFixed(4)}, 目标买入价: ${this.config.buyPrice}`);

      // 如果价格 <= 买入价，执行买入
      if (bestAsk <= this.config.buyPrice) {
        console.log(`✅ 发现买入机会! 价格: ${bestAsk.toFixed(4)} <= ${this.config.buyPrice}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('检查买入机会失败:', error);
      return false;
    }
  }

  /**
   * 执行买入订单
   */
  async executeBuy(market: any): Promise<boolean> {
    try {
      const yesToken = market.tokens?.find((t: any) => t.outcome === 'Yes');
      if (!yesToken) {
        console.error('未找到YES token');
        return false;
      }

      const tokenId = yesToken.tokenId;
      const amount = this.config.maxPositionSize;

      console.log(`📈 执行买入: Token=${tokenId}, 价格=${this.config.buyPrice}, 数量=${amount}`);

      // 创建限价买单
      // 注意：根据poly-sdk的实际API调整参数
      const order = await this.sdk.trading.createLimitOrder({
        tokenId: tokenId,
        side: 'BUY' as any,
        price: this.config.buyPrice.toString(),
        size: amount.toString(),
        expiration: Math.floor(Date.now() / 1000) + 300, // 5分钟后过期
      }).catch(async (err: any) => {
        // 如果createLimitOrder失败，尝试使用其他方法
        console.log('尝试使用替代方法创建订单...');
        try {
          // 使用SDK的placeOrder方法（如果存在）
          return await (this.sdk as any).placeOrder?.({
            tokenId: tokenId,
            side: 'BUY',
            price: this.config.buyPrice,
            amount: amount,
          });
        } catch (e) {
          throw err;
        }
      });

      if (order && order.orderId) {
        console.log(`✅ 买入订单已提交: ${order.orderId}`);
        
        // 记录持仓
        this.positions.set(order.orderId, {
          marketId: market.id,
          tokenId: tokenId,
          buyPrice: this.config.buyPrice,
          amount: amount,
          orderId: order.orderId,
          timestamp: Date.now(),
        });

        // 立即挂卖出单
        await this.placeSellOrder(tokenId, amount, order.orderId);
        return true;
      }

      return false;
    } catch (error) {
      console.error('执行买入失败:', error);
      return false;
    }
  }

  /**
   * 挂卖出订单（价格 = 0.90）
   */
  async placeSellOrder(tokenId: string, amount: number, buyOrderId: string): Promise<void> {
    try {
      console.log(`📉 挂卖出单: Token=${tokenId}, 价格=${this.config.sellPrice}, 数量=${amount}`);

      const order = await this.sdk.trading.createLimitOrder({
        tokenId: tokenId,
        side: 'SELL' as any,
        price: this.config.sellPrice.toString(),
        size: amount.toString(),
        expiration: Math.floor(Date.now() / 1000) + 900, // 15分钟后过期
      }).catch(async (err: any) => {
        // 如果createLimitOrder失败，尝试使用其他方法
        console.log('尝试使用替代方法创建卖出订单...');
        try {
          return await (this.sdk as any).placeOrder?.({
            tokenId: tokenId,
            side: 'SELL',
            price: this.config.sellPrice,
            amount: amount,
          });
        } catch (e) {
          throw err;
        }
      });

      if (order && order.orderId) {
        console.log(`✅ 卖出订单已提交: ${order.orderId}`);
        
        // 更新持仓记录
        const position = this.positions.get(buyOrderId);
        if (position) {
          position.sellOrderId = order.orderId;
          this.positions.set(buyOrderId, position);
        }
      }
    } catch (error) {
      console.error('挂卖出单失败:', error);
    }
  }

  /**
   * 检查持仓状态
   */
  async checkPositions(): Promise<void> {
    try {
      for (const [orderId, position] of this.positions.entries()) {
        // 检查订单状态
        const orderStatus = await this.sdk.trading.getOrderStatus(orderId);
        
        if (orderStatus?.status === 'FILLED') {
          console.log(`✅ 订单 ${orderId} 已成交`);
          
          // 如果是买单成交，确保卖出单已挂
          if (!position.sellOrderId) {
            await this.placeSellOrder(position.tokenId, position.amount, orderId);
          }
        }
      }
    } catch (error) {
      console.error('检查持仓状态失败:', error);
    }
  }

  /**
   * 主循环
   */
  async run(): Promise<void> {
    if (this.isRunning) {
      console.log('程序已在运行中');
      return;
    }

    this.isRunning = true;
    console.log('🚀 15分钟市场套利程序启动');
    console.log(`配置: 买入价=${this.config.buyPrice}, 卖出价=${this.config.sellPrice}`);
    console.log(`标的: ${this.config.underlying}, 时长: ${this.config.duration}`);

    while (this.isRunning) {
      try {
        // 1. 查找当前活跃市场
        const market = await this.findActiveMarket();
        
        if (!market) {
          console.log('等待活跃市场...');
          await this.sleep(5000);
          continue;
        }

        // 如果市场发生变化，更新当前市场
        if (!this.currentMarket || this.currentMarket.id !== market.id) {
          this.currentMarket = market;
          console.log(`\n🔄 切换到新市场: ${market.question}`);
          console.log(`市场ID: ${market.id}`);
        }

        // 2. 检查买入机会
        const hasBuyOpportunity = await this.checkBuyOpportunity(market);
        
        if (hasBuyOpportunity) {
          await this.executeBuy(market);
        }

        // 3. 检查现有持仓状态
        if (this.positions.size > 0) {
          await this.checkPositions();
        }

        // 等待一段时间后再次检查
        await this.sleep(2000); // 2秒检查一次

      } catch (error) {
        console.error('主循环错误:', error);
        await this.sleep(5000);
      }
    }
  }

  /**
   * 停止程序
   */
  stop(): void {
    this.isRunning = false;
    console.log('程序已停止');
  }

  /**
   * 休眠函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 主程序入口
async function main() {
  const config: TradingConfig = {
    buyPrice: 0.80,        // 赔率80买入
    sellPrice: 0.90,       // 赔率90卖出
    underlying: process.env.UNDERLYING || 'ETH',  // 默认ETH
    duration: '15m',       // 15分钟市场
    minProfitRate: 0.10,   // 最小利润率10%
    maxPositionSize: parseFloat(process.env.MAX_POSITION_SIZE || '100'), // 最大持仓
  };

  const bot = new FifteenMinArbitrageBot(config);

  // 处理程序退出
  process.on('SIGINT', () => {
    console.log('\n收到退出信号...');
    bot.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n收到终止信号...');
    bot.stop();
    process.exit(0);
  });

  // 启动程序
  await bot.run();
}

// 运行主程序
main().catch(console.error);
