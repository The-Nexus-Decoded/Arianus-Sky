/**
 * Gesture Preview Renderer
 * 
 * Renders visual feedback for gestures and thermal states.
 * Integrates with zone highlighting, gesture indicators, and thermal warnings.
 */

import { GestureType, HapticType, TouchZone } from './GestureRecognizer';
import { ThermalTier } from './ThermalContext';
import { ZoneAction } from './ZoneBindings';

export interface PreviewConfig {
  showZoneHighlight: boolean;
  showGestureIndicator: boolean;
  showThermalWarning: boolean;
  animationDurationMs: number;
}

const DEFAULT_PREVIEW_CONFIG: PreviewConfig = {
  showZoneHighlight: true,
  showGestureIndicator: true,
  showThermalWarning: true,
  animationDurationMs: 200,
};

export interface PreviewState {
  activeZone: TouchZone | null;
  activeGesture: GestureType | null;
  hapticFeedback: HapticType | null;
  zoneAction: ZoneAction | null;
  thermalTier: ThermalTier;
  isVisible: boolean;
}

/**
 * CSS class names for preview styling
 */
export const PREVIEW_CLASSES = {
  container: 'gesture-preview',
  zoneHighlight: 'zone-highlight',
  gestureIndicator: 'gesture-indicator',
  thermalWarning: 'thermal-warning',
  thermalTier: (tier: ThermalTier) => `thermal-tier-${tier}`,
  zone: (z: string) => `zone-${z.toLowerCase()}`,
  gesture: (g: string) => `gesture-${g}`,
  haptic: (h: string) => `haptic-${h}`,
};

/**
 * Generate zone highlight SVG
 */
export function renderZoneGrid(
  activeZone: TouchZone | null,
  thermalTier: ThermalTier = 0
): string {
  const zones: TouchZone[] = ['NW', 'NORTH', 'NE', 'WEST', 'CENTER', 'EAST', 'SW', 'SOUTH', 'SE'];
  const zonePositions: Record<TouchZone, { x: number; y: number }> = {
    NW: { x: 0, y: 0 }, NORTH: { x: 1, y: 0 }, NE: { x: 2, y: 0 },
    WEST: { x: 0, y: 1 }, CENTER: { x: 1, y: 1 }, EAST: { x: 2, y: 1 },
    SW: { x: 0, y: 2 }, SOUTH: { x: 1, y: 2 }, SE: { x: 2, y: 2 },
  };

  let svg = `<svg viewBox="0 0 3 3" class="${PREVIEW_CLASSES.zoneHighlight} thermal-tier-${thermalTier}">`;
  
  for (const zone of zones) {
    const pos = zonePositions[zone];
    const isActive = zone === activeZone;
    const opacity = isActive ? 0.8 : 0.15;
    
    svg += `<rect 
      x="${pos.x}" 
      y="${pos.y}" 
      width="1" 
      height="1" 
      fill="currentColor" 
      fill-opacity="${opacity}"
      class="${PREVIEW_CLASSES.zone(zone)} ${isActive ? 'active' : ''}"
    />`;
  }
  
  svg += '</svg>';
  return svg;
}

/**
 * Generate gesture indicator
 */
export function renderGestureIndicator(
  gesture: GestureType,
  haptic: HapticType
): string {
  const icons: Record<GestureType, string> = {
    tap: '👆',
    double_tap: '👆👆',
    long_press: '✋',
    drag_x: '⬅️➡️',
    drag_y: '⬆️⬇️',
    drag_z: '🔺',
    pinch: '🤏',
    none: '',
  };

  const hapticLabels: Record<HapticType, string> = {
    light: '💫',
    double: '💫💫',
    heavy: '💥',
    soft: '〰️',
    medium: '⚡',
  };

  return `<div class="${PREVIEW_CLASSES.gestureIndicator}">
    <span class="${PREVIEW_CLASSES.gesture(gesture)}">${icons[gesture]}</span>
    <span class="${PREVIEW_CLASSES.haptic(haptic)}">${hapticLabels[haptic]}</span>
  </div>`;
}

/**
 * Generate thermal warning overlay
 */
export function renderThermalWarning(tier: ThermalTier): string {
  if (tier < 3) return ''; // Only show for tier 3+
  
  const warnings: Record<ThermalTier, string> = {
    0: '',
    1: '',
    2: '',
    3: '🌡️ Warming',
    4: '🔥 HOT',
  };

  const colors: Record<ThermalTier, string> = {
    0: '',
    1: '',
    2: '',
    3: '#ff9500',
    4: '#ff3b30',
  };

  return `<div class="${PREVIEW_CLASSES.thermalWarning}" 
    style="border-color: ${colors[tier]}; color: ${colors[tier]}">
    ${warnings[tier]}
  </div>`;
}

/**
 * Preview Renderer class
 */
export class PreviewRenderer {
  private container: HTMLElement | null = null;
  private config: PreviewConfig;
  private state: PreviewState = {
    activeZone: null,
    activeGesture: null,
    hapticFeedback: null,
    zoneAction: null,
    thermalTier: 0,
    isVisible: false,
  };

  constructor(config: Partial<PreviewConfig> = {}) {
    this.config = { ...DEFAULT_PREVIEW_CONFIG, ...config };
  }

  /**
   * Mount the preview renderer to a DOM element
   */
  mount(selector: string | HTMLElement): void {
    const el = typeof selector === 'string' 
      ? document.querySelector(selector) 
      : selector;
    
    if (el) {
      this.container = el as HTMLElement;
      this.render();
    }
  }

  /**
   * Update preview state
   */
  update(state: Partial<PreviewState>): void {
    this.state = { ...this.state, ...state };
    this.render();
  }

  /**
   * Show/hide preview
   */
  setVisible(visible: boolean): void {
    this.state.isVisible = visible;
    this.render();
  }

  /**
   * Update thermal tier
   */
  setThermalTier(tier: ThermalTier): void {
    this.state.thermalTier = tier;
    this.render();
  }

  /**
   * Show gesture feedback
   */
  showGesture(zone: TouchZone, gesture: GestureType, haptic: HapticType, action: ZoneAction): void {
    this.state.activeZone = zone;
    this.state.activeGesture = gesture;
    this.state.hapticFeedback = haptic;
    this.state.zoneAction = action;
    this.state.isVisible = true;
    this.render();

    // Auto-hide after animation
    setTimeout(() => {
      this.state.isVisible = false;
      this.render();
    }, this.config.animationDurationMs);
  }

  /**
   * Render current state to DOM
   */
  private render(): void {
    if (!this.container) return;

    const { activeZone, activeGesture, hapticFeedback, zoneAction, thermalTier, isVisible } = this.state;

    let html = '';

    if (this.config.showThermalWarning && thermalTier >= 3) {
      html += renderThermalWarning(thermalTier);
    }

    if (isVisible && this.config.showZoneHighlight && activeZone) {
      html += renderZoneGrid(activeZone, thermalTier);
    }

    if (isVisible && this.config.showGestureIndicator && activeGesture && hapticFeedback) {
      html += renderGestureIndicator(activeGesture, hapticFeedback);
    }

    if (zoneAction) {
      html += `<div class="zone-action">${zoneAction}</div>`;
    }

    this.container.innerHTML = html;
    this.container.style.opacity = isVisible ? '1' : '0';
  }

  /**
   * Destroy renderer
   */
  destroy(): void {
    this.container = null;
    this.queue = [];
  }

  private queue: string[] = [];
}

export default PreviewRenderer;
