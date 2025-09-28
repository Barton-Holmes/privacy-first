"use client";

import { createContext, useContext, useCallback, useSyncExternalStore, ReactNode } from "react";
import { useEip6963 } from "./useEip6963";
import type { EIP1193Provider } from "./Eip6963Types";

// MetaMask连接状态
interface MetaMaskState {
  provider: EIP1193Provider | undefined;
  accounts: string[];
  chainId: number | undefined;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | undefined;
}

// MetaMask状态管理类
class MetaMaskStore {
  private state: MetaMaskState = {
    provider: undefined,
    accounts: [],
    chainId: undefined,
    isConnected: false,
    isConnecting: false,
    error: undefined,
  };
  
  private listeners = new Set<() => void>();

  constructor() {
    if (typeof window !== "undefined") {
      this.init();
    }
  }

  private async init() {
    // 检查是否有已连接的账户
    const provider = this.getMetaMaskProvider();
    if (provider) {
      try {
        const accounts = await provider.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          await this.updateConnectionState(provider);
        }
      } catch (error) {
        console.error("Failed to check existing connection:", error);
      }
    }
  }

  private getMetaMaskProvider(): EIP1193Provider | undefined {
    // 优先使用window.ethereum（传统方式）
    if (typeof window !== "undefined" && window.ethereum?.isMetaMask) {
      return window.ethereum;
    }
    return undefined;
  }

  private async updateConnectionState(provider: EIP1193Provider) {
    try {
      const accounts = await provider.request({ method: 'eth_accounts' });
      const chainIdHex = await provider.request({ method: 'eth_chainId' });
      const chainId = parseInt(chainIdHex, 16);

      this.setState({
        provider,
        accounts,
        chainId,
        isConnected: accounts.length > 0,
        isConnecting: false,
        error: undefined,
      });

      // 设置事件监听器
      this.setupEventListeners(provider);
    } catch (error) {
      this.setState({
        provider,
        accounts: [],
        chainId: undefined,
        isConnected: false,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private setupEventListeners(provider: EIP1193Provider) {
    // 账户变化
    const handleAccountsChanged = (accounts: string[]) => {
      this.setState({
        ...this.state,
        accounts,
        isConnected: accounts.length > 0,
        error: accounts.length === 0 ? 'Disconnected' : undefined,
      });
    };

    // 链变化
    const handleChainChanged = (chainIdHex: string) => {
      const chainId = parseInt(chainIdHex, 16);
      this.setState({
        ...this.state,
        chainId,
        error: undefined,
      });
    };

    // 连接事件
    const handleConnect = (connectInfo: { chainId: string }) => {
      const chainId = parseInt(connectInfo.chainId, 16);
      this.setState({
        ...this.state,
        chainId,
        error: undefined,
      });
    };

    // 断开连接事件
    const handleDisconnect = () => {
      this.setState({
        provider: undefined,
        accounts: [],
        chainId: undefined,
        isConnected: false,
        isConnecting: false,
        error: 'Disconnected',
      });
    };

    // 添加监听器
    provider.on('accountsChanged', handleAccountsChanged);
    provider.on('chainChanged', handleChainChanged);
    provider.on('connect', handleConnect);
    provider.on('disconnect', handleDisconnect);
  }

  private setState(newState: Partial<MetaMaskState>) {
    this.state = { ...this.state, ...newState };
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  public async connect(): Promise<void> {
    const provider = this.getMetaMaskProvider();
    
    if (!provider) {
      throw new Error('MetaMask not found. Please install MetaMask.');
    }

    this.setState({ isConnecting: true, error: undefined });

    try {
      // 请求连接
      await provider.request({ method: 'eth_requestAccounts' });
      
      // 更新连接状态
      await this.updateConnectionState(provider);
    } catch (error) {
      this.setState({
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      });
      throw error;
    }
  }

  public async switchChain(chainId: number): Promise<void> {
    const provider = this.state.provider;
    if (!provider) {
      throw new Error('No provider available');
    }

    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (error: any) {
      // 如果链不存在，尝试添加
      if (error.code === 4902) {
        await this.addChain(chainId);
      } else {
        throw error;
      }
    }
  }

  private async addChain(chainId: number): Promise<void> {
    const provider = this.state.provider;
    if (!provider) {
      throw new Error('No provider available');
    }

    // 预定义的链配置
    const chainConfigs: Record<number, any> = {
      31337: {
        chainId: '0x7a69',
        chainName: 'Localhost',
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['http://localhost:8545'],
        blockExplorerUrls: null,
      },
      11155111: {
        chainId: '0xaa36a7',
        chainName: 'Sepolia',
        nativeCurrency: { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://ethereum-sepolia-rpc.publicnode.com'],
        blockExplorerUrls: ['https://sepolia.etherscan.io'],
      },
    };

    const config = chainConfigs[chainId];
    if (!config) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }

    await provider.request({
      method: 'wallet_addEthereumChain',
      params: [config],
    });
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getSnapshot(): MetaMaskState {
    return this.state;
  }
}

// 全局存储实例
const metaMaskStore = new MetaMaskStore();

// Context
const MetaMaskContext = createContext<{
  state: MetaMaskState;
  connect: () => Promise<void>;
  switchChain: (chainId: number) => Promise<void>;
} | null>(null);

// Provider组件
export function MetaMaskProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(
    metaMaskStore.subscribe.bind(metaMaskStore),
    metaMaskStore.getSnapshot.bind(metaMaskStore),
    () => metaMaskStore.getSnapshot()
  );

  const connect = useCallback(async () => {
    await metaMaskStore.connect();
  }, []);

  const switchChain = useCallback(async (chainId: number) => {
    await metaMaskStore.switchChain(chainId);
  }, []);

  return (
    <MetaMaskContext.Provider value={{ state, connect, switchChain }}>
      {children}
    </MetaMaskContext.Provider>
  );
}

// Hook
export function useMetaMaskProvider() {
  const context = useContext(MetaMaskContext);
  if (!context) {
    throw new Error('useMetaMaskProvider must be used within a MetaMaskProvider');
  }
  return context;
}

// 扩展Window类型
declare global {
  interface Window {
    ethereum?: EIP1193Provider;
  }
}

