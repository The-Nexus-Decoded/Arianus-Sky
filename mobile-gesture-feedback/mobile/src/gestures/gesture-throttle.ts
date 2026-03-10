import type { GestureData } from '../types/gesture';

export interface GestureThrottleConfig {
  hz?: number;
  onThrottledEmit?: (data: GestureData) => void;
}

const DEFAULT_CONFIG = {
  hz: 10, // 10Hz per spec Section 1.5
};

export class GestureThrottle {
  private config: Required<GestureThrottleConfig>;
  private lastEmitTime: number = 0;
  private pendingData: GestureData | null = null;
  private emitTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly intervalMs: number;

  constructor(config: GestureThrottleConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config } as Required<GestureThrottleConfig>;
    this.intervalMs = 1000 / this.config.hz;
  }

  emit(data: GestureData): void {
    const now = Date.now();
    const timeSinceLastEmit = now - this.lastEmitTime;

    if (timeSinceLastEmit >= this.intervalMs) {
      // Can emit immediately
      this.doEmit(data);
    } else {
      // Queue for throttled emit
      this.pendingData = data;
      
      if (this.emitTimer) {
        clearTimeout(this.emitTimer);
      }

      this.emitTimer = setTimeout(() => {
        this.emitTimer = null;
        if (this.pendingData) {
          this.doEmit(this.pendingData);
          this.pendingData = null;
        }
      }, this.intervalMs - timeSinceLastEmit);
    }
  }

  private doEmit(data: GestureData): void {
    this.lastEmitTime = Date.now();
    this.config.onThrottledEmit?.(data);
  }

  flush(): void {
    if (Timer) {
     this.emit clearTimeout(this.emitTimer);
      this.emitTimer = null;
    }
    if (this.pendingData) {
      this.doEmit(this.pendingData);
      this.pendingData = null;
    }
  }

  getLastEmitTime(): number {
    return this.lastEmitTime;
  }

  destroy(): void {
    if (this.emitTimer) {
      clearTimeout(this.emitTimer);
      this.emitTimer = null;
    }
  }
}
