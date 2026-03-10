// Gesture & Intent Protocol - TypeScript Contract
// Generated from protocols/gesture.proto

export type GestureAction = 'move' | 'rotate' | 'scale' | 'select';
export type GestureSource = 'gesture' | 'menu' | 'depth_handle';

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export enum ThermalTier {
  TIER_UNSPECIFIED = 0,
  TIER_COOL = 1,       // Full color, subtle breathing, 100% opacity
  TIER_WARM = 2,       // Reduced palette, slower pulse, 85% opacity
  TIER_HOT = 3,        // Monochrome, urgent pulse, 70% opacity
  TIER_CRITICAL = 4,   // Alert color, rapid blink, 100% + overlay
}

export interface ThermalContext {
  temperature: number;
  tier: ThermalTier;
  timestamp: number;
}

export interface Intent {
  action: GestureAction;
  target: string;
  source: GestureSource;
  confidence: number;
  confidence_override_threshold: number;
  position?: Vector3;
  rotation?: Vector3;
  scale?: Vector3;
}

export interface GestureDefinition {
  action: GestureAction;
  axes: string[];
  source: GestureSource;
}

export interface GestureEvent {
  gesture_id: string;
  intent: Intent;
  thermal: ThermalContext;
  timestamp: number;
}

// Confidence threshold config
export interface ConfidenceThreshold {
  user_can_override: number;  // 0.85
  below_threshold: string;   // mobile queues for VR confirmation
  above_threshold: string;   // mobile commits, VR animates
}

// Gesture to action mapping (from Orla's spec)
export interface GestureMapping {
  flick: GestureAction;      // cast → ghost_wireframe
  hold: GestureAction;       // charge → glow_pulse
  circle: GestureAction;     // rotate → rotation_ring
  pinch: GestureAction;      // grab → highlight_outline
}

export const GESTURE_MAPPING: GestureMapping = {
  flick: 'move',      // cast
  hold: 'scale',      // charge
  circle: 'rotate',  // rotate
  pinch: 'select',   // grab
};

export const CONFIDENCE_THRESHOLD = 0.85;
