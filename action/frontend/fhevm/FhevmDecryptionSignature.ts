import { ethers } from "ethers";
import { FhevmInstance, FhevmDecryptionSignatureType, EIP712Type } from "./fhevmTypes";
import { GenericStringStorage } from "./GenericStringStorage";
import { TIME_CONSTANTS } from "./internal/constants";

// 存储键生成类
class FhevmDecryptionSignatureStorageKey {
  public readonly key: string;

  constructor(
    instance: FhevmInstance,
    contractAddresses: string[],
    userAddress: string,
    publicKey?: string
  ) {
    // 生成唯一的存储键
    const sortedContracts = [...contractAddresses].sort();
    const contractsHash = ethers.keccak256(
      ethers.toUtf8Bytes(sortedContracts.join(","))
    );
    
    const keyComponents = [
      "fhevm_decryption_signature",
      userAddress.toLowerCase(),
      contractsHash.slice(0, 10), // 取前10个字符作为简短标识
    ];
    
    if (publicKey) {
      keyComponents.push(ethers.keccak256(ethers.toUtf8Bytes(publicKey)).slice(0, 10));
    }
    
    this.key = keyComponents.join("_");
  }
}

// 解密签名管理类
export class FhevmDecryptionSignature {
  public readonly publicKey: string;
  public readonly privateKey: string;
  public readonly signature: string;
  public readonly startTimestamp: number;
  public readonly durationDays: number;
  public readonly userAddress: `0x${string}`;
  public readonly contractAddresses: `0x${string}`[];
  public readonly eip712: EIP712Type;

  constructor(parameters: FhevmDecryptionSignatureType) {
    this.publicKey = parameters.publicKey;
    this.privateKey = parameters.privateKey;
    this.signature = parameters.signature;
    this.startTimestamp = parameters.startTimestamp;
    this.durationDays = parameters.durationDays;
    this.userAddress = parameters.userAddress;
    this.contractAddresses = parameters.contractAddresses;
    this.eip712 = parameters.eip712;
  }

  // 检查签名是否有效
  public isValid(): boolean {
    const now = Math.floor(Date.now() / 1000);
    const expiryTime = this.startTimestamp + this.durationDays * 24 * 60 * 60;
    return now < expiryTime;
  }

  // 获取剩余有效时间（秒）
  public getRemainingTime(): number {
    const now = Math.floor(Date.now() / 1000);
    const expiryTime = this.startTimestamp + this.durationDays * 24 * 60 * 60;
    return Math.max(0, expiryTime - now);
  }

  // 序列化为JSON
  public toJSON(): string {
    return JSON.stringify({
      publicKey: this.publicKey,
      privateKey: this.privateKey,
      signature: this.signature,
      startTimestamp: this.startTimestamp,
      durationDays: this.durationDays,
      userAddress: this.userAddress,
      contractAddresses: this.contractAddresses,
      eip712: this.eip712,
    });
  }

  // 从JSON反序列化
  public static fromJSON(json: string): FhevmDecryptionSignature {
    const data = JSON.parse(json);
    return new FhevmDecryptionSignature(data);
  }

  // 保存到存储
  public async saveToGenericStringStorage(
    storage: GenericStringStorage,
    instance: FhevmInstance,
    hasPublicKey: boolean
  ): Promise<void> {
    const storageKey = new FhevmDecryptionSignatureStorageKey(
      instance,
      this.contractAddresses,
      this.userAddress,
      hasPublicKey ? this.publicKey : undefined
    );

    console.log("[FhevmDecryptionSignature] Saving signature to storage with key:", storageKey.key);
    
    try {
      await storage.setItem(storageKey.key, this.toJSON());
      console.log("[FhevmDecryptionSignature] Signature saved successfully");
    } catch (error) {
      console.error("[FhevmDecryptionSignature] Failed to save signature:", error);
      throw error;
    }
  }

  // 从存储加载签名
  public static async loadFromGenericStringStorage(
    storage: GenericStringStorage,
    instance: FhevmInstance,
    contractAddresses: string[],
    userAddress: string,
    publicKey?: string
  ): Promise<FhevmDecryptionSignature | null> {
    const storageKey = new FhevmDecryptionSignatureStorageKey(
      instance,
      contractAddresses,
      userAddress,
      publicKey
    );

    console.log("[FhevmDecryptionSignature] Loading signature from storage with key:", storageKey.key);

    try {
      const result = await storage.getItem(storageKey.key);
      if (!result) {
        console.log("[FhevmDecryptionSignature] No stored signature found");
        return null;
      }

      const signature = FhevmDecryptionSignature.fromJSON(result);
      
      if (!signature.isValid()) {
        console.log("[FhevmDecryptionSignature] Stored signature expired, removing");
        await storage.removeItem(storageKey.key);
        return null;
      }

      console.log("[FhevmDecryptionSignature] Valid signature loaded from storage");
      return signature;
    } catch (error) {
      console.error("[FhevmDecryptionSignature] Failed to load signature:", error);
      return null;
    }
  }

  // 创建新的签名
  public static async new(
    instance: FhevmInstance,
    contractAddresses: string[],
    publicKey: string,
    privateKey: string,
    signer: ethers.Signer
  ): Promise<FhevmDecryptionSignature | null> {
    try {
      console.log("[FhevmDecryptionSignature] Creating new signature for contracts:", contractAddresses);
      
      const userAddress = await signer.getAddress() as `0x${string}`;
      const startTimestamp = Math.floor(Date.now() / 1000);
      const durationDays = TIME_CONSTANTS.SIGNATURE_DURATION_DAYS;

      // 创建EIP712签名数据
      const eip712 = instance.createEIP712(
        publicKey,
        contractAddresses,
        startTimestamp,
        durationDays
      );

      console.log("[FhevmDecryptionSignature] Requesting user signature for EIP712 data");

      // 请求用户签名
      const signature = await signer.signTypedData(
        eip712.domain,
        { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
        eip712.message
      );

      console.log("[FhevmDecryptionSignature] User signature obtained");

      return new FhevmDecryptionSignature({
        publicKey,
        privateKey,
        contractAddresses: contractAddresses as `0x${string}`[],
        startTimestamp,
        durationDays,
        signature,
        eip712: eip712 as EIP712Type,
        userAddress,
      });
    } catch (error) {
      console.error("[FhevmDecryptionSignature] Failed to create signature:", error);
      return null;
    }
  }

  // 加载或创建签名（主要入口点）
  public static async loadOrSign(
    instance: FhevmInstance,
    contractAddresses: string[],
    signer: ethers.Signer,
    storage: GenericStringStorage,
    keyPair?: { publicKey: string; privateKey: string }
  ): Promise<FhevmDecryptionSignature | null> {
    const userAddress = await signer.getAddress() as `0x${string}`;
    
    console.log("[FhevmDecryptionSignature] LoadOrSign requested for user:", userAddress, "contracts:", contractAddresses);

    // 1. 尝试从缓存加载现有签名
    const cached = await FhevmDecryptionSignature.loadFromGenericStringStorage(
      storage,
      instance,
      contractAddresses,
      userAddress,
      keyPair?.publicKey
    );

    if (cached) {
      const remainingTime = cached.getRemainingTime();
      console.log("[FhevmDecryptionSignature] Using cached signature, remaining time:", remainingTime, "seconds");
      return cached;
    }

    // 2. 创建新的签名
    console.log("[FhevmDecryptionSignature] No valid cached signature, creating new one");
    
    const { publicKey, privateKey } = keyPair ?? instance.generateKeypair();
    
    const newSignature = await FhevmDecryptionSignature.new(
      instance,
      contractAddresses,
      publicKey,
      privateKey,
      signer
    );

    if (!newSignature) {
      console.error("[FhevmDecryptionSignature] Failed to create new signature");
      return null;
    }

    // 3. 保存新签名到存储
    try {
      await newSignature.saveToGenericStringStorage(storage, instance, Boolean(keyPair?.publicKey));
      console.log("[FhevmDecryptionSignature] New signature saved to storage");
    } catch (error) {
      console.warn("[FhevmDecryptionSignature] Failed to save signature, but continuing:", error);
    }

    return newSignature;
  }

  // 清理过期签名（实用工具函数）
  public static async cleanupExpiredSignatures(storage: GenericStringStorage): Promise<void> {
    // 注意：这个函数需要存储实现支持枚举所有键
    // 对于基本的GenericStringStorage接口，这可能不可用
    console.log("[FhevmDecryptionSignature] Cleanup expired signatures (if supported by storage)");
    
    if ('keys' in storage && typeof storage.keys === 'function') {
      try {
        const keys = (storage as any).keys();
        const signatureKeys = keys.filter((key: string) => key.startsWith('fhevm_decryption_signature_'));
        
        for (const key of signatureKeys) {
          try {
            const json = await storage.getItem(key);
            if (json) {
              const signature = FhevmDecryptionSignature.fromJSON(json);
              if (!signature.isValid()) {
                await storage.removeItem(key);
                console.log("[FhevmDecryptionSignature] Removed expired signature:", key);
              }
            }
          } catch (error) {
            console.warn("[FhevmDecryptionSignature] Error checking signature:", key, error);
          }
        }
      } catch (error) {
        console.warn("[FhevmDecryptionSignature] Cleanup failed:", error);
      }
    }
  }
}

