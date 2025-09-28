import { ethers } from "ethers";
import { 
  FhevmInstance, 
  FhevmInstanceConfig, 
  FhevmWindowType,
  FhevmRelayerStatusType,
  FhevmInitSDKOptions
} from "../fhevmTypes";
import { RelayerSDKLoader } from "./RelayerSDKLoader";
import { DEFAULT_CONFIG, ERROR_MESSAGES } from "./constants";
import { publicKeyStorageGet, publicKeyStorageSet } from "./PublicKeyStorage";

// 错误类型定义
export class FhevmReactError extends Error {
  code: string;
  cause?: unknown;
  constructor(code: string, message?: string, options?: { cause?: unknown }) {
    super(message);
    this.code = code;
    this.name = "FhevmReactError";
    if (options?.cause) {
      this.cause = options.cause;
    }
  }
}

export class FhevmAbortError extends Error {
  constructor(message = "FHEVM operation was cancelled") {
    super(message);
    this.name = "FhevmAbortError";
  }
}

// 类型守卫
function isFhevmWindowType(window: Window, trace?: (msg: string) => void): window is FhevmWindowType {
  const isValid = "relayerSDK" in window && 
    typeof window.relayerSDK === "object" &&
    window.relayerSDK !== null;
    
  if (trace && !isValid) {
    trace("Window relayerSDK validation failed");
  }
  
  return isValid;
}

function isFhevmInitialized(): boolean {
  return isFhevmWindowType(window) && Boolean(window.relayerSDK.__initialized__);
}

// SDK加载函数
const fhevmLoadSDK = (): Promise<void> => {
  const loader = new RelayerSDKLoader({ trace: console.log });
  return loader.load();
};

// SDK初始化函数
const fhevmInitSDK = async (options?: FhevmInitSDKOptions): Promise<boolean> => {
  if (!isFhevmWindowType(window, console.log)) {
    throw new FhevmReactError(
      "SDK_NOT_LOADED",
      "window.relayerSDK is not available"
    );
  }

  const result = await window.relayerSDK.initSDK(options);
  window.relayerSDK.__initialized__ = result;

  if (!result) {
    throw new FhevmReactError(
      "SDK_INIT_FAILED", 
      "window.relayerSDK.initSDK failed"
    );
  }

  return true;
};

// 获取Web3客户端版本
async function getWeb3Client(rpcUrl: string): Promise<string> {
  const rpc = new ethers.JsonRpcProvider(rpcUrl);
  try {
    const version = await rpc.send("web3_clientVersion", []);
    return version;
  } catch (e) {
    throw new FhevmReactError(
      "WEB3_CLIENTVERSION_ERROR",
      `The URL ${rpcUrl} is not a Web3 client or is not reachable. Please check the endpoint.`
    );
  } finally {
    rpc.destroy();
  }
}

// 获取FHEVM Relayer元数据
async function getFHEVMRelayerMetadata(rpcUrl: string) {
  const rpc = new ethers.JsonRpcProvider(rpcUrl);
  try {
    const metadata = await rpc.send("fhevm_relayer_metadata", []);
    return metadata;
  } catch (e) {
    throw new FhevmReactError(
      "FHEVM_RELAYER_METADATA_ERROR",
      `The URL ${rpcUrl} is not a FHEVM Hardhat node or is not reachable. Please check the endpoint.`
    );
  } finally {
    rpc.destroy();
  }
}

// 尝试获取FHEVM Hardhat节点元数据
async function tryFetchFHEVMHardhatNodeRelayerMetadata(rpcUrl: string): Promise<
  | {
      ACLAddress: `0x${string}`;
      InputVerifierAddress: `0x${string}`;
      KMSVerifierAddress: `0x${string}`;
    }
  | undefined
> {
  try {
    const version = await getWeb3Client(rpcUrl);
    if (
      typeof version !== "string" ||
      !version.toLowerCase().includes("hardhat")
    ) {
      // Not a Hardhat Node
      return undefined;
    }
    
    const metadata = await getFHEVMRelayerMetadata(rpcUrl);
    if (!metadata || typeof metadata !== "object") {
      return undefined;
    }
    
    // 验证所有必需的地址字段
    if (
      !(
        "ACLAddress" in metadata &&
        typeof metadata.ACLAddress === "string" &&
        metadata.ACLAddress.startsWith("0x")
      )
    ) {
      return undefined;
    }
    if (
      !(
        "InputVerifierAddress" in metadata &&
        typeof metadata.InputVerifierAddress === "string" &&
        metadata.InputVerifierAddress.startsWith("0x")
      )
    ) {
      return undefined;
    }
    if (
      !(
        "KMSVerifierAddress" in metadata &&
        typeof metadata.KMSVerifierAddress === "string" &&
        metadata.KMSVerifierAddress.startsWith("0x")
      )
    ) {
      return undefined;
    }
    
    return metadata;
  } catch {
    // Not a FHEVM Hardhat Node
    return undefined;
  }
}

// 网络解析函数
async function getChainId(providerOrUrl: ethers.Eip1193Provider | string): Promise<number> {
  if (typeof providerOrUrl === "string") {
    const rpc = new ethers.JsonRpcProvider(providerOrUrl);
    try {
      const network = await rpc.getNetwork();
      return Number(network.chainId);
    } catch (e) {
      throw new FhevmReactError(
        "WEB3_CLIENTVERSION_ERROR",
        `Failed to get chainId from ${providerOrUrl}`
      );
    } finally {
      rpc.destroy();
    }
  } else {
    try {
      const chainIdHex = await providerOrUrl.request({ method: "eth_chainId" });
      return parseInt(chainIdHex as string, 16);
    } catch (e) {
      throw new FhevmReactError(
        "WEB3_CLIENTVERSION_ERROR",
        `Failed to get chainId from provider`
      );
    }
  }
}

// 网络解析
type MockResolveResult = { isMock: true; chainId: number; rpcUrl: string };
type GenericResolveResult = { isMock: false; chainId: number; rpcUrl?: string };
type ResolveResult = MockResolveResult | GenericResolveResult;

async function resolve(
  providerOrUrl: ethers.Eip1193Provider | string,
  mockChains?: Record<number, string>
): Promise<ResolveResult> {
  // Resolve chainId
  const chainId = await getChainId(providerOrUrl);

  // Resolve rpc url
  let rpcUrl = typeof providerOrUrl === "string" ? providerOrUrl : undefined;

  const _mockChains: Record<number, string> = {
    31337: "http://localhost:8545",
    ...(mockChains ?? {}),
  };

  // Help Typescript solver here:
  if (Object.prototype.hasOwnProperty.call(_mockChains, chainId)) {
    if (!rpcUrl) {
      rpcUrl = _mockChains[chainId];
    }

    return { isMock: true, chainId, rpcUrl };
  }

  return { isMock: false, chainId, rpcUrl };
}

// 创建FHEVM实例的主函数
export const createFhevmInstance = async (parameters: {
  provider: ethers.Eip1193Provider | string;
  mockChains?: Record<number, string>;
  signal: AbortSignal;
  onStatusChange?: (status: FhevmRelayerStatusType) => void;
}): Promise<FhevmInstance> => {

  const throwIfAborted = () => {
    if (parameters.signal.aborted) throw new FhevmAbortError();
  };

  const notify = (status: FhevmRelayerStatusType) => {
    if (parameters.onStatusChange) parameters.onStatusChange(status);
  };

  const {
    signal,
    onStatusChange,
    provider: providerOrUrl,
    mockChains,
  } = parameters;

  // 1. 解析网络信息
  const { isMock, rpcUrl, chainId } = await resolve(providerOrUrl, mockChains);
  
  console.log("[fhevm] Network resolved:", { isMock, rpcUrl, chainId });

  if (isMock) {
    console.log("[fhevm] Attempting to use Mock instance for local development");
    
    // 尝试获取FHEVM Hardhat节点元数据
    const fhevmRelayerMetadata = await tryFetchFHEVMHardhatNodeRelayerMetadata(rpcUrl);

    if (fhevmRelayerMetadata) {
      console.log("[fhevm] FHEVM Hardhat node detected! Using MockFhevmInstance");
      console.log("[fhevm] Metadata:", fhevmRelayerMetadata);
      
      notify("creating");

      // 动态导入Mock模块（避免打包到生产环境）
      const fhevmMock = await import("./mock/fhevmMock");
      const mockInstance = await fhevmMock.fhevmMockCreateInstance({
        rpcUrl,
        chainId,
        metadata: fhevmRelayerMetadata,
      });

      throwIfAborted();

      console.log("[fhevm] MockFhevmInstance created successfully");
      return mockInstance;
    } else {
      console.log("[fhevm] No FHEVM metadata found, this is not a FHEVM node");
      throw new FhevmReactError(
        "FHEVM_RELAYER_METADATA_ERROR",
        `The URL ${rpcUrl} is not a FHEVM Hardhat node or is not reachable. Please check the endpoint.`
      );
    }
  }

  // 3. 生产环境处理
  console.log("[fhevm] Using production Relayer SDK");
  notify("sdk-loading");

  if (!isFhevmWindowType(window, console.log)) {
    await fhevmLoadSDK();
    throwIfAborted();
  }

  notify("sdk-initializing");

  if (!isFhevmInitialized()) {
    await fhevmInitSDK();
    throwIfAborted();
  }

  // 4. 获取存储的公钥和参数
  const relayerSDK = (window as unknown as FhevmWindowType).relayerSDK;
  const aclAddress = relayerSDK.SepoliaConfig.aclContractAddress as `0x${string}`;
  
  console.log("[fhevm] Loading public key and params for ACL:", aclAddress);
  const pub = await publicKeyStorageGet(aclAddress);
  throwIfAborted();

  // 5. 创建实例配置
  const config: FhevmInstanceConfig = {
    ...relayerSDK.SepoliaConfig,
    network: providerOrUrl,
    publicKey: pub.publicKey,
    publicParams: pub.publicParams ?? undefined,
  };

  console.log("[fhevm] Creating instance with config:", {
    ...config,
    network: typeof config.network === 'string' ? config.network : 'EIP1193Provider'
  });

  // 6. 创建实例
  const instance = await relayerSDK.createInstance(config);
  throwIfAborted();

  console.log("[fhevm] Instance created, saving public key and params");

  // 7. 保存公钥和参数（异步，不阻塞）
  try {
    await publicKeyStorageSet(
      aclAddress,
      instance.getPublicKey(),
      instance.getPublicParams(2048)
    );
    console.log("[fhevm] Public key and params saved successfully");
  } catch (error) {
    console.warn("[fhevm] Failed to save public key and params:", error);
  }

  throwIfAborted();
  notify("ready");
  
  console.log("[fhevm] FHEVM instance ready");
  return instance;
};