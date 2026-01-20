// SDK 加载器 - 兼容不同的模块系统
import { createRequire } from 'module';

/**
 * 动态加载 poly-sdk，兼容 ESM 和 CommonJS
 */
export async function loadPolySDK() {
  try {
    // 方法1: 尝试 ESM 导入
    try {
      const sdkModule = await import('@catalyst-team/poly-sdk');
      return sdkModule.default || sdkModule.PolySDK || sdkModule;
    } catch (esmError) {
      // 方法2: 使用 CommonJS require
      const require = createRequire(import.meta.url);
      const sdkModule = require('@catalyst-team/poly-sdk');
      return sdkModule.default || sdkModule.PolySDK || sdkModule;
    }
  } catch (error) {
    console.error('加载 poly-sdk 失败:', error);
    throw new Error(`无法加载 @catalyst-team/poly-sdk: ${error}`);
  }
}
