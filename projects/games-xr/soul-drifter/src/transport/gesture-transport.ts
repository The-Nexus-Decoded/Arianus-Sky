// GestureTransport - WSS client with battery awareness
// Handles connection lifecycle, reconnection, and battery-aware suspend

import {
  TransportConfig,
  TransportState,
  ConnectionState,
  DEFAULT_TRANSPORT,
} from '../types/transport';
import { GestureEvent } from '../types/gesture';

type GestureHandler = (event: GestureEvent) => void;
type StateHandler = (state: TransportState) => void;

export class GestureTransport {
  private config: TransportConfig;
  private ws: WebSocket | null = null;
  private state: TransportState = { state: 'disconnected' };
  private gestureHandler: GestureHandler | null = null;
  private stateHandler: StateHandler | null = null;
  private batteryLevel: number = 1.0;
  private batteryMonitor: Promise<void> | null = null;
  private reconnectAttempts = 0;
  private pingInterval: number | null = null;
  private backgroundTimeout: number | null = null;

  constructor(config: Partial<TransportConfig> = {}) {
    this.config = { ...DEFAULT_TRANSPORT, ...config };
  }

  // Lifecycle
  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    this.setState({ state: 'connecting' });

    const url = `${this.config.protocol}://${this.config.host}:${this.config.port}${this.config.path}`;
    console.log('[GestureTransport] Connecting to', url);

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          console.log('[GestureTransport] Connected');
          this.setState({ state: 'connected' });
          this.reconnectAttempts = 0;
          this.startPing();
          this.startBatteryMonitor();
          resolve();
        };

        this.ws.onmessage = (msg) => {
          try {
            const event: GestureEvent = JSON.parse(msg.data);
            this.gestureHandler?.(event);
          } catch (e) {
            console.warn('[GestureTransport] Parse error:', e);
          }
        };

        this.ws.onclose = () => {
          console.log('[GestureTransport] Disconnected');
          this.stopPing();
          this.handleDisconnect();
        };

        this.ws.onerror = (err) => {
          console.error('[GestureTransport] Error:', err);
          reject(err);
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  disconnect(): void {
    this.stopPing();
    this.stopBatteryMonitor();
    this.ws?.close();
    this.ws = null;
    this.setState({ state: 'disconnected' });
  }

  // Handlers
  onGesture(handler: GestureHandler): void {
    this.gestureHandler = handler;
  }

  onStateChange(handler: StateHandler): void {
    this.stateHandler = handler;
  }

  // Send gesture (mobile → VR)
  send(event: GestureEvent): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.warn('[GestureTransport] Not connected');
      return;
    }
    this.ws.send(JSON.stringify(event));
  }

  // Internal
  private setState(partial: Partial<TransportState>): void {
    this.state = { ...this.state, ...partial };
    this.stateHandler?.(this.state);
  }

  private handleDisconnect(): void {
    if (!this.config.reconnect.enabled) {
      this.setState({ state: 'disconnected' });
      return;
    }

    if (this.reconnectAttempts >= this.config.reconnect.maxRetries) {
      console.error('[GestureTransport] Max retries reached');
      this.setState({ state: 'disconnected' });
      return;
    }

    this.setState({ state: 'reconnecting' });
    const delay = Math.min(
      this.config.reconnect.backoffMs * Math.pow(2, this.reconnectAttempts),
      this.config.reconnect.maxBackoffMs
    );

    console.log(`[GestureTransport] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);
    this.reconnectAttempts++;

    setTimeout(() => this.connect(), delay);
  }

  private startPing(): void {
    this.pingInterval = window.setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
        this.setState({ lastPingMs: Date.now() });
      }
    }, 5000);
  }

  private stopPing(): void {
    if (this.pingInterval) clearInterval(this.pingInterval);
  }

  // Battery awareness
  private startBatteryMonitor(): void {
    if (!this.config.battery.observeBatteryLevel) return;

    this.batteryMonitor = (async () => {
      // @ts-ignore - navigator.getBattery is experimental
      const battery = await navigator.getBattery?.();
      if (!battery) return;

      const check = () => {
        this.batteryLevel = battery.level;
        this.setState({ batteryLevel: this.batteryLevel });

        if (this.batteryLevel < this.config.battery.lowBatteryThreshold) {
          if (this.config.battery.suspendOnLowBattery) {
            console.warn('[GestureTransport] Low battery, suspending');
            this.setState({ state: 'suspended_low_battery' });
            this.disconnect();
          }
        }
      };

      battery.addEventListener('levelchange', check);
      check();
    })();
  }

  private stopBatteryMonitor(): void {
    this.batteryMonitor = null;
  }

  // Background awareness (call from page visibility handler)
  handleVisibilityChange(): void {
    if (document.visibilityState === 'hidden') {
      this.backgroundTimeout = window.setTimeout(() => {
        console.log('[GestureTransport] Background timeout, disconnecting');
        this.setState({ state: 'suspended_background' });
        this.disconnect();
      }, this.config.battery.backgroundDisconnectMs);
    } else {
      if (this.backgroundTimeout) {
        clearTimeout(this.backgroundTimeout);
        this.backgroundTimeout = null;
      }
      // Auto-reconnect on foreground
      if (this.state.state === 'suspended_background') {
        this.connect();
      }
    }
  }

  getState(): TransportState {
    return this.state;
  }
}
