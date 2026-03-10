# Spatial UI Contract Specification

## Overview
Contract schema for spatial UI interactions — defines the manipulation matrix and interaction contracts between user input and interface response.

## Manipulation Matrix

| Gesture | Target State | Constraints | Feedback |
|---------|--------------|-------------|----------|
| Grab | Selected | Min distance: 0.1m | Haptic burst + visual highlight |
| Drag | Transformed | Max velocity: 2m/s | Continuous haptic + trail |
| Pinch | Scaled | Min: 0.1x, Max: 5.0x | Tension haptic |
| Rotate | Oriented | Gimbal lock at ±90° pitch | Resistance haptic near limits |
| Push | Activated | Max range: 3m | Impact haptic |

## Contract Schema

### InteractionContract
```typescript
interface InteractionContract {
  id: string;
  gesture: GestureType;
  target: TargetType;
  constraints: ConstraintSet;
  feedback: FeedbackProfile;
  lifecycle: LifecyclePhase[];
}
```

### Lifecycle Phases
1. **Idle** — Contract dormant
2. **Initiated** — Gesture recognized, intent validated
3. **Active** — Manipulation in progress
4. **Resolved** — Target state reached or gesture released
5. **Failed** — Constraint violation or timeout

## Gesture Recognition

- **Confidence threshold**: 0.85
- **Timeout**: 5000ms for initiation
- **Cooldown**: 200ms between gestures

## Feedback Profiles

| Profile | Visual | Haptic | Audio |
|---------|--------|--------|-------|
| Precise | Highlight + trajectory | 0.3x pulse | Click |
| Loose | Subtle highlight | 0.1x pulse | None |
| Locked | Red overlay | 1.0x buzz | Error tone |
