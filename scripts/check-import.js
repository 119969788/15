#!/usr/bin/env node

// 检查 poly-sdk 的导出方式
console.log('检查 @catalyst-team/poly-sdk 的导出方式...\n');

try {
  // 尝试 CommonJS 导入
  const sdk = require('@catalyst-team/poly-sdk');
  console.log('✓ CommonJS 导入成功');
  console.log('导出键:', Object.keys(sdk));
  console.log('默认导出:', sdk.default);
  console.log('PolySDK:', sdk.PolySDK);
  console.log('\n完整导出对象:');
  console.log(JSON.stringify(sdk, null, 2));
} catch (error) {
  console.error('✗ CommonJS 导入失败:', error.message);
}

try {
  // 尝试 ESM 导入（需要 Node.js 支持）
  import('@catalyst-team/poly-sdk').then(sdk => {
    console.log('\n✓ ESM 导入成功');
    console.log('导出键:', Object.keys(sdk));
    console.log('默认导出:', sdk.default);
    console.log('PolySDK:', sdk.PolySDK);
  }).catch(err => {
    console.error('\n✗ ESM 导入失败:', err.message);
  });
} catch (error) {
  console.error('ESM 导入不支持或失败');
}
