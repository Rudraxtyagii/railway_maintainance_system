/**
 * Real-Time Stream & WebSocket Synchronization Service for RAILBLOCK (v3.0)
 * Connects to the Indian Railways Live Stream Event Bus on Render / Localhost.
 * Automatically derives wss:// and https:// endpoints from VITE_API_BASE_URL.
 * Switches seamlessly between WebSocket and Server-Sent Events (SSE) with exponential backoff.
 */

function resolveWsUrl() {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  if (apiBase) {
    const clean = apiBase.replace(/\/api\/?$/, '');
    if (clean.startsWith('https://')) {
      return clean.replace('https://', 'wss://') + '/ws/events';
    } else if (clean.startsWith('http://')) {
      return clean.replace('http://', 'ws://') + '/ws/events';
    }
  }
  if (typeof window !== 'undefined' && window.location) {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `${proto}//localhost:8080/ws/events`;
    }
    return `${proto}//${window.location.host}/ws/events`;
  }
  return 'ws://localhost:8080/ws/events';
}

function resolveSseUrl() {
  if (import.meta.env.VITE_SSE_URL) {
    return import.meta.env.VITE_SSE_URL;
  }
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  if (apiBase) {
    const clean = apiBase.replace(/\/api\/?$/, '');
    return `${clean}/api/realtime/events`;
  }
  if (typeof window !== 'undefined' && window.location) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8080/api/realtime/events';
    }
    return `${window.location.origin}/api/realtime/events`;
  }
  return 'http://localhost:8080/api/realtime/events';
}

class RealtimeService {
  constructor() {
    this.ws = null;
    this.eventSource = null;
    this.status = 'DISCONNECTED'; // 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED'
    this.statusListeners = new Set();
    this.reconnectTimer = null;
    this.reconnectAttempts = 0;
    this.pingInterval = null;
  }

  onStatusChange(callback) {
    this.statusListeners.add(callback);
    callback(this.status);
    return () => this.statusListeners.delete(callback);
  }

  _setStatus(newStatus) {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.statusListeners.forEach(cb => cb(this.status));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('railblock:connection_status', { detail: { status: newStatus } }));
      }
    }
  }

  connect() {
    if (typeof window === 'undefined') return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this._setStatus('CONNECTING');
    const wsUrl = resolveWsUrl();

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this._setStatus('CONNECTED');
        this.reconnectAttempts = 0;
        console.log(`🚄 Connected to Indian Railways Live Event Bus (${wsUrl.startsWith('wss:') ? 'Secure WSS' : 'WebSocket'}).`);

        // On reconnect / connect, trigger a fresh refetch from PostgreSQL
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('railblock:data_changed', { detail: { action: 'CONNECTED' } }));
        }

        // Start ping loop
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.pingInterval = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send('PING');
          }
        }, 25000);
      };

      this.ws.onmessage = (event) => {
        if (event.data === 'PONG') return;
        try {
          const payload = JSON.parse(event.data);
          this._handleIncomingEvent(payload);
        } catch (e) {
          console.warn('Malformed realtime payload:', e);
        }
      };

      this.ws.onclose = () => {
        this._setStatus('DISCONNECTED');
        if (this.pingInterval) clearInterval(this.pingInterval);
        this._scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.warn('WebSocket connection error, attempting SSE fallback...', err);
        if (this.ws) this.ws.close();
        this._connectSSE();
      };
    } catch (e) {
      this._connectSSE();
    }
  }

  _connectSSE() {
    if (this.eventSource) {
      this.eventSource.close();
    }

    const sseUrl = resolveSseUrl();
    try {
      this.eventSource = new EventSource(sseUrl);

      this.eventSource.onopen = () => {
        this._setStatus('CONNECTED');
        this.reconnectAttempts = 0;
        console.log('🚄 Connected to Indian Railways Live Real-Time Stream (SSE Fallback).');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('railblock:data_changed', { detail: { action: 'CONNECTED' } }));
        }
      };

      this.eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          this._handleIncomingEvent(payload);
        } catch (e) {
          // ignore keepalive
        }
      };

      this.eventSource.onerror = () => {
        this._setStatus('DISCONNECTED');
        this.eventSource.close();
        this._scheduleReconnect();
      };
    } catch (e) {
      this._setStatus('DISCONNECTED');
      this._scheduleReconnect();
    }
  }

  _handleIncomingEvent(payload) {
    if (typeof window === 'undefined') return;

    // Dispatch generic events
    window.dispatchEvent(new CustomEvent('railblock:realtime_event', { detail: payload }));
    window.dispatchEvent(new CustomEvent('railblock:data_changed', { detail: payload }));

    // Dispatch specific event types
    switch (payload.type) {
      case 'REQUEST_CREATED':
      case 'TASK_CREATED':
      case 'STREAM_INGESTED':
        window.dispatchEvent(new CustomEvent('railblock:task_created', { detail: payload.data }));
        window.dispatchEvent(new CustomEvent('railblock:metrics_updated', { detail: payload.data }));
        break;
      case 'REQUEST_UPDATED':
      case 'TASK_UPDATED':
        window.dispatchEvent(new CustomEvent('railblock:task_updated', { detail: payload.data }));
        window.dispatchEvent(new CustomEvent('railblock:metrics_updated', { detail: payload.data }));
        break;
      case 'TASK_DELETED':
        window.dispatchEvent(new CustomEvent('railblock:task_deleted', { detail: payload.data }));
        window.dispatchEvent(new CustomEvent('railblock:metrics_updated', { detail: payload.data }));
        break;
      case 'HITL_APPROVED':
      case 'HITL_MODIFIED':
      case 'HITL_DENIED':
      case 'HITL_DECISION_ENTERED':
        window.dispatchEvent(new CustomEvent('railblock:hitl_decision', { detail: payload.data }));
        window.dispatchEvent(new CustomEvent('railblock:task_updated', { detail: payload.data }));
        window.dispatchEvent(new CustomEvent('railblock:metrics_updated', { detail: payload.data }));
        break;
      case 'EMERGENCY_OVERRIDE':
      case 'EMERGENCY_OVERRIDE_TRIGGERED':
        window.dispatchEvent(new CustomEvent('railblock:hitl_decision', { detail: payload.data }));
        window.dispatchEvent(new CustomEvent('railblock:task_updated', { detail: payload.data }));
        window.dispatchEvent(new CustomEvent('railblock:metrics_updated', { detail: payload.data }));
        break;
      case 'NOTIFICATION_CREATED':
        window.dispatchEvent(new CustomEvent('railblock:notification_created', { detail: payload.data }));
        break;
      case 'DATABASE_RESET':
        window.dispatchEvent(new CustomEvent('railblock:database_reset', { detail: payload.data }));
        window.dispatchEvent(new CustomEvent('railblock:metrics_updated', { detail: payload.data }));
        break;
      case 'USER_PROVISIONED':
      case 'USER_UPDATED':
        window.dispatchEvent(new CustomEvent('railblock:user_changed', { detail: payload.data }));
        break;
      case 'SCHEDULE_APPROVED':
      case 'SCHEDULE_PUBLISHED':
      case 'CONFLICT_RESOLVED':
      case 'BUNDLE_STATUS_CHANGED':
      case 'OPTIMIZATION_COMPLETED':
      case 'METRICS_UPDATED':
        window.dispatchEvent(new CustomEvent('railblock:metrics_updated', { detail: payload.data }));
        break;
      default:
        break;
    }
  }

  _scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectAttempts = Math.min(this.reconnectAttempts + 1, 10);
    const delay = Math.min(1500 * Math.pow(1.5, this.reconnectAttempts - 1), 30000);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  disconnect() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this._setStatus('DISCONNECTED');
  }
}

export const realtimeService = new RealtimeService();
