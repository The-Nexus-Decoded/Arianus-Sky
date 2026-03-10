/**
 * Ambient Skin - State Matrix
 * XY-only input, gesture+mode driven, preference-driven
 * 
 * State matrix dimensions:
 * - Input: X, Y position (normalized 0-1)
 * - Gesture: flick, hold, circle, pinch
 * - Mode: sartan, patryn, ambient
 * - Preference: user overrides
 */

import { GestureType, GestureEvent, GESTURE_CONFIG } from './gestures/GestureRecognizer';
import { SkinMode, ModeConfig, MODE_CONFIGS, ModeToggleStateMachine, mapGestureToAction } from './modes/ModeToggle';

/**
 * V1 Spatial UI Contract - Intent Types
 * TTL values in milliseconds
 */
export type IntentType = 'cast' | 'movement' | 'menu' | 'combat' | 'trade' | 'social';
export type Urgency = 'none' | 'normal' | 'high' | 'critical';

export interface Intent {
  event_type: 'message' | 'combat' | 'thermal' | 'social';
  urgency: Urgency;
  response_window_ms: number;
  user_initiated: boolean;
  action_required: boolean;
}

/**
 * TTL by intent type (milliseconds)
 */
export const INTENT_TTL: Record<IntentType, number> = {
  cast: 5000,
  movement: 500,
  menu: 10000,
  combat: 2000,
  trade: 15000,
  social: 5000
};

/**
 * Preview queue config
 */
export const PREVIEW_QUEUE_CONFIG = {
  maxItems: 3,
  evictionPolicy: 'drop_oldest' as const,
  ephemeral: true
};

/**
 * Confidence thresholds
 */
export const CONFIDENCE_THRESHOLDS = {
  autoCommit: 0.85,
  requireVRConfirm: 0.85
};

/**
 * State reconciliation
 */
export const STATE_RECONCILIATION = {
  winner: 'vr_wins',
  strategy: 'delta_merge'
};

/**
 * Z-depth sync config
 */
export const Z_DEPTH_CONFIG = {
  strategy: 'last_writer_wins',
  maxVelocity: 0.5, // units per second
  fallback: 'vr'
};

export interface SkinState {
  // Position state (XY-only per spec)
  x: number; // 0-1 normalized
  y: number; // 0-1 normalized
  
  // Interaction state
  isActive: boolean;
  activeGesture: GestureType | null;
  gestureProgress: number; // 0-1 for hold duration, circle completion, etc.
  
  // Mode state
  mode: SkinMode;
  isTransitioning: boolean;
  
  // Preference overrides
  preferences: UserPreferences;
}

export interface UserPreferences {
  hapticEnabled: boolean;
  particleDensity: 'low' | 'medium' | 'high';
  glowIntensity: 'low' | 'medium' | 'high';
  touchScaleWithDepth: boolean;
  gestureSensitivity: 'low' | 'medium' | 'high';
}

/**
 * State Matrix - manages all skin states and transitions
 */
export class AmbientSkinStateMatrix {
  private state: SkinState;
  private modeStateMachine: ModeToggleStateMachine;
  private preferences: UserPreferences;
  
  // State change callbacks
  onStateChange?: (state: SkinState) => void;
  onAction?: (action: string, params: Record<string, unknown>) => void;

  constructor() {
    this.state = {
      x: 0.5,
      y: 0.5,
      isActive: false,
      activeGesture: null,
      gestureProgress: 0,
      mode: 'ambient',
      isTransitioning: false,
      preferences: this.getDefaultPreferences()
    };
    
    this.preferences = this.state.preferences;
    this.modeStateMachine = new ModeToggleStateMachine();
    
    // Wire up mode state machine callbacks
    this.modeStateMachine.onModeChange = (from, to) => {
      this.state.mode = to;
      this.onStateChange?.(this.state);
    };
    
    this.modeStateMachine.onTransitionStart = () => {
      this.state.isTransitioning = true;
      this.onStateChange?.(this.state);
    };
    
    this.modeStateMachine.onTransitionEnd = () => {
      this.state.isTransitioning = false;
      this.onStateChange?.(this.state);
    };
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      hapticEnabled: true,
      particleDensity: 'medium',
      glowIntensity: 'medium',
      touchScaleWithDepth: true,
      gestureSensitivity: 'medium'
    };
  }

  /**
   * Get current state snapshot
   */
  getState(): Readonly<SkinState> {
    return { ...this.state };
  }

  /**
   * Get current mode config
   */
  getModeConfig(): ModeConfig {
    return MODE_CONFIGS[this.state.mode];
  }

  /**
   * Update XY position (normalized 0-1)
   */
  setPosition(x: number, y: number): void {
    this.state.x = Math.max(0, Math.min(1, x));
    this.state.y = Math.max(0, Math.min(1, y));
    this.onStateChange?.(this.state);
  }

  /**
   * Handle touch start
   */
  handleTouchStart(x: number, y: number): void {
    this.state.isActive = true;
    this.state.x = Math.max(0, Math.min(1, x));
    this.state.y = Math.max(0, Math.min(1, y));
    this.onStateChange?.(this.state);
  }

  /**
   * Handle gesture recognition result
   */
  handleGesture(gesture: GestureEvent): void {
    this.state.activeGesture = gesture.type;
    
    // Map gesture to action based on current mode
    const action = mapGestureToAction(gesture.type, this.state.mode);
    
    // Execute action
    this.executeAction(action, gesture);
    
    // Reset gesture state after short delay
    setTimeout(() => {
      this.state.activeGesture = null;
      this.state.gestureProgress = 0;
      this.onStateChange?.(this.state);
    }, 200);
    
    this.onStateChange?.(this.state);
  }

  /**
   * Handle touch end
   */
  handleTouchEnd(): void {
    this.state.isActive = false;
    this.state.activeGesture = null;
    this.state.gestureProgress = 0;
    this.onStateChange?.(this.state);
  }

  /**
   * Switch to specific mode
   */
  setMode(mode: SkinMode): void {
    this.modeStateMachine.transitionTo(mode);
  }

  /**
   * Cycle through modes
   */
  cycleMode(): void {
    this.modeStateMachine.cycleMode();
  }

  /**
   * Update user preferences
   */
  setPreferences(prefs: Partial<UserPreferences>): void {
    this.preferences = { ...this.preferences, ...prefs };
    this.state.preferences = this.preferences;
    this.onStateChange?.(this.state);
  }

  /**
   * Get preferences
   */
  getPreferences(): UserPreferences {
    return { ...this.preferences };
  }

  /**
   * Execute action based on mode-specific mapping
   */
  private executeAction(action: string, gesture: GestureEvent): void {
    const params: Record<string, unknown> = {
      x: this.state.x,
      y: this.state.y,
      mode: this.state.mode,
      gesture: gesture.type,
      direction: gesture.direction,
      duration: gesture.duration,
      velocity: gesture.velocity,
      center: gesture.center
    };
    
    this.onAction?.(action, params);
    
    // Haptic feedback if enabled
    if (this.preferences.hapticEnabled && this.getModeConfig().visualStyle.hapticFeedback) {
      this.triggerHaptic('medium');
    }
  }

  /**
   * Trigger haptic feedback
   */
  private triggerHaptic(intensity: 'light' | 'medium' | 'heavy'): void {
    if ('vibrate' in navigator) {
      const durations = { light: 10, medium: 25, heavy: 50 };
      navigator.vibrate(durations[intensity]);
    }
  }

  /**
   * Calculate touch target size based on preferences and depth
   */
  getTouchTargetSize(depthMeters: number = 1.0): number {
    let size = GESTURE_CONFIG.TOUCH_TARGET_PX;
    
    if (this.preferences.touchScaleWithDepth) {
      size = size * (1 / Math.max(depthMeters, 0.5));
    }
    
    // Apply sensitivity modifier
    const sensitivityMod = {
      low: 1.2,
      medium: 1.0,
      high: 0.8
    };
    
    return size * sensitivityMod[this.preferences.gestureSensitivity];
  }

  /**
   * Serialize state for persistence
   */
  serialize(): string {
    return JSON.stringify({
      mode: this.state.mode,
      preferences: this.preferences
    });
  }

  /**
   * Restore state from persistence
   */
  deserialize(data: string): void {
    try {
      const parsed = JSON.parse(data);
      if (parsed.mode) {
        this.modeStateMachine.transitionTo(parsed.mode);
      }
      if (parsed.preferences) {
        this.setPreferences(parsed.preferences);
      }
    } catch (e) {
      console.warn('Failed to deserialize skin state:', e);
    }
  }
}

// Default export
export default AmbientSkinStateMatrix;
