// EIP-6963: Multi Injected Provider Discovery 类型定义

export interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

export interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: EIP1193Provider;
}

export interface EIP1193Provider {
  request(args: { method: string; params?: any[] }): Promise<any>;
  on(event: string, handler: (...args: any[]) => void): void;
  removeListener(event: string, handler: (...args: any[]) => void): void;
  isMetaMask?: boolean;
  selectedAddress?: string;
  chainId?: string;
}

export interface EIP6963AnnounceProviderEvent extends CustomEvent {
  type: "eip6963:announceProvider";
  detail: EIP6963ProviderDetail;
}

export interface EIP6963RequestProviderEvent extends CustomEvent {
  type: "eip6963:requestProvider";
}

