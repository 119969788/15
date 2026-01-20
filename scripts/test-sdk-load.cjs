#!/usr/bin/env node

// 测试 SDK 加载和初始化 (CommonJS 版本)
const { createRequire } = require('module');
const { join } = require('path');
const path = require('path');

const requireLocal = createRequire(__filename);

console.log('测试 @catalyst-team/poly-sdk 加载...\n');

try {
  const pkgPath = join(process.cwd(), 'node_modules', '@catalyst-team', 'poly-sdk');
  const packageJson = require(join(pkgPath, 'package.json'));
  
  console.log('📦 包信息:');
  console.log('  main:', packageJson.main);
  console.log('  module:', packageJson.module);
  console.log('  exports:', packageJson.exports);
  console.log('');
  
  const entryPath = join(pkgPath, packageJson.main || 'dist/index.js');
  console.log('📄 加载路径:', entryPath);
  
  const sdkModule = require(entryPath);
  console.log('\n✅ 模块加载成功');
  console.log('模块类型:', typeof sdkModule);
  console.log('模块键:', Object.keys(sdkModule));
  
  // 尝试获取 PolySDK
  let PolySDK = sdkModule.default || sdkModule.PolySDK || sdkModule;
  
  console.log('\n🔍 PolySDK 信息:');
  console.log('类型:', typeof PolySDK);
  
  if (typeof PolySDK === 'function') {
    console.log('✓ 是构造函数');
    console.log('函数名:', PolySDK.name);
  } else if (typeof PolySDK === 'object') {
    console.log('✓ 是对象');
    console.log('对象键:', Object.keys(PolySDK));
    
    // 检查是否有构造函数
    if (PolySDK.PolySDK && typeof PolySDK.PolySDK === 'function') {
      console.log('✓ 找到 PolySDK.PolySDK 构造函数');
    }
    if (PolySDK.default && typeof PolySDK.default === 'function') {
      console.log('✓ 找到 PolySDK.default 构造函数');
    }
    if (typeof PolySDK.create === 'function') {
      console.log('✓ 找到 PolySDK.create 工厂方法');
    }
    if (typeof PolySDK.init === 'function') {
      console.log('✓ 找到 PolySDK.init 初始化方法');
    }
    if (typeof PolySDK.initialize === 'function') {
      console.log('✓ 找到 PolySDK.initialize 初始化方法');
    }
  }
  
  // 尝试初始化（使用测试私钥）
  console.log('\n🧪 测试初始化:');
  try {
    if (typeof PolySDK === 'function') {
      const instance = new PolySDK({
        privateKey: '0x0000000000000000000000000000000000000000000000000000000000000000',
        network: 'polygon'
      });
      console.log('✓ 使用 new PolySDK() 初始化成功');
      console.log('实例类型:', typeof instance);
      console.log('实例方法:', Object.keys(instance).slice(0, 10));
    } else if (PolySDK && typeof PolySDK === 'object') {
      if (typeof PolySDK.create === 'function') {
        const instance = PolySDK.create({
          privateKey: '0x0000000000000000000000000000000000000000000000000000000000000000',
          network: 'polygon'
        });
        console.log('✓ 使用 PolySDK.create() 初始化成功');
        console.log('实例类型:', typeof instance);
        console.log('实例方法:', Object.keys(instance).slice(0, 10));
      } else if (typeof PolySDK.default === 'function') {
        const instance = new PolySDK.default({
          privateKey: '0x0000000000000000000000000000000000000000000000000000000000000000',
          network: 'polygon'
        });
        console.log('✓ 使用 new PolySDK.default() 初始化成功');
        console.log('实例类型:', typeof instance);
        console.log('实例方法:', Object.keys(instance).slice(0, 10));
      } else {
        console.log('⚠️  无法找到初始化方法');
        console.log('可用的方法:', Object.keys(PolySDK).filter(k => typeof PolySDK[k] === 'function'));
      }
    }
  } catch (initError) {
    console.log('❌ 初始化失败:', initError.message);
    console.log('错误堆栈:', initError.stack);
  }
  
} catch (error) {
  console.error('❌ 错误:', error.message);
  console.error(error.stack);
}
