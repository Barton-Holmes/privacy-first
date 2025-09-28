// This file is auto-generated. Do not edit manually.
// Generated from deployment artifacts

export const AnonExamAddresses = {
  "31337": {
    "address": "0x322813Fd9A801c5507c9de605d63CEA4f2CE6c44",
    "chainId": 31337,
    "chainName": "Localhost",
    "blockNumber": 1,
    "transactionHash": "0x"
  },
  "11155111": {
    "address": "0x2da25F9be5F874F6A14ADa63a206C2B9e6f4b199",
    "chainId": 11155111,
    "chainName": "Sepolia",
    "blockNumber": 0,
    "transactionHash": "0xed299b55e09dd161386c4aaf93dd4c4da3dda1cc9a2438f3614bd0d9b4a6a20f"
  }
} as const;

export type AnonExamAddressesType = typeof AnonExamAddresses;

// 辅助函数：根据链ID获取合约地址
export function getAnonExamAddress(chainId: number): string | undefined {
  const chainIdStr = chainId.toString() as keyof typeof AnonExamAddresses;
  const entry = AnonExamAddresses[chainIdStr];
  return entry && 'address' in entry ? entry.address : undefined;
}

// 辅助函数：检查链是否支持
export function isSupportedChain(chainId: number): boolean {
  return chainId.toString() in AnonExamAddresses;
}

// 支持的链ID列表
export const SUPPORTED_CHAIN_IDS = Object.keys(AnonExamAddresses).map(Number);
