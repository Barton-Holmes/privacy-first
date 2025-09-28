"use client";

import { createContext, useContext, ReactNode, useMemo, useRef } from "react";
import { ethers } from "ethers";
import { useMetaMaskProvider } from "./useMetaMaskProvider";

interface MetaMaskEthersState {
  provider: ethers.BrowserProvider | undefined;
  readonlyProvider: ethers.JsonRpcProvider | undefined;
  signer: ethers.JsonRpcSigner | undefined;
  address: string | undefined;
  chainId: number | undefined;
  isConnected: boolean;
  sameChain: (chainId: number | undefined) => boolean;
  sameSigner: (signer: ethers.JsonRpcSigner | undefined) => boolean;
}

interface MetaMaskEthersSignerProviderProps {
  children: ReactNode;
  initialMockChains?: Record<number, string>;
}

// Context
const MetaMaskEthersContext = createContext<MetaMaskEthersState | null>(null);

// Provider组件
export function MetaMaskEthersSignerProvider({ 
  children, 
  initialMockChains = { 31337: "http://localhost:8545" }
}: MetaMaskEthersSignerProviderProps) {
  const { state: metaMaskState } = useMetaMaskProvider();
  const signerRef = useRef<ethers.JsonRpcSigner | undefined>(undefined);
  const chainIdRef = useRef<number | undefined>(undefined);

  // 创建ethers提供者和签名者
  const { provider, readonlyProvider, signer, address } = useMemo(() => {
    if (!metaMaskState.provider || !metaMaskState.isConnected) {
      return {
        provider: undefined,
        readonlyProvider: undefined,
        signer: undefined,
        address: undefined,
      };
    }

    try {
      // 创建浏览器提供者
      const browserProvider = new ethers.BrowserProvider(metaMaskState.provider);
      
      // 创建只读提供者
      let readonlyProvider: ethers.JsonRpcProvider | undefined;
      const chainId = metaMaskState.chainId;
      
      if (chainId && initialMockChains[chainId]) {
        // 本地开发环境
        readonlyProvider = new ethers.JsonRpcProvider(initialMockChains[chainId]);
      } else {
        // 使用浏览器提供者作为只读提供者
        readonlyProvider = browserProvider as any;
      }

      // 创建签名者（此处返回 Promise，但我们在下方不直接存入 context，而是用 ref 追踪）
      const signer = browserProvider.getSigner();
      
      // 获取地址
      const address = metaMaskState.accounts[0];

      return {
        provider: browserProvider,
        readonlyProvider,
        signer: undefined,
        address,
      };
    } catch (error) {
      console.error("Failed to create ethers providers:", error);
      return {
        provider: undefined,
        readonlyProvider: undefined,
        signer: undefined,
        address: undefined,
      };
    }
  }, [metaMaskState.provider, metaMaskState.isConnected, metaMaskState.accounts, metaMaskState.chainId, initialMockChains]);

  // 更新引用
  // 异步解析 signer Promise，并保持 ref 与 context 解耦
  if (!signerRef.current && provider) {
    (async () => {
      try {
        const s = await (new ethers.BrowserProvider(metaMaskState.provider as any)).getSigner();
        signerRef.current = s;
      } catch (e) {
        console.warn("Failed to resolve signer asynchronously", e);
      }
    })();
  }
  chainIdRef.current = metaMaskState.chainId;

  // 比较函数
  const sameChain = (chainId: number | undefined) => {
    return chainId === chainIdRef.current;
  };

  const sameSigner = (signer: ethers.JsonRpcSigner | undefined) => {
    return signer === signerRef.current;
  };

  const contextValue: MetaMaskEthersState = {
    provider,
    readonlyProvider,
    signer: signerRef.current,
    address,
    chainId: metaMaskState.chainId,
    isConnected: metaMaskState.isConnected,
    sameChain,
    sameSigner,
  };

  return (
    <MetaMaskEthersContext.Provider value={contextValue}>
      {children}
    </MetaMaskEthersContext.Provider>
  );
}

// Hook
export function useMetaMaskEthersSigner() {
  const context = useContext(MetaMaskEthersContext);
  if (!context) {
    throw new Error('useMetaMaskEthersSigner must be used within a MetaMaskEthersSignerProvider');
  }
  return context;
}
