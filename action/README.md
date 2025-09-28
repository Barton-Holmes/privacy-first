# AnonExam - 匿名加密在线考试平台

基于FHEVM（全同态加密虚拟机）的去中心化隐私保护考试平台，实现真正的匿名、加密、公平的在线考试体验。

## ✨ 核心特性

- 🔐 **隐私保护**: 使用FHEVM同态加密，答案在链上保持加密状态
- 🌐 **去中心化**: 无需传统后端，所有数据存储在区块链上
- 👤 **匿名考试**: 支持匿名身份，保护考生隐私
- ⚡ **实时加密**: 前端实时加密答案，零知识证明验证
- 🎯 **自动评分**: 智能合约自动评分选择题
- 📊 **加密统计**: 支持加密状态下的成绩统计分析

## 🏗️ 项目架构

```
action/
├── fhevm-hardhat-template/     # 智能合约 (Solidity + FHEVM)
│   ├── contracts/              # 智能合约源码
│   ├── deploy/                 # 部署脚本
│   ├── tasks/                  # Hardhat任务
│   └── fhevmTemp/             # FHEVM配置文件
└── frontend/                   # 前端应用 (Next.js + React)
    ├── app/                    # Next.js App Router
    ├── components/             # UI组件
    ├── hooks/                  # React Hooks
    ├── fhevm/                  # FHEVM集成模块
    └── abi/                    # 合约ABI和地址
```

## 🚀 快速开始

### 1. 环境准备

确保已安装以下工具：
- Node.js 18+
- npm 或 yarn
- MetaMask 浏览器扩展

### 2. 启动后端（智能合约）

```bash
# 进入合约目录
cd fhevm-hardhat-template

# 安装依赖
npm install

# 启动本地FHEVM节点
npm run node

# 在新终端中部署合约
npm run deploy:localhost
```

### 3. 启动前端

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 生成ABI文件
npm run genabi

# 启动开发服务器
npm run dev
```

### 4. 配置MetaMask

1. 添加本地网络：
   - 网络名称: Localhost
   - RPC URL: http://localhost:8545
   - 链ID: 31337
   - 货币符号: ETH

2. 导入测试账户（Hardhat默认账户）

## 📖 使用指南

### 学生端操作流程

1. **连接钱包**: 使用MetaMask连接到本地网络
2. **查看考试**: 浏览可参加的考试列表
3. **进入考试**: 点击"进入考试"开始答题
4. **答题**: 支持选择题、填空题、简答题
5. **提交答案**: 答案自动加密后提交到区块链
6. **查看成绩**: 考试结束后解密查看个人成绩

### 教师端操作流程

1. **创建考试**: 设置考试基本信息（标题、时间、时长等）
2. **添加题目**: 支持多种题型，答案加密存储
3. **发布考试**: 将考试发布给学生
4. **授权访问**: 为特定学生授予考试权限
5. **自动评分**: 系统自动评分选择题
6. **手动评分**: 教师评分主观题
7. **发布成绩**: 将成绩发布给学生

## 🔧 技术实现

### 智能合约核心功能

```solidity
// 核心合约：AnonExam.sol
contract AnonExam is SepoliaConfig {
    // 创建考试
    function createExam(...) external onlyTeacher returns (uint256);
    
    // 提交加密答案
    function submitAnswers(
        uint256 examId,
        externalEuint32[] encryptedAnswers,
        bytes[] answersProof
    ) external;
    
    // 自动评分
    function autoGradeMultipleChoice(uint256 examId, address student) external;
    
    // 解密成绩
    function getStudentGrade(uint256 examId, address student) 
        external view returns (euint64 encryptedScore, ...);
}
```

### 前端FHEVM集成

```typescript
// FHEVM实例管理
const { instance, status, error } = useFhevm({
  provider: ethersProvider,
  chainId,
  initialMockChains: { 31337: "http://localhost:8545" },
});

// 加密答案提交
const submitAnswers = async (answers: any[]) => {
  const input = instance.createEncryptedInput(contractAddress, userAddress);
  answers.forEach(answer => input.add32(answer));
  const encrypted = await input.encrypt();
  await contract.submitAnswers(examId, encrypted.handles, encrypted.inputProof);
};

// 解密成绩
const decryptGrade = async (examId: bigint) => {
  const sig = await FhevmDecryptionSignature.loadOrSign(instance, [contractAddress], signer, storage);
  const result = await instance.userDecrypt([{handle, contractAddress}], ...);
  return result[handle];
};
```

## 🔒 隐私保护机制

### 1. 同态加密
- 答案在客户端使用FHEVM加密
- 链上计算保持加密状态
- 只有授权用户可以解密

### 2. 访问控制
```solidity
// ACL权限管理
FHE.allow(encryptedData, authorizedUser);     // 授权特定用户
FHE.allowThis(encryptedData);                 // 授权合约访问
FHE.allowTransient(encryptedData, user);      // 临时授权
```

### 3. 零知识证明
- 每次加密操作都生成零知识证明
- 验证数据完整性而不泄露内容
- 防止恶意数据注入

## 🧪 测试与调试

### 运行测试
```bash
# 合约测试
cd fhevm-hardhat-template
npm run test

# 前端测试
cd frontend
npm run test
```

### 调试技巧
1. 查看浏览器控制台的FHEVM日志
2. 使用Hardhat网络的详细错误信息
3. 监控MetaMask的交易状态

## 🔧 开发工具

### 合约开发
- **Hardhat**: 开发框架
- **@fhevm/hardhat-plugin**: FHEVM插件
- **@fhevm/solidity**: FHEVM Solidity库

### 前端开发
- **Next.js 15**: React框架
- **@fhevm/mock-utils**: 本地开发Mock工具
- **@zama-fhe/relayer-sdk**: FHEVM客户端SDK
- **ethers.js**: 区块链交互库

## 📝 API参考

### 智能合约接口

#### 考试管理
- `createExam()`: 创建新考试
- `publishExam()`: 发布考试
- `grantExamAccess()`: 授权学生访问

#### 答题与评分
- `submitAnswers()`: 提交加密答案
- `autoGradeMultipleChoice()`: 自动评分
- `manualGrade()`: 手动评分

#### 数据查询
- `getExamInfo()`: 获取考试信息
- `getQuestionInfo()`: 获取题目信息
- `getStudentGrade()`: 获取学生成绩

### 前端Hooks

#### FHEVM集成
- `useFhevm()`: FHEVM实例管理
- `useAnonExam()`: 考试业务逻辑

#### 钱包集成
- `useMetaMaskProvider()`: MetaMask连接
- `useMetaMaskEthersSigner()`: Ethers签名者

## 🚨 注意事项

### 安全提醒
1. 本项目为演示版本，生产环境需要额外的安全审计
2. 私钥和助记词请妥善保管
3. 测试网络的代币没有实际价值

### 性能考虑
1. FHEVM加密操作较为耗时，需要适当的UI反馈
2. 大量数据加密可能导致浏览器暂时卡顿
3. 建议限制单次考试的题目数量

### 兼容性
- 支持现代浏览器（Chrome、Firefox、Safari、Edge）
- 需要MetaMask或其他Web3钱包
- 推荐使用Chrome浏览器以获得最佳体验

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [Zama](https://www.zama.ai/) - FHEVM技术支持
- [Hardhat](https://hardhat.org/) - 开发框架
- [Next.js](https://nextjs.org/) - React框架
- [Tailwind CSS](https://tailwindcss.com/) - UI样式

## 📞 支持

如有问题或建议，请：
1. 提交 [Issue](../../issues)
2. 参与 [Discussions](../../discussions)
3. 查看 [Wiki](../../wiki) 文档

---

**AnonExam Team** - 让考试更公平、更私密、更去中心化 🎓

