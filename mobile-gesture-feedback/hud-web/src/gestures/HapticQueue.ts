/**
 * Haptic Queue Manager
 * 
 * Manages haptic feedback queue with priority, cooldown, and thermal-aware throttling.
 * Gesture → Haptic mapping per Orla's spec:
 * | Gesture    | Haptic |
 * | ---------- | ------ |
 * | tap        | light  |
 * | double_tap | double |
 * | long_press | heavy  |
 * | drag_x/y   | soft   |
 * | drag_z     | medium |
 * | pinch      | medium |
 */

import { HapticType } from './GestureRecognizer';

export interface QueuedHaptic {
  type: HapticType;
  timestamp: number;
  priority: number; // Higher = more important
  zone?: string;
}

export interface HapticQueueConfig {
  maxQueueSize: number;
  cooldownMs: number;
  thermalThrottle: boolean;
}

const DEFAULT_HAPTIC_CONFIG: HapticQueueConfig = {
  maxQueueSize: 10,
  cooldownMs: 50,  // Min time between haptics
  thermalThrottle: true,
};

/**
 * Web Vibration API wrapper with queue management
 */
export class HapticQueue {
  private queue: QueuedHaptic[] = [];
  private config: HapticQueueConfig;
  private lastHapticTime: number = 0;
  private isProcessing: boolean = false;
  private thermalEnabled: boolean = true;
  private enabled: boolean = true;

  constructor(config: Partial<HapticQueueConfig> = {}) {
    this.config = { ...DEFAULT_HAPTIC_CONFIG, ...config };
  }

  /**
   * Check if haptic feedback is available
   */
  isSupported(): boolean {
    return 'vibrate' in navigator && this.enabled;
  }

  /**
   * Enable/disable haptic feedback globally
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Set thermal throttling state (called by ThermalContext)
   */
  setThermalEnabled(enabled: boolean): void {
    this.thermalEnabled = enabled;
  }

  /**
   * Enqueue a haptic feedback request
   */
  enqueue(type: HapticType, priority: number = 0, zone?: string): void {
    if (!this.isSupported()) return;
    
    // Thermal throttling: reduce or disable haptics when hot
    if (this.config.thermalThrottle && !this.thermalEnabled) {
      // Still allow critical haptics (long_press, double_tap) at reduced intensity
      if (type !== 'heavy' && type !== 'double') {
        return; // Skip non-critical haptics
      }
    }

    const haptic: QueuedHaptic = {
      type,
      timestamp: Date.now(),
      priority,
      zone,
    };

    this.queue.push(haptic);

    // Sort by priority (descending), then by timestamp (ascending)
    this.queue.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.timestamp - b.timestamp;
    });

    // Trim queue to max size
    if (this.queue.length > this.config.maxQueueSize) {
      this.queue = this.queue.slice(0, this.config.maxQueueSize);
    }

    // Process queue
    this.processQueue();
  }

  /**
   * Process queued haptics with cooldown
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;
    
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLast = now - this.lastHapticTime;

      if (timeSinceLast < this.config.cooldownMs) {
        // Wait for cooldown
        await this.sleep(this.config.cooldownMs - timeSinceLast);
      }

      const haptic = this.queue.shift();
      if (haptic) {
        this.playHaptic(haptic.type);
        this.lastHapticTime = Date.now();
      }
    }

    this.isProcessing = false;
  }

  /**
   * Play a single haptic pattern
   */
  private playHaptic(type: HapticType): void {
    const patterns: Record<HapticType, number | number[]> = {
      light: 10,
      double: [0, 50, 50, 50],  // double tap pattern
      heavy: 100,
      soft: 20,
      medium: 50,
    };

    const pattern = patterns[type];
    if (pattern && this.enabled) {
      navigator.vibrate(pattern);
    }
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.queue = [];
  }

  /**
   * Get queue length
   */
  size(): number {
    return this.queue.length;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default HapticQueue;
