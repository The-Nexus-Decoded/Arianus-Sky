/**
 * Ambient Skin - V1 Specification
 * 
 * XY-only input, gesture+mode toggle, preference-driven
 * 
 * ## Spec Summary
 * - Touch target: 4.6cm (44px @ 96dpi) or depth-scaled variant
 * - Gesture vocabulary: flick, hold, circle, pinch
 * - Mode toggle: sartan / patryn / ambient
 * - State matrix locked
 * 
 * ## Files
 * - src/components/AmbientSkin.ts - Main component
 * - src/gestures/GestureRecognizer.ts - Gesture recognition
 * - src/modes/ModeToggle.ts - Mode state machine
 * - src/StateMatrix.ts - State management
 * 
 * ## Usage
 * import { createAmbientSkin } from './src/components/AmbientSkin';
 * 
 * const skin = createAmbientSkin();
 * skin.mount(document.getElementById('app'));
 * skin.onAction = (action, params) => console.log(action, params);
 * 
 * // Change mode
 * skin.setMode('sartan');
 * skin.cycleMode();
 * 
 * // Update preferences
 * skin.setPreferences({ hapticEnabled: true, glowIntensity: 'high' });
 */

export { AmbientSkin, createAmbientSkin } from './components/AmbientSkin';
export { AmbientSkinStateMatrix } from './StateMatrix';
export { GestureRecognizer, scaleTouchTarget, GESTURE_CONFIG } from './gestures/GestureRecognizer';
export { ModeToggleStateMachine, MODE_CONFIGS, mapGestureToAction } from './modes/ModeToggle';
export type { GestureType, GestureEvent, TouchPoint } from './gestures/GestureRecognizer';
export type { SkinMode, ModeConfig } from './modes/ModeToggle';
export type { SkinState, UserPreferences, IntentType, Urgency, Intent } from './StateMatrix';
export { INTENT_TTL, PREVIEW_QUEUE_CONFIG, CONFIDENCE_THRESHOLDS, STATE_RECONCILIATION, Z_DEPTH_CONFIG } from './StateMatrix';
