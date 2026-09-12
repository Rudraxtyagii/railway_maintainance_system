/**
 * Centralized API Client for RAILBLOCK (v3.0)
 * Directly connects to FastAPI PostgreSQL backend on port 8080.
 * Handles JWT authorization, error parsing, and live telemetry data exchange.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
// Default to live backend mode unless explicitly set to mock
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  getHeaders() {
    const token = localStorage.getItem('railblock_token');
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  async request(endpoint, options = {}) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    // If endpoint already includes /api and baseUrl ends with /api, avoid double /api/api
    let fullUrl;
    if (this.baseUrl.endsWith('/api') && cleanEndpoint.startsWith('/api/')) {
      fullUrl = `${this.baseUrl.slice(0, -4)}${cleanEndpoint}`;
    } else {
      fullUrl = `${this.baseUrl}${cleanEndpoint}`;
    }

    const config = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(fullUrl, config);
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const errorMsg = errorBody.detail || errorBody.message || errorBody.title || `HTTP ${response.status}: ${response.statusText}`;
        const error = new Error(errorMsg);
        error.status = response.status;
        error.data = errorBody;
        throw error;
      }
      // Return null or empty object if 204 No Content
      if (response.status === 204) {
        return null;
      }
      return await response.json();
    } catch (err) {
      if (USE_MOCK) {
        console.warn('API call failed in mock mode, falling back:', err);
        return null;
      }
      throw err;
    }
  }

  get(endpoint, params = {}) {
    const validParams = Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '');
    const query = new URLSearchParams(validParams).toString();
    const url = query ? `${endpoint}?${query}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  post(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  put(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  patch(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  async simulateDelay(ms = 150) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export { API_BASE_URL, USE_MOCK };
