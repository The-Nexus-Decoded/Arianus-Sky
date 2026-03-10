# Attention Management System - UX to Architecture Contract

## Status
**DRAFT** — Pending Paithan review

---

## 1. User State → UX Behavior Mapping

| User State | ImmersionDepth | UX Behavior | Architectural Promise |
|------------|----------------|-------------|----------------------|
| **Idle** | `passive` | No active attention engagement. System monitors for intent signals. | `AttentionLease` inactive. Spatial hints dormant. |
| **Attending** | `attentive` | User has signaled intent. `AttentionLease` timer starts. TTL/Priority tier applied based on intent type. | Lease promise active. System honors the TTL. Optimistic UI enabled. |
| **Immersive** | `urgent` | Full spatial focus achieved. `SpatialHint` resolved to `3d_spawn`. User attention fully captured. | Spatial layer owns the experience. 90fps target. Graceful mobile fallback maintained. |

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

## 5. Voice Return Integration (Paithan)

Mobile-to-spatial voice intent pipeline:

```
Mobile App (Siri/Google Assistant)
    │
    ▼ [intent translation]
AttentionLease.update(intent: "stepping_away", depth: passive)
    │
    ▼
Spatial Layer (receives lease update)
```

**Scenario:** "Siri, tell VR I'm stepping out" → Mobile app translates → Spatial layer updates `ImmersionDepth` to `passive`.

**Owner:** Paithan (mobile integration)

---

### Return ACK Patterns (Paithan)
Device-to-user confirmation that intent crossed the tether:

| Attention Tier | ACK Pattern | Sensory Channel |
|----------------|-------------|------------------|
| `passive` | None | — |
| `attentive` | Single pulse | Haptic |
| `urgent` | Double pulse + screen flash | Haptic + Visual |

**Architecture:** ACK fires only after spatial layer confirms receipt. No ACK = retry logic engaged.

---

### Thermal-Aware Tier Escalation
Device self-preservation overrides user-set tier:

| Device Thermal State | Tier Behavior |
|----------------------|---------------|
| **Nominal** (<35°C) | User-set tier honored |
| **Throttling** (35-38°C) | Auto-bump one tier higher |
| **Critical** (>38°C) | Max tier, force-reduce all activity |

**Architecture:** Thermal state is a forced input — user preference cannot override device safety. Spatial layer receives `thermal_override` flag alongside `ImmersionDepth`.

---

## Changelog
- 2026-03-09: Initial draft with user-state → UX → architecture mapping
- 2026-03-09: Added ImmersionDepth mapping + voice return ownership (Paithan)
- 2026-03-09: Added return ACK patterns tied to attention tiers (Paithan)
- 2026-03-09: Added thermal-aware tier escalation (Paithan)
