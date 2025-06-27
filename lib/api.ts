import AsyncStorage from '@react-native-async-storage/async-storage';

// Use the user's local IP address for backend API calls
const API_URL = 'http://192.168.1.10:3000';

class ApiClient {
  async getToken() {
    return await AsyncStorage.getItem('token');
  }

  async setToken(token: string) {
    await AsyncStorage.setItem('token', token);
  }

  async clearToken() {
    await AsyncStorage.removeItem('token');
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };
    const token = await this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });
    let data = {};
    try {
      data = await response.json();
    } catch (e) {
      data = {};
    }
    if (!response.ok) {
      // Log for debugging
      console.error('API error:', data, response.status);
      throw new Error(((data as any).error || (data as any).message) || `HTTP error! status: ${response.status}`);
    }
    // Log for debugging
    console.log('API success:', data, response.status);
    return data;
  }

  async get(endpoint: string, options: RequestInit = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint: string, data: any, options: RequestInit = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async patch(endpoint: string, data: any, options: RequestInit = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient(); 