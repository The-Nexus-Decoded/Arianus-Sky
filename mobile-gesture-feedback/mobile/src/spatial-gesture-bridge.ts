import { SpatialTransport, type SpatialTransportConfig } from '../transport/spatial-transport';
import { ProximityObserver, ThermalObserver, createThermalPayload, createProximityPayload } from '../context/context-observers';
import { IntentResolver } from '../gestures/intent-resolver';
import { IntentQueue } from '../gestures/intent-queue';
import { UndoManager } from '../gestures/undo-manager';
import { GestureThrottle } from '../gestures/gesture-throttle';
import type { 
  GestureType, 
  GestureData, 
  ThermalTier,
  ProximityZone,
  Intent 
} from '../types/gesture';

export interface SpatialGestureBridgeConfig {
  host: string;
  devMode?: boolean;
  mode: 'sartan' | 'patryn';
  // Callbacks
  onIntentConfirmed?: (intent: Intent) => void;
  onPreview?: (intent: string, visual: string, duration: number) => void;
  onHaptic?: (pattern: string, intensity: string) => void;
  onModeChange?: (mode: 'sartan' | 'patryn' | 'ambient') => void;
  onThermalTierChange?: (tier: ThermalTier) => void;
  onProximityZoneChange?: (zone: ProximityZone) => void;
}

export class SpatialGestureBridge {
  private transport: SpatialTransport;
  private proximityObserver: ProximityObserver;
  private thermalObserver: ThermalObserver;
  private intentResolver: IntentResolver;
  private intentQueue: IntentQueue;
  private undoManager: UndoManager;
  private gestureThrottle: GestureThrottle;
  private config: SpatialGestureBridgeConfig;

  constructor(config: SpatialGestureBridgeConfig) {
    this.config = config;

    // Initialize transport
    const transportConfig: SpatialTransportConfig = {
      host: config.host,
      devMode: config.devMode,
      onStateChange: (state) => console.log('[SpatialBridge] State:', state),
      onPreview: (intent, visual, duration) => this.handlePreview(intent, visual, duration),
      onHaptic: (pattern, intensity, duration, gaps) => this.handleHaptic(pattern, intensity),
      onState: (mode, queue) => this.handleState(mode, queue),
      onThermalAdapt: (tier, actions) => this.handleThermalAdapt(tier),
    };
    this.transport = new SpatialTransport(transportConfig);

    // Initialize proximity observer
    this.proximityObserver = new ProximityObserver({
      onZoneChange: (zone, distance) => {
        this.config.onProximityZoneChange?.(zone);
        // Send proximity data to server
        this.transport.sendProximity(createProximityPayload(distance));
      },
      onWake: () => console.log('[SpatialBridge] Proximity wake'),
      onSleep: () => console.log('[SpatialBridge] Proximity sleep'),
    });

    // Initialize thermal observer
    this.thermalObserver = new ThermalObserver({
      onTierChange: (tier) => {
        this.config.onThermalTierChange?.(tier as ThermalTier);
        // Thermal adapt is sent from server, but we track locally
      },
    });

    // Initialize intent pipeline
    this.intentResolver = new IntentResolver({
      mode: config.mode,
      onIntentConfirmed: (intent) => {
        this.undoManager.record(intent);
        this.intentQueue.enqueue(intent);
        this.config.onIntentConfirmed?.(intent);
      },
      onIntentQueued: (intent) => {
        this.intentQueue.enqueue(intent);
      },
      onIntentRejected: (intent, reason) => {
        console.log('[SpatialBridge] Intent rejected:', reason, intent.gesture);
      },
    });

    this.intentQueue = new IntentQueue({
      maxSize: 3,
      onOverflow: (dropped) => console.log('[SpatialBridge] Queue overflow, dropped:', dropped.type),
    });

    this.undoManager = new UndoManager({
      windowMs: 3000,
      onUndo: (undone, current) => console.log('[SpatialBridge] Undo:', undone.type, '→', current.type),
    });

    this.gestureThrottle = new GestureThrottle({
      hz: 10,
      onThrottledEmit: (data) => {
        this.transport.sendGesture(data);
      },
    });
  }

  // Public API for gesture input
  processGesture(
    gesture: GestureType,
    confidence: number,
    position?: { x: number; y: number; z?: number }
  ): Intent | null {
    // First resolve to intent
    const intent = this.intentResolver.resolve(gesture, confidence, position);
    
    // Always send gesture data (throttled)
    const gestureData: GestureData = { gesture, confidence, position };
    this.gestureThrottle.emit(gestureData);

    return intent;
  }

  // Public API for sensor input
  updateProximity(distance: number): ProximityZone {
    return this.proximityObserver.update(distance);
  }

  updateThermal(chipTemp: number): ThermalTier {
    const tier = this.thermalObserver.update(chipTemp);
    this.transport.sendThermal(createThermalPayload(chipTemp));
    return tier as ThermalTier;
  }

  // Handle incoming preview from XR
  private handlePreview(intent: string, visual: string, duration: number): void {
    this.config.onPreview?.(intent, visual, duration);
  }

  // Handle incoming haptic from XR
  private handleHaptic(pattern: string, intensity: string): void {
    this.config.onHaptic?.(pattern, intensity);
  }

  // Handle state changes from XR
  private handleState(mode: string, queue: number): void {
    if (mode !== this.config.mode) {
      this.config.mode = mode as 'sartan' | 'patryn';
      this.config.onModeChange?.(this.config.mode);
    }
  }

  // Handle thermal adaptation from XR
  private handleThermalAdapt(tier: number): void {
    this.config.onThermalTierChange?.(tier as ThermalTier);
  }

  // Undo support
  undo(): Intent | null {
    return this.undoManager.undo();
  }

  canUndo(): boolean {
    return this.undoManager.canUndoNow();
  }

  // Queue management
  confirmPending(): Intent | null {
    return this.intentResolver.confirmPending();
  }

  rejectPending(): void {
    this.intentResolver.rejectPending();
  }

  hasPendingConfirmation(): boolean {
    return this.intentResolver.hasPending();
  }

  // Connection state
  isConnected(): boolean {
    return this.transport.isOperational();
  }

  getConnectionState(): string {
    return this.transport.getState();
  }

  // Cleanup
  destroy(): void {
    this.transport.disconnect();
    this.proximityObserver.destroy();
    this.thermalObserver.destroy();
    this.undoManager.destroy();
    this.gestureThrottle.destroy();
  }
}
