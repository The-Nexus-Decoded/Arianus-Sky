# Attention Management System - UX to Architecture Contract

## Status
**DRAFT** — Pending Paithan review

---

## 1. User State → UX Behavior Mapping

| User State | UX Behavior | Architectural Promise |
|------------|-------------|----------------------|
| **Idle** | No active attention engagement. System monitors for intent signals. | `AttentionLease` inactive. Spatial hints dormant. |
| **Attending** | User has signaled intent. `AttentionLease` timer starts. TTL/Priority tier applied based on intent type. | Lease promise active. System honors the TTL. Optimistic UI enabled. |
| **Immersive** | Full spatial focus achieved. `SpatialHint` resolved to `3d_spawn`. User attention fully captured. | Spatial layer owns the experience. 90fps target. Graceful mobile fallback maintained. |

---

## 2. UX Primitives (Orla's Specification)

### TTL/Priority
Tiered by **intent type**:

| Intent Type | TTL | Priority |
|-------------|-----|----------|
| `passive` | 30s | low |
| `active` | 5m | normal |
| `critical` | indefinite | high |

**Architecture:** Lease timer must honor TTL exactly. Priority influences render queue ordering.

### SpatialHint
Explicit resolution:

```typescript
enum SpatialHint {
  THREE_D_SPAWN = "3d_spawn",   // Full spatial render
  TWO_D_OVERLAY = "2d_overlay", // Flat UI overlay
  HAPTIC_ONLY  = "haptic_only"  // No visual, device feedback only
}
```

**Architecture:** Spatial layer **owns** the hint. Mobile clients follow the spatial layer's resolution. This is a one-way contract: spatial dictates, mobile adapts.

### Optimistic UI
Immediate feedback with configurable rollback:

```typescript
interface OptimisticConfig {
  enable: boolean;
  rollbackDelay: number;    // ms before confirmation
  confirmThreshold: number; // confidence required
}
```

**Architecture:** Optimistic renders must be idempotent. Rollback triggers clean state reversion, not visual flicker.

---

## 3. Architecture Contract

### The Contract
```
Spatial Layer ──(SpatialHint)──> Mobile Client
     │                                  │
     │──(AttentionLease promise)───────>│
     │                                  │
     │──(TTL/Priority)─────────────────>│
```

### Rules
1. **Spatial owns the hint.** Mobile never overrides `SpatialHint`.
2. **Lease is a promise.** If `AttentionLease` says 5m, it's 5m — not 4m59s.
3. **Optimistic is safe.** Rollback must be invisible to the user.
4. **Graceful degradation.** If spatial fails, mobile falls back to `2d_overlay`. If `2d_overlay` fails, `haptic_only`.

### Performance Targets
- **Immersive state:** ≥90fps (hard requirement for presence)
- **Attending state:** ≥60fps
- **Idle state:** ≥30fps (background monitoring only)

---

## 4. Delivery to Haplo

This document is the **contract** between UX (Orla) and Architecture (Haplo).

- **Do not change UX without updating this document.**
- **Do not implement architecture that violates this contract.**

---

## Changelog
- 2026-03-09: Initial draft with user-state → UX → architecture mapping
