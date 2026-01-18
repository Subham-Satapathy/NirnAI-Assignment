import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createHash } from 'crypto';
import Redis from 'ioredis';
import { ExtractedTransaction } from './pdf-parser.service';

interface CacheEntry {
  hash: string;
  transactions: ExtractedTransaction[];
  timestamp: number;
  fileName: string;
}

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis;
  private readonly TTL = 24 * 60 * 60; // 24 hours in seconds

  async onModuleInit() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.redis = new Redis(redisUrl, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    this.redis.on('connect', () => {
      console.log('[REDIS] Redis connected successfully');
    });

    this.redis.on('error', (err) => {
      console.error('[REDIS ERROR] Redis connection error:', err.message);
    });
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  /**
   * Generate a hash from PDF buffer
   */
  generateHash(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Get cached extraction results if available and not expired
   */
  async get(hash: string): Promise<ExtractedTransaction[] | null> {
    try {
      const cached = await this.redis.get(`pdf:${hash}`);
      
      if (!cached) {
        return null;
      }

      const entry: CacheEntry = JSON.parse(cached);
      console.log(`[CACHE HIT] Cache HIT for file: ${entry.fileName} (${entry.transactions.length} transactions)`);
      return entry.transactions;
    } catch (error) {
      console.error('[REDIS ERROR] Redis get error:', error.message);
      return null;
    }
  }

  /**
   * Store extraction results in cache
   */
  async set(hash: string, transactions: ExtractedTransaction[], fileName: string): Promise<void> {
    try {
      const entry: CacheEntry = {
        hash,
        transactions,
        timestamp: Date.now(),
        fileName,
      };

      await this.redis.setex(`pdf:${hash}`, this.TTL, JSON.stringify(entry));
      console.log(`[CACHE SAVE] Cached extraction results for: ${fileName} (${transactions.length} transactions)`);
    } catch (error) {
      console.error('[REDIS ERROR] Redis set error:', error.message);
    }
  }

  /**
   * Check if a hash exists in cache
   */
  async has(hash: string): Promise<boolean> {
    try {
      const exists = await this.redis.exists(`pdf:${hash}`);
      return exists === 1;
    } catch (error) {
      console.error('[REDIS ERROR] Redis exists error:', error.message);
      return false;
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      const keys = await this.redis.keys('pdf:*');
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      console.log('[CACHE] Cache cleared');
    } catch (error) {
      console.error('[REDIS ERROR] Redis clear error:', error.message);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    try {
      const keys = await this.redis.keys('pdf:*');
      const entries = [];

      for (const key of keys) {
        const cached = await this.redis.get(key);
        if (cached) {
          const entry: CacheEntry = JSON.parse(cached);
          entries.push({
            fileName: entry.fileName,
            transactionCount: entry.transactions.length,
            age: Math.floor((Date.now() - entry.timestamp) / 1000 / 60), // minutes
          });
        }
      }

      return {
        size: keys.length,
        entries,
      };
    } catch (error) {
      console.error('[REDIS ERROR] Redis stats error:', error.message);
      return { size: 0, entries: [] };
    }
  }

  /**
   * Clean up expired entries (handled automatically by Redis TTL)
   */
  async cleanup(): Promise<void> {
    console.log('ℹ️  Redis handles TTL cleanup automatically');
  }
}
