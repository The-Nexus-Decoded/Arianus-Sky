# Spatial UI Contract (V1)

Collaborative XR manipulation between VR (Sartan) and Mobile (Patryn).

## Manipulation Matrix

| Action | Input                       | Preview Type             | Mobile Render |
| ------ | --------------------------- | ------------------------ | ------------- |
| MOVE   | Horizontal drag             | ghost_wireframe          | ✅             |
| ROTATE | Circular threshold / toggle | rotation_ring            | ✅             |
| SCALE  | Dual trigger / dual grip    | corner_handles (uniform) | ✅             |

## Contract Schema

```json
{
  "intent": "manipulate",
  "action": "move" | "rotate" | "scale",
  "axis": "x" | "y",
  "method": "dual_trigger" | "dual_grip",
  "preview": {
    "type": "ghost_wireframe" | "rotation_ring" | "corner_handles",
    "uniform": true
  },
  "confidence": "0.0-1.0",
  "user_can_override": true
}
```

## V1 Constraints

- **XY plane only** — no Z-axis manipulation
- **Preview-first** — ghost wireframe confirms intent before geometry commit
- **Override capability** — `user_can_override` enables correction flow
- **Queue management** — `preview_queue_max`: 3

## World Unit Baseline (V1/V2 Shared)

- **Reference distance:** 1m from camera
- **FOV assumption:** 90° horizontal
- **Math:** visible width at 1m = 2 × tan(45°) × 1m = **2m world units**
- **Conversion (1920px canvas):** 1 world unit = 960px → 44px touch target = ~0.046m at 1m
- **Depth scaling:** world_units_per_px scales linearly with distance
