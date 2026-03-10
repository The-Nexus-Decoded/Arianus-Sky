/**
 * Ambient Skin - Mode Toggle System
 * V1 Spec: sartan / patryn / ambient modes
 */

export type SkinMode = 'sartan' | 'patryn' | 'ambient';

export interface ModeConfig {
  id: SkinMode;
  name: string;
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  visualStyle: {
    glowIntensity: number; // 0-1
    edgeGlow: boolean;
    particleDensity: number;
    hapticFeedback: boolean;
  };
  gestureMapping: {
    flick: string;
    hold: string;
    circle: string;
    pinch: string;
  };
}

export const MODE_CONFIGS: Record<SkinMode, ModeConfig> = {
  sartan: {
    id: 'sartan',
    name: 'Sartan',
    colorPalette: {
      primary: '#00ffaa',
      secondary: '#004433',
      accent: '#66ffcc',
      background: '#001a14',
      text: '#ccffee'
    },
    visualStyle: {
      glowIntensity: 0.8,
      edgeGlow: true,
      particleDensity: 0.6,
      hapticFeedback: true
    },
    gestureMapping: {
      flick: 'navigate',
      hold: 'activate',
      circle: 'rotate',
      pinch: 'zoom'
    }
  },
  patryn: {
    id: 'patryn',
    name: 'Patryn',
    colorPalette: {
      primary: '#ff6b35',
      secondary: '#331a0d',
      accent: '#ff9955',
      background: '#1a0d05',
      text: '#ffd4b8'
    },
    visualStyle: {
      glowIntensity: 0.9,
      edgeGlow: true,
      particleDensity: 0.8,
      hapticFeedback: true
    },
    gestureMapping: {
      flick: 'dash',
      hold: 'charge',
      circle: 'spin',
      pinch: 'focus'
    }
  },
  ambient: {
    id: 'ambient',
    name: 'Ambient',
    colorPalette: {
      primary: '#4a90d9',
      secondary: '#1a2d4a',
      accent: '#7ab3f0',
      background: '#0d1520',
      text: '#c4d9f0'
    },
    visualStyle: {
      glowIntensity: 0.3,
      edgeGlow: false,
      particleDensity: 0.2,
      hapticFeedback: false
    },
    gestureMapping: {
      flick: 'scroll',
      hold: 'select',
      circle: 'cycle',
      pinch: 'scale'
    }
  }
};

/**
 * State machine for mode transitions
 */
export class ModeToggleStateMachine {
  private currentMode: SkinMode = 'ambient';
  private transitionInProgress = false;
  
  onModeChange?: (from: SkinMode, to: SkinMode) => void;
  onTransitionStart?: (from: SkinMode, to: SkinMode) => void;
  onTransitionEnd?: (from: SkinMode, to: SkinMode) => void;

  getCurrentMode(): SkinMode {
    return this.currentMode;
  }

  getModeConfig(mode: SkinMode): ModeConfig {
    return MODE_CONFIGS[mode];
  }

  getCurrentConfig(): ModeConfig {
    return MODE_CONFIGS[this.currentMode];
  }

  /**
   * Attempt to transition to a new mode
   * Returns true if transition started, false if already in that mode
   */
  transitionTo(newMode: SkinMode): boolean {
    if (this.transitionInProgress || newMode === this.currentMode) {
      return false;
    }

    const fromMode = this.currentMode;
    this.transitionInProgress = true;
    this.onTransitionStart?.(fromMode, newMode);

    // Simulate transition duration (CSS handles animation)
    setTimeout(() => {
      this.currentMode = newMode;
      this.transitionInProgress = false;
      this.onModeChange?.(fromMode, newMode);
      this.onTransitionEnd?.(fromMode, newMode);
    }, 500); // 500ms transition

    return true;
  }

  /**
   * Cycle to next mode: ambient -> sartan -> patryn -> ambient
   */
  cycleMode(): SkinMode {
    const modes: SkinMode[] = ['ambient', 'sartan', 'patryn'];
    const currentIndex = modes.indexOf(this.currentMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    
    this.transitionTo(modes[nextIndex]);
    return this.currentMode;
  }

  isTransitioning(): boolean {
    return this.transitionInProgress;
  }
}

/**
 * Gesture to action mapper based on current mode
 */
export function mapGestureToAction(
  gesture: string, 
  mode: SkinMode
): string {
  const config = MODE_CONFIGS[mode];
  return config.gestureMapping[gesture as keyof typeof config.gestureMapping] || 'none';
}
