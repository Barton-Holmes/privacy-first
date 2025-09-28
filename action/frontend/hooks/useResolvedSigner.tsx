"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";

export function useResolvedSigner(signerPromise: Promise<ethers.JsonRpcSigner> | ethers.JsonRpcSigner | undefined) {
  const [resolvedSigner, setResolvedSigner] = useState<ethers.JsonRpcSigner | undefined>(undefined);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    if (!signerPromise) {
      setResolvedSigner(undefined);
      return;
    }

    // 如果已经是resolved的signer
    if (signerPromise instanceof ethers.JsonRpcSigner) {
      setResolvedSigner(signerPromise);
      return;
    }

    // 如果是Promise，需要resolve
    if (signerPromise instanceof Promise) {
      setIsResolving(true);
      signerPromise
        .then((signer) => {
          setResolvedSigner(signer);
          setIsResolving(false);
        })
        .catch((error) => {
          console.error("Failed to resolve signer:", error);
          setResolvedSigner(undefined);
          setIsResolving(false);
        });
    }
  }, [signerPromise]);

  return {
    signer: resolvedSigner,
    isResolving,
  };
}

