## FHEVM + Relayer SDK 通用 DApp 开发参考

本参考面向使用 Zama FHEVM（链上同态计算）与 Relayer SDK 的前端/合约一体化开发，沉淀本项目的最佳实践与可复用范式。你可以将其作为新项目脚手架的开发指南。

---

## 目录

- **目标与术语**
- **合约开发**（FHE 类型、外部输入、ACL、解密策略）
- **Relayer SDK 加载与实例初始化**（CDN/浏览器、Hardhat 本地、配置缓存）
- **加密写入流程**（createEncryptedInput → encrypt → 合约调用）
- **解密读取流程**（用户解密 userDecrypt、公共解密 decryptPublic、签名管理）
- **前端架构与状态管理**（实例生命周期、存储、并发与幂等）
- **错误处理与调试**
- **性能优化与体验**
- **安全实践**
- **常见问题排查（FAQ）**
- **最小可行样例（Solidity/TS）**

---

## 目标与术语

- **FHEVM**: 在链上对密文进行加/减/乘/比较/位运算等同态计算的运行环境。
- **Relayer SDK**: 前端/服务端用于本地加密、证明生成、与网关/Relayer 交互及解密请求的 SDK。
- **externalEuintX + proof**: 外部密文句柄与零知识证明；在合约内通过 `FHE.fromExternal` 转回内部加密类型。
- **ACL（访问控制）**: 使用 `FHE.allow/allowThis/allowTransient` 授权对某加密状态进行解密的权限。

---

## 合约开发

### 基础骨架

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract MyFHEContract is SepoliaConfig {
    euint32 private _value;

    function setValue(externalEuint32 input, bytes calldata proof) external {
        euint32 v = FHE.fromExternal(input, proof);
        _value = v;
        FHE.allowThis(_value);         // 合约内可继续访问/授权
        FHE.allow(_value, msg.sender); // 授权调用者可解密
    }

    function getValue() external view returns (euint32) {
        return _value;
    }
}
```

### 关键规则

- 使用 `externalEuint*` 作为外部参数，并伴随 `bytes proof`；在函数体内用 `FHE.fromExternal` 转为内部加密类型。
- 使用 `FHE.add/sub/mul/min/max/and/or/xor/div/rem/...` 对加密值计算；按需转换 `asEuint*`、`asEbool`。
- 使用最小合适位宽（如 `euint32` 而非 `euint256`）与标量运算（`FHE.add(value, 42)`）降低 gas。
- 对需被用户/合约解密的状态设置 ACL：`FHE.allowThis`、`FHE.allow`、`FHE.allowTransient`。
- 仅在必要时公开解密（`FHE.decrypt` 或前端 `decryptPublic`）。

---

## Relayer SDK 加载与实例初始化

### 浏览器（UMD CDN）

```html
<script
  src="https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.umd.cjs"
  type="text/javascript"
></script>
```

```typescript
// 加载 + 初始化 + 创建实例（伪代码）
await window.relayerSDK.initSDK();
const instance = await window.relayerSDK.createInstance({
  ...window.relayerSDK.SepoliaConfig,
  network: window.ethereum, // 或 RPC URL 字符串
  publicKey,                 // 可选：IndexedDB 读取缓存
  publicParams,              // 可选：IndexedDB 读取缓存
});
```

### 本地开发（Hardhat FHEVM 节点）

- 检测 `web3_clientVersion` 是否包含 `hardhat`，并通过 `fhevm_relayer_metadata` 拉取必要元信息。
- 命中本地 FHEVM 节点时可使用 SDK 的 mock 实例（动态 import，避免打包进生产）。

### 公钥与公共参数缓存

- 首次创建实例后：用 `instance.getPublicKey()`、`instance.getPublicParams(2048)` 写入 IndexedDB。
- 创建实例前：尝试从 IndexedDB 读取，作为 `createInstance` 的 `publicKey/publicParams` 以跳过网络获取。

---

## 加密写入流程（前端 → 合约）

1) `createEncryptedInput(contractAddress, userAddress)` 创建输入缓冲区。
2) `buffer.add8/16/32/64/128/256/Bool/Address(...)` 添加要加密的值。
3) `const { handles, inputProof } = await buffer.encrypt()` 本地加密并生成证明。
4) 使用合约方法 `fn(externalEuintX, bytes)` 传入 `handles[i]` 与 `inputProof`。

```typescript
const input = instance.createEncryptedInput(contractAddress, userAddress);
input.add32(BigInt(7));
const enc = await input.encrypt();
await contract.increment(enc.handles[0], enc.inputProof);
```

合约侧：

```solidity
function increment(externalEuint32 input, bytes calldata proof) external {
    euint32 v = FHE.fromExternal(input, proof);
    _count = FHE.add(_count, v);
    FHE.allowThis(_count);
    FHE.allow(_count, msg.sender);
}
```

---

## 解密读取流程

### A. 用户解密（需要 ACL 授权）

流程：读取加密句柄 → 构造或复用解密签名（EIP‑712，有有效期）→ 调用 `instance.userDecrypt(...)` → 得到句柄到明文的映射。

```typescript
// 1) 生成/复用解密签名（建议缓存于内存/IndexedDB）
const sig = await FhevmDecryptionSignature.loadOrSign(
  instance,
  [contractAddress],
  signer,
  storage
);

// 2) 解密（可批量）
const res = await instance.userDecrypt(
  [{ handle, contractAddress }],
  sig.privateKey,
  sig.publicKey,
  sig.signature,
  sig.contractAddresses,
  sig.userAddress,
  sig.startTimestamp,
  sig.durationDays
);

const clear = res[handle];
```

签名要点：

- 使用 `instance.createEIP712(publicKey, contracts, start, durationDays)` 生成 TypedData；
- 由用户 `signTypedData(domain, types, message)` 签名；
- 缓存签名与键值（与合约集合、公钥、用户地址绑定）以避免重复签名。

### B. 公共解密（无需用户签名）

适用于公开可读数据：

```typescript
const clear = await instance.decryptPublic(contractAddress, handle);
``;

---

## 前端架构与状态管理（推荐）

- **实例生命周期**：
  - 首次进入页面：动态加载 UMD → `initSDK()` → 从 IndexedDB 读公钥/参数 → `createInstance(config)`。
  - 切链/换钱包：刷新或重建实例；确保 `network`/`chainId` 一致。
  - 本地 31337：自动探测 Hardhat FHEVM 节点并走 mock 实例。

- **存储**：
  - IndexedDB：缓存 `publicKey/publicParams`（键使用 ACL 地址）。
  - 内存或 IndexedDB：缓存解密签名（按 `user + contracts (+ publicKey)` 组合键）。

- **并发与幂等**：
  - 使用 `AbortController`/`ref` 作为操作锁，避免重复加密/解密/读取。
  - 对“已解密过的句柄”直接复用缓存结果。

---

## 错误处理与调试

- 预检 RPC：调用 `web3_clientVersion` 校验节点可达；失败抛出明确错误码（如 `WEB3_CLIENTVERSION_ERROR`）。
- 预检 FHEVM 本地节点：`fhevm_relayer_metadata`；失败提示非 FHEVM Hardhat 或不可达。
- SDK 状态：对 `sdk-loading / sdk-initializing / creating` 过程添加 UI 反馈与重试策略。
- 分类提示：钱包拒签、余额不足、网络错误、SDK 未初始化、实例创建失败等。

---

## 性能优化与体验

- WASM 冷启动：在页面加载早期触发 `initSDK()` 以减少首次加密卡顿。
- 加密前延迟：在主线程空闲时执行 `encrypt()`（微延迟 50–100ms）。
- 批量操作：同一缓冲区批量 `addXX` 后一次 `encrypt()`，减少开销。
- 类型选择：优先小位宽与标量运算，显著降低 gas 与证明开销。
- 结果缓存：句柄→明文缓存、签名缓存、公钥/参数缓存。

---

## 安全实践

- 最小权限：优先 `allowTransient` 代替长期授权；仅对必要状态授权。
- 谨慎明文检查：避免在链上做会泄露信息的分支或 require；确需时权衡风险。
- 公共解密：仅应用于“公开数据”；私密数据使用用户解密并控制签名有效期。
- 密钥管理：前端仅保存 SDK 公钥/参数与临时签名，不保存敏感私钥（签名由钱包完成）。

---

## 常见问题排查（FAQ）

- SDK 加载失败：检查 CDN 链接、CSP、网络；确认 `window.relayerSDK` 对象存在。
- 初始化失败：重复调用 `initSDK()` 或参数不合法；确认只初始化一次且在 `createInstance` 前。
- 创建实例失败：`network` 与当前链不匹配；缺失 `publicKey/publicParams` 且网络受限；IndexedDB 不可用。
- 本地节点未命中 mock：确认 Hardhat 节点返回 `web3_clientVersion` 含 `hardhat` 且支持 `fhevm_relayer_metadata`。
- 解密失败：未授权 ACL、签名过期/不匹配、句柄与合约地址不一致、网关/Relayer 不可用。

---

## 最小可行样例（端到端）

### Solidity（计数器片段）

```solidity
function increment(externalEuint32 input, bytes calldata proof) external {
    euint32 v = FHE.fromExternal(input, proof);
    _count = FHE.add(_count, v);
    FHE.allowThis(_count);
    FHE.allow(_count, msg.sender);
}

function getCount() external view returns (euint32) {
    return _count;
}
```

### TypeScript（前端交互）

```typescript
// 1) SDK 初始化 + 实例
await window.relayerSDK.initSDK();
const instance = await window.relayerSDK.createInstance({
  ...window.relayerSDK.SepoliaConfig,
  network: window.ethereum,
});

// 2) 加密并调用合约
const input = instance.createEncryptedInput(contractAddress, await signer.getAddress());
input.add32(BigInt(1));
const enc = await input.encrypt();
await contract.increment(enc.handles[0], enc.inputProof);

// 3) 读取句柄
const handle = await contract.getCount();

// 4) 用户解密
const sig = await FhevmDecryptionSignature.loadOrSign(instance, [contractAddress], signer, storage);
const res = await instance.userDecrypt(
  [{ handle, contractAddress }],
  sig.privateKey,
  sig.publicKey,
  sig.signature,
  sig.contractAddresses,
  sig.userAddress,
  sig.startTimestamp,
  sig.durationDays
);
console.log("clear count =", res[handle]);
```

---

## 快速清单（Checklist）

- 合约：`externalEuintX + proof` → `FHE.fromExternal` → 运算 → `allow/allowThis/allowTransient`。
- 前端：加载 UMD → `initSDK()` → 读取/缓存公钥参数 → `createInstance`。
- 写入：`createEncryptedInput` → `addXX` → `encrypt()` → 合约调用。
- 读取：调用只读函数拿句柄 → 用户解密或公共解密 → 缓存明文与签名。
- 健壮：并发/幂等、错误码提示、重试与状态 UI。
- 性能：小位宽、标量运算、批量处理、预热 WASM、缓存。


