// Transport Contract - Mobile → VR Gesture Stream
// WSS/TLS + battery-aware disconnect

export interface TransportConfig {
  protocol: 'wss' | 'ws';
  host: string;
  port: number;
  path: string;
  tls: boolean;
  reconnect: ReconnectPolicy;
  battery: BatteryPolicy;
}

export interface ReconnectPolicy {
  enabled: boolean;
  maxRetries: number;
  backoffMs: number;
  maxBackoffMs: number;
}

export interface BatteryPolicy {
  observeBatteryLevel: boolean;
  lowBatteryThreshold: number;  // 0.0-1.0
  suspendOnLowBattery: boolean;
  backgroundDisconnectMs: number;
}

export const DEFAULT_TRANSPORT: TransportConfig = {
  protocol: 'wss',
  host: 'xr.soul-drifter.local',
  port: 443,
  path: '/gesture/stream',
  tls: true,
  reconnect: {
    enabled: true,
    maxRetries: 5,
    backoffMs: 1000,
    maxBackoffMs: 30000,
  },
  battery: {
    observeBatteryLevel: true,
    lowBatteryThreshold: 0.15,
    suspendOnLowBattery: true,
    backgroundDisconnectMs: 30000,  // 30s background → disconnect
  },
};

// Battery-aware connection state
export type ConnectionState = 
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'suspended_low_battery'
  | 'suspended_background';

export interface TransportState {
  state: ConnectionState;
  batteryLevel?: number;
  lastPingMs?: number;
  lastPongMs?: number;
}
