# Ambient Skin - V1 Specification

## Contract Reference
- **Spec Source**: Orla (#games-vr)
- **Touch Target**: 4.6cm (44px @ 96dpi) or depth-scaled variant
- **Gestures**: flick, hold, circle, pinch
- **Modes**: sartan / patryn / ambient
- **Input**: XY-only

## V1 Spatial UI Contract

### Intent Format
```typescript
{
  event_type: 'message' | 'combat' | 'thermal' | 'social',
  urgency: 'none' | 'normal' | 'high' | 'critical',
  response_window_ms: 300000, // 5 min default
  user_initiated: boolean,
  action_required: boolean
}
```

### TTL by Intent Type
| Intent | TTL |
|--------|-----|
| cast | 5000ms |
| movement | 500ms |
| menu | 10000ms |
| combat | 2000ms |
| trade | 15000ms |
| social | 5000ms |

### Preview Queue
- Max items: 3
- Eviction: drop_oldest
- Type: ephemeral

### Confidence
- ≥0.85: auto-commit
- <0.85: queue for VR confirm

### State Reconciliation
- Winner: vr_wins
- Strategy: delta_merge

### Z-Depth Sync
- Strategy: last_writer_wins
- Max velocity: 0.5 units/sec
- Fallback: VR

## V1 Scope (Locked)

### Features
- **XY-gesture + mode toggle**: flick, hold, circle, pinch → sartan/patryn/ambient modes
- **Thermal-adaptive rendering**: sustained ceiling (not peak) thermal management
- **Async shared state**: 2D mirror converges on world state
- **External view**: camera-projected 2D, responds to VR spatial actions

### External View Specifications
- Pan/zoom controls
- Tap to highlight elements
- Camera-projected rendering

### Ship Target
- **Monday**

## Gesture Specifications

### Visual Feedback
- **double-tap**: cyan glow
- **rotate**: scale pulse
- **long-press 500ms**: red shake

### Timing
- **max confirm**: 2s
- **double-tap gap**: 300ms
- **long-press threshold**: 500ms

### Haptic Patterns (V1)
| Event | Pattern | Intensity |
| --------------------------- | ---------------------------- | ------------------------- |
| intent sent (double-tap) | single 35ms pulse | medium |
| confirmed (rotate complete) | double 50ms pulse, 80ms gap | high |
| error (long-press) | triple 40ms pulse, 50ms gaps | high |

## Implementation Complete

```
ambient-skin/
├── index.ts              # Main exports
├── index.html            # Demo page
├── styles.css            # Visual styling
├── src/
│   ├── components/
│   │   └── AmbientSkin.ts    # Main component
│   ├── gestures/
│   │   └── GestureRecognizer.ts   # Gesture system
│   ├── modes/
│   │   └── ModeToggle.ts      # Mode state machine
│   └── StateMatrix.ts         # State management
```

## Features Implemented

### Gesture Recognition
- **Flick**: Fast swipe detection with direction (up/down/left/right)
- **Hold**: Long press detection (500ms threshold)
- **Circle**: Circular motion detection (270° minimum)
- **Pinch**: Scale gesture (two-finger)

### Mode System
- **sartan**: Green/gold palette, high glow, particles
- **patryn**: Orange/amber palette, high glow, particles
- **ambient**: Blue palette, low glow, minimal particles

### Preferences
- Haptic feedback toggle
- Particle density (low/medium/high)
- Glow intensity (low/medium/high)
- Touch scale with depth
- Gesture sensitivity

### State Matrix
- XY position tracking (normalized 0-1)
- Gesture state with progress
- Mode transition state
- Preference overrides

## Usage

```typescript
import { createAmbientSkin } from './ambient-skin/index.js';

const skin = createAmbientSkin();
skin.mount(document.getElementById('app'));

skin.onAction = (action, params) => {
  console.log(action, params);
};

skin.setMode('sartan');
skin.cycleMode();
skin.setPreferences({ hapticEnabled: true });
```

## Run Demo

```bash
cd /data/repos/Arianus-Sky/ambient-skin
npx serve .
```

Then open http://localhost:3000
