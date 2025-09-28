import type { NextConfig } from 'next'

// 判断是否为GitHub Pages部署
const isGitHubPages = process.env.GITHUB_ACTIONS === 'true'

// 自动推导basePath：如果仓库名为 username.github.io 则为空，否则为 /仓库名
const getBasePath = () => {
  if (!isGitHubPages) return ''
  
  const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1]
  if (!repoName) return ''
  
  const isUserSite = repoName.endsWith('.github.io')
  
  return isUserSite ? '' : `/${repoName}`
}

const nextConfig: NextConfig = {
  // GitHub Pages 静态部署配置
  output: isGitHubPages ? 'export' : undefined,
  basePath: getBasePath(),
  assetPrefix: getBasePath(),
  trailingSlash: true,
  
  experimental: {
    esmExternals: true,
  },
  // 构建时忽略 ESLint 报错，避免编译被阻塞
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      }
    }
    
    // 处理WASM文件
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    }
    
    return config
  },
  // 优化图片处理
  images: {
    unoptimized: isGitHubPages, // GitHub Pages 不支持图片优化
    domains: ['localhost'],
  },
  // 启用React严格模式
  reactStrictMode: true,
}

export default nextConfig
