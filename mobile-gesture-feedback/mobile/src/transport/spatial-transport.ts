import type { 
  GesturePayload, 
  RenderPayload, 
  GestureData, 
  ThermalData, 
  ProximityData,
  XRpcError 
} from '../types/gesture';

export type ConnectionState = 'DISCONNECTED' | 'CONNECTING' | 'AUTHENTICATED' | 'OPERATIONAL';

export interface SpatialTransportConfig {
  host: string;
  devMode?: boolean;
  onGesture?: (data: GestureData) => void;
  onThermal?: (data: ThermalData) => void;
  onProximity?: (data: ProximityData) => void;
  onPreview?: (intent: string, visual: string, duration: number) => void;
  onHaptic?: (pattern: string, intensity: string, duration?: number, gaps?: number[]) => void;
  onState?: (mode: string, previewQueue: number) => void;
  onThermalAdapt?: (tier: number, actions: string[]) => void;
  onError?: (error: XRpcError) => void;
  onStateChange?: (state: ConnectionState) => void;
}

const DEFAULT_CONFIG: Partial<SpatialTransportConfig> = {
  devMode: false,
};

export class SpatialTransport {
  private ws: WebSocket | null = null;
  private config: SpatialTransportConfig;
  private state: ConnectionState = 'DISCONNECTED';
  private reconnectAttempts = 0;
  private maxReconnectDelay = 30000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private authToken: string | null = null;

  constructor(config: SpatialTransportConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.connect();
  }

  private get endpoint(): string {
    const protocol = this.config.devMode ? 'ws' : 'wss';
    const port = this.config.devMode ? ':8080' : '';
    return `${protocol}://${this.config.host}${port}/spatial`;
  }

  private setState(newState: ConnectionState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.config.onStateChange?.(newState);
    }
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.setState('CONNECTING');

    try {
      this.ws = new WebSocket(this.endpoint);
      
      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.setState('AUTHENTICATED');
        // In production, would send auth token here
        this.sendAuth();
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as RenderPayload;
          this.handleMessage(payload);
        } catch (err) {
          console.error('Failed to parse message:', err);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.handleError({ code: 'TRANSPORT_ERROR', message: 'WebSocket error', recoverable: true });
      };

      this.ws.onclose = () => {
        this.setState('DISCONNECTED');
        this.scheduleReconnect();
      };
    } catch (err) {
      this.handleError({ code: 'INTERNAL_ERROR', message: String(err), recoverable: true });
      this.scheduleReconnect();
    }
  }

  private sendAuth(): void {
    // In production, include token: { type: 'auth', token: this.authToken }
    // For now, just transition to operational after auth handshake
    this.setState('OPERATIONAL');
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;

    const delay = Math.min(
      1000 * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private handleMessage(payload: RenderPayload): void {
    switch (payload.type) {
      case 'preview':
        if (payload.data) {
          const preview = payload.data as { intent: string; visual: string; duration: number };
          this.config.onPreview?.(preview.intent, preview.visual, preview.duration);
        }
        break;
      case 'haptic':
        if (payload.data) {
          const haptic = payload.data as { pattern: string; intensity: string; duration?: number; gaps?: number[] };
          this.config.onHaptic?.(haptic.pattern, haptic.intensity, haptic.duration, haptic.gaps);
        }
        break;
      case 'state':
        if (payload.data) {
          const state = payload.data as { mode: string; previewQueue: number };
          this.config.onState?.(state.mode, state.previewQueue);
        }
        break;
      case 'thermal_adapt':
        if (payload.data) {
          const adapt = payload.data as { tier: number; actions: string[] };
          this.config.onThermalAdapt?.(adapt.tier, adapt.actions);
        }
        break;
    }
  }

  private handleError(error: XRpcError): void {
    this.config.onError?.(error);
  }

  // Public API for sending data
  sendGesture(data: GestureData): void {
    this.send({ type: 'gesture', timestamp: Date.now(), data });
  }

  sendThermal(data: ThermalData): void {
    this.send({ type: 'thermal', timestamp: Date.now(), data });
  }

  sendProximity(data: ProximityData): void {
    this.send({ type: 'proximity', timestamp: Date.now(), data });
  }

  private send(payload: GesturePayload): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
    this.setState('DISCONNECTED');
  }

  getState(): ConnectionState {
    return this.state;
  }

  isOperational(): boolean {
    return this.state === 'OPERATIONAL';
  }
}
