import type { Intent } from '../types/gesture';

export interface IntentQueueConfig {
  maxSize?: number;
  onOverflow?: (dropped: Intent) => void;
  onIntentEmit?: (intent: Intent) => void;
}

const DEFAULT_CONFIG = {
  maxSize: 3,
};

export class IntentQueue {
  private queue: Intent[] = [];
  private config: Required<IntentQueueConfig>;

  constructor(config: IntentQueueConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config } as Required<IntentQueueConfig>;
  }

  enqueue(intent: Intent): void {
    // Check if intent type already exists - if so, replace (best-effort per spec)
    const existingIndex = this.queue.findIndex(i => i.type === intent.type);
    
    if (existingIndex >= 0) {
      // Replace existing intent of same type
      this.queue[existingIndex] = intent;
      this.config.onIntentEmit?.(intent);
      return;
    }

    // Check for overflow
    if (this.queue.length >= this.config.maxSize) {
      // Drop oldest (drop_oldest per spec Section 4.3)
      const dropped = this.queue.shift()!;
      this.config.onOverflow?.(dropped);
    }

    this.queue.push(intent);
    this.config.onIntentEmit?.(intent);
  }

  dequeue(): Intent | undefined {
    return this.queue.shift();
  }

  peek(): Intent | undefined {
    return this.queue[0];
  }

  clear(): Intent[] {
    const items = [...this.queue];
    this.queue = [];
    return items;
  }

  size(): number {
    return this.queue.length;
  }

  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  isFull(): boolean {
    return this.queue.length >= this.config.maxSize;
  }

  getAll(): Intent[] {
    return [...this.queue];
  }
}
