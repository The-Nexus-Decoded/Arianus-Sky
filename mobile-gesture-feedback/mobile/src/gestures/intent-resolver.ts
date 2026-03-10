import { 
  type GestureType, 
  type Intent, 
  type IntentType,
  GESTURE_INTENT_MAP,
  CONFIDENCE_THRESHOLD,
  CONFIDENCE_CONFIRM_THRESHOLD 
} from '../types/gesture';

export interface IntentResolverConfig {
  onIntentConfirmed?: (intent: Intent) => void;
  onIntentQueued?: (intent: Intent) => void;
  onIntentRejected?: (intent: Intent, reason: string) => void;
  mode: 'sartan' | 'patryn';
}

export class IntentResolver {
  private config: IntentResolverConfig;
  private pendingConfirmation: Intent | null = null;

  constructor(config: IntentResolverConfig) {
    this.config = config;
  }

  resolve(
    gesture: GestureType,
    confidence: number,
    position?: { x: number; y: number; z?: number }
  ): Intent | null {
    const mapping = GESTURE_INTENT_MAP[gesture];
    
    if (!mapping) {
      return null;
    }

    // Check mode compatibility
    if (mapping.mode !== this.config.mode) {
      return null;
    }

    const intent: Intent = {
      id: crypto.randomUUID(),
      type: mapping.intent,
      gesture,
      confidence,
      position,
      timestamp: Date.now(),
      ttl: mapping.ttl,
      mode: mapping.mode,
    };

    // Confidence evaluation per spec Section 4.3
    if (confidence >= CONFIDENCE_THRESHOLD) {
      // Immediate execution
      this.config.onIntentConfirmed?.(intent);
      return intent;
    } else if (confidence >= CONFIDENCE_CONFIRM_THRESHOLD) {
      // Queue for confirmation
      this.pendingConfirmation = intent;
      this.config.onIntentQueued?.(intent);
      return intent;
    } else {
      // Below threshold - ignore
      this.config.onIntentRejected?.(intent, 'confidence_below_threshold');
      return null;
    }
  }

  confirmPending(): Intent | null {
    if (this.pendingConfirmation) {
      const intent = this.pendingConfirmation;
      this.config.onIntentConfirmed?.(intent);
      this.pendingConfirmation = null;
      return intent;
    }
    return null;
  }

  rejectPending(): void {
    if (this.pendingConfirmation) {
      this.config.onIntentRejected?.(this.pendingConfirmation, 'user_rejected');
      this.pendingConfirmation = null;
    }
  }

  hasPending(): boolean {
    return this.pendingConfirmation !== null;
  }

  getPending(): Intent | null {
    return this.pendingConfirmation;
  }
}
