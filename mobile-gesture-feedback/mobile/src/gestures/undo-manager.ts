import type { Intent } from '../types/gesture';

export interface UndoManagerConfig {
  windowMs?: number;
  onUndo?: (undoneIntent: Intent, currentIntent: Intent) => void;
}

const DEFAULT_CONFIG = {
  windowMs: 3000, // 3 seconds per contract
};

interface UndoEntry {
  intent: Intent;
  timestamp: number;
}

export class UndoManager {
  private config: Required<UndoManagerConfig>;
  private history: UndoEntry[] = [];
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config: UndoManagerConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config } as Required<UndoManagerConfig>;
    
    // Periodic cleanup of expired entries
    this.cleanupTimer = setInterval(() => this.cleanup(), 1000);
  }

  record(intent: Intent): void {
    const entry: UndoEntry = {
      intent,
      timestamp: Date.now(),
    };

    this.history.push(entry);

    // Trigger undo if within window (per spec: cast/charge have different semantics)
    if (this.canUndo(intent)) {
      const lastEntry = this.history[this.history.length - 2];
      if (lastEntry && this.isWithinWindow(lastEntry.timestamp)) {
        this.config.onUndo?.(lastEntry.intent, intent);
      }
    }
  }

  private canUndo(intent: Intent): boolean {
    // Only certain intents support undo
    const undoableTypes = ['cast', 'rotate', 'grab', 'confirm', 'menu_select'];
    return undoableTypes.includes(intent.type);
  }

  private isWithinWindow(timestamp: number): boolean {
    return Date.now() - timestamp <= this.config.windowMs;
  }

  private cleanup(): void {
    const now = Date.now();
    this.history = this.history.filter(
      entry => now - entry.timestamp <= this.config.windowMs
    );
  }

  undo(): Intent | null {
    // Find most recent undoable intent within window
    for (let i = this.history.length - 1; i >= 0; i--) {
      if (this.canUndo(this.history[i].intent) && this.isWithinWindow(this.history[i].timestamp)) {
        const undone = this.history[i].intent;
        // Remove this and all subsequent entries
        this.history = this.history.slice(0, i);
        return undone;
      }
    }
    return null;
  }

  canUndoNow(): boolean {
    const now = Date.now();
    return this.history.some(
      entry => this.canUndo(entry.intent) && (now - entry.timestamp <= this.config.windowMs)
    );
  }

  clear(): void {
    this.history = [];
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}
