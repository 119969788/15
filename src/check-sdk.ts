// 临时文件：检查 poly-sdk 的导出方式
import * as sdkModule from '@catalyst-team/poly-sdk';

console.log('SDK模块导出:', Object.keys(sdkModule));
console.log('默认导出:', sdkModule.default);
console.log('PolySDK导出:', sdkModule.PolySDK);
