# 修复 PolySDK 构造函数问题

## 问题

```
TypeError: PolySDK is not a constructor
```

## 原因

`@catalyst-team/poly-sdk` 加载后可能不是构造函数，而是：
- 一个对象（需要调用工厂方法）
- 一个包含构造函数的对象
- 一个已经初始化的实例

## 解决方案

代码已更新为支持多种初始化方式：

### 1. 构造函数方式
```typescript
if (typeof PolySDK === 'function') {
  this.sdk = new PolySDK({ privateKey, network });
}
```

### 2. 工厂方法方式
```typescript
if (typeof PolySDK.create === 'function') {
  this.sdk = PolySDK.create({ privateKey, network });
}
```

### 3. 默认导出方式
```typescript
if (typeof PolySDK.default === 'function') {
  this.sdk = new PolySDK.default({ privateKey, network });
}
```

### 4. 初始化方法方式
```typescript
if (PolySDK.init || PolySDK.initialize) {
  this.sdk = PolySDK.init({ privateKey, network });
}
```

### 5. 直接使用对象
```typescript
this.sdk = PolySDK;
this.sdk.setPrivateKey(privateKey);
this.sdk.setNetwork(network);
```

## 在服务器上应用

```bash
cd /root/15
git pull
npm run dev
```

## 调试

如果仍然失败，运行测试脚本查看 SDK 的实际结构：

```bash
node scripts/test-sdk-load.js
```

这会显示：
- SDK 的实际类型
- 可用的方法和属性
- 正确的初始化方式

## 根据测试结果调整

如果测试脚本显示 SDK 有特定的初始化方式，可以：

1. 查看测试脚本的输出
2. 根据输出调整 `src/index.ts` 中的初始化逻辑
3. 或者告诉我测试结果，我可以帮你调整代码
