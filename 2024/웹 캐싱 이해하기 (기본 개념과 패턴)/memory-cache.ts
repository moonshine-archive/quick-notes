interface CacheItem<T> {
  value: T;
  expiry: number;
}

type CacheData = {
  [key: string]: CacheItem<any>;
};

class MemoryCache {
  private data: CacheData = {};

  public set<T>(key: string, value: T, ttl: number): void {
    this.data[key] = {
      value,
      expiry: Date.now() + ttl,
    };
  }

  public get<T>(key: string): T | null {
    const item = this.data[key];

    if (this.isValidCacheItem<T>(item)) {
      return item.value;
    }

    return null;
  }

  private isValidCacheItem<T>(
    item: CacheItem<T> | undefined
  ): item is CacheItem<T> {
    return item !== undefined && item.expiry > Date.now();
  }

  public remove(key: string): void {
    delete this.data[key];
  }

  public clear(): void {
    this.data = {};
  }

  public keys(): string[] {
    return Object.keys(this.data);
  }
}

// Usage example
const memoryCache = new MemoryCache();

// Type inference works here
memoryCache.set("user", { name: "John" }, 60000); // Cache for 1 minute

// Type safety: TypeScript knows the type of 'user' is { name: string } | null
const user = memoryCache.get<{ name: string }>("user");

if (user) {
  console.log(user.name); // TypeScript knows 'name' exists
} else {
  console.log("User not found or expired");
}

// Additional usage examples
memoryCache.set<number>("count", 42, 30000); // Cache for 30 seconds
const count = memoryCache.get<number>("count");
console.log(count); // 42 or null

memoryCache.remove("user");
console.log(memoryCache.keys()); // ['count']

memoryCache.clear();
console.log(memoryCache.keys()); // []
