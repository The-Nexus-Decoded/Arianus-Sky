import { PROXIMITY_ZONES, type ThermalData, type ProximityData } from '../types/gesture';

export type ProximityZone = 'far' | 'mid' | 'near' | 'intimate';

export interface ProximityObserverConfig {
  onZoneChange?: (zone: ProximityZone, distance: number) => void;
  onWake?: () => void;
  onSleep?: () => void;
  wakeThreshold?: number; // cm
  sleepTimeout?: number; // ms
}

const DEFAULT_CONFIG = {
  wakeThreshold: 15, // cm - per spec Section 2
  sleepTimeout: 3000, // ms - per spec Section 2.3
};

export class ProximityObserver {
  private config: Required<ProximityObserverConfig>;
  private currentZone: ProximityZone = 'far';
  private sleepTimer: ReturnType<typeof setTimeout> | null = null;
  private lastDistance: number = Infinity;

  constructor(config: ProximityObserverConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config } as Required<ProximityObserverConfig>;
  }

  update(distance: number): ProximityZone {
    this.lastDistance = distance;
    
    // Determine zone
    let newZone: ProximityZone;
    if (distance > PROXIMITY_ZONES.mid.max) {
      newZone = 'far';
    } else if (distance > PROXIMITY_ZONES.near.max) {
      newZone = 'mid';
    } else if (distance > PROXIMITY_ZONES.intimate.max) {
      newZone = 'near';
    } else {
      newZone = 'intimate';
    }

    if (newZone !== this.currentZone) {
      const prevZone = this.currentZone;
      this.currentZone = newZone;
      
      this.config.onZoneChange?.(newZone, distance);

      // Handle wake/sleep transitions
      if (prevZone === 'far' && newZone !== 'far') {
        this.cancelSleep();
        this.config.onWake?.();
      } else if (newZone === 'far') {
        this.scheduleSleep();
      }
    }

    return newZone;
  }

  private scheduleSleep(): void {
    if (this.sleepTimer) return;
    this.sleepTimer = setTimeout(() => {
      this.sleepTimer = null;
      this.config.onSleep?.();
    }, this.config.sleepTimeout);
  }

  private cancelSleep(): void {
    if (this.sleepTimer) {
      clearTimeout(this.sleepTimer);
      this.sleepTimer = null;
    }
  }

  getZone(): ProximityZone {
    return this.currentZone;
  }

  destroy(): void {
    this.cancelSleep();
  }
}

// Thermal Observer
export interface ThermalObserverConfig {
  onTierChange?: (tier: number, chipTemp: number) => void;
  cooldownMs?: number;
}

const THERMAL_THRESHOLDS = [40, 55, 70, 85];
const DEFAULT_THERMAL_CONFIG = {
  cooldownMs: 5000, // per spec Section 3.4
};

export class ThermalObserver {
  private config: Required<ThermalObserverConfig>;
  private currentTier: number = 0;
  private cooldownTimer: ReturnType<typeof setTimeout> | null = null;
  private lastEscalation: number = 0;

  constructor(config: ThermalObserverConfig = {}) {
    this.config = { ...DEFAULT_THERMAL_CONFIG, ...config } as Required<ThermalObserverConfig>;
  }

  update(chipTemp: number): number {
    // Determine tier
    let newTier = 0;
    for (let i = 0; i < THERMAL_THRESHOLDS.length; i++) {
      if (chipTemp <= THERMAL_THRESHOLDS[i]) {
        newTier = i;
        break;
      }
      newTier = i + 1;
    }

    // Handle tier changes
    if (newTier !== this.currentTier) {
      const now = Date.now();
      
      // Immediate escalation, delayed de-escalation
      if (newTier > this.currentTier) {
        this.lastEscalation = now;
        this.currentTier = newTier;
        this.config.onTierChange?.(newTier, chipTemp);
        this.cancelCooldown();
      } else {
        // De-escalation needs cooldown
        if (now - this.lastEscalation >= this.config.cooldownMs) {
          this.currentTier = newTier;
          this.config.onTierChange?.(newTier, chipTemp);
        }
      }
    }

    return this.currentTier;
  }

  private cancelCooldown(): void {
    if (this.cooldownTimer) {
      clearTimeout(this.cooldownTimer);
      this.cooldownTimer = null;
    }
  }

  getTier(): number {
    return this.currentTier;
  }

  destroy(): void {
    this.cancelCooldown();
  }
}

// Helper to create sensor data payloads
export function createThermalPayload(chipTemp: number): ThermalData {
  return { chipTemp, timestamp: Date.now() };
}

export function createProximityPayload(distance: number): ProximityData {
  return { distance, timestamp: Date.now() };
}
