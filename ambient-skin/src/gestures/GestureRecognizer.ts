/**
 * Ambient Skin - Gesture Recognition System
 * V1 Spec: flick, hold, circle, pinch
 * Touch target: 4.6cm (44px @ 96dpi) / depth-scaled
 */

export type GestureType = 'flick' | 'hold' | 'circle' | 'pinch';
export type GestureDirection = 'up' | 'down' | 'left' | 'right';
export type GesturePhase = 'start' | 'move' | 'end' | 'cancel';

export interface GestureEvent {
  type: GestureType;
  direction?: GestureDirection;
  duration: number;
  velocity: { x: number; y: number };
  scale?: number; // for pinch
  rotation?: number; // for circle
  center?: { x: number; y: number };
}

export interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
  pressure?: number;
}

// Config from spec
export const GESTURE_CONFIG = {
  // Touch target: 4.6cm = 44px @ 96dpi
  TOUCH_TARGET_PX: 44,
  TOUCH_TARGET_CM: 4.6,
  
  // Gesture thresholds
  FLICK_MIN_VELOCITY: 0.3, // px/ms
  FLICK_MAX_DURATION: 300, // ms
  
  HOLD_MIN_DURATION: 500, // ms
  HOLD_MAX_MOVEMENT: 10, // px tolerance
  
  CIRCLE_MIN_ANGLE: 270, // degrees
  CIRCLE_MIN_RADIUS: 30, // px
  
  PINCH_MIN_SCALE: 0.2, // scale delta threshold
};

/**
 * Gesture recognizer - processes touch points into gestures
 */
export class GestureRecognizer {
  private points: TouchPoint[] = [];
  private startPoint: TouchPoint | null = null;
  private isTracking = false;
  
  // Callbacks
  onGesture?: (gesture: GestureEvent) => void;
  onPhaseChange?: (phase: GesturePhase) => void;

  startTracking(x: number, y: number, pressure?: number): void {
    const point: TouchPoint = { x, y, timestamp: Date.now(), pressure };
    this.points = [point];
    this.startPoint = point;
    this.isTracking = true;
    this.onPhaseChange?.('start');
  }

  continueTracking(x: number, y: number, pressure?: number): void {
    if (!this.isTracking) return;
    
    const point: TouchPoint = { x, y, timestamp: Date.now(), pressure };
    this.points.push(point);
    this.onPhaseChange?.('move');
  }

  endTracking(): GestureEvent | null {
    if (!this.isTracking || this.points.length < 2) {
      this.reset();
      return null;
    }

    this.onPhaseChange?.('end');
    const gesture = this.recognize();
    this.reset();
    return gesture;
  }

  cancel(): void {
    this.onPhaseChange?.('cancel');
    this.reset();
  }

  private reset(): void {
    this.points = [];
    this.startPoint = null;
    this.isTracking = false;
  }

  private recognize(): GestureEvent {
    if (!this.startPoint || this.points.length < 2) {
      return { type: 'hold', duration: 0, velocity: { x: 0, y: 0 } };
    }

    const last = this.points[this.points.length - 1];
    const duration = last.timestamp - this.startPoint.timestamp;
    
    // Calculate velocity
    const dx = last.x - this.startPoint.x;
    const dy = last.y - this.startPoint.y;
    const velocity = {
      x: dx / duration,
      y: dy / duration
    };
    const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);

    // Detect FLICK (fast, short duration)
    if (duration < GESTURE_CONFIG.FLICK_MAX_DURATION && 
        speed > GESTURE_CONFIG.FLICK_MIN_VELOCITY) {
      return {
        type: 'flick',
        direction: this.getDirection(dx, dy),
        duration,
        velocity,
        center: { x: last.x, y: last.y }
      };
    }

    // Detect HOLD (slow, long duration)
    if (duration > GESTURE_CONFIG.HOLD_MIN_DURATION && 
        Math.abs(dx) < GESTURE_CONFIG.HOLD_MAX_MOVEMENT &&
        Math.abs(dy) < GESTURE_CONFIG.HOLD_MAX_MOVEMENT) {
      return {
        type: 'hold',
        duration,
        velocity: { x: 0, y: 0 },
        center: { x: last.x, y: last.y }
      };
    }

    // Detect CIRCLE (circular motion)
    const circleResult = this.detectCircle();
    if (circleResult) {
      return circleResult;
    }

    // Detect PINCH (two-finger scale) - requires 2+ fingers in multi-touch context
    // Handled separately via MultiTouchGestureRecognizer

    // Default: return flick with direction
    return {
      type: 'flick',
      direction: this.getDirection(dx, dy),
      duration,
      velocity,
      center: { x: last.x, y: last.y }
    };
  }

  private getDirection(dx: number, dy: number): GestureDirection {
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    if (angle >= -45 && angle < 45) return 'right';
    if (angle >= 45 && angle < 135) return 'down';
    if (angle >= -135 && angle < -45) return 'up';
    return 'left';
  }

  private detectCircle(): GestureEvent | null {
    if (this.points.length < 10) return null;

    // Calculate centroid
    const cx = this.points.reduce((sum, p) => sum + p.x, 0) / this.points.length;
    const cy = this.points.reduce((sum, p) => sum + p.y, 0) / this.points.length;

    // Calculate total angle traversed
    let totalAngle = 0;
    for (let i = 1; i < this.points.length; i++) {
      const prev = this.points[i - 1];
      const curr = this.points[i];
      
      const angle1 = Math.atan2(prev.y - cy, prev.x - cx);
      const angle2 = Math.atan2(curr.y - cy, curr.x - cx);
      
      let delta = angle2 - angle1;
      if (delta > Math.PI) delta -= 2 * Math.PI;
      if (delta < -Math.PI) delta += 2 * Math.PI;
      
      totalAngle += delta;
    }

    const angleDegrees = Math.abs(totalAngle * (180 / Math.PI));
    const radius = Math.sqrt(
      this.points.reduce((sum, p) => sum + (p.x - cx) ** 2 + (p.y - cy) ** 2, 0) / this.points.length
    );

    if (angleDegrees > GESTURE_CONFIG.CIRCLE_MIN_ANGLE && 
        radius > GESTURE_CONFIG.CIRCLE_MIN_RADIUS) {
      return {
        type: 'circle',
        rotation: totalAngle,
        duration: this.points[this.points.length - 1].timestamp - this.startPoint!.timestamp,
        velocity: { x: 0, y: 0 },
        center: { x: cx, y: cy }
      };
    }

    return null;
  }
}

/**
 * Scale touch target based on depth (Z position in VR)
 */
export function scaleTouchTarget(baseSizePx: number, depthMeters: number): number {
  // In VR, objects further away appear smaller
  // Scale = 1 at 1m, decreases with distance
  const referenceDepth = 1.0;
  return baseSizePx * (referenceDepth / Math.max(depthMeters, 0.5));
}
