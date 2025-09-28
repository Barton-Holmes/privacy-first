// 通用字符串存储接口
export interface GenericStringStorage {
  getItem(key: string): string | Promise<string | null> | null;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}

// 内存存储实现
export class GenericStringInMemoryStorage implements GenericStringStorage {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  // 额外方法：清空存储
  clear(): void {
    this.store.clear();
  }

  // 额外方法：获取所有键
  keys(): string[] {
    return Array.from(this.store.keys());
  }

  // 额外方法：获取存储大小
  size(): number {
    return this.store.size;
  }
}

// LocalStorage适配器
export class GenericStringLocalStorage implements GenericStringStorage {
  private prefix: string;

  constructor(prefix: string = 'anonexam_') {
    this.prefix = prefix;
  }

  getItem(key: string): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.prefix + key);
  }

  setItem(key: string, value: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.prefix + key, value);
  }

  removeItem(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.prefix + key);
  }

  // 额外方法：清空带前缀的存储
  clear(): void {
    if (typeof window === 'undefined') return;
    
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
}

