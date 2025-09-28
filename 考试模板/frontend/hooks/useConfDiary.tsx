"use client";

import { ethers } from "ethers";
import {
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { FhevmInstance } from "@/fhevm/fhevmTypes";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import { GenericStringStorage } from "@/fhevm/GenericStringStorage";

// Import the generated ABI and addresses
import { ConfDiaryAddresses } from "@/abi/ConfDiaryAddresses";
import { ConfDiaryABI } from "@/abi/ConfDiaryABI";

// Types for diary entries
export type DiaryEntry = {
  entryId: number;
  timestamp: number;
  encryptedContent?: string; // encrypted handle
  decryptedContent?: string; // decrypted content
  isOwn?: boolean; // whether this entry belongs to current user
  isDecrypted?: boolean;
};

export type ClearDiaryContent = {
  entryId: number;
  content: string;
};

type ConfDiaryInfoType = {
  abi: typeof ConfDiaryABI.abi;
  address?: `0x${string}`;
  chainId?: number;
  chainName?: string;
};

/**
 * Resolves ConfDiary contract metadata for the given EVM chainId.
 */
function getConfDiaryByChainId(
  chainId: number | undefined
): ConfDiaryInfoType {
  if (!chainId) {
    return { abi: ConfDiaryABI.abi };
  }

  const entry =
    ConfDiaryAddresses[chainId.toString() as keyof typeof ConfDiaryAddresses];

  if (!("address" in entry) || entry.address === ethers.ZeroAddress) {
    return { abi: ConfDiaryABI.abi, chainId };
  }

  return {
    address: entry?.address as `0x${string}` | undefined,
    chainId: entry?.chainId ?? chainId,
    chainName: entry?.chainName,
    abi: ConfDiaryABI.abi,
  };
}

/**
 * Main ConfDiary React hook for managing encrypted diary functionality
 */
export const useConfDiary = (parameters: {
  instance: FhevmInstance | undefined;
  fhevmDecryptionSignatureStorage: GenericStringStorage;
  eip1193Provider: ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  sameChain: RefObject<(chainId: number | undefined) => boolean>;
  sameSigner: RefObject<
    (ethersSigner: ethers.JsonRpcSigner | undefined) => boolean
  >;
}) => {
  const {
    instance,
    fhevmDecryptionSignatureStorage,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  } = parameters;

  // States
  const [publicTimeline, setPublicTimeline] = useState<DiaryEntry[]>([]);
  const [myDiaries, setMyDiaries] = useState<DiaryEntry[]>([]);
  const [decryptedContents, setDecryptedContents] = useState<Map<number, string>>(new Map());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [isDecrypting, setIsDecrypting] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [totalDiaries, setTotalDiaries] = useState<number>(0);

  // Refs for avoiding stale closures
  const confDiaryRef = useRef<ConfDiaryInfoType | undefined>(undefined);
  const isLoadingRef = useRef<boolean>(false);
  const isPublishingRef = useRef<boolean>(false);
  const isDecryptingRef = useRef<boolean>(false);

  // Contract info
  const confDiary = useMemo(() => {
    const c = getConfDiaryByChainId(chainId);
    confDiaryRef.current = c;

    if (!c.address) {
      setMessage(`ConfDiary deployment not found for chainId=${chainId}.`);
    }

    return c;
  }, [chainId]);

  // Check if deployed
  const isDeployed = useMemo(() => {
    if (!confDiary) {
      return undefined;
    }
    return Boolean(confDiary.address) && confDiary.address !== ethers.ZeroAddress;
  }, [confDiary]);

  // Can perform operations
  const canPublish = useMemo(() => {
    return confDiary.address && instance && ethersSigner && !isPublishing;
  }, [confDiary.address, instance, ethersSigner, isPublishing]);

  const canLoadTimeline = useMemo(() => {
    return confDiary.address && ethersReadonlyProvider && !isLoading;
  }, [confDiary.address, ethersReadonlyProvider, isLoading]);

  const canDecrypt = useMemo(() => {
    return confDiary.address && instance && ethersSigner && !isDecrypting;
  }, [confDiary.address, instance, ethersSigner, isDecrypting]);

  /**
   * Load public timeline - shows encrypted entries from all users
   */
  const loadPublicTimeline = useCallback(async (count: number = 10) => {
    if (isLoadingRef.current || !confDiary.address || !ethersReadonlyProvider) {
      return;
    }

    isLoadingRef.current = true;
    setIsLoading(true);
    setMessage("Loading public timeline...");

    try {
      const contract = new ethers.Contract(
        confDiary.address,
        confDiary.abi,
        ethersReadonlyProvider
      );

      // Get recent diary IDs
      const recentIds: number[] = await contract.getRecentDiaryIds(count);
      const timeline: DiaryEntry[] = [];

      // Load basic info for each diary
      for (const entryId of recentIds) {
        try {
          const [timestamp, exists] = await contract.getDiaryInfo(entryId);
          if (exists) {
            timeline.push({
              entryId: Number(entryId),
              timestamp: Number(timestamp),
              isOwn: false,
              isDecrypted: false,
            });
          }
        } catch (error) {
          console.warn(`Failed to load diary ${entryId}:`, error);
        }
      }

      setPublicTimeline(timeline);
      setMessage(`Loaded ${timeline.length} diary entries`);
    } catch (error) {
      console.error("Failed to load public timeline:", error);
      setMessage("Failed to load public timeline");
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [confDiary.address, confDiary.abi, ethersReadonlyProvider]);

  /**
   * Load user's own diaries
   */
  const loadMyDiaries = useCallback(async () => {
    if (isLoadingRef.current || !confDiary.address || !ethersReadonlyProvider || !ethersSigner) {
      return;
    }

    isLoadingRef.current = true;
    setIsLoading(true);
    setMessage("Loading my diaries...");

    try {
      const contract = new ethers.Contract(
        confDiary.address,
        confDiary.abi,
        ethersReadonlyProvider
      );

      // Get user's diary IDs
      const userDiaryIds: number[] = await contract.getUserDiaryIds(ethersSigner.address);
      const myDiaryList: DiaryEntry[] = [];

      // Load info for each diary
      for (const entryId of userDiaryIds) {
        try {
          const [timestamp, exists] = await contract.getDiaryInfo(entryId);
          if (exists) {
            myDiaryList.push({
              entryId: Number(entryId),
              timestamp: Number(timestamp),
              isOwn: true,
              isDecrypted: false,
            });
          }
        } catch (error) {
          console.warn(`Failed to load my diary ${entryId}:`, error);
        }
      }

      // Sort by timestamp (newest first)
      myDiaryList.sort((a, b) => b.timestamp - a.timestamp);

      setMyDiaries(myDiaryList);
      setMessage(`Loaded ${myDiaryList.length} of my diary entries`);
    } catch (error) {
      console.error("Failed to load my diaries:", error);
      setMessage("Failed to load my diaries");
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [confDiary.address, confDiary.abi, ethersReadonlyProvider, ethersSigner]);

  /**
   * Publish a new diary entry
   */
  const publishDiary = useCallback(async (content: string) => {
    if (isPublishingRef.current || !confDiary.address || !instance || !ethersSigner) {
      return;
    }

    if (!content.trim()) {
      setMessage("Diary content cannot be empty");
      return;
    }

    isPublishingRef.current = true;
    setIsPublishing(true);
    setMessage("Publishing diary...");

    const thisChainId = chainId;
    const thisConfDiaryAddress = confDiary.address;
    const thisEthersSigner = ethersSigner;

    try {
      // Create encrypted input buffer
      const input = instance.createEncryptedInput(
        thisConfDiaryAddress,
        thisEthersSigner.address
      );

      // Convert content to a hash for storage (since we can't store large strings directly)
      const contentHash = ethers.keccak256(ethers.toUtf8Bytes(content));
      const contentHashBigInt = BigInt(contentHash);

      // Add encrypted content hash and author address
      input.add128(contentHashBigInt);
      input.addAddress(thisEthersSigner.address);

      // Let browser repaint before CPU-intensive encryption
      await new Promise((resolve) => setTimeout(resolve, 100));

      const enc = await input.encrypt();

      // Check if operation is still valid
      const isStale = () =>
        thisConfDiaryAddress !== confDiaryRef.current?.address ||
        !sameChain.current(thisChainId) ||
        !sameSigner.current(thisEthersSigner);

      if (isStale()) {
        setMessage("Publish operation cancelled");
        return;
      }

      setMessage("Submitting to blockchain...");

      // Create contract instance
      const contract = new ethers.Contract(
        thisConfDiaryAddress,
        confDiary.abi,
        thisEthersSigner
      );

      // Call publishDiary function
      const tx = await contract.publishDiary(
        enc.handles[0], // encrypted content hash
        enc.inputProof,
        enc.handles[1], // encrypted author address
        enc.inputProof
      );

      setMessage(`Waiting for transaction: ${tx.hash}...`);

      const receipt = await tx.wait();

      setMessage(`Diary published successfully! Status: ${receipt?.status}`);

      if (isStale()) {
        return;
      }

      // Store the original content locally for decryption
      // In a real app, you might want to store this more securely
      const newEntryId = totalDiaries; // Assuming this is the next ID
      setDecryptedContents(prev => new Map(prev.set(newEntryId, content)));

      // Refresh the data
      await loadMyDiaries();
      await loadPublicTimeline();

    } catch (error) {
      console.error("Failed to publish diary:", error);
      setMessage(`Failed to publish diary: ${error.message}`);
    } finally {
      isPublishingRef.current = false;
      setIsPublishing(false);
    }
  }, [
    confDiary.address,
    confDiary.abi,
    instance,
    ethersSigner,
    chainId,
    totalDiaries,
    sameChain,
    sameSigner,
    loadMyDiaries,
    loadPublicTimeline,
  ]);

  /**
   * Decrypt a diary entry (only works if user has permission)
   */
  const decryptDiary = useCallback(async (entryId: number) => {
    if (isDecryptingRef.current || !confDiary.address || !instance || !ethersSigner) {
      return;
    }

    // Check if already decrypted
    if (decryptedContents.has(entryId)) {
      return decryptedContents.get(entryId);
    }

    isDecryptingRef.current = true;
    setIsDecrypting(true);
    setMessage(`Decrypting diary entry ${entryId}...`);

    const thisChainId = chainId;
    const thisConfDiaryAddress = confDiary.address;
    const thisEthersSigner = ethersSigner;

    try {
      // Get decryption signature
      const sig = await FhevmDecryptionSignature.loadOrSign(
        instance,
        [confDiary.address as `0x${string}`],
        ethersSigner,
        fhevmDecryptionSignatureStorage
      );

      if (!sig) {
        setMessage("Unable to build FHEVM decryption signature");
        return;
      }

      const isStale = () =>
        thisConfDiaryAddress !== confDiaryRef.current?.address ||
        !sameChain.current(thisChainId) ||
        !sameSigner.current(thisEthersSigner);

      if (isStale()) {
        setMessage("Decryption operation cancelled");
        return;
      }

      // Get encrypted content handle from contract
      const contract = new ethers.Contract(
        thisConfDiaryAddress,
        confDiary.abi,
        ethersReadonlyProvider
      );

      const encryptedContentHandle = await contract.getDiaryContent(entryId);

      setMessage("Performing FHEVM decryption...");

      // Decrypt the content
      const res = await instance.userDecrypt(
        [{ handle: encryptedContentHandle, contractAddress: thisConfDiaryAddress }],
        sig.privateKey,
        sig.publicKey,
        sig.signature,
        sig.contractAddresses,
        sig.userAddress,
        sig.startTimestamp,
        sig.durationDays
      );

      if (isStale()) {
        setMessage("Decryption operation cancelled");
        return;
      }

      const decryptedHash = res[encryptedContentHandle];
      
      // In a real implementation, you would need to map the hash back to content
      // For now, we'll use a placeholder
      const decryptedContent = `Decrypted content hash: ${decryptedHash}`;

      // Store decrypted content
      setDecryptedContents(prev => new Map(prev.set(entryId, decryptedContent)));

      setMessage(`Successfully decrypted diary entry ${entryId}`);

      return decryptedContent;

    } catch (error) {
      console.error(`Failed to decrypt diary ${entryId}:`, error);
      setMessage(`Failed to decrypt diary entry: ${error.message}`);
      return null;
    } finally {
      isDecryptingRef.current = false;
      setIsDecrypting(false);
    }
  }, [
    confDiary.address,
    confDiary.abi,
    instance,
    ethersSigner,
    ethersReadonlyProvider,
    fhevmDecryptionSignatureStorage,
    chainId,
    decryptedContents,
    sameChain,
    sameSigner,
  ]);

  /**
   * Load total diaries count
   */
  const loadTotalDiaries = useCallback(async () => {
    if (!confDiary.address || !ethersReadonlyProvider) {
      return;
    }

    try {
      const contract = new ethers.Contract(
        confDiary.address,
        confDiary.abi,
        ethersReadonlyProvider
      );

      const total = await contract.getTotalDiaries();
      setTotalDiaries(Number(total));
    } catch (error) {
      console.error("Failed to load total diaries:", error);
    }
  }, [confDiary.address, confDiary.abi, ethersReadonlyProvider]);

  // Auto-load data when contract is available
  useEffect(() => {
    if (confDiary.address && ethersReadonlyProvider) {
      loadTotalDiaries();
      loadPublicTimeline();
    }
  }, [confDiary.address, ethersReadonlyProvider, loadTotalDiaries, loadPublicTimeline]);

  // Auto-load user's diaries when signer is available
  useEffect(() => {
    if (confDiary.address && ethersReadonlyProvider && ethersSigner) {
      loadMyDiaries();
    }
  }, [confDiary.address, ethersReadonlyProvider, ethersSigner, loadMyDiaries]);

  return {
    // Contract info
    contractAddress: confDiary.address,
    isDeployed,

    // Data
    publicTimeline,
    myDiaries,
    decryptedContents,
    totalDiaries,

    // States
    isLoading,
    isPublishing,
    isDecrypting,
    message,

    // Capabilities
    canPublish,
    canLoadTimeline,
    canDecrypt,

    // Actions
    publishDiary,
    decryptDiary,
    loadPublicTimeline,
    loadMyDiaries,
    loadTotalDiaries,

    // Utilities
    getDecryptedContent: (entryId: number) => decryptedContents.get(entryId),
    isEntryDecrypted: (entryId: number) => decryptedContents.has(entryId),
  };
};
