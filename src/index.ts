// 兼容多种导入方式
import * as dotenv from 'dotenv';
import { ethers } from 'ethers';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 获取当前文件目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 使用 createRequire 创建 require 函数
const require = createRequire(import.meta.url);

// 尝试多种方式加载 SDK（使用直接路径绕过 exports 限制）
let PolySDK: any;
let loadSuccess = false;

// 方法1: 尝试使用包的绝对路径
const packagePaths = [
  join(process.cwd(), 'node_modules', '@catalyst-team', 'poly-sdk'),
  join(__dirname, '..', 'node_modules', '@catalyst-team', 'poly-sdk'),
];

for (const pkgPath of packagePaths) {
  try {
    // 先读取 package.json 获取 main 字段
    const packageJsonPath = join(pkgPath, 'package.json');
    const packageJson = require(packageJsonPath);
    
    // 尝试多个可能的入口文件
    const possibleEntries = [
      packageJson.main,
      packageJson.module,
      'index.js',
      'dist/index.js',
      'lib/index.js',
      'src/index.js',
      'dist/index.cjs',
      'lib/index.cjs',
    ].filter(Boolean);

    for (const entry of possibleEntries) {
      try {
        const entryPath = join(pkgPath, entry);
        const sdkModule = require(entryPath);
        
        // 尝试多种导出方式
        let candidate = sdkModule.default || sdkModule.PolySDK || sdkModule;
        
        // 如果 candidate 是对象，尝试从中获取构造函数
        if (candidate && typeof candidate === 'object' && !(candidate instanceof Function)) {
          // 尝试从对象中获取 PolySDK 类
          if (candidate.PolySDK && typeof candidate.PolySDK === 'function') {
            candidate = candidate.PolySDK;
          } else if (candidate.default && typeof candidate.default === 'function') {
            candidate = candidate.default;
          }
        }
        
        // 验证是否是构造函数
        if (candidate && typeof candidate === 'function') {
          PolySDK = candidate;
          console.log(`✓ 成功加载 SDK (使用: ${entry})`);
          loadSuccess = true;
          break;
        } else if (candidate && typeof candidate === 'object') {
          // 如果仍然是对象，保存它，可能是一个工厂函数或需要不同的使用方式
          PolySDK = candidate;
          console.log(`✓ 成功加载 SDK 对象 (使用: ${entry})`);
          loadSuccess = true;
          break;
        }
      } catch (entryError) {
        // 继续尝试下一个入口文件
        continue;
      }
    }
    
    if (loadSuccess) break;
  } catch (pathError) {
    // 继续尝试下一个路径
    continue;
  }
}

// 方法2: 如果直接路径都失败，尝试使用包名（可能会失败，但作为最后尝试）
if (!loadSuccess) {
  try {
    const sdkModule = require('@catalyst-team/poly-sdk');
    PolySDK = sdkModule.default || sdkModule.PolySDK || sdkModule;
    if (PolySDK && (typeof PolySDK === 'function' || typeof PolySDK === 'object')) {
      console.log('✓ 使用包名加载成功');
      loadSuccess = true;
    }
  } catch (nameError) {
    // 忽略错误，继续
  }
}

// 如果所有方法都失败
if (!loadSuccess || !PolySDK) {
  console.error('❌ 无法加载 @catalyst-team/poly-sdk');
  console.error('\n🔧 请尝试以下解决方案:');
  console.error('1. 检查包结构:');
  console.error('   bash scripts/check-package-structure.sh');
  console.error('2. 重新安装包:');
  console.error('   npm uninstall @catalyst-team/poly-sdk');
  console.error('   npm install @catalyst-team/poly-sdk@latest');
  console.error('3. 检查包的 package.json:');
  console.error('   cat node_modules/@catalyst-team/poly-sdk/package.json');
  throw new Error('无法加载 PolySDK，请检查包的安装和结构');
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
  private sdk: any;
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

    // 尝试多种初始化方式
    try {
      // 方式1: 如果 PolySDK 是构造函数
      if (typeof PolySDK === 'function') {
        this.sdk = new PolySDK({
          privateKey: privateKey,
          network: process.env.NETWORK || 'polygon',
        });
      } 
      // 方式2: 如果 PolySDK 是对象，尝试使用工厂方法
      else if (PolySDK && typeof PolySDK === 'object') {
        // 尝试 create 方法
        if (typeof PolySDK.create === 'function') {
          this.sdk = PolySDK.create({
            privateKey: privateKey,
            network: process.env.NETWORK || 'polygon',
          });
        }
        // 尝试 default 方法
        else if (typeof PolySDK.default === 'function') {
          this.sdk = new PolySDK.default({
            privateKey: privateKey,
            network: process.env.NETWORK || 'polygon',
          });
        }
        // 尝试直接使用对象（如果它本身就是一个实例）
        else if (PolySDK.init || PolySDK.initialize) {
          const initMethod = PolySDK.init || PolySDK.initialize;
          this.sdk = typeof initMethod === 'function' 
            ? initMethod.call(PolySDK, { privateKey, network: process.env.NETWORK || 'polygon' })
            : PolySDK;
        }
        // 如果对象本身就可以使用
        else {
          this.sdk = PolySDK;
          // 尝试设置配置
          if (typeof this.sdk.setPrivateKey === 'function') {
            this.sdk.setPrivateKey(privateKey);
          }
          if (typeof this.sdk.setNetwork === 'function') {
            this.sdk.setNetwork(process.env.NETWORK || 'polygon');
          }
        }
      } else {
        throw new Error('PolySDK 格式不正确，既不是构造函数也不是对象');
      }
    } catch (error: any) {
      console.error('❌ 初始化 SDK 失败:', error.message);
      console.error('PolySDK 类型:', typeof PolySDK);
      if (PolySDK && typeof PolySDK === 'object') {
        console.error('PolySDK 键:', Object.keys(PolySDK));
      }
      throw new Error(`无法初始化 SDK: ${error.message}`);
    }
  }

  /**
   * 查找当前活跃的15分钟市场
   */
  async findActiveMarket(): Promise<any> {
    try {
      // 检查 SDK 结构
      if (!this.sdk) {
        throw new Error('SDK 未初始化');
      }

      // 尝试多种 API 访问方式
      let markets: any[] = [];
      
      // 方式1: this.sdk.gammaApi.searchMarkets
      if (this.sdk.gammaApi && typeof this.sdk.gammaApi.searchMarkets === 'function') {
        markets = await this.sdk.gammaApi.searchMarkets({
          query: `${this.config.underlying} ${this.config.duration}`,
          limit: 50,
        });
      }
      // 方式2: this.sdk.searchMarkets
      else if (typeof this.sdk.searchMarkets === 'function') {
        markets = await this.sdk.searchMarkets({
          query: `${this.config.underlying} ${this.config.duration}`,
          limit: 50,
        });
      }
      // 方式3: this.sdk.api.searchMarkets
      else if (this.sdk.api && typeof this.sdk.api.searchMarkets === 'function') {
        markets = await this.sdk.api.searchMarkets({
          query: `${this.config.underlying} ${this.config.duration}`,
          limit: 50,
        });
      }
      // 方式4: this.sdk.markets.search
      else if (this.sdk.markets && typeof this.sdk.markets.search === 'function') {
        markets = await this.sdk.markets.search({
          query: `${this.config.underlying} ${this.config.duration}`,
          limit: 50,
        });
      }
      // 方式5: 直接调用方法
      else if (typeof this.sdk.getMarkets === 'function') {
        const allMarkets = await this.sdk.getMarkets();
        // 手动过滤
        markets = allMarkets.filter((m: any) => {
          const isActive = m.active && !m.resolved;
          const is15m = m.duration === this.config.duration || 
                       m.question?.includes('15m') ||
                       m.question?.includes('15分钟');
          const isUnderlying = m.underlying?.toUpperCase() === this.config.underlying.toUpperCase();
          return isActive && is15m && isUnderlying;
        }).slice(0, 50);
      }
      else {
        // 调试信息
        console.error('❌ 无法找到搜索市场的方法');
        console.error('SDK 结构:', Object.keys(this.sdk));
        if (this.sdk.gammaApi) {
          console.error('gammaApi 结构:', Object.keys(this.sdk.gammaApi));
        }
        if (this.sdk.api) {
          console.error('api 结构:', Object.keys(this.sdk.api));
        }
        throw new Error('SDK 中没有找到搜索市场的方法');
      }

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
      // 尝试多种方式创建订单
      let order: any = null;
      
      // 方式1: this.sdk.trading.createLimitOrder
      if (this.sdk.trading && typeof this.sdk.trading.createLimitOrder === 'function') {
        order = await this.sdk.trading.createLimitOrder({
          tokenId: tokenId,
          side: 'BUY' as any,
          price: this.config.buyPrice.toString(),
          size: amount.toString(),
          expiration: Math.floor(Date.now() / 1000) + 300,
        });
      }
      // 方式2: this.sdk.createOrder
      else if (typeof this.sdk.createOrder === 'function') {
        order = await this.sdk.createOrder({
          tokenId: tokenId,
          side: 'BUY',
          price: this.config.buyPrice,
          size: amount,
        });
      }
      // 方式3: this.sdk.placeOrder
      else if (typeof this.sdk.placeOrder === 'function') {
        order = await this.sdk.placeOrder({
          tokenId: tokenId,
          side: 'BUY',
          price: this.config.buyPrice,
          amount: amount,
        });
      }
      // 方式4: this.sdk.trading.placeOrder
      else if (this.sdk.trading && typeof this.sdk.trading.placeOrder === 'function') {
        order = await this.sdk.trading.placeOrder({
          tokenId: tokenId,
          side: 'BUY',
          price: this.config.buyPrice,
          size: amount,
        });
      }
      else {
        console.error('❌ 无法找到创建订单的方法');
        console.error('SDK 结构:', Object.keys(this.sdk));
        if (this.sdk.trading) {
          console.error('trading 结构:', Object.keys(this.sdk.trading));
        }
        throw new Error('SDK 中没有找到创建订单的方法');
      }

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
        // 检查订单状态 - 尝试多种方式
        let orderStatus: any = null;
        
        if (this.sdk.trading && typeof this.sdk.trading.getOrderStatus === 'function') {
          orderStatus = await this.sdk.trading.getOrderStatus(orderId);
        } else if (typeof this.sdk.getOrderStatus === 'function') {
          orderStatus = await this.sdk.getOrderStatus(orderId);
        } else if (this.sdk.trading && typeof this.sdk.trading.getOrder === 'function') {
          orderStatus = await this.sdk.trading.getOrder(orderId);
        } else {
          // 如果无法检查状态，跳过
          continue;
        }
        
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
