// XR Gesture Receiver
// Consumes GestureEvent payloads from mobile → routes to intent handlers

import {
  GestureEvent,
  Intent,
  ThermalContext,
  ThermalTier,
  GestureAction,
  Vector3,
  CONFIDENCE_THRESHOLD,
} from '../types/gesture';

export type VisualEffect = 'ghost_wireframe' | 'glow_pulse' | 'rotation_ring' | 'highlight_outline';

export interface IntentHandler {
  (intent: Intent, thermal: ThermalContext): void;
}

export interface ThermalStyle {
  opacity: number;
  palette: 'full' | 'reduced' | 'mono' | 'alert';
  pulseRate: 'subtle' | 'slow' | 'urgent' | 'rapid';
}

// Thermal tier → visual style mapping
const THERMAL_STYLES: Record<ThermalTier, ThermalStyle> = {
  [ThermalTier.TIER_COOL]: {
    opacity: 1.0,
    palette: 'full',
    pulseRate: 'subtle',
  },
  [ThermalTier.TIER_WARM]: {
    opacity: 0.85,
    palette: 'reduced',
    pulseRate: 'slow',
  },
  [ThermalTier.TIER_HOT]: {
    opacity: 0.7,
    palette: 'mono',
    pulseRate: 'urgent',
  },
  [ThermalTier.TIER_CRITICAL]: {
    opacity: 1.0,
    palette: 'alert',
    pulseRate: 'rapid',
  },
  [ThermalTier.TIER_UNSPECIFIED]: {
    opacity: 1.0,
    palette: 'full',
    pulseRate: 'subtle',
  },
};

// Action → visual effect mapping (from Orla's spec)
const ACTION_EFFECTS: Record<GestureAction, VisualEffect> = {
  move: 'ghost_wireframe',
  rotate: 'rotation_ring',
  scale: 'glow_pulse',
  select: 'highlight_outline',
};

export class XRGestureReceiver {
  private handlers: Map<GestureAction, IntentHandler> = new Map();
  private thermalStyle: ThermalStyle = THERMAL_STYLES[ThermalTier.TIER_COOL];

  constructor() {
    this.registerDefaultHandlers();
  }

  private registerDefaultHandlers(): void {
    this.on('move', this.handleMove.bind(this));
    this.on('rotate', this.handleRotate.bind(this));
    this.on('scale', this.handleScale.bind(this));
    this.on('select', this.handleSelect.bind(this));
  }

  on(action: GestureAction, handler: IntentHandler): void {
    this.handlers.set(action, handler);
  }

  // Main entry: receive GestureEvent from mobile
  receive(event: GestureEvent): void {
    const { intent, thermal, gesture_id } = event;

    // Update thermal style
    this.thermalStyle = THERMAL_STYLES[thermal.tier] || THERMAL_STYLES[ThermalTier.TIER_COOL];

    // Confidence check
    if (intent.confidence < CONFIDENCE_THRESHOLD) {
      console.warn(`[XRReceiver] Low confidence (${intent.confidence}), queueing for VR confirmation`);
      this.queueForConfirmation(event);
      return;
    }

    // Route to handler
    const handler = this.handlers.get(intent.action);
    if (handler) {
      console.log(`[XRReceiver] ${gesture_id} → ${intent.action} (conf: ${intent.confidence.toFixed(2)})`);
      handler(intent, thermal);
    } else {
      console.warn(`[XRReceiver] No handler for action: ${intent.action}`);
    }
  }

  // Queue low-confidence events for VR user confirmation
  private queueForConfirmation(event: GestureEvent): void {
    // TODO: Implement queue persistence + VR UI display
    console.log('[XRReceiver] Queued:', event.gesture_id);
  }

  // Get current thermal style for ambient skin
  getThermalStyle(): ThermalStyle {
    return this.thermalStyle;
  }

  // Intent handlers
  private handleMove(intent: Intent, thermal: ThermalContext): void {
    const effect = ACTION_EFFECTS.move;
    this.applyEffect(effect, intent, thermal);
  }

  private handleRotate(intent: Intent, thermal: ThermalContext): void {
    const effect = ACTION_EFFECTS.rotate;
    this.applyEffect(effect, intent, thermal);
  }

  private handleScale(intent: Intent, thermal: ThermalContext): void {
    const effect = ACTION_EFFECTS.scale;
    this.applyEffect(effect, intent, thermal);
  }

  private handleSelect(intent: Intent, thermal: ThermalContext): void {
    const effect = ACTION_EFFECTS.select;
    this.applyEffect(effect, intent, thermal);
  }

  private applyEffect(effect: VisualEffect, intent: Intent, thermal: ThermalContext): void {
    // TODO: Wire to actual Three.js/Babylon scene
    console.log(`[XRReceiver] Apply ${effect} to ${intent.target}`, {
      position: intent.position,
      rotation: intent.rotation,
      scale: intent.scale,
      thermal: ThermalTier[thermal.tier],
    });
  }
}

export { ThermalTier, type ThermalStyle, type VisualEffect };
