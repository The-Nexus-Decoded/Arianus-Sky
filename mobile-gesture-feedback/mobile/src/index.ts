// Mobile Gesture-Haptic Pipeline
// Main exports

// Types
export * from './types/gesture';

// Transport
export { SpatialTransport } from './transport/spatial-transport';
export type { SpatialTransportConfig, ConnectionState } from './transport/spatial-transport';

// Context Observers
export { ProximityObserver, ThermalObserver } from './context/context-observers';
export type { ProximityObserverConfig, ThermalObserverConfig, ProximityZone } from './context/context-observers';
export { createThermalPayload, createProximityPayload } from './context/context-observers';

// Gesture Pipeline
export { IntentResolver } from './gestures/intent-resolver';
export { IntentQueue } from './gestures/intent-queue';
export { UndoManager } from './gestures/undo-manager';
export { GestureThrottle } from './gestures/gesture-throttle';

// Main Bridge
export { SpatialGestureBridge } from './spatial-gesture-bridge';
export type { SpatialGestureBridgeConfig } from './spatial-gesture-bridge';
