# Ambient Skin Spec (V1)

Mobile-first ambient display states for XR collaboration.

## Phone States

| State | Trigger | Behavior |
| ----- | ------- | -------- |
| `proximity_wake` | Proximity sensor detects approach | Wake display + show **context card** (glanceable summary — decision interstitial: engage or dismiss) |
| `silence_toggle` | Physical silent switch | Suppress haptic/audio feedback |
| `pocket_context` | Device in pocket / dark > 30s | Deferred rendering, queue updates |

## V1 Constraints

- Mobile is **preview-only** — full geometry commit happens in VR
- Render preview visualizations on device
- Handle preview queue in ambient/foreground transitions
