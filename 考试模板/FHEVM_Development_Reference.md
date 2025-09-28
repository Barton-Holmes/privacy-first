# FHEVM 智能合约开发参考文档

## 概述

本参考文档总结了Zama Protocol FHEVM（Fully Homomorphic Encryption Virtual Machine）智能合约开发的要点，涵盖从配置到解密的全流程开发指南。

## 1. Core Configuration Setup（核心配置设置）

### 环境配置和初始化

智能合约使用FHEVM需要正确的配置和初始化：

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32, externalEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract MyContract is SepoliaConfig {
    // 合约代码
}
```

**关键要点：**
- 导入FHE库和环境特定配置合约
- 从环境配置合约继承（如SepoliaConfig）
- 配置Relayer访问用于加密操作
- 初始化前验证加密变量

### Relayer SDK配置

```javascript
import { createInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk';

// 推荐方式：使用预配置
const instance = await createInstance(SepoliaConfig);

// 或手动配置
const instance = await createInstance({
  aclContractAddress: '0x687820221192C5B662b25367F70076A37bc79b6c',
  kmsContractAddress: '0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC',
  inputVerifierContractAddress: '0xbc91f3daD1A5F19F8390c400196e58073B6a0BC4',
  chainId: 11155111,
  gatewayChainId: 55815,
  network: 'https://eth-sepolia.public.blastapi.io',
  relayerUrl: 'https://relayer.testnet.zama.cloud',
});
```

## 2. Supported Types（支持的类型）

### 加密数据类型

FHEVM提供以下加密数据类型：

| 类型 | 描述 | 对应的external类型 |
|------|------|-------------------|
| `ebool` | 加密布尔值 | `externalEbool` |
| `euint8` | 8位加密无符号整数 | `externalEuint8` |
| `euint16` | 16位加密无符号整数 | `externalEuint16` |
| `euint32` | 32位加密无符号整数 | `externalEuint32` |
| `euint64` | 64位加密无符号整数 | `externalEuint64` |
| `euint128` | 128位加密无符号整数 | `externalEuint128` |
| `euint256` | 256位加密无符号整数 | `externalEuint256` |
| `eaddress` | 加密地址 | `externalEaddress` |

### 类型转换函数

```solidity
// 在加密类型间转换
ebool encryptedBool = FHE.asEbool(encryptedUint);

// 明文转换为加密类型
euint32 encryptedValue = FHE.asEuint32(42);
euint64 encryptedValue64 = FHE.asEuint64(1000);
euint8 smallValue = FHE.asEuint8(25);

// 地址转换
eaddress encryptedAddr = FHE.asEaddress(msg.sender);
```

**重要特性：**
- 加密整数运算为unchecked，会在溢出时wrap around
- 数据以ciphertext handles表示
- 确保机密性，避免通过错误检测泄露信息

**最佳实践：**
- 选择最小合适的数据类型以优化gas成本
- 使用euint8用于小数字(0-255)而不是euint256

## 3. Operations on Encrypted Types（加密类型操作）

### Casting and Trivial Encryption（类型转换和简单加密）

#### 类型转换函数

```solidity
contract CastingExample is SepoliaConfig {
    // 在加密类型之间转换
    function castToBool(euint32 value) public pure returns (ebool) {
        return FHE.asEbool(value); // 将加密整数转换为加密布尔值
    }

    // 明文到加密类型的转换（trivial encryption）
    function encryptPlaintext(uint32 plaintext) public pure returns (euint32) {
        return FHE.asEuint32(plaintext); // 创建加密版本
    }

    // 不同大小的整数转换
    function castTypes(euint64 bigValue) public pure returns (euint32, euint8) {
        euint32 mediumValue = FHE.asEuint32(bigValue);
        euint8 smallValue = FHE.asEuint8(bigValue);
        return (mediumValue, smallValue);
    }

    // 地址加密
    function encryptAddress(address addr) public pure returns (eaddress) {
        return FHE.asEaddress(addr);
    }
}
```

**注意事项：**
- 类型转换可能会丢失数据（大类型转小类型）
- 使用最小合适类型以节省gas
- trivial encryption用于将明文转换为加密形式

#### 标量操作优化

```solidity
contract OptimizedOperations is SepoliaConfig {
    euint32 public value;

    // ✅ 推荐：使用标量操作节省gas
    function addScalar() public {
        value = FHE.add(value, 42); // 直接使用明文42
    }

    // ❌ 不推荐：创建不必要的加密值
    function addEncrypted() public {
        euint32 encrypted42 = FHE.asEuint32(42);
        value = FHE.add(value, encrypted42); // 浪费gas
    }
}
```

### 算术运算

```solidity
euint32 a = FHE.asEuint32(10);
euint32 b = FHE.asEuint32(5);

euint32 sum = FHE.add(a, b);        // +
euint32 diff = FHE.sub(a, b);       // -
euint32 product = FHE.mul(a, b);    // *
euint32 min = FHE.min(a, b);        // 最小值
euint32 max = FHE.max(a, b);        // 最大值
euint32 neg = FHE.neg(a);           // 取负

// 除法和取余（除数必须是明文）
euint32 quotient = FHE.div(a, 2);   // a / 2
euint32 remainder = FHE.rem(a, 2);  // a % 2
```

### 位运算

```solidity
euint32 result;

// 逻辑运算
result = FHE.and(a, b);    // &
result = FHE.or(a, b);     // |
result = FHE.xor(a, b);    // ^

// 位运算
result = FHE.not(a);       // ~
result = FHE.shl(a, 2);    // 左移
result = FHE.shr(a, 2);    // 右移
result = FHE.rotl(a, 2);   // 左旋转
result = FHE.rotr(a, 2);   // 右旋转
```

### 比较运算

```solidity
ebool isEqual = FHE.eq(a, b);      // ==
ebool notEqual = FHE.ne(a, b);     // !=
ebool lessThan = FHE.lt(a, b);     // <
ebool lessEqual = FHE.le(a, b);    // <=
ebool greaterThan = FHE.gt(a, b);  // >
ebool greaterEqual = FHE.ge(a, b); // >=
```

### Generate Random Encrypted Numbers（生成随机加密数）

#### 基本随机数生成

```solidity
contract RandomExample is SepoliaConfig {
    // 生成不同位数的随机加密数
    function generateRandom8() public view returns (euint8) {
        return FHE.randEuint8();   // 0-255之间的随机数
    }

    function generateRandom32() public view returns (euint32) {
        return FHE.randEuint32();  // 32位随机数
    }

    function generateRandom64() public view returns (euint64) {
        return FHE.randEuint64();  // 64位随机数
    }

    function generateRandom128() public view returns (euint128) {
        return FHE.randEuint128(); // 128位随机数
    }

    function generateRandom256() public view returns (euint256) {
        return FHE.randEuint256(); // 256位随机数
    }
}
```

#### 高级随机数应用

##### 1. 随机选择（Random Choice）
```solidity
contract RandomChoice is SepoliaConfig {
    // 在两个选项中随机选择一个
    function randomChoice(euint32 option1, euint32 option2) public view returns (euint32) {
        euint32 random = FHE.randEuint32();
        euint32 threshold = FHE.asEuint32(2**31); // 使用2^31作为阈值

        return FHE.select(FHE.lt(random, threshold), option1, option2);
    }

    // 从数组中随机选择一个元素
    function randomFromArray(euint32[] memory options) public view returns (euint32) {
        require(options.length > 0, "Array cannot be empty");

        euint32 randomIndex = FHE.rem(
            FHE.randEuint32(),
            FHE.asEuint32(options.length)
        );

        // 注意：Solidity中无法直接用加密索引访问数组
        // 这里需要特殊的处理方式
        return FHE.asEuint32(0); // 简化示例
    }
}
```

##### 2. 随机范围生成（Random Range）
```solidity
contract RandomRange is SepoliaConfig {
    // 生成指定范围内的随机数 [min, max)
    function randomInRange(euint32 min, euint32 max) public view returns (euint32) {
        require(FHE.lt(min, max), "min must be less than max");

        euint32 random = FHE.randEuint32();
        euint32 range = FHE.sub(max, min);
        euint32 scaled = FHE.rem(random, range);
        return FHE.add(scaled, min);
    }

    // 生成随机百分比 (0-100)
    function randomPercentage() public view returns (euint8) {
        return FHE.asEuint8(FHE.rem(FHE.randEuint32(), FHE.asEuint32(101)));
    }

    // 生成随机角度 (0-359度)
    function randomAngle() public view returns (euint16) {
        return FHE.asEuint16(FHE.rem(FHE.randEuint32(), FHE.asEuint32(360)));
    }
}
```

##### 3. 概率权重随机（Weighted Random）
```solidity
contract WeightedRandom is SepoliaConfig {
    // 基于权重的随机选择
    function weightedRandom(uint32[] memory weights) public view returns (euint32) {
        require(weights.length > 0, "Weights array cannot be empty");

        // 计算总权重
        uint32 totalWeight = 0;
        for (uint i = 0; i < weights.length; i++) {
            totalWeight += weights[i];
        }

        // 生成随机数并映射到权重范围
        euint32 random = FHE.randEuint32();
        euint32 scaledRandom = FHE.rem(random, FHE.asEuint32(totalWeight));

        // 找到对应的选项（这里简化了实现）
        return FHE.asEuint32(0); // 需要更复杂的逻辑来实现权重选择
    }

    // 简单的二项式随机（50%概率）
    function coinFlip() public view returns (ebool) {
        euint32 random = FHE.randEuint32();
        euint32 threshold = FHE.asEuint32(2**31);
        return FHE.lt(random, threshold);
    }
}
```

##### 4. 随机排序和洗牌（Random Shuffle）
```solidity
contract RandomShuffle is SepoliaConfig {
    // Fisher-Yates洗牌算法的FHE版本（简化实现）
    function shuffleArray(euint32[] memory array) public view returns (euint32[] memory) {
        euint32[] memory shuffled = new euint32[](array.length);

        for (uint i = 0; i < array.length; i++) {
            // 生成随机索引
            euint32 randomIndex = FHE.rem(
                FHE.randEuint32(),
                FHE.asEuint32(array.length - i)
            );

            // 这里需要复杂的逻辑来实现真正的洗牌
            // 由于FHE的限制，真正的洗牌比较复杂
        }

        return shuffled;
    }
}
```

##### 5. 密码学应用
```solidity
contract CryptoRandom is SepoliaConfig {
    // 生成随机盐值
    function generateSalt() public view returns (euint256) {
        return FHE.randEuint256();
    }

    // 生成随机挑战值
    function generateChallenge() public view returns (euint128) {
        return FHE.randEuint128();
    }

    // 生成会话密钥
    function generateSessionKey() public view returns (euint256) {
        // 组合多个随机值生成更强的密钥
        euint256 part1 = FHE.randEuint256();
        euint256 part2 = FHE.randEuint256();
        return FHE.xor(part1, part2);
    }

    // 生成随机种子
    function generateSeed() public view returns (euint64) {
        return FHE.randEuint64();
    }
}
```

#### 游戏和娱乐应用

##### 1. 骰子游戏
```solidity
contract DiceGame is SepoliaConfig {
    // 掷骰子 (1-6)
    function rollDice() public view returns (euint8) {
        euint32 random = FHE.randEuint32();
        return FHE.asEuint8(FHE.add(FHE.rem(random, FHE.asEuint32(6)), FHE.asEuint32(1)));
    }

    // 掷多个骰子
    function rollMultipleDice(uint8 count) public view returns (euint32) {
        euint32 total = FHE.asEuint32(0);

        for (uint8 i = 0; i < count; i++) {
            euint32 dice = FHE.rem(FHE.randEuint32(), FHE.asEuint32(6));
            total = FHE.add(total, FHE.add(dice, FHE.asEuint32(1)));
        }

        return total;
    }
}
```

##### 2. 卡牌游戏
```solidity
contract CardGame is SepoliaConfig {
    // 抽一张牌 (0-51代表52张牌)
    function drawCard() public view returns (euint8) {
        return FHE.asEuint8(FHE.rem(FHE.randEuint32(), FHE.asEuint32(52)));
    }

    // 洗牌 (简化的实现)
    function shuffleDeck() public view returns (euint8) {
        // 返回一个随机位置来代表洗牌后的第一张牌
        return FHE.asEuint8(FHE.rem(FHE.randEuint32(), FHE.asEuint32(52)));
    }
}
```

##### 3. 彩票系统
```solidity
contract Lottery is SepoliaConfig {
    // 生成彩票号码 (1-99)
    function generateLotteryNumber() public view returns (euint8) {
        return FHE.asEuint8(FHE.add(FHE.rem(FHE.randEuint32(), FHE.asEuint32(99)), FHE.asEuint32(1)));
    }

    // 生成多个彩票号码
    function generateLotteryNumbers(uint8 count) public view returns (euint8[] memory) {
        euint8[] memory numbers = new euint8[](count);

        for (uint8 i = 0; i < count; i++) {
            numbers[i] = FHE.asEuint8(FHE.add(FHE.rem(FHE.randEuint32(), FHE.asEuint32(99)), FHE.asEuint32(1)));
        }

        return numbers;
    }
}
```

#### 随机数生成的最佳实践

##### 1. 安全性考虑
```solidity
contract SecureRandom is SepoliaConfig {
    // 避免预测性：使用高熵随机数
    function secureRandom() public view returns (euint256) {
        // 使用最大位数的随机数获得最高熵
        return FHE.randEuint256();
    }

    // 组合多个随机源
    function combinedRandom() public view returns (euint256) {
        euint256 r1 = FHE.randEuint256();
        euint256 r2 = FHE.randEuint256();
        euint256 r3 = FHE.randEuint256();

        // 通过XOR组合多个随机值
        return FHE.xor(FHE.xor(r1, r2), r3);
    }
}
```

##### 2. 性能优化
```solidity
contract OptimizedRandom is SepoliaConfig {
    // 缓存随机数以减少gas消耗
    euint256 private cachedRandom;
    uint256 private lastUpdate;

    function getCachedRandom() public returns (euint256) {
        // 只有在需要时才生成新的随机数
        if (block.timestamp - lastUpdate > 1 hours) {
            cachedRandom = FHE.randEuint256();
            lastUpdate = block.timestamp;
        }
        return cachedRandom;
    }

    // 批量生成随机数
    function generateBatch(uint8 count) public view returns (euint32[] memory) {
        euint32[] memory randoms = new euint32[](count);

        for (uint8 i = 0; i < count; i++) {
            randoms[i] = FHE.randEuint32();
        }

        return randoms;
    }
}
```

##### 3. 测试和验证
```solidity
contract RandomTest is SepoliaConfig {
    // 测试随机数分布
    function testDistribution() public view returns (euint32[10] memory) {
        euint32[10] memory counts;

        // 生成1000个随机数并统计分布
        for (uint i = 0; i < 1000; i++) {
            euint32 random = FHE.rem(FHE.randEuint32(), FHE.asEuint32(10));
            // 这里需要更复杂的逻辑来更新计数
        }

        return counts;
    }

    // 验证随机数唯一性
    function testUniqueness() public view returns (ebool) {
        euint32 r1 = FHE.randEuint32();
        euint32 r2 = FHE.randEuint32();

        // 检查两个连续的随机数是否不同
        return FHE.ne(r1, r2);
    }
}
```

**随机数特性：**
- ✅ 密码学安全的随机数生成
- ✅ 完全在链上生成，无需预言机
- ✅ 支持所有加密整数类型（8位到256位）
- ✅ 每次调用生成新的随机值
- ✅ 不可预测性和均匀分布

**重要安全注意事项：**
- ⚠️ 不要将链上随机数用于需要完美随机性的应用
- ⚠️ 考虑使用VRF（可验证随机函数）来增强安全性
- ⚠️ 在生产环境中测试随机数分布的均匀性
- ⚠️ 避免在需要确定性的场景中使用随机数

### 高级操作

```solidity
// 条件选择（基于加密条件的分支）
euint32 result = FHE.select(condition, valueIfTrue, valueIfFalse);
```

## 4. Encrypted Inputs（加密输入）

### 外部输入处理

```solidity
contract MyContract is SepoliaConfig {
    function processInput(
        externalEuint64 input,
        bytes calldata proof
    ) public returns (euint64) {
        // 从外部输入创建内部加密类型
        euint64 encryptedInput = FHE.fromExternal(input, proof);

        // 使用加密输入进行运算
        return FHE.add(encryptedInput, FHE.asEuint64(10));
    }
}
```

### 使用Relayer SDK创建加密输入

```javascript
// 创建加密输入缓冲区
const buffer = instance.createEncryptedInput(
    contractAddress,  // 允许交互的合约地址
    userAddress       // 允许导入密文的实体地址
);

// 添加不同类型的加密值
buffer.add64(BigInt(23393893233));
buffer.addBool(true);
buffer.add32(BigInt(12345));
buffer.addAddress('0xa5e1defb98EFe38EBb2D958CEe052410247F4c80');

// 加密并上传到Relayer
const ciphertexts = await buffer.encrypt();

// 使用密文句柄调用合约
await contract.processInput(
    ciphertexts.handles[0],  // 密文句柄
    ciphertexts.inputProof   // 输入证明
);
```

## 5. Access Control List（访问控制列表）

### ACL权限管理

```solidity
contract SecureContract is SepoliaConfig {
    euint32 private secretValue;

    // 授予永久权限
    function grantAccess(address user) public {
        FHE.allow(secretValue, user);
    }

    // 授予当前合约权限
    function grantContractAccess() public {
        FHE.allowThis(secretValue);
    }

    // 授予临时权限（仅当前交易）
    function grantTransientAccess(address user) public {
        FHE.allowTransient(secretValue, user);
    }

    // 验证发送者权限
    function checkAccess() public view returns (bool) {
        return FHE.isSenderAllowed(secretValue);
    }
}
```

### 权限类型

- **持久权限**：`FHE.allow()`, `FHE.allowThis()` - 永久权限
- **临时权限**：`FHE.allowTransient()` - 仅当前交易有效
- **权限验证**：`FHE.isSenderAllowed()` - 检查发送者权限

## 6. Logics（逻辑控制）

### 条件分支

```solidity
contract ConditionalContract is SepoliaConfig {
    function conditionalOperation(
        euint32 value,
        euint32 threshold
    ) public pure returns (euint32) {
        ebool condition = FHE.lt(value, threshold);

        // 使用FHE.select进行条件选择
        return FHE.select(
            condition,
            FHE.mul(value, FHE.asEuint32(2)),  // if true: value * 2
            FHE.add(value, FHE.asEuint32(10))  // if false: value + 10
        );
    }

    // 复杂条件逻辑
    function complexCondition(
        euint32 a,
        euint32 b,
        euint32 c
    ) public pure returns (euint32) {
        ebool cond1 = FHE.gt(a, b);
        ebool cond2 = FHE.lt(b, c);
        ebool finalCondition = FHE.and(cond1, cond2);

        return FHE.select(
            finalCondition,
            FHE.add(a, b),
            FHE.mul(c, FHE.asEuint32(2))
        );
    }
}
```

### 错误处理

```solidity
contract ErrorHandlingContract is SepoliaConfig {
    function safeOperation(
        euint32 value,
        euint32 divisor
    ) public pure returns (euint32) {
        // 检查除零（使用明文检查）
        require(divisor != 0, "Division by zero");

        // 检查权限
        require(FHE.isSenderAllowed(value), "Access denied");

        return FHE.div(value, divisor);
    }

    function validateInput(euint32 input) public pure {
        // 验证输入范围（转换为明文进行检查）
        // 注意：这会泄露一些信息，谨慎使用
        ebool isValid = FHE.lt(input, FHE.asEuint32(1000));
        require(isValid, "Input out of range");
    }
}
```

## 7. Decryption（解密）

### 链上解密

```solidity
contract DecryptionContract is SepoliaConfig {
    euint32 public encryptedBalance;

    function deposit(euint32 amount) public {
        encryptedBalance = FHE.add(encryptedBalance, amount);
    }

    // 公开解密（任何人都可以调用）
    function getBalance() public view returns (uint32) {
        return FHE.decrypt(encryptedBalance);
    }

    // 私有解密（需要权限）
    function getPrivateBalance() public view returns (uint32) {
        require(FHE.isSenderAllowed(encryptedBalance), "Access denied");
        return FHE.decrypt(encryptedBalance);
    }
}
```

### 离链解密（使用Relayer SDK）

```javascript
// 用户解密（需要ACL权限）
async function decryptUserData() {
    const decryptedValue = await instance.decrypt(
        contractAddress,
        encryptedValueHandle
    );
    console.log('Decrypted value:', decryptedValue);
}

// 公共解密（公开数据）
async function decryptPublicData() {
    const publicDecryptedValue = await instance.decryptPublic(
        contractAddress,
        publicEncryptedValueHandle
    );
    console.log('Public decrypted value:', publicDecryptedValue);
}
```

### 解密流程

1. **权限检查**：确保调用者有解密权限
2. **证明生成**：Relayer生成零知识证明
3. **网关验证**：在Gateway链上验证证明
4. **解密返回**：返回明文结果

## 开发最佳实践

### 安全考虑

1. **最小权限原则**：只授予必要的ACL权限
2. **临时权限优先**：优先使用`allowTransient`而不是永久权限
3. **明文检查限制**：避免过度使用明文条件检查以防信息泄露

### 性能优化

1. **标量操作**：尽可能使用标量操作节省gas
2. **合适类型大小**：选择最小合适的数据类型
3. **批量操作**：将多个操作组合以减少gas消耗
4. **选择性解密**：只在需要时进行解密

### 调试技巧

1. **测试网优先**：在Sepolia测试网进行充分测试
2. **权限验证**：确保ACL设置正确
3. **错误处理**：添加适当的错误检查和处理

## 8. Relayer SDK 使用指南

### SDK的加载与初始化

#### 安装SDK

```bash
# 使用npm
npm install @zama-fhe/relayer-sdk

# 使用Yarn
yarn add @zama-fhe/relayer-sdk

# 使用pnpm
pnpm add @zama-fhe/relayer-sdk
```

#### WASM加载和初始化

在使用SDK之前需要先加载TFHE的WASM文件：

```javascript
import { initSDK, createInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk/bundle';

const init = async () => {
   // 第一步：加载TFHE WASM
   await initSDK();

   // 第二步：创建FHEVM实例
   const instance = await createInstance(SepoliaConfig);

   return instance;
};
```

#### 不同环境下的初始化

**使用UMD CDN（推荐用于Web应用）：**
```html
<script
  src="https://cdn.zama.ai/relayer-sdk-js/0.1.0-9/relayer-sdk-js.umd.cjs"
  type="text/javascript"
></script>
```

**使用ESM CDN：**
```html
<script type="module">
  import {
    initSDK,
    createInstance,
    SepoliaConfig,
  } from 'https://cdn.zama.ai/relayer-sdk-js/0.1.0-9/relayer-sdk-js.js';

  await initSDK();
  const config = { ...SepoliaConfig, network: window.ethereum };
  const instance = await createInstance(config);
</script>
```

**Node.js环境：**
```javascript
// 对于CommonJS项目，使用web版本
import { createInstance } from '@zama-fhe/relayer-sdk/web';

// 或者设置package.json中的"type": "module"
```

### Input（加密输入处理）

#### 创建加密输入缓冲区

```javascript
// 创建加密输入缓冲区
const buffer = instance.createEncryptedInput(
    contractAddress,  // 允许交互的合约地址
    userAddress       // 允许导入密文的实体地址
);

// 添加不同类型的加密值
buffer.add64(BigInt(23393893233));              // 64位整数
buffer.addBool(true);                           // 布尔值
buffer.add32(BigInt(12345));                    // 32位整数
buffer.add8(BigInt(42));                        // 8位整数
buffer.add16(BigInt(1000));                     // 16位整数
buffer.add128(BigInt(233938932390));            // 128位整数
buffer.add256(BigInt('2339389323922393930'));   // 256位整数
buffer.addAddress('0xa5e1defb98EFe38EBb2D958CEe052410247F4c80'); // 地址

// 加密并上传到Relayer
const ciphertexts = await buffer.encrypt();

// 使用密文句柄调用合约
await contract.processInput(
    ciphertexts.handles[0],  // 密文句柄
    ciphertexts.inputProof   // 输入证明
);
```

#### 完整的输入处理流程

```javascript
const contractAddress = '0x8Fdb26641d14a80FCCBE87BF455338Dd9C539a50';
const userAddress = '0xa5e1defb98EFe38EBb2D958CEe052410247F4c80';

// 创建输入缓冲区
const buffer = instance.createEncryptedInput(contractAddress, userAddress);

// 添加要加密的值
buffer.add64(BigInt(71721075));  // 加密整数
buffer.addBool(true);            // 加密布尔值

// 加密并获取密文句柄
const ciphertexts = await buffer.encrypt();

// 调用智能合约
const tx = await contract.add(
    ciphertexts.handles[0],  // 第一个加密值
    ciphertexts.handles[1],  // 第二个加密值
    ciphertexts.inputProof   // 证明
);
```

### Decryption（解密）

#### 用户解密（User Decryption）

当用户拥有ACL权限时，可以解密属于自己的数据：

```javascript
// 用户解密私有数据
async function decryptUserData() {
    const contractAddress = '0x8Fdb26641d14a80FCCBE87BF455338Dd9C539a50';
    const encryptedValueHandle = '密文句柄';

    try {
        const decryptedValue = await instance.decrypt(
            contractAddress,
            encryptedValueHandle
        );
        console.log('解密后的值:', decryptedValue);
        return decryptedValue;
    } catch (error) {
        console.error('解密失败:', error);
        throw error;
    }
}
```

#### 公共解密（Public Decryption）

对于公开可访问的数据，可以通过HTTP或链上预言机进行解密：

```javascript
// 公共数据解密
async function decryptPublicData() {
    const contractAddress = '0x8Fdb26641d14a80FCCBE87BF455338Dd9C539a50';
    const publicEncryptedValueHandle = '公开密文句柄';

    try {
        const publicDecryptedValue = await instance.decryptPublic(
            contractAddress,
            publicEncryptedValueHandle
        );
        console.log('公共解密值:', publicDecryptedValue);
        return publicDecryptedValue;
    } catch (error) {
        console.error('公共解密失败:', error);
        throw error;
    }
}
```

#### 解密流程说明

1. **权限验证**：检查用户是否拥有解密权限（通过ACL）
2. **证明生成**：SDK生成零知识证明
3. **Relayer交互**：将请求发送到Relayer
4. **网关验证**：在Gateway链上验证证明
5. **返回明文**：返回解密后的明文值

### Web Applications Development Guide（Web应用开发指南）

#### 基本Web应用结构

```javascript
// web-app.js
import {
    initSDK,
    createInstance,
    SepoliaConfig,
} from '@zama-fhe/relayer-sdk/bundle';

class FHEVMApp {
    constructor() {
        this.instance = null;
        this.contract = null;
    }

    // 初始化应用
    async init() {
        try {
            // 加载WASM
            await initSDK();

            // 创建FHEVM实例
            const config = {
                ...SepoliaConfig,
                network: window.ethereum // 使用MetaMask或其他Web3钱包
            };
            this.instance = await createInstance(config);

            // 连接到智能合约
            this.contract = this.createContract();

            console.log('FHEVM应用初始化成功');
        } catch (error) {
            console.error('初始化失败:', error);
            throw error;
        }
    }

    // 创建合约实例
    createContract() {
        // 使用ethers.js创建合约实例
        const contractABI = [...]; // 合约ABI
        const contractAddress = '0x...'; // 合约地址
        return new ethers.Contract(contractAddress, contractABI, this.instance.signer);
    }

    // 加密输入并发送交易
    async encryptAndSend(value, isBoolean = false) {
        try {
            // 创建输入缓冲区
            const buffer = this.instance.createEncryptedInput(
                this.contract.address,
                await this.instance.signer.getAddress()
            );

            // 添加值
            if (isBoolean) {
                buffer.addBool(value);
            } else {
                buffer.add64(BigInt(value));
            }

            // 加密
            const ciphertexts = await buffer.encrypt();

            // 发送交易
            const tx = await this.contract.processInput(
                ciphertexts.handles[0],
                ciphertexts.inputProof
            );

            console.log('交易发送成功:', tx.hash);
            return tx;
        } catch (error) {
            console.error('发送失败:', error);
            throw error;
        }
    }

    // 解密结果
    async decryptResult(encryptedValueHandle) {
        try {
            const decryptedValue = await this.instance.decrypt(
                this.contract.address,
                encryptedValueHandle
            );
            return decryptedValue;
        } catch (error) {
            console.error('解密失败:', error);
            throw error;
        }
    }
}

// 使用示例
const app = new FHEVMApp();
await app.init();

// 加密并发送一个数值
const tx = await app.encryptAndSend(42);
console.log('交易哈希:', tx.hash);
```

#### React组件示例

```javascript
// FHEVMComponent.jsx
import React, { useState, useEffect } from 'react';
import { initSDK, createInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk/bundle';

const FHEVMComponent = () => {
    const [instance, setInstance] = useState(null);
    const [contract, setContract] = useState(null);
    const [loading, setLoading] = useState(true);
    const [inputValue, setInputValue] = useState('');
    const [encryptedResult, setEncryptedResult] = useState(null);
    const [decryptedResult, setDecryptedResult] = useState(null);

    useEffect(() => {
        initFHEVM();
    }, []);

    const initFHEVM = async () => {
        try {
            setLoading(true);

            // 初始化SDK
            await initSDK();

            // 创建实例
            const config = {
                ...SepoliaConfig,
                network: window.ethereum
            };
            const fhevmInstance = await createInstance(config);

            // 创建合约实例
            const contractInstance = new ethers.Contract(
                '0x...', // 合约地址
                [...],   // 合约ABI
                fhevmInstance.signer
            );

            setInstance(fhevmInstance);
            setContract(contractInstance);
            setLoading(false);
        } catch (error) {
            console.error('初始化失败:', error);
            setLoading(false);
        }
    };

    const handleEncrypt = async () => {
        if (!instance || !contract || !inputValue) return;

        try {
            // 创建加密输入
            const buffer = instance.createEncryptedInput(
                contract.address,
                await instance.signer.getAddress()
            );

            buffer.add64(BigInt(inputValue));
            const ciphertexts = await buffer.encrypt();

            // 发送到合约
            const tx = await contract.processInput(
                ciphertexts.handles[0],
                ciphertexts.inputProof
            );

            setEncryptedResult(ciphertexts.handles[0]);
            console.log('加密成功:', tx.hash);
        } catch (error) {
            console.error('加密失败:', error);
        }
    };

    const handleDecrypt = async () => {
        if (!instance || !contract || !encryptedResult) return;

        try {
            const decrypted = await instance.decrypt(
                contract.address,
                encryptedResult
            );
            setDecryptedResult(decrypted.toString());
        } catch (error) {
            console.error('解密失败:', error);
        }
    };

    if (loading) {
        return <div>正在初始化FHEVM...</div>;
    }

    return (
        <div className="fhevm-app">
            <h2>FHEVM 加密计算</h2>

            <div className="input-section">
                <input
                    type="number"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="输入要加密的数值"
                />
                <button onClick={handleEncrypt} disabled={!inputValue}>
                    加密并发送
                </button>
            </div>

            {encryptedResult && (
                <div className="result-section">
                    <p>加密结果: {encryptedResult}</p>
                    <button onClick={handleDecrypt}>
                        解密
                    </button>
                </div>
            )}

            {decryptedResult && (
                <div className="decrypted-section">
                    <p>解密结果: {decryptedResult}</p>
                </div>
            )}
        </div>
    );
};

export default FHEVMComponent;
```

#### 错误处理和最佳实践

```javascript
// 错误处理
const handleError = (error) => {
    if (error.message.includes('insufficient funds')) {
        alert('Gas费用不足');
    } else if (error.message.includes('denied transaction')) {
        alert('交易被拒绝');
    } else if (error.message.includes('network error')) {
        alert('网络错误，请检查连接');
    } else {
        alert('操作失败: ' + error.message);
    }
};

// 连接钱包
const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            console.log('钱包已连接');
        } catch (error) {
            handleError(error);
        }
    } else {
        alert('请安装MetaMask或其他Web3钱包');
    }
};

// 监听网络变化
const setupNetworkListener = () => {
    if (window.ethereum) {
        window.ethereum.on('chainChanged', (chainId) => {
            console.log('网络切换到:', chainId);
            // 重新初始化实例
            initFHEVM();
        });
    }
};
```

#### 性能优化建议

1. **预加载WASM**：在应用启动时预加载WASM文件
2. **缓存实例**：避免重复创建FHEVM实例
3. **批量处理**：将多个加密操作批量处理
4. **错误重试**：实现重试机制处理网络错误
5. **内存管理**：及时清理不再需要的密文句柄

---

**参考资料：**
- Protocol v0.8 文档
- Relayer SDK v0.2 文档
- Zama Protocol 官方文档

**更新日期：** 2025年9月11日
