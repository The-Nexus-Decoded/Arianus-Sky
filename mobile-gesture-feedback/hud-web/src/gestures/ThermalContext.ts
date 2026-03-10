/**
 * Thermal Context Manager
 * 
 * Proactive thermal management for mobile XR.
 * Thresholds from Orla's spec (Section 3):
 * | Tier | Chip Temp | UI Actions | Haptic |
 * |------|-----------|------------|--------|
 * | 0    | <40°C     | Full fidelity | All enabled |
 * | 1    | 40–55°C   | Reduce particles, keep shaders | All enabled |
 * | 2    | 55–70°C   | Simplify shaders, reduce animations | All enabled |
 * | 3    | 70–85°C   | Flat colors, no blur, static UI | Reduced intensity |
 * | 4    | 85°C+     | Minimal mode — single surface | Disabled |
 */

export type ThermalTier = 0 | 1 | 2 | 3 | 4;

export interface ThermalState {
  tier: ThermalTier;
  chipTemp: number;
  timestamp: number;
}

export interface ThermalConfig {
  tiers: {
    0: { maxTemp: number; actions: string[]; hapticEnabled: boolean };
    1: { maxTemp: number; actions: string[]; hapticEnabled: boolean };
    2: { maxTemp: number; actions: string[]; hapticEnabled: boolean };
    3: { maxTemp: number; actions: string[]; hapticEnabled: boolean };
    4: { maxTemp: number; actions: string[]; hapticEnabled: boolean };
  };
  cooldownMs: number;  // De-escalation cooldown (5s per spec)
  pollingIntervalMs: number;  // 1s per spec
}

export const DEFAULT_THERMAL_CONFIG: ThermalConfig = {
  tiers: {
    0: { maxTemp: 40, actions: [], hapticEnabled: true },
    1: { maxTemp: 55, actions: ['reduce_particles'], hapticEnabled: true },
    2: { maxTemp: 70, actions: ['simplify_shaders', 'reduce_animations'], hapticEnabled: true },
    3: { maxTemp: 85, actions: ['flat_colors', 'no_blur', 'static_ui'], hapticEnabled: false },
    4: { maxTemp: Infinity, actions: ['minimal_mode'], hapticEnabled: false },
  },
  cooldownMs: 5000,
  pollingIntervalMs: 1000,
};

export type ThermalChangeCallback = (state: ThermalState, prevTier: ThermalTier) => void;

export class ThermalContext {
  private config: ThermalConfig;
  private currentTier: ThermalTier = 0;
  private lastTierChangeTime: number = 0;
  private listeners: ThermalChangeCallback[] = [];
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private getTempFn: () => Promise<number>;

  constructor(
    getTempFn: () => Promise<number>,
    config: Partial<ThermalConfig> = {}
  ) {
    this.getTempFn = getTempFn;
    this.config = { ...DEFAULT_THERMAL_CONFIG, ...config };
  }

  /**
   * Get current thermal tier
   */
  getTier(): ThermalTier {
    return this.currentTier;
  }

  /**
   * Get current thermal state
   */
  async getState(): Promise<ThermalState> {
    const chipTemp = await this.getTempFn();
    return {
      tier: this.currentTier,
      chipTemp,
      timestamp: Date.now(),
    };
  }

  /**
   * Get actions for current tier
   */
  getActions(): string[] {
    return this.config.tiers[this.currentTier].actions;
  }

  /**
   * Check if haptic feedback is enabled for current tier
   */
  isHapticEnabled(): boolean {
    return this.config.tiers[this.currentTier].hapticEnabled;
  }

  /**
   * Register for thermal state changes
   */
  onThermalChange(callback: ThermalChangeCallback): void {
    this.listeners.push(callback);
  }

  /**
   * Unregister thermal change callback
   */
  offThermalChange(callback: ThermalChangeCallback): void {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Update thermal tier based on current temperature
   * Returns true if tier changed
   */
  async update(): Promise<boolean> {
    const chipTemp = await this.getTempFn();
    const prevTier = this.currentTier;
    const now = Date.now();

    // Determine new tier
    let newTier: ThermalTier = 0;
    if (chipTemp >= 85) {
      newTier = 4;
    } else if (chipTemp >= 70) {
      newTier = 3;
    } else if (chipTemp >= 55) {
      newTier = 2;
    } else if (chipTemp >= 40) {
      newTier = 1;
    } else {
      newTier = 0;
    }

    // Handle escalation (immediate) vs de-escalation (with cooldown)
    if (newTier > this.currentTier) {
      // Escalation: immediate
      this.currentTier = newTier;
      this.lastTierChangeTime = now;
    } else if (newTier < this.currentTier) {
      // De-escalation: check cooldown
      if (now - this.lastTierChangeTime >= this.config.cooldownMs) {
        this.currentTier = newTier;
        this.lastTierChangeTime = now;
      }
    }

    // Notify listeners if tier changed
    if (this.currentTier !== prevTier) {
      const state: ThermalState = {
        tier: this.currentTier,
        chipTemp,
        timestamp: now,
      };
      this.listeners.forEach(cb => cb(state, prevTier));
      return true;
    }

    return false;
  }

  /**
   * Start polling thermal state
   */
  startPolling(): void {
    if (this.pollTimer) return;
    
    this.pollTimer = setInterval(() => {
      this.update();
    }, this.config.pollingIntervalMs);
  }

  /**
   * Stop polling thermal state
   */
  stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  /**
   * Destroy the thermal context
   */
  destroy(): void {
    this.stopPolling();
    this.listeners = [];
  }
}

export default ThermalContext;
