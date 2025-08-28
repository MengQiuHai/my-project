import { createClient, RedisClientType } from 'redis';

class RedisClient {
  private static instance: RedisClient;
  private client: RedisClientType | null = null;
  private isRedisAvailable = false;

  private constructor() {
    this.initializeClient();
  }

  private async initializeClient() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.client = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 5000,
          lazyConnect: true,
        },
        retry_unfulfilled_commands: false,
      });

      this.client.on('error', (err) => {
        console.warn('Redis Client Error (Redis is optional):', err.message);
        this.isRedisAvailable = false;
      });

      this.client.on('connect', () => {
        console.log('Redis Client Connected');
        this.isRedisAvailable = true;
      });

      this.client.on('disconnect', () => {
        console.log('Redis Client Disconnected');
        this.isRedisAvailable = false;
      });
    } catch (error) {
      console.warn('Redis initialization failed (continuing without Redis):', error);
      this.isRedisAvailable = false;
    }
  }

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  public async connect(): Promise<void> {
    if (!this.client) {
      console.warn('Redis client not initialized');
      return;
    }

    try {
      if (!this.client.isOpen) {
        await this.client.connect();
        this.isRedisAvailable = true;
      }
    } catch (error) {
      console.warn('Redis connection failed (continuing without Redis):', error);
      this.isRedisAvailable = false;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.client && this.client.isOpen) {
        await this.client.disconnect();
      }
    } catch (error) {
      console.warn('Redis disconnect error:', error);
    }
    this.isRedisAvailable = false;
  }

  public getClient(): RedisClientType | null {
    return this.client;
  }

  public isAvailable(): boolean {
    return this.isRedisAvailable && this.client?.isOpen === true;
  }

  // Safe Redis operations with fallback
  public async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.isAvailable()) {
      console.warn('Redis not available, skipping set operation');
      return;
    }

    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      if (ttl) {
        await this.client!.setEx(key, ttl, stringValue);
      } else {
        await this.client!.set(key, stringValue);
      }
    } catch (error) {
      console.warn('Redis set operation failed:', error);
    }
  }

  public async get(key: string): Promise<any> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const value = await this.client!.get(key);
      if (!value) return null;
      
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      console.warn('Redis get operation failed:', error);
      return null;
    }
  }

  public async del(key: string): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    try {
      await this.client!.del(key);
    } catch (error) {
      console.warn('Redis del operation failed:', error);
    }
  }

  public async exists(key: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const result = await this.client!.exists(key);
      return result === 1;
    } catch (error) {
      console.warn('Redis exists operation failed:', error);
      return false;
    }
  }
}

export default RedisClient;