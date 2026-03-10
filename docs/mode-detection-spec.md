# Mode Detection Specification

**Version:** 0.1  
**Author:** Samah (XR Architect)  
**Status:** Ready for Design Handoff  
**Last Updated:** 2026-03-10

---

## 1. Core Modes

| Mode | Description | Visual Skin |
|------|-------------|-------------|
| `ambient` | Passive, glanceable, low opacity | Ambient skin (per Orla's spec) |
| `sartan` | Full spatial interaction, magical gestures | Sartan skin |
| `patryn` | Direct manipulation, rune-based | Patryn skin |

---

## 2. Detection Triggers

### 2.1 Primary: Device Orientation + Proximity

| Condition | Mode |
|-----------|------|
| Device flat (pitch < 15°) + proximity > 40cm | `ambient` |
| Device upright (pitch ≥ 15°) + proximity 15–40cm | `sartan` |
| Device upright + proximity < 15cm | `patryn` |

### 2.2 Secondary: User Gesture History

If user repeatedly uses **Sartan gestures** (flick, circle, pinch) → bias toward `sartan`  
If user repeatedly uses **Patryn gestures** (tap, swipe) → bias toward `patryn`

Gesture history window: 10 gestures, 60-second expiry per gesture.

### 2.3 Manual Override

- User can force mode via UI toggle
- Manual override persists for 5 minutes, then auto-detection resumes

---

## 3. Transition Logic

### 3.1 State Machine

```
ambient ←→ sartan ←→ patryn
   ↑         ↑         ↑
   └─────────┴─────────┘ (direct via proximity jump)
```

### 3.2 Debounce / Hysteresis

| Transition | Debounce |
|------------|-----------|
| ambient → sartan | 500ms stable |
| sartan → patryn | 300ms stable |
| patryn → sartan | 500ms stable |
| sartan → ambient | 2000ms stable (prevent flicker) |
| Any → manual override | Immediate |

**Rationale:** sartan↔ambient flickers最容易 (device angle wobble). 2s debounce prevents visual thrashing.

---

## 4. Entry Points

### 4.1 App Launch
- Default: `ambient`
- If proximity < 15cm on launch → immediately `patryn`

### 4.2 Background → Foreground
- Restore previous mode (stored in memory)
- If app was killed → restore to `ambient`

### 4.3 Thermal Emergency (Tier 4)
- Force to `ambient`
- Disable gesture detection
- Display minimal single-surface UI

---

## 5. API Surface

```typescript
// src/types/mode.ts

export type XRMode = 'ambient' | 'sartan' | 'patryn';

export interface ModeState {
  current: XRMode;
  override: XRMode | null;        // null = auto-detection
  overrideExpiresAt: number | null;  // timestamp
  gestureBias: {
    sartan: number;    // 0–10
    patryn: number;    // 0–10
  };
  lastTransition: number;  // timestamp ms
}

export interface ModeDetectionConfig {
  pitchThreshold: number;      // degrees, default 15
  proximityFar: number;        // cm, default 40
  proximityNear: number;        // cm, default 15
  debounceAmbientMs: number;    // default 2000
  debounceSartanMs: number;     // default 500
  debouncePatrynMs: number;     // default 300
  overrideDurationMs: number;    // default 300000 (5 min)
  gestureWindowSize: number;    // default 10
  gestureWindowExpiryMs: number; // default 60000
}
```

---

## 6. Hand-off to Orla

This spec defines **WHEN** modes transition. You design **HOW** the UI visually transitions:

- Touch Surface Zones for each mode
- 2D↔spatial animation curves
- Zone boundaries (center vs edge, thumb reach)
- Color bands per mode (glanceable indicators)

---

## 7. Hand-off to Paithan

Once Orla's zones land, you'll consume:

- `XRMode` enum
- Mode change callbacks (for UI skin swap)
- Gesture intent routing based on current mode

---

**Questions?** Ping in #games-vr.
