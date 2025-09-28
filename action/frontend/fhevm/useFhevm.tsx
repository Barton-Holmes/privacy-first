import { ethers } from "ethers";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FhevmInstance } from "./fhevmTypes";
import { createFhevmInstance } from "./internal/fhevm";

function _assert(condition: boolean, message?: string): asserts condition {
  if (!condition) {
    const m = message ? `Assertion failed: ${message}` : `Assertion failed.`;
    console.error(m);
    throw new Error(m);
  }
}

export type FhevmGoState = "idle" | "loading" | "ready" | "error";

export function useFhevm(parameters: {
  provider: string | ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  enabled?: boolean;
  initialMockChains?: Readonly<Record<number, string>>;
}): {
  instance: FhevmInstance | undefined;
  refresh: () => void;
  error: Error | undefined;
  status: FhevmGoState;
} {
  const { provider, chainId, initialMockChains, enabled = true } = parameters;

  const [instance, _setInstance] = useState<FhevmInstance | undefined>(undefined);
  const [status, _setStatus] = useState<FhevmGoState>("idle");
  const [error, _setError] = useState<Error | undefined>(undefined);
  const [_isRunning, _setIsRunning] = useState<boolean>(enabled);
  const [_providerChanged, _setProviderChanged] = useState<number>(0);
  
  const _abortControllerRef = useRef<AbortController | null>(null);
  const _providerRef = useRef<string | ethers.Eip1193Provider | undefined>(provider);
  const _chainIdRef = useRef<number | undefined>(chainId);
  const _mockChainsRef = useRef<Record<number, string> | undefined>(initialMockChains);

  const refresh = useCallback(() => {
    console.log("[useFhevm] Refresh called");
    
    // 取消之前的操作
    if (_abortControllerRef.current) {
      console.log("[useFhevm] Aborting previous operation");
      _providerRef.current = undefined;
      _chainIdRef.current = undefined;
      _abortControllerRef.current.abort();
      _abortControllerRef.current = null;
    }

    // 更新引用
    _providerRef.current = provider;
    _chainIdRef.current = chainId;

    // 重置状态
    _setInstance(undefined);
    _setError(undefined);
    _setStatus("idle");

    if (provider !== undefined) {
      _setProviderChanged((prev) => prev + 1);
    }
  }, [provider, chainId]);

  // 主要的初始化effect
  useEffect(() => {
    refresh();
  }, [refresh]);

  // 启用/禁用effect
  useEffect(() => {
    _setIsRunning(enabled);
  }, [enabled]);

  // 主要的实例创建effect
  useEffect(() => {
    if (_isRunning === false) {
      console.log("[useFhevm] FHEVM disabled, cancelling operations");
      if (_abortControllerRef.current) {
        _abortControllerRef.current.abort();
        _abortControllerRef.current = null;
      }
      _setInstance(undefined);
      _setError(undefined);
      _setStatus("idle");
      return;
    }

    if (_isRunning === true) {
      if (_providerRef.current === undefined) {
        _setInstance(undefined);
        _setError(undefined);
        _setStatus("idle");
        return;
      }

      if (!_abortControllerRef.current) {
        _abortControllerRef.current = new AbortController();
      }

      _assert(
        !_abortControllerRef.current.signal.aborted,
        "AbortController signal should not be aborted"
      );

      _setStatus("loading");
      _setError(undefined);

      const thisSignal = _abortControllerRef.current.signal;
      const thisProvider = _providerRef.current;
      const thisRpcUrlsByChainId = _mockChainsRef.current;

      console.log("[useFhevm] Starting FHEVM instance creation", {
        provider: typeof thisProvider === 'string' ? thisProvider : 'EIP1193Provider',
        chainId: _chainIdRef.current,
        mockChains: thisRpcUrlsByChainId
      });

      createFhevmInstance({
        signal: thisSignal,
        provider: thisProvider,
        mockChains: thisRpcUrlsByChainId,
        onStatusChange: (s) =>
          console.log(`[useFhevm] Instance creation status: ${s}`),
      })
        .then((i) => {
          console.log(`[useFhevm] FHEVM instance created successfully`);
          if (thisSignal.aborted) return;

          _assert(
            thisProvider === _providerRef.current,
            "Provider reference should match"
          );

          _setInstance(i);
          _setError(undefined);
          _setStatus("ready");
        })
        .catch((e) => {
          console.error(`[useFhevm] Instance creation failed:`, e);
          if (thisSignal.aborted) return;

          _assert(
            thisProvider === _providerRef.current,
            "Provider reference should match"
          );

          _setInstance(undefined);
          _setError(e);
          _setStatus("error");
        });
    }
  }, [_isRunning, _providerChanged]);

  return { instance, refresh, error, status };
}

