/**
 * XR Gesture Recognizer
 * 
 * Thresholds from Orla's spec:
 * | Gesture    | Threshold   | Output        | Haptic |
 * | ---------- | ----------- | ------------- | ------ |
 * | tap        | <200ms      | select        | light  |
 * | double_tap | gap <300ms  | confirm       | double |
 * | long_press | >500ms      | context menu  | heavy  |
 * | drag_x/y   | >30px       | translate X/Y | soft   |
 * | drag_z     | 0.85 conf   | translate Z   | medium |
 * | pinch      | scale delta | scale         | medium |
 */

export type GestureType = 
  | 'tap' 
  | 'double_tap' 
  | 'long_press' 
  | 'drag_x' 
  | 'drag_y' 
  | 'drag_z'
  | 'pinch'
  | 'none';

export type HapticType = 'light' | 'double' | 'heavy' | 'soft' | 'medium';

export interface GestureResult {
  gesture: GestureType;
  output: string;
  haptic: HapticType;
  confidence: number;
  metadata?: {
    duration?: number;
    distance?: { x: number; y: number; z?: number };
    scale?: number;
    tapCount?: number;
  };
}

export interface GestureConfig {
  tapThresholdMs: number;
  doubleTapGapMs: number;
  longPressThresholdMs: number;
  dragThresholdPx: number;
  dragZConfidenceThreshold: number;
}

// Default thresholds from spec
export const DEFAULT_GESTURE_CONFIG: GestureConfig = {
  tapThresholdMs: 200,
  doubleTapGapMs: 300,
  longPressThresholdMs: 500,
  dragThresholdPx: 30,
  dragZConfidenceThreshold: 0.85,
};

export class GestureRecognizer {
  private config: GestureConfig;
  private touchStartTime: number = 0;
  private touchStartPosition: { x: number; y: number } = { x: 0, y: 0 };
  private lastTapTime: number = 0;
  private isLongPressTriggered: boolean = false;
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;
  private initialPinchDistance: number = 0;

  constructor(config: Partial<GestureConfig> = {}) {
    this.config = { ...DEFAULT_GESTURE_CONFIG, ...config };
  }

  /**
   * Start tracking a new touch gesture
   */
  startTouch(x: number, y: number): void {
    this.touchStartTime = Date.now();
    this.touchStartPosition = { x, y };
    this.isLongPressTriggered = false;
    
    // Start long press timer
    this.longPressTimer = setTimeout(() => {
      this.isLongPressTriggered = true;
    }, this.config.longPressThresholdMs);
  }

  /**
   * End touch and recognize gesture
   */
  endTouch(x: number, y: number, currentPinchScale?: number): GestureResult {
    const endTime = Date.now();
    const duration = endTime - this.touchStartTime;
    const distance = {
      x: x - this.touchStartPosition.x,
      y: y - this.touchStartPosition.y,
    };

    // Clear long press timer
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    // Check for long press (takes precedence if triggered)
    if (this.isLongPressTriggered) {
      return {
        gesture: 'long_press',
        output: 'context menu',
        haptic: 'heavy',
        confidence: 1.0,
        metadata: { duration },
      };
    }

    // Check for pinch gesture
    if (currentPinchScale !== undefined) {
      const scaleDelta = Math.abs(currentPinchScale - 1);
      if (scaleDelta > 0.1) {
        return {
          gesture: 'pinch',
          output: 'scale',
          haptic: 'medium',
          confidence: Math.min(scaleDelta * 2, 1.0),
          metadata: { scale: currentPinchScale },
        };
      }
    }

    // Check for drag Z (depth translation)
    const dragMagnitude = Math.sqrt(distance.x ** 2 + distance.y ** 2);
    if (dragMagnitude > this.config.dragThresholdPx) {
      // Determine if this is a Z-drag (vertical movement with high confidence)
      if (Math.abs(distance.y) > this.config.dragThresholdPx * 1.5) {
        return {
          gesture: 'drag_z',
          output: 'translate Z',
          haptic: 'medium',
          confidence: this.config.dragZConfidenceThreshold,
          metadata: { distance: { x: distance.x, y: distance.y, z: distance.y } },
        };
      }
      
      // Otherwise it's an X or Y drag
      if (Math.abs(distance.x) > Math.abs(distance.y)) {
        return {
          gesture: 'drag_x',
          output: 'translate X',
          haptic: 'soft',
          confidence: Math.min(dragMagnitude / 100, 1.0),
          metadata: { distance },
        };
      } else {
        return {
          gesture: 'drag_y',
          output: 'translate Y',
          haptic: 'soft',
          confidence: Math.min(dragMagnitude / 100, 1.0),
          metadata: { distance },
        };
      }
    }

    // Check for tap gestures
    const now = Date.now();
    const gapSinceLastTap = now - this.lastTapTime;
    
    if (duration < this.config.tapThresholdMs) {
      // Check for double tap
      if (gapSinceLastTap < this.config.doubleTapGapMs) {
        this.lastTapTime = 0; // Reset after double tap
        return {
          gesture: 'double_tap',
          output: 'confirm',
          haptic: 'double',
          confidence: 1.0,
          metadata: { duration, tapCount: 2 },
        };
      }
      
      this.lastTapTime = now;
      return {
        gesture: 'tap',
        output: 'select',
        haptic: 'light',
        confidence: 1.0,
        metadata: { duration, tapCount: 1 },
      };
    }

    // No recognized gesture
    return {
      gesture: 'none',
      output: '',
      haptic: 'light',
      confidence: 0,
      metadata: { duration },
    };
  }

  /**
   * Handle pinch gesture tracking
   */
  startPinch(distance: number): void {
    this.initialPinchDistance = distance;
  }

  updatePinch(currentDistance: number): number {
    if (this.initialPinchDistance === 0) return 1;
    return currentDistance / this.initialPinchDistance;
  }

  /**
   * Reset the recognizer state
   */
  reset(): void {
    this.touchStartTime = 0;
    this.touchStartPosition = { x: 0, y: 0 };
    this.lastTapTime = 0;
    this.isLongPressTriggered = false;
    this.initialPinchDistance = 0;
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }
}

export default GestureRecognizer;
