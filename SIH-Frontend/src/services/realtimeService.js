/**
 * Real-Time Stream & WebSocket Synchronization Service for RAILBLOCK (v3.0)
 * Connects to the Indian Railways Live Stream Event Bus on port 8080.
 * Automatically switches between WebSocket and Server-Sent Events (SSE).
 */

class RealtimeService {
  constructor() {
    this.ws = null;
    this.eventSource = null;
    this.status = 'DISCONNECTED'; // 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED'
    this.statusListeners = new Set();
    this.reconnectTimer = null;
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

    const wsUrl = (import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws/events');

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this._setStatus('CONNECTED');
        console.log('🚄 Connected to Indian Railways Live Real-Time Stream Bus (WebSocket).');

        // Start ping loop
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

    const sseUrl = (import.meta.env.VITE_SSE_URL || 'http://localhost:8080/api/realtime/events');
    try {
      this.eventSource = new EventSource(sseUrl);

      this.eventSource.onopen = () => {
        this._setStatus('CONNECTED');
        console.log('🚄 Connected to Indian Railways Live Real-Time Stream (SSE Fallback).');
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

    // Dispatch generic event
    window.dispatchEvent(new CustomEvent('railblock:realtime_event', { detail: payload }));
    window.dispatchEvent(new CustomEvent('railblock:data_changed', { detail: payload }));

    // Dispatch specific event types
    switch (payload.type) {
      case 'TASK_CREATED':
      case 'STREAM_INGESTED':
        window.dispatchEvent(new CustomEvent('railblock:task_created', { detail: payload.data }));
        window.dispatchEvent(new CustomEvent('railblock:metrics_updated', { detail: payload.data }));
        break;
      case 'TASK_UPDATED':
      case 'TASK_DELETED':
      case 'SCHEDULE_APPROVED':
      case 'SCHEDULE_PUBLISHED':
      case 'CONFLICT_RESOLVED':
      case 'BUNDLE_STATUS_CHANGED':
      case 'HITL_DECISION_ENTERED':
      case 'EMERGENCY_OVERRIDE_TRIGGERED':
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
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, 4000);
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
