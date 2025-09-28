# GitHub Pages 部署指南

本项目支持自动部署到 GitHub Pages。

## 自动部署设置

### 1. 启用 GitHub Pages

1. 进入你的 GitHub 仓库
2. 点击 **Settings** 标签页
3. 在左侧菜单中找到 **Pages**
4. 在 **Source** 部分选择 **GitHub Actions**

### 2. 自动 basePath 推导

工作流会自动根据仓库名设置正确的 basePath：

- 如果仓库名为 `username.github.io`：basePath 为空 (`""`)
- 如果仓库名为其他名称（如 `my-project`）：basePath 为 `/my-project`

这意味着：
- 用户站点（如 `john.github.io`）会部署到 `https://john.github.io/`
- 项目站点（如 `john/my-exam-platform`）会部署到 `https://john.github.io/my-exam-platform/`

### 3. 触发部署

部署会在以下情况自动触发：
- 推送代码到 `main` 或 `master` 分支
- 手动在 Actions 页面触发

## 本地测试静态构建

你可以在本地测试静态构建：

```bash
# 构建静态版本
npm run build:static

# 查看输出文件
ls -la action/frontend/out/
```

## 构建过程

1. **安装依赖**：安装根目录、前端和合约的所有依赖
2. **构建合约**：编译智能合约并生成类型文件
3. **构建前端**：以静态导出模式构建 Next.js 应用
4. **部署**：将生成的静态文件上传到 GitHub Pages

## 注意事项

### 智能合约功能限制

由于 GitHub Pages 是静态托管，以下功能在部署版本中可能受限：

- **MetaMask 连接**：需要用户手动连接钱包
- **合约交互**：需要连接到实际的区块链网络（如 Sepolia 测试网）
- **本地开发网络**：无法连接到 `localhost:8545`

### 推荐配置

为了在 GitHub Pages 上获得最佳体验：

1. **配置 Sepolia 测试网**：确保合约已部署到 Sepolia
2. **更新合约地址**：在 `action/frontend/abi/AnonExamAddresses.ts` 中配置正确的合约地址
3. **测试网络连接**：确保 MetaMask 可以连接到 Sepolia 网络

## 故障排除

### 构建失败

如果构建失败，检查：
1. 所有依赖是否正确安装
2. TypeScript 类型错误是否已修复
3. 静态导出是否与你的代码兼容

### 页面无法加载

如果部署后页面无法正常加载：
1. 检查浏览器控制台是否有 404 错误
2. 确认 basePath 设置是否正确
3. 验证所有资源路径是否使用相对路径

### 合约交互问题

如果合约交互不工作：
1. 确认 MetaMask 已连接到正确网络
2. 检查合约地址配置是否正确
3. 验证合约是否已正确部署并验证
