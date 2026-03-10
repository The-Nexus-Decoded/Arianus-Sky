# XRpc Protocol Specification

> Bidirectional VR ↔ Mobile Intent Flow

## 1. Error Schema

```typescript
interface XRpcError {
  code: 'OBJECT_NOT_FOUND' | 'OUT_OF_BOUNDS' | 'RESOLUTION_FAILED' | 'TIMEOUT' | 'THERMAL_THROTTLE' | 'SESSION_EXPIRED';
  message: string;
  recoverable: boolean;
  retryAfter?: number; // ms if recoverable
}
```

**Notes:**
- `SESSION_EXPIRED` added for mobile↔VR handoff scenarios

## 2. Cache TTL Strategy

| Context | TTL | Rationale |
|---------|-----|-----------|
| Foreground | No cache | Always fresh |
| Background | 30s | Quick resume capability |
| Handoff (suspend >60s) | Full clear | Avoid stale object refs |

**Update Rate:** Background cache updates throttled to ≤10Hz

## 3. Coordinate Bounds Handling

- **Default:** Clamp — UI smooths to edge, visual edge-glow warning
- **Reject + haptic error:** Only for deliberate out-of-bounds gestures

## 4. Latency Budget

| Stage | Timeout | Notes |
|-------|---------|-------|
| Intent → Resolve | 500ms | Mobile local timeout |
| Resolve → Confirm | 500ms | VR processing |
| Round-trip total | 2000ms | Per spec, with buffer |
| Actionable threshold | 1500ms | Show "still processing?" UI, auto-retry once |

## 5. Component Architecture

- `IntentResolver.ts` — bidirectional VR↔mobile confirm flow
- `IntentQueue.ts` — 3-deep FIFO with sustained session cap
- `UndoManager.ts` — 3s temporal window
- `GestureIntent.ts` — `IntentResolution` types

## 7. Gesture Semantics

| Gesture | Mode | Notes |
|---------|------|-------|
| `charge` | Continuous | Visual feedback (glow, haptics) during hold |
| `cast` | Discrete | Fires once. Optional `progress` field for wind-up animations |

**Edge case:** If `cast` requires UI sync (e.g., "casting... 50%"), opt-in via `progress` field. Otherwise keep simple.

## 7. Error Response Format

```json
{
  "error": {
    "code": "NOT_FOUND" | "OUT_OF_BOUNDS" | "TIMEOUT" | "INVALID_GESTURE",
    "message": "Human-readable",
    "details": { "received": { "x": 0.5, "y": 1.2 } } // optional context
  }
}
```

## 8. Cache TTL

| Context | TTL | Invalidation |
|---------|-----|--------------|
| Background (app hidden) | 30s | On foreground |
| Handoff (mobile ↔ headset) | 60s | Re-validate on arrival |

Keep short — stale spatial data is dangerous.

## 9. Coordinate Bounds

- **Reject** with error. Clamping hides bugs.
- Return `OUT_OF_BOUNDS` with the received coords.

## 10. Latency Budget

- 500ms round-trip for gesture → feedback
- If no response in 500ms: emit `TIMEOUT` and fallback to local haptics

## 11. Cast vs Charge

- `cast`: discrete (fire-and-forget)
- `charge`: continuous (hold to build power)
- Optional `progress` field for UI sync edge cases

## 12. Intent Delivery

- **Best effort**: Next gesture overwrites previous
- **Reliable**: ACK for COMMIT/UNDO (request receipt confirmation)

## 13. NACK & Resend

- Gap detected → delta re-send from last confirmed packet

## 14. Interpolation

- 3-packet buffer
- Hermite spline (tension 0.5)
- Velocity-aware prediction
- Jitter >15ms: hold-last + extrapolate

## V1 Scope

**In scope:**
- Mobile → Arianus-Sky: XY-gesture, mode toggle, thermal signaling, haptics, AttentionLease, ProximityWake
- Arianus-Sky → Mobile: intent consumption, 2D mirror, thermal push

**Excluded (V2):**
- Real-time spatial presence
