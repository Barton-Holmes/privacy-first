//////////////////////////////////////////////////////////////////////////
//
// WARNING!!
// ALWAYS USE DYNAMIC IMPORT FOR THIS FILE TO AVOID INCLUDING THE ENTIRE 
// FHEVM MOCK LIB IN THE FINAL PRODUCTION BUNDLE!!
//
//////////////////////////////////////////////////////////////////////////

import { JsonRpcProvider } from "ethers";
import { MockFhevmInstance } from "@fhevm/mock-utils";
import { FhevmInstance } from "../../fhevmTypes";

export const fhevmMockCreateInstance = async (parameters: {
  rpcUrl: string;
  chainId: number;
  metadata: {
    ACLAddress: `0x${string}`;
    InputVerifierAddress: `0x${string}`;
    KMSVerifierAddress: `0x${string}`;
  };
}): Promise<FhevmInstance> => {
  const provider = new JsonRpcProvider(parameters.rpcUrl);
  
  console.log("[fhevmMock] Creating MockFhevmInstance with config:", {
    rpcUrl: parameters.rpcUrl,
    chainId: parameters.chainId,
    aclContractAddress: parameters.metadata.ACLAddress,
    inputVerifierContractAddress: parameters.metadata.InputVerifierAddress,
    kmsContractAddress: parameters.metadata.KMSVerifierAddress,
  });
  
  const instance = await MockFhevmInstance.create(provider, provider, {
    aclContractAddress: parameters.metadata.ACLAddress,
    chainId: parameters.chainId,
    gatewayChainId: 55815,
    inputVerifierContractAddress: parameters.metadata.InputVerifierAddress,
    kmsContractAddress: parameters.metadata.KMSVerifierAddress,
    verifyingContractAddressDecryption: "0x5ffdaAB0373E62E2ea2944776209aEf29E631A64",
    verifyingContractAddressInputVerification: "0x812b06e1CDCE800494b79fFE4f925A504a9A9810",
  });
  
  console.log("[fhevmMock] MockFhevmInstance created successfully");
  // 提供与 FhevmInstance 对齐的 decryptPublic 兼容实现
  const compat: FhevmInstance = {
    ...(instance as any),
    decryptPublic: async (contractAddress: string, handle: string): Promise<string | bigint | boolean> => {
      if (typeof (instance as any).decryptPublic === "function") {
        return await (instance as any).decryptPublic(contractAddress, handle);
      }
      console.warn("[fhevmMock] decryptPublic not available on mock, returning empty string");
      return "";
    },
  };

  return compat;
};

