// Mobile → Server gesture payloads
export interface GesturePayload {
  type: 'gesture' | 'thermal' | 'proximity';
  timestamp: number;
  data: GestureData | ThermalData | ProximityData;
}

export interface GestureData {
  gesture: GestureType;
  confidence: number; // 0.0–1.0
  position?: { x: number; y: number; z?: number };
  velocity?: number;
  duration?: number;
}

export type GestureType = 
  | 'flick' | 'hold' | 'circle' | 'pinch' 
  | 'double-tap' | 'long-press'
  | 'tap' | 'swipe_left' | 'swipe_right'; // Patryn gestures

export interface ThermalData {
  chipTemp: number; // Celsius
  timestamp: number;
}

export interface ProximityData {
  distance: number; // centimeters
  timestamp: number;
}

// Server → Mobile render payloads
export interface RenderPayload {
  type: 'preview' | 'haptic' | 'state' | 'thermal_adapt';
  timestamp: number;
  data: PreviewData | HapticData | StateData | ThermalAdaptData;
}

export interface PreviewData {
  intent: string;
  visual: VisualPreview;
  duration: number; // ms
}

export type VisualPreview = 
  | 'ghost_wireframe' | 'glow_pulse' | 'rotation_ring' 
  | 'highlight_outline' | 'menu_skin_flash' | 'arrow_wipe_left'
  | 'arrow_wipe_right' | 'glow_cyan' | 'glow_red';

export interface HapticData {
  pattern: HapticPattern;
  intensity: 'low' | 'medium' | 'high';
  duration?: number; // ms
  gaps?: number[]; // ms between pulses
}

export type HapticPattern = 'single' | 'double' | 'triple' | 'continuous';

export interface StateData {
  mode: 'sartan' | 'patryn' | 'ambient';
  previewQueue: number; // 0–3
}

export interface ThermalAdaptData {
  tier: ThermalTier;
  actions: string[];
}

export type ThermalTier = 0 | 1 | 2 | 3 | 4;

// XRpc Error types
export type XRpcErrorCode = 
  | 'OBJECT_NOT_FOUND' 
  | 'OUT_OF_BOUNDS' 
  | 'RESOLUTION_FAILED' 
  | 'TIMEOUT' 
  | 'THERMAL_THROTTLE' 
  | 'SESSION_EXPIRED'
  | 'INVALID_GESTURE'
  | 'STATE_CONFLICT'
  | 'INTERNAL_ERROR';

export interface XRpcError {
  code: XRpcErrorCode;
  message: string;
  recoverable: boolean;
  retryAfter?: number;
}

// Intent types for mobile layer
export interface Intent {
  id: string;
  type: IntentType;
  gesture: GestureType;
  confidence: number;
  position?: { x: number; y: number; z?: number };
  timestamp: number;
  ttl: number; // ms
  mode: 'sartan' | 'patryn';
}

export type IntentType = 
  | 'cast' | 'charge' | 'rotate' | 'grab' | 'confirm' 
  | 'error' | 'menu_select' | 'navigate_back' | 'navigate_forward' | 'back';

// Gesture to Intent mapping (per spec Section 4)
export const GESTURE_INTENT_MAP: Record<GestureType, { intent: IntentType; ttl: number; mode: 'sartan' | 'patryn' }> = {
  // Sartan
  flick: { intent: 'cast', ttl: 5000, mode: 'sartan' },
  hold: { intent: 'charge', ttl: 500, mode: 'sartan' },
  circle: { intent: 'rotate', ttl: 5000, mode: 'sartan' },
  pinch: { intent: 'grab', ttl: 5000, mode: 'sartan' },
  'double-tap': { intent: 'confirm', ttl: 5000, mode: 'sartan' },
  'long-press': { intent: 'error', ttl: 2000, mode: 'sartan' },
  // Patryn
  tap: { intent: 'menu_select', ttl: 10000, mode: 'patryn' },
  swipe_left: { intent: 'navigate_back', ttl: 10000, mode: 'patryn' },
  swipe_right: { intent: 'navigate_forward', ttl: 10000, mode: 'patryn' },
};

// Confidence thresholds
export const CONFIDENCE_THRESHOLD = 0.85;
export const CONFIDENCE_CONFIRM_THRESHOLD = 0.60;

// Thermal tier thresholds (per spec Section 3)
export const THERMAL_TIERS: { maxTemp: number; tier: ThermalTier }[] = [
  { maxTemp: 40, tier: 0 },
  { maxTemp: 55, tier: 1 },
  { maxTemp: 70, tier: 2 },
  { maxTemp: 85, tier: 3 },
  { maxTemp: Infinity, tier: 4 },
];

// Proximity zones (per spec Section 2)
export const PROXIMITY_ZONES = {
  far: { max: 40, name: 'far' as const },
  mid: { max: 15, name: 'mid' as const },
  near: { max: 5, name: 'near' as const },
  intimate: { max: 0, name: 'intimate' as const },
};
