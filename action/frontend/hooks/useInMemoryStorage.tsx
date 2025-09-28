"use client";

import { createContext, useContext, ReactNode, useState } from "react";
import { GenericStringStorage, GenericStringInMemoryStorage } from "@/fhevm/GenericStringStorage";

interface UseInMemoryStorageState {
  storage: GenericStringStorage;
}

interface InMemoryStorageProviderProps {
  children: ReactNode;
}

// Context
const InMemoryStorageContext = createContext<UseInMemoryStorageState | undefined>(undefined);

// Provider组件
export const InMemoryStorageProvider = ({ children }: InMemoryStorageProviderProps) => {
  // 创建单例存储实例
  const [storage] = useState<GenericStringStorage>(() => new GenericStringInMemoryStorage());

  return (
    <InMemoryStorageContext.Provider value={{ storage }}>
      {children}
    </InMemoryStorageContext.Provider>
  );
};

// Hook
export const useInMemoryStorage = () => {
  const context = useContext(InMemoryStorageContext);
  if (!context) {
    throw new Error("useInMemoryStorage must be used within a InMemoryStorageProvider");
  }
  return context;
};

