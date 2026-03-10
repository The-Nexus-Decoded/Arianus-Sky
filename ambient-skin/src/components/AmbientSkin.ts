/**
 * Ambient Skin - Main Component
 * V1: XY-only, gesture+mode toggle, preference-driven
 */

import { AmbientSkinStateMatrix, SkinState, UserPreferences } from './StateMatrix';
import { GestureRecognizer, GestureEvent, scaleTouchTarget, GESTURE_CONFIG } from './gestures/GestureRecognizer';
import { SkinMode, ModeConfig, MODE_CONFIGS } from './modes/ModeToggle';

export { AmbientSkinStateMatrix, GestureRecognizer };
export type { SkinState, UserPreferences, GestureEvent, SkinMode, ModeConfig };

/**
 * AmbientSkin - Main UI component for XR environments
 */
export class AmbientSkin {
  private stateMatrix: AmbientSkinStateMatrix;
  private gestureRecognizer: GestureRecognizer;
  private container: HTMLElement | null = null;
  private isMounted = false;
  
  // DOM elements
  private skinElement: HTMLElement | null = null;
  private glowLayer: HTMLElement | null = null;
  private particleLayer: HTMLElement | null = null;
  
  // Callbacks
  onAction?: (action: string, params: Record<string, unknown>) => void;

  constructor() {
    this.stateMatrix = new AmbientSkinStateMatrix();
    this.gestureRecognizer = new GestureRecognizer();
    
    // Wire up callbacks
    this.stateMatrix.onStateChange = this.handleStateChange.bind(this);
    this.stateMatrix.onAction = this.handleAction.bind(this);
    
    this.gestureRecognizer.onGesture = this.handleGesture.bind(this);
  }

  /**
   * Mount the skin to a DOM element
   */
  mount(element: HTMLElement): void {
    this.container = element;
    this.isMounted = true;
    this.render();
    this.attachEventListeners();
  }

  /**
   * Unmount from DOM
   */
  unmount(): void {
    this.isMounted = false;
    this.detachEventListeners();
    if (this.container) {
      this.container.innerHTML = '';
    }
  }

  /**
   * Get current state
   */
  getState(): Readonly<SkinState> {
    return this.stateMatrix.getState();
  }

  /**
   * Get current mode config
   */
  getModeConfig(): ModeConfig {
    return this.stateMatrix.getModeConfig();
  }

  /**
   * Set skin mode
   */
  setMode(mode: SkinMode): void {
    this.stateMatrix.setMode(mode);
  }

  /**
   * Cycle through modes
   */
  cycleMode(): void {
    this.stateMatrix.cycleMode();
  }

  /**
   * Update preferences
   */
  setPreferences(prefs: Partial<UserPreferences>): void {
    this.stateMatrix.setPreferences(prefs);
  }

  /**
   * Get preferences
   */
  getPreferences(): UserPreferences {
    return this.stateMatrix.getPreferences();
  }

  /**
   * Get touch target size
   */
  getTouchTargetSize(depthMeters: number = 1.0): number {
    return this.stateMatrix.getTouchTargetSize(depthMeters);
  }

  /**
   * Render the skin
   */
  private render(): void {
    if (!this.container) return;

    const config = this.stateMatrix.getModeConfig();
    const state = this.stateMatrix.getState();

    this.container.innerHTML = `
      <div class="ambient-skin" data-mode="${config.id}">
        <div class="skin-glow"></div>
        <div class="skin-particles"></div>
        <div class="skin-content">
          <div class="mode-indicator">${config.name}</div>
          <div class="touch-target" style="width: ${GESTURE_CONFIG.TOUCH_TARGET_PX}px; height: ${GESTURE_CONFIG.TOUCH_TARGET_PX}px;"></div>
        </div>
      </div>
    `;

    this.skinElement = this.container.querySelector('.ambient-skin');
    this.glowLayer = this.container.querySelector('.skin-glow');
    this.particleLayer = this.container.querySelector('.skin-particles');
    
    this.applyStyles(config, state);
  }

  /**
   * Apply dynamic styles based on mode and state
   */
  private applyStyles(config: ModeConfig, state: SkinState): void {
    if (!this.skinElement) return;

    const root = this.skinElement;
    const palette = config.colorPalette;
    const style = config.visualStyle;

    // Apply color palette
    root.style.setProperty('--primary', palette.primary);
    root.style.setProperty('--secondary', palette.secondary);
    root.style.setProperty('--accent', palette.accent);
    root.style.setProperty('--background', palette.background);
    root.style.setProperty('--text', palette.text);

    // Apply glow intensity
    const glowOpacity = style.glowIntensity * (state.isActive ? 1.5 : 1);
    root.style.setProperty('--glow-opacity', String(glowOpacity));

    // Edge glow
    if (style.edgeGlow && this.glowLayer) {
      this.glowLayer.classList.add('active');
    } else if (this.glowLayer) {
      this.glowLayer.classList.remove('active');
    }

    // Particle density
    if (this.particleLayer) {
      this.particleLayer.style.opacity = String(style.particleDensity);
    }

    // Active state
    if (state.isActive) {
      root.classList.add('active');
    } else {
      root.classList.remove('active');
    }

    // Gesture feedback
    if (state.activeGesture) {
      root.setAttribute('data-gesture', state.activeGesture);
    } else {
      root.removeAttribute('data-gesture');
    }

    // Transitioning state
    if (state.isTransitioning) {
      root.classList.add('transitioning');
    } else {
      root.classList.remove('transitioning');
    }
  }

  /**
   * Handle state changes
   */
  private handleStateChange(state: SkinState): void {
    if (!this.isMounted) return;
    
    const config = this.stateMatrix.getModeConfig();
    this.applyStyles(config, state);
  }

  /**
   * Handle gesture events
   */
  private handleGesture(gesture: GestureEvent): void {
    this.stateMatrix.handleGesture(gesture);
  }

  /**
   * Handle action events
   */
  private handleAction(action: string, params: Record<string, unknown>): void {
    this.onAction?.(action, params);
  }

  /**
   * Attach touch/mouse event listeners
   */
  private attachEventListeners(): void {
    if (!this.container) return;

    this.container.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    this.container.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    this.container.addEventListener('touchend', this.onTouchEnd.bind(this), { passive: false });
    this.container.addEventListener('touchcancel', this.onTouchCancel.bind(this));
    
    // Mouse fallback for desktop testing
    this.container.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.container.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.container.addEventListener('mouseup', this.onMouseUp.bind(this));
  }

  /**
   * Detach event listeners
   */
  private detachEventListeners(): void {
    if (!this.container) return;

    this.container.removeEventListener('touchstart', this.onTouchStart.bind(this));
    this.container.removeEventListener('touchmove', this.onTouchMove.bind(this));
    this.container.removeEventListener('touchend', this.onTouchEnd.bind(this));
    this.container.removeEventListener('touchcancel', this.onTouchCancel.bind(this));
    
    this.container.removeEventListener('mousedown', this.onMouseDown.bind(this));
    this.container.removeEventListener('mousemove', this.onMouseMove.bind(this));
    this.container.removeEventListener('mouseup', this.onMouseUp.bind(this));
  }

  // Touch handlers
  private onTouchStart(e: TouchEvent): void {
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;

    const rect = this.container!.getBoundingClientRect();
    const x = (touch.clientX - rect.left) / rect.width;
    const y = (touch.clientY - rect.top) / rect.height;

    this.gestureRecognizer.startTracking(touch.clientX, touch.clientY, touch.force);
    this.stateMatrix.handleTouchStart(x, y);
  }

  private onTouchMove(e: TouchEvent): void {
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;

    const rect = this.container!.getBoundingClientRect();
    const x = (touch.clientX - rect.left) / rect.width;
    const y = (touch.clientY - rect.top) / rect.height;

    this.gestureRecognizer.continueTracking(touch.clientX, touch.clientY, touch.force);
    this.stateMatrix.setPosition(x, y);
  }

  private onTouchEnd(e: TouchEvent): void {
    e.preventDefault();
    const gesture = this.gestureRecognizer.endTracking();
    if (gesture) {
      this.handleGesture(gesture);
    }
    this.stateMatrix.handleTouchEnd();
  }

  private onTouchCancel(): void {
    this.gestureRecognizer.cancel();
    this.stateMatrix.handleTouchEnd();
  }

  // Mouse fallback handlers
  private onMouseDown(e: MouseEvent): void {
    const rect = this.container!.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    this.gestureRecognizer.startTracking(e.clientX, e.clientY);
    this.stateMatrix.handleTouchStart(x, y);
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.gestureRecognizer) return; // Not tracking

    const rect = this.container!.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    this.gestureRecognizer.continueTracking(e.clientX, e.clientY);
    this.stateMatrix.setPosition(x, y);
  }

  private onMouseUp(): void {
    const gesture = this.gestureRecognizer.endTracking();
    if (gesture) {
      this.handleGesture(gesture);
    }
    this.stateMatrix.handleTouchEnd();
  }
}

/**
 * Create a new AmbientSkin instance
 */
export function createAmbientSkin(): AmbientSkin {
  return new AmbientSkin();
}

export default AmbientSkin;
