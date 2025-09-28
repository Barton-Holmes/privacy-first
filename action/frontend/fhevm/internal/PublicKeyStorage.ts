import { openDB, DBSchema, IDBPDatabase } from "idb";
import { FhevmStoredPublicKey, FhevmStoredPublicParams } from "../fhevmTypes";

// IndexedDB数据库结构
interface PublicParamsDB extends DBSchema {
  publicKeyStore: {
    key: string;
    value: {
      acl: `0x${string}`;
      value: FhevmStoredPublicKey;
    };
  };
  paramsStore: {
    key: string;
    value: {
      acl: `0x${string}`;
      value: FhevmStoredPublicParams;
    };
  };
}

let __dbPromise: Promise<IDBPDatabase<PublicParamsDB>> | undefined = undefined;

async function _getDB(): Promise<IDBPDatabase<PublicParamsDB> | undefined> {
  if (__dbPromise) return __dbPromise;

  if (typeof window === "undefined") {
    console.log("[PublicKeyStorage] Not in browser environment");
    return undefined;
  }

  try {
    __dbPromise = openDB<PublicParamsDB>("anonexam_fhevm", 1, {
      upgrade(db) {
        console.log("[PublicKeyStorage] Upgrading database schema");
        
        if (!db.objectStoreNames.contains("paramsStore")) {
          db.createObjectStore("paramsStore", { keyPath: "acl" });
        }
        if (!db.objectStoreNames.contains("publicKeyStore")) {
          db.createObjectStore("publicKeyStore", { keyPath: "acl" });
        }
      },
    });

    console.log("[PublicKeyStorage] Database initialized successfully");
    return __dbPromise;
  } catch (error) {
    console.error("[PublicKeyStorage] Failed to initialize database:", error);
    __dbPromise = undefined;
    return undefined;
  }
}

export async function publicKeyStorageGet(aclAddress: `0x${string}`): Promise<{
  publicKey?: {
    id: string;
    data: string;
  };
  publicParams: { [key: string]: any } | null;
}> {
  console.log("[PublicKeyStorage] Getting stored data for ACL:", aclAddress);
  
  const db = await _getDB();
  if (!db) {
    console.log("[PublicKeyStorage] Database not available, returning empty");
    return { publicParams: null };
  }

  try {
    // 从IndexedDB获取存储的公钥和参数
    const storedPublicKey = await db.get("publicKeyStore", aclAddress);
    const storedPublicParams = await db.get("paramsStore", aclAddress);

    console.log("[PublicKeyStorage] Retrieved from storage:", {
      hasPublicKey: !!storedPublicKey,
      hasPublicParams: !!storedPublicParams
    });

    // 构建返回对象
    const publicKey = storedPublicKey?.value?.publicKeyId && storedPublicKey?.value?.publicKey
      ? {
          id: storedPublicKey.value.publicKeyId,
          data: storedPublicKey.value.publicKey,
        }
      : undefined;

    const publicParams = storedPublicParams?.value
      ? { "2048": storedPublicParams.value }
      : null;

    return { publicKey, publicParams };
  } catch (error) {
    console.error("[PublicKeyStorage] Error retrieving from storage:", error);
    return { publicParams: null };
  }
}

export async function publicKeyStorageSet(
  aclAddress: `0x${string}`,
  publicKey: FhevmStoredPublicKey | null,
  publicParams: FhevmStoredPublicParams | null
): Promise<void> {
  console.log("[PublicKeyStorage] Saving data for ACL:", aclAddress, {
    hasPublicKey: !!publicKey,
    hasPublicParams: !!publicParams
  });
  
  const db = await _getDB();
  if (!db) {
    console.warn("[PublicKeyStorage] Database not available, cannot save");
    return;
  }

  try {
    if (publicKey) {
      await db.put("publicKeyStore", { acl: aclAddress, value: publicKey });
      console.log("[PublicKeyStorage] Public key saved successfully");
    }

    if (publicParams) {
      await db.put("paramsStore", { acl: aclAddress, value: publicParams });
      console.log("[PublicKeyStorage] Public params saved successfully");
    }
  } catch (error) {
    console.error("[PublicKeyStorage] Error saving to storage:", error);
    throw error;
  }
}

// 清理存储的函数
export async function publicKeyStorageClear(): Promise<void> {
  console.log("[PublicKeyStorage] Clearing all stored data");
  
  const db = await _getDB();
  if (!db) {
    console.warn("[PublicKeyStorage] Database not available, cannot clear");
    return;
  }

  try {
    await db.clear("publicKeyStore");
    await db.clear("paramsStore");
    console.log("[PublicKeyStorage] All data cleared successfully");
  } catch (error) {
    console.error("[PublicKeyStorage] Error clearing storage:", error);
    throw error;
  }
}

