# Gesture Resolver Contract (V1)

## Overview
XR gesture recognition service that translates spatial hand inputs into game intents for consumption by downstream clients (VR, mobile).

## Location
`/data/repos/Arianus-Sky/ambient-skin/src/gestures/GestureResolver.ts`

## Interface

```typescript
interface GestureResolver {
  // Subscribe to gesture events
  onGesture(gesture: GestureEvent): void;
  
  // Current gesture state
  getState(): GestureState;
  
  // Reset recognition
  reset(): void;
}

interface GestureEvent {
  type: 'flick' | 'hold' | 'circle' | 'pinch';
  direction?: 'up' | 'down' | 'left' | 'right';
  duration?: number;
  scale?: number;
  position: { x: number; y: number; z: number };
  timestamp: number;
  confidence: number;
}

interface GestureState {
  active: boolean;
  gesture: GestureEvent | null;
  progress: number; // 0-1
  mode: 'idle' | 'tracking' | 'recognized' | 'confirmed';
}
```

## Gesture → Mode Mapping

| Gesture | Mode |
|---------|------|
| flick up | sartan |
| flick down | patryn |
| hold 500ms | ambient |
| circle clockwise | cycle forward |
| circle counter-clockwise | cycle backward |
| pinch | confirm / execute |

## Timing Constraints

| Parameter | Value |
|-----------|-------|
| double-tap gap | 300ms |
| long-press threshold | 500ms |
| max confirm window | 2000ms |
| gesture timeout | 3000ms |

## Output: Intent

```typescript
interface Intent {
  id: string;
  gesture: GestureEvent;
  mode: 'sartan' | 'patryn' | 'ambient';
  action: string;
  ttl_ms: number;
  created_at: number;
}
```

## TTL by Action

| Action | TTL |
|--------|-----|
| cast | 5000ms |
| movement | 500ms |
| menu | 10000ms |
| confirm | 2000ms |

## Consumer API

```typescript
// Mobile (Paithan)
const resolver = new GestureResolver();
resolver.connect('ws://xr-gateway/gestures');

resolver.onIntent((intent) => {
  // Forward to mobile app
  mobileApp.dispatch(intent);
});
```

## Status
- **Draft**: Awaiting Paithan review before V1 freeze
- **Owner**: Samah (XR domain)