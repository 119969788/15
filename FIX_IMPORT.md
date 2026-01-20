# 修复导入错误指南

## 问题描述

如果遇到以下错误：
```
SyntaxError: The requested module '@catalyst-team/poly-sdk' does not provide an export named 'PolySDK'
```

## 解决方案

### 方法1: 检查包的导出方式（推荐）

在服务器上运行以下命令检查包的导出：

```bash
cd /root/15
node -e "const sdk = require('@catalyst-team/poly-sdk'); console.log(Object.keys(sdk)); console.log('default:', sdk.default);"
```

或者使用检查脚本：

```bash
npx tsx src/check-sdk.ts
```

### 方法2: 使用默认导出

如果包使用默认导出，修改 `src/index.ts` 第一行为：

```typescript
import PolySDK from '@catalyst-team/poly-sdk';
```

### 方法3: 使用命名空间导入（当前已实现）

当前代码已使用命名空间导入，应该可以工作。如果仍然失败，请尝试：

```typescript
import * as PolySDKModule from '@catalyst-team/poly-sdk';
const PolySDK = PolySDKModule.default || PolySDKModule.PolySDK || PolySDKModule;
```

### 方法4: 检查包版本和重新安装

```bash
# 检查已安装的版本
npm list @catalyst-team/poly-sdk

# 重新安装
npm uninstall @catalyst-team/poly-sdk
npm install @catalyst-team/poly-sdk@latest

# 或者安装特定版本
npm install @catalyst-team/poly-sdk@0.3.0
```

### 方法5: 使用官方 Polymarket SDK

如果 `@catalyst-team/poly-sdk` 有问题，可以考虑使用官方 SDK：

```bash
npm install @polymarket/clob-client
```

然后修改代码使用 `ClobClient`。

## 快速修复步骤

1. **检查包的导出**：
   ```bash
   node -e "console.log(require('@catalyst-team/poly-sdk'))"
   ```

2. **根据输出结果修改导入语句**

3. **重新运行**：
   ```bash
   npm run dev
   ```

## 如果仍然失败

请提供以下信息以便进一步诊断：

1. Node.js 版本：`node --version`
2. npm 版本：`npm --version`
3. 包的导出信息：运行检查命令的输出
4. 完整的错误信息
