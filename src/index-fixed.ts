// 修复版本的入口文件 - 使用直接路径导入
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

// 尝试多种方式加载 SDK
let PolySDK: any;

// 方法1: 尝试直接 require（使用绝对路径）
try {
  const sdkPath = join(process.cwd(), 'node_modules', '@catalyst-team', 'poly-sdk');
  const sdkModule = require(sdkPath);
  PolySDK = sdkModule.default || sdkModule.PolySDK || sdkModule;
  if (typeof PolySDK === 'function' || (PolySDK && typeof PolySDK === 'object')) {
    console.log('✓ 使用直接路径加载成功');
  } else {
    throw new Error('SDK 格式不正确');
  }
} catch (error1: any) {
  // 方法2: 尝试使用包的 main 字段指定的路径
  try {
    const packageJson = require(join(process.cwd(), 'node_modules', '@catalyst-team', 'poly-sdk', 'package.json'));
    if (packageJson.main) {
      const mainPath = join(process.cwd(), 'node_modules', '@catalyst-team', 'poly-sdk', packageJson.main);
      const sdkModule = require(mainPath);
      PolySDK = sdkModule.default || sdkModule.PolySDK || sdkModule;
      console.log('✓ 使用 main 字段路径加载成功');
    } else {
      throw new Error('package.json 中没有 main 字段');
    }
  } catch (error2: any) {
    // 方法3: 尝试常见的入口文件
    const commonPaths = [
      'index.js',
      'dist/index.js',
      'lib/index.js',
      'src/index.js',
      'dist/index.cjs',
      'lib/index.cjs'
    ];
    
    let loaded = false;
    for (const path of commonPaths) {
      try {
        const fullPath = join(process.cwd(), 'node_modules', '@catalyst-team', 'poly-sdk', path);
        const sdkModule = require(fullPath);
        PolySDK = sdkModule.default || sdkModule.PolySDK || sdkModule;
        if (PolySDK) {
          console.log(`✓ 使用 ${path} 加载成功`);
          loaded = true;
          break;
        }
      } catch (e) {
        // 继续尝试下一个路径
      }
    }
    
    if (!loaded) {
      console.error('❌ 所有加载方式都失败了');
      console.error('错误1:', error1.message);
      console.error('错误2:', error2.message);
      console.error('\n请运行以下命令检查包结构:');
      console.error('  bash scripts/check-package-structure.sh');
      throw new Error('无法加载 PolySDK');
    }
  }
}

if (!PolySDK || (typeof PolySDK !== 'function' && typeof PolySDK !== 'object')) {
  throw new Error('PolySDK 未正确加载');
}

// 加载环境变量
dotenv.config();

// 从这里开始是原来的代码...
interface TradingConfig {
  buyPrice: number;
  sellPrice: number;
  underlying: string;
  duration: string;
  minProfitRate: number;
  maxPositionSize: number;
}

class FifteenMinArbitrageBot {
  private sdk: any;
  private config: TradingConfig;
  private currentMarket: any = null;
  private positions: Map<string, any> = new Map();
  private isRunning: boolean = false;

  constructor(config: TradingConfig) {
    this.config = config;
    
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('请设置环境变量 PRIVATE_KEY');
    }

    // 使用加载的 PolySDK
    this.sdk = new PolySDK({
      privateKey: privateKey,
      network: process.env.NETWORK || 'polygon',
    });
  }

  // ... 其他方法保持不变，从原文件复制 ...
}

// 主程序入口
async function main() {
  const config: TradingConfig = {
    buyPrice: 0.80,
    sellPrice: 0.90,
    underlying: process.env.UNDERLYING || 'ETH',
    duration: '15m',
    minProfitRate: 0.10,
    maxPositionSize: parseFloat(process.env.MAX_POSITION_SIZE || '100'),
  };

  const bot = new FifteenMinArbitrageBot(config);

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

  await bot.run();
}

main().catch(console.error);
