"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import type { EIP6963ProviderDetail, EIP6963AnnounceProviderEvent } from "./Eip6963Types";

// EIP-6963提供者存储
class EIP6963ProvidersStore {
  private providers = new Map<string, EIP6963ProviderDetail>();
  private listeners = new Set<() => void>();

  constructor() {
    if (typeof window !== "undefined") {
      this.init();
    }
  }

  private init() {
    // 监听提供者公告（类型断言为 EventListener 以兼容自定义事件）
    window.addEventListener(
      "eip6963:announceProvider",
      this.handleAnnouncement as unknown as EventListener
    );
    
    // 请求现有提供者
    window.dispatchEvent(new CustomEvent("eip6963:requestProvider"));
  }

  private handleAnnouncement = (event: CustomEvent) => {
    const { detail } = (event as unknown as EIP6963AnnounceProviderEvent);
    
    // 存储提供者
    this.providers.set(detail.info.uuid, detail);
    
    // 通知监听者
    this.notifyListeners();
  };

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  public getProviders(): EIP6963ProviderDetail[] {
    return Array.from(this.providers.values());
  }

  public getProvider(uuid: string): EIP6963ProviderDetail | undefined {
    return this.providers.get(uuid);
  }

  public getMetaMaskProvider(): EIP6963ProviderDetail | undefined {
    return Array.from(this.providers.values()).find(
      provider => provider.info.name.toLowerCase().includes('metamask')
    );
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getSnapshot(): EIP6963ProviderDetail[] {
    return this.getProviders();
  }
}

// 全局存储实例
const providersStore = new EIP6963ProvidersStore();

// Hook: 使用EIP-6963提供者发现
export function useEip6963() {
  const providers = useSyncExternalStore(
    providersStore.subscribe.bind(providersStore),
    providersStore.getSnapshot.bind(providersStore),
    () => []
  );

  const getMetaMaskProvider = useCallback(() => {
    return providersStore.getMetaMaskProvider();
  }, []);

  const getProvider = useCallback((uuid: string) => {
    return providersStore.getProvider(uuid);
  }, []);

  // 请求刷新提供者列表
  const refreshProviders = useCallback(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("eip6963:requestProvider"));
    }
  }, []);

  return {
    providers,
    getMetaMaskProvider,
    getProvider,
    refreshProviders,
  };
}

