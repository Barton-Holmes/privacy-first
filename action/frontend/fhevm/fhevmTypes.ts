import { ethers } from "ethers";

// 基础FHEVM实例接口
export interface FhevmInstance {
  createEncryptedInput(contractAddress: string, userAddress: string): EncryptedInput;
  userDecrypt(
    handles: { handle: string; contractAddress: string }[],
    privateKey: string,
    publicKey: string,
    signature: string,
    contractAddresses: string[],
    userAddress: string,
    startTimestamp: number,
    durationDays: number
  ): Promise<Record<string, string | bigint | boolean>>;
  decryptPublic(contractAddress: string, handle: string): Promise<string | bigint | boolean>;
  generateKeypair(): { publicKey: string; privateKey: string };
  createEIP712(
    publicKey: string,
    contractAddresses: string[],
    startTimestamp: number,
    durationDays: number
  ): EIP712Type;
  getPublicKey(): FhevmStoredPublicKey | null;
  getPublicParams(bits: number): FhevmStoredPublicParams | null;
}

// 加密输入接口
export interface EncryptedInput {
  add8(value: number | bigint): void;
  add16(value: number | bigint): void;
  add32(value: number | bigint): void;
  add64(value: number | bigint): void;
  add128(value: number | bigint): void;
  add256(value: number | bigint): void;
  addBool(value: boolean): void;
  addAddress(value: string): void;
  encrypt(): Promise<{
    handles: string[];
    inputProof: string;
  }>;
}

// EIP712签名类型
export interface EIP712Type {
  domain: {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: string;
  };
  types: {
    UserDecryptRequestVerification: Array<{
      name: string;
      type: string;
    }>;
  };
  message: {
    publicKey: string;
    contractAddresses: string[];
    startTimestamp: number;
    durationDays: number;
  };
}

// 存储的公钥类型
export interface FhevmStoredPublicKey {
  publicKeyId: string;
  publicKey: string;
}

// 存储的公共参数类型
export interface FhevmStoredPublicParams {
  [key: string]: any;
}

// FHEVM实例配置
export interface FhevmInstanceConfig {
  aclContractAddress: string;
  kmsContractAddress: string;
  inputVerifierContractAddress: string;
  chainId: number;
  gatewayChainId: number;
  network: string | ethers.Eip1193Provider;
  relayerUrl?: string;
  publicKey?: {
    id: string;
    data: string;
  };
  publicParams?: {
    [key: string]: any;
  };
}

// FHEVM窗口类型（用于CDN加载）
export interface FhevmWindowType extends Window {
  relayerSDK: {
    initSDK: (options?: any) => Promise<boolean>;
    createInstance: (config: FhevmInstanceConfig) => Promise<FhevmInstance>;
    SepoliaConfig: {
      aclContractAddress: string;
      kmsContractAddress: string;
      inputVerifierContractAddress: string;
      chainId: number;
      gatewayChainId: number;
      relayerUrl: string;
    };
    __initialized__?: boolean;
  };
}

// 解密签名参数类型
export interface FhevmDecryptionSignatureType {
  publicKey: string;
  privateKey: string;
  signature: string;
  startTimestamp: number;
  durationDays: number;
  userAddress: `0x${string}`;
  contractAddresses: `0x${string}`[];
  eip712: EIP712Type;
}

// Relayer状态类型
export type FhevmRelayerStatusType = 
  | "sdk-loading"
  | "sdk-initializing" 
  | "creating"
  | "ready"
  | "error";

// 初始化选项
export interface FhevmInitSDKOptions {
  wasmUrl?: string;
  [key: string]: any;
}

