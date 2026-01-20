#!/usr/bin/env node

// 调试 SDK 结构
const { createRequire } = require('module');
const { join } = require('path');
const requireLocal = createRequire(__filename);

console.log('调试 @catalyst-team/poly-sdk 结构...\n');

try {
  const pkgPath = join(process.cwd(), 'node_modules', '@catalyst-team', 'poly-sdk');
  const packageJson = require(join(pkgPath, 'package.json'));
  const entryPath = join(pkgPath, packageJson.main || 'dist/index.js');
  const sdkModule = require(entryPath);
  
  let PolySDK = sdkModule.default || sdkModule.PolySDK || sdkModule;
  
  // 尝试初始化
  let sdk;
  if (typeof PolySDK === 'function') {
    sdk = new PolySDK({
      privateKey: '0x0000000000000000000000000000000000000000000000000000000000000000',
      network: 'polygon'
    });
  } else if (PolySDK && typeof PolySDK === 'object') {
    if (typeof PolySDK.create === 'function') {
      sdk = PolySDK.create({
        privateKey: '0x0000000000000000000000000000000000000000000000000000000000000000',
        network: 'polygon'
      });
    } else {
      sdk = PolySDK;
    }
  }
  
  console.log('📦 SDK 实例结构:');
  console.log('类型:', typeof sdk);
  console.log('顶级键:', Object.keys(sdk || {}));
  console.log('');
  
  // 检查各种可能的 API 结构
  const apiChecks = [
    'gammaApi',
    'api',
    'trading',
    'markets',
    'orderbook',
    'searchMarkets',
    'getMarkets',
    'getOrderbook',
    'createOrder',
    'placeOrder',
  ];
  
  console.log('🔍 API 检查:');
  for (const key of apiChecks) {
    if (sdk && sdk[key]) {
      const value = sdk[key];
      console.log(`  ✓ ${key}:`, typeof value === 'function' ? 'function' : typeof value);
      if (typeof value === 'object' && value !== null) {
        console.log(`    子键:`, Object.keys(value).slice(0, 10));
      }
    }
  }
  
  // 详细检查 gammaApi
  if (sdk && sdk.gammaApi) {
    console.log('\n📡 gammaApi 详细结构:');
    console.log('类型:', typeof sdk.gammaApi);
    console.log('方法:', Object.keys(sdk.gammaApi).filter(k => typeof sdk.gammaApi[k] === 'function'));
    console.log('属性:', Object.keys(sdk.gammaApi).filter(k => typeof sdk.gammaApi[k] !== 'function'));
  }
  
  // 详细检查 trading
  if (sdk && sdk.trading) {
    console.log('\n💰 trading 详细结构:');
    console.log('类型:', typeof sdk.trading);
    console.log('方法:', Object.keys(sdk.trading).filter(k => typeof sdk.trading[k] === 'function'));
    console.log('属性:', Object.keys(sdk.trading).filter(k => typeof sdk.trading[k] !== 'function'));
  }
  
} catch (error) {
  console.error('❌ 错误:', error.message);
  console.error(error.stack);
}
