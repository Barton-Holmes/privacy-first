"use client";

import { ReactNode } from "react";
import { MetaMaskProvider } from "@/hooks/metamask/useMetaMaskProvider";
import { MetaMaskEthersSignerProvider } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { InMemoryStorageProvider } from "@/hooks/useInMemoryStorage";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <MetaMaskProvider>
      <MetaMaskEthersSignerProvider
        initialMockChains={{ 31337: "http://localhost:8545", 11155111: "https://ethereum-sepolia-rpc.publicnode.com" }}
      >
        <InMemoryStorageProvider>
          {children}
        </InMemoryStorageProvider>
      </MetaMaskEthersSignerProvider>
    </MetaMaskProvider>
  );
}

