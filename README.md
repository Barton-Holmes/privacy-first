# 隐私优先考试平台 (Privacy-First Exam Platform)

基于FHEVM（全同态加密虚拟机）的匿名加密在线考试平台，确保考试过程中的隐私保护和数据安全。

## 🌟 特性

- **完全隐私保护**: 使用FHEVM技术，考试答案在区块链上保持加密状态
- **匿名评分**: 教师可以在不知道学生身份的情况下进行评分
- **去中心化**: 基于以太坊区块链，无需中心化服务器
- **自动化流程**: 智能合约自动处理考试创建、提交和评分
- **现代界面**: 基于Next.js和React的响应式用户界面

## 🏗️ 技术栈

### 智能合约
- **Solidity**: 智能合约开发语言
- **FHEVM**: 全同态加密虚拟机
- **Hardhat**: 开发框架和测试环境
- **TypeChain**: 自动生成TypeScript类型定义

### 前端
- **Next.js 15**: React全栈框架
- **TypeScript**: 类型安全的JavaScript
- **Tailwind CSS**: 实用优先的CSS框架
- **Ethers.js**: 以太坊交互库
- **MetaMask**: 钱包连接

## 🚀 快速开始

### 环境要求
- Node.js >= 20
- npm >= 7.0.0
- MetaMask浏览器扩展

### 安装依赖
```bash
npm install
npm run install:all
```

### 开发环境运行
```bash
# 启动Hardhat本地节点
npm run dev:contracts

# 在新终端中启动前端
npm run dev:frontend
```

### 构建项目
```bash
# 构建所有组件
npm run build

# 构建静态版本（用于GitHub Pages）
npm run build:static
```

## 📦 项目结构

```
├── action/                          # 主要应用代码
│   ├── fhevm-hardhat-template/     # 智能合约
│   │   ├── contracts/              # Solidity合约
│   │   ├── deploy/                 # 部署脚本
│   │   ├── scripts/                # 工具脚本
│   │   └── tasks/                  # Hardhat任务
│   └── frontend/                   # 前端应用
│       ├── app/                    # Next.js应用页面
│       ├── components/             # React组件
│       ├── hooks/                  # 自定义React Hooks
│       ├── fhevm/                  # FHEVM集成
│       └── abi/                    # 合约ABI和地址
├── .github/workflows/              # GitHub Actions
├── 考试模板/                       # 开发参考模板
└── 视频/                          # 演示视频
```

## 🔧 核心功能

### 教师功能
- 创建加密考试
- 设置考试时间和时长
- 添加多种题型（选择题、填空题、简答题）
- 匿名评分学生答案
- 发布成绩

### 学生功能
- 浏览可用考试
- 提交加密答案
- 查看个人成绩（解密后）
- 实时考试状态跟踪

### 智能合约功能
- 考试生命周期管理
- 加密答案存储
- 自动化评分流程
- 访问控制和权限管理

## 🌐 GitHub Pages 部署

项目已配置自动部署到GitHub Pages：

1. **自动basePath推导**: 根据仓库名自动设置正确的路径
2. **GitHub Actions工作流**: 自动构建和部署
3. **静态导出**: 优化的静态文件生成

查看 [DEPLOYMENT.md](./DEPLOYMENT.md) 了解详细部署说明。

## 🔒 隐私和安全

- **端到端加密**: 学生答案从提交到评分全程保持加密
- **零知识证明**: 验证答案正确性而不暴露内容
- **去中心化存储**: 数据存储在区块链上，无单点故障
- **匿名性保护**: 评分过程中保护学生身份隐私

## 📚 开发文档

- [FHEVM开发参考](./考试模板/FHEVM_Development_Reference.md)
- [前端集成指南](./考试模板/FHEVM_Frontend_Integration_Guide.md)
- [RelayerSDK DApp参考](./考试模板/FHEVM_RelayerSDK_DApp_Reference.md)

## 🤝 贡献

欢迎贡献代码！请确保：

1. 遵循现有的代码风格
2. 添加适当的测试
3. 更新相关文档
4. 提交前运行 `npm run build` 确保构建成功

## 📄 许可证

MIT License - 查看 [LICENSE](./LICENSE) 文件了解详情

## 🏆 致谢

- [ZAMA](https://www.zama.ai/) - 提供FHEVM技术
- [Hardhat](https://hardhat.org/) - 以太坊开发环境
- [Next.js](https://nextjs.org/) - React框架
- [Ethers.js](https://docs.ethers.org/) - 以太坊库

---

**注意**: 这是一个演示项目，用于展示FHEVM在教育场景中的应用。在生产环境中使用前，请进行充分的安全审计和测试。
