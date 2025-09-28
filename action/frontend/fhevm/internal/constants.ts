// SDK CDN配置
export const SDK_CDN_URL = "https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.umd.cjs";

// 默认配置
export const DEFAULT_CONFIG = {
  SEPOLIA_CHAIN_ID: 11155111,
  LOCAL_CHAIN_ID: 31337,
  LOCAL_RPC_URL: "http://localhost:8545",
  GATEWAY_CHAIN_ID: 55815,
  RELAYER_URL: "https://relayer.testnet.zama.cloud",
};

// 错误消息
export const ERROR_MESSAGES = {
  SDK_LOAD_FAILED: "Failed to load FHEVM Relayer SDK",
  SDK_INIT_FAILED: "Failed to initialize FHEVM SDK", 
  INSTANCE_CREATE_FAILED: "Failed to create FHEVM instance",
  NETWORK_ERROR: "Network error occurred",
  METAMASK_NOT_FOUND: "MetaMask not found",
  WALLET_CONNECTION_FAILED: "Wallet connection failed",
  ENCRYPTION_FAILED: "Encryption operation failed",
  DECRYPTION_FAILED: "Decryption operation failed",
  SIGNATURE_FAILED: "Signature operation failed",
  CONTRACT_CALL_FAILED: "Contract call failed",
  INVALID_EXAM_ID: "Invalid exam ID",
  EXAM_NOT_FOUND: "Exam not found",
  ACCESS_DENIED: "Access denied",
  EXAM_NOT_STARTED: "Exam has not started yet",
  EXAM_ENDED: "Exam has ended",
  ALREADY_SUBMITTED: "Already submitted",
  NOT_AUTHORIZED: "Not authorized",
} as const;

// 存储键
export const STORAGE_KEYS = {
  PUBLIC_KEY: "fhevm_public_key",
  PUBLIC_PARAMS: "fhevm_public_params", 
  DECRYPTION_SIGNATURE: "fhevm_decryption_signature",
  USER_PREFERENCES: "user_preferences",
  EXAM_DRAFTS: "exam_drafts",
} as const;

// 时间常量
export const TIME_CONSTANTS = {
  SIGNATURE_DURATION_DAYS: 365,
  ENCRYPTION_DELAY_MS: 100,
  POLLING_INTERVAL_MS: 5000,
  TIMEOUT_MS: 30000,
} as const;

