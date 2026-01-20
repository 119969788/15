# 快速修复导入错误

## 问题

运行程序时出现：
```
SyntaxError: The requested module '@catalyst-team/poly-sdk' does not provide an export named 'PolySDK'
```

## 快速修复步骤

### 1. 更新代码（已修复）

代码已更新，支持多种导出方式。在服务器上执行：

```bash
cd /root/15
git pull
```

### 2. 检查包的导出方式

```bash
# 方法1: 使用检查脚本
node scripts/check-import.js

# 方法2: 直接检查
node -e "console.log(require('@catalyst-team/poly-sdk'))"
```

### 3. 如果仍然失败，尝试重新安装

```bash
cd /root/15
npm uninstall @catalyst-team/poly-sdk
npm install @catalyst-team/poly-sdk@latest
npm run build
```

### 4. 测试运行

```bash
npm run dev
```

## 如果问题仍然存在

### 方案A: 使用默认导出

编辑 `src/index.ts`，将第一行改为：

```typescript
import PolySDK from '@catalyst-team/poly-sdk';
```

### 方案B: 检查包的实际导出

```bash
# 查看包的 package.json
cat node_modules/@catalyst-team/poly-sdk/package.json | grep -A 5 '"main"'

# 查看实际导出
node -e "const pkg = require('./node_modules/@catalyst-team/poly-sdk/package.json'); console.log(pkg.main, pkg.exports);"
```

### 方案C: 使用官方SDK（备选）

如果 `@catalyst-team/poly-sdk` 确实有问题，可以考虑使用官方 SDK：

```bash
npm install @polymarket/clob-client
```

然后修改代码使用 `ClobClient`。

## 当前代码的兼容性

当前代码已更新为支持：
- 默认导出: `export default PolySDK`
- 命名导出: `export { PolySDK }`
- 命名空间导出: `export *`

如果仍然失败，请运行检查脚本并提供输出结果。
