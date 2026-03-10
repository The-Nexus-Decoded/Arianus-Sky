# Mobile Gesture-Haptic Contract

**Version:** 1.1  
**Status:** Implementation Required  
**Created:** 2026-03-10  
**Updated:** 2026-03-10

---

## Overview

Contract between mobile layer (`Arianus-Sky/ambient-skin/`) and XR spatial consumer layer. Defines the gesture-to-intent pipeline with presence-aware continuous context.

---

## Spec References

| Doc | Path |
|-----|------|
| Ambient Skin Spec | `ambient-skin/SPEC.md` |
| XRPC Protocol | `ambient-skin/docs/XRPC-SPEC.md` |
| Gesture Resolver Contract | `ambient-skin/docs/GESTURE-RESOLVER-CONTRACT.md` |

---

## Current Implementation (Audit)

| Component | Path | Status |
|-----------|------|--------|
| GestureRecognizer | `mobile/spatial-gesture-bridge.ts` | ✅ Complete |
| SpatialProjector | `mobile/spatial-gesture-bridge.ts` | ✅ Complete |
| IntentEmitter (WebSocket) | `mobile/spatial-gesture-bridge.ts` | ✅ Complete |
| ProximityObserver | `mobile/context-observers.ts` | ✅ Complete |
| ThermalObserver | `mobile/context-observers.ts` | ✅ Complete |
| PreviewQueue | `mobile/ambient-skin/PreviewQueue.ts` | ✅ Complete |
| IntentTTL | `mobile/ambient-skin/IntentTTL.ts` | ✅ Complete |
| Confidence Threshold | — | ❌ Missing |
| 10Hz Throttle | — | ❌ Missing |
| SESSION_EXPIRED | — | ❌ Missing |
| Sartan/Patryn Mapping | — | ⚠️ Partial |
| IntentResolver | — | ❌ Missing |
| IntentQueue (3-deep FIFO) | — | ❌ Missing |
| UndoManager (3s window) | — | ❌ Missing |
| Cast vs Charge semantics | — | ❌ Missing |

---

## Requirements (per XRPC-SPEC.md)

### 1. Error Codes (Section 1)

```typescript
type XRpcErrorCode = 
  | 'OBJECT_NOT_FOUND' 
  | 'OUT_OF_BOUNDS' 
  | 'RESOLUTION_FAILED' 
  | 'TIMEOUT' 
  | 'THERMAL_THROTTLE' 
  | 'SESSION_EXPIRED'
  | 'INVALID_GESTURE'
  | 'STATE_CONFLICT'
  | 'INTERNAL_ERROR';

interface XRpcError {
  code: XRpcErrorCode;
  message: string;
  recoverable: boolean;
  retryAfter?: number;
}
```

### 2. Cache TTL Strategy (Section 2, 8)

| Context | TTL | Invalidation |
|---------|-----|--------------|
| Foreground | No cache | N/A |
| Background | 30s | On foreground |
| Handoff (suspend >60s) | Full clear | Re-validate on arrival |

### 3. Coordinate Bounds (Section 3, 9)

- **Default:** Reject with `OUT_OF_BOUNDS` error
- Return received coords in error details

### 4. Latency Budget (Section 4, 10)

| Stage | Timeout |
|-------|---------|
| Intent → Resolve | 500ms |
| Resolve → Confirm | 500ms |
| Round-trip total | 2000ms |
| Actionable threshold | 1500ms |

### 5. Gesture Semantics (Section 7, 11)

| Gesture | Type | Notes |
|---------|------|-------|
| `charge` | Continuous | Visual feedback (glow, haptics) during hold |
| `cast` | Discrete | Fires once. Optional `progress` field for wind-up |

### 6. Intent Delivery (Section 12)

- **Best effort:** Next gesture overwrites previous
- **Reliable:** ACK for COMMIT/UNDO

### 7. NACK & Resend (Section 13)

- Gap detected → delta re-send from last confirmed packet

### 8. Interpolation (Section 14)

- 3-packet buffer
- Hermite spline (tension 0.5)
- Velocity-aware prediction
- Jitter >15ms: hold-last + extrapolate

---

## Requirements (per SPEC.md)

### TTL by Intent Type

| Intent | TTL |
|--------|-----|
| cast | 5000ms |
| movement | 500ms |
| menu | 10000ms |
| combat | 2000ms |
| trade | 15000ms |
| social | 5000ms |

### Confidence

- ≥0.85: auto-commit
- <0.85: queue for VR confirm

### Preview Queue

- Max items: 3
- Eviction: drop_oldest
- Type: ephemeral

### State Reconciliation

- Winner: vr_wins
- Strategy: delta_merge

### Z-Depth Sync

- Strategy: last_writer_wins
- Max velocity: 0.5 units/sec
- Fallback: VR

---

## Gesture Mapping Alignment

| Spec Gesture | Current Type | Alignment |
|--------------|--------------|-----------|
| flick | drag | ✅ Map to flick |
| hold | long_press | ✅ Map to hold |
| circle | twist | ✅ Map to circle |
| pinch | pinch | ✅ Match |
| double-tap | double_tap | ✅ Match |
| long-press | long_press | ✅ Match |
| tap (Patryn) | tap | ✅ Match |
| swipe_left | — | ❌ Add |
| swipe_right | — | ❌ Add |

---

## Implementation Plan

### Phase 1: Core Pipeline

1. **Create `IntentResolver.ts`** — Bidirectional VR↔mobile confirm flow
2. **Create `IntentQueue.ts`** — 3-deep FIFO with sustained session cap
3. **Create `UndoManager.ts`** — 3s temporal window
4. **Create `GestureThrottle.ts`** — 10Hz throttle

### Phase 2: Error Handling

5. **Add `XRpcError` types** — All error codes from spec
6. **Add SESSION_EXPIRED** — Extend ImmersionContext
7. **Add OUT_OF_BOUNDS** — Coordinate validation
8. **Add TIMEOUT** — 500ms local timeout

### Phase 3: Gestures & Confidence

9. **Add confidence evaluation** — ≥0.85 auto-commit
10. **Fill gesture gaps** — swipe_left, swipe_right
11. **Implement Cast vs Charge** — Discrete vs continuous semantics

### Phase 4: Caching & Sync

12. **Implement cache TTL** — Foreground/background/handoff
13. **Implement state reconciliation** — delta_merge, vr_wins
14. **Implement z-depth sync** — last_writer_wins

### Phase 5: Interpolation

15. **Implement 3-packet buffer** — Hermite spline
16. **Add jitter handling** — Hold-last + extrapolate

---

## Delivery

- **Owner:** Samah (XR Architect)
- **Dependencies:** 
  - Orla's specs (`ambient-skin/SPEC.md`, `ambient-skin/docs/XRPC-SPEC.md`)
  - Paithan's spatial-gesture-bridge
- **Testing:** Unit tests for throttle, TTL, error codes, interpolation
- **Ship Target:** Monday

---

**Contract confirmed:** Implementation proceeds.
