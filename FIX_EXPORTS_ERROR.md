# 修复 ERR_PACKAGE_PATH_NOT_EXPORTED 错误

## 错误信息

```
Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: No "exports" main defined in /root/15/node_modules/@catalyst-team/poly-sdk/package.json
```

## 原因

这个错误是因为 `@catalyst-team/poly-sdk` 包的 `package.json` 中没有正确配置 `exports` 字段，导致 ESM 模块系统无法找到正确的导出路径。

## 解决方案

### 方案1: 使用 CommonJS require（已实现）

代码已更新为使用 `createRequire` 来加载包，这样可以绕过 ESM exports 的限制。

**在服务器上执行：**

```bash
cd /root/15
git pull
npm run dev
```

### 方案2: 检查并修复包的安装

如果方案1仍然失败，尝试：

```bash
# 1. 检查包是否正确安装
npm list @catalyst-team/poly-sdk

# 2. 查看包的 package.json
cat node_modules/@catalyst-team/poly-sdk/package.json | grep -A 10 '"exports"'

# 3. 重新安装
npm uninstall @catalyst-team/poly-sdk
rm -rf node_modules/@catalyst-team
npm install @catalyst-team/poly-sdk@latest

# 4. 清理缓存
npm cache clean --force
npm install
```

### 方案3: 使用包的子路径导入

如果包有特定的导出路径，可以尝试：

```typescript
// 尝试不同的导入路径
import PolySDK from '@catalyst-team/poly-sdk/dist/index.js';
// 或
import PolySDK from '@catalyst-team/poly-sdk/lib/index.js';
```

### 方案4: 修改 package.json（临时方案）

如果以上都不行，可以临时移除 `"type": "module"`：

```json
{
  "type": "commonjs",  // 改为 commonjs
  // ... 其他配置
}
```

然后使用 CommonJS 语法：

```typescript
const { PolySDK } = require('@catalyst-team/poly-sdk');
```

**注意：** 这需要修改整个项目的模块系统，不推荐。

### 方案5: 使用官方 Polymarket SDK（备选）

如果 `@catalyst-team/poly-sdk` 确实有问题，可以考虑使用官方 SDK：

```bash
npm install @polymarket/clob-client
```

然后修改代码使用 `ClobClient`。

## 验证修复

运行以下命令验证：

```bash
# 测试 require 加载
node -e "const require = require('module').createRequire(import.meta.url); const sdk = require('@catalyst-team/poly-sdk'); console.log('成功:', Object.keys(sdk));"

# 或者使用检查脚本
node scripts/check-import.js
```

## 当前代码状态

代码已更新为使用 `createRequire`，这应该可以解决大部分导出问题。如果仍然失败，请：

1. 检查包的版本和安装状态
2. 查看包的 `package.json` 中的 `exports` 配置
3. 考虑使用官方 SDK 作为替代方案
