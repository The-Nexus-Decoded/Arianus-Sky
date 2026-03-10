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

## 6. Transport Layer

Awaiting Haplo's WebSocket endpoint.
