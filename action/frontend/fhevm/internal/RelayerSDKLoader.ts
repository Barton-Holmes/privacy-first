import { SDK_CDN_URL, ERROR_MESSAGES } from "./constants";
import { FhevmWindowType } from "../fhevmTypes";

type TraceType = (message: string, ...args: any[]) => void;

// 类型守卫函数
function isFhevmWindowType(window: Window, trace?: TraceType): window is FhevmWindowType {
  const isValid = "relayerSDK" in window && 
    typeof window.relayerSDK === "object" &&
    window.relayerSDK !== null &&
    "initSDK" in window.relayerSDK &&
    "createInstance" in window.relayerSDK &&
    "SepoliaConfig" in window.relayerSDK;
    
  if (trace && !isValid) {
    trace("[RelayerSDKLoader] Window object validation failed");
  }
  
  return isValid;
}

function isFhevmRelayerSDKType(relayerSDK: any, trace?: TraceType): boolean {
  const isValid = relayerSDK &&
    typeof relayerSDK.initSDK === "function" &&
    typeof relayerSDK.createInstance === "function" &&
    typeof relayerSDK.SepoliaConfig === "object";
    
  if (trace && !isValid) {
    trace("[RelayerSDKLoader] RelayerSDK object validation failed");
  }
  
  return isValid;
}

export class RelayerSDKLoader {
  private trace?: TraceType;

  constructor(options: { trace?: TraceType } = {}) {
    this.trace = options.trace;
  }

  public load(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.trace?.("[RelayerSDKLoader] Starting SDK load process");

      // 检查是否已经加载
      if ("relayerSDK" in window) {
        this.trace?.("[RelayerSDKLoader] SDK already exists in window");
        
        if (!isFhevmRelayerSDKType(window.relayerSDK, this.trace)) {
          reject(new Error("Invalid SDK object in window"));
          return;
        }
        
        this.trace?.("[RelayerSDKLoader] SDK validation passed, resolving");
        resolve();
        return;
      }

      this.trace?.("[RelayerSDKLoader] Loading SDK from CDN:", SDK_CDN_URL);

      // 创建script标签动态加载
      const script = document.createElement("script");
      script.src = SDK_CDN_URL;
      script.type = "text/javascript";
      script.async = true;

      script.onload = () => {
        this.trace?.("[RelayerSDKLoader] Script loaded successfully");
        
        if (!isFhevmWindowType(window, this.trace)) {
          reject(new Error("window.relayerSDK object is invalid after script load"));
          return;
        }
        
        this.trace?.("[RelayerSDKLoader] SDK loaded and validated successfully");
        resolve();
      };

      script.onerror = (error) => {
        this.trace?.("[RelayerSDKLoader] Script load failed:", error);
        reject(new Error(`${ERROR_MESSAGES.SDK_LOAD_FAILED} from ${SDK_CDN_URL}`));
      };

      // 添加超时处理
      const timeout = setTimeout(() => {
        this.trace?.("[RelayerSDKLoader] Script load timeout");
        document.head.removeChild(script);
        reject(new Error(`${ERROR_MESSAGES.SDK_LOAD_FAILED}: timeout`));
      }, 30000); // 30秒超时

      script.onload = (originalOnLoad => (event) => {
        clearTimeout(timeout);
        originalOnLoad(event);
      })(script.onload as any);

      script.onerror = (originalOnError => (event) => {
        clearTimeout(timeout);
        originalOnError(event);
      })(script.onerror as any);

      document.head.appendChild(script);
    });
  }
}

