import AsyncStorage from '@react-native-async-storage/async-storage';

// Use the user's local IP address for backend API calls
const API_URL = 'http://192.168.62.235:3000';

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
    
    console.log(`Making ${options.method || 'GET'} request to: ${API_URL}${endpoint}`);
    
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });
      
      let data = {};
      try {
        data = await response.json();
      } catch (e) {
        console.log('Failed to parse JSON response, using empty object');
        data = {};
      }
      
      console.log(`Response status: ${response.status}, data:`, data);
      
      if (!response.ok) {
        // Log for debugging
        console.error('API error:', data, response.status);
        const errorMessage = (data as any).error || (data as any).message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      // Log for debugging
      console.log('API success:', data, response.status);
      return data;
    } catch (error: any) {
      console.error('Network error:', error);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server. Please check your internet connection.');
      }
      throw error;
    }
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

  async put(endpoint: string, data: any, options: RequestInit = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
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

  async delete(endpoint: string, options: RequestInit = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiClient();

// Content Progress Tracking APIs
export const contentProgressApi = {
  // Get progress for a campaign participation
  getProgress: async (participationId: string) => {
    const response = await api.get(`/api/campaigns/participation/${participationId}/progress`);
    return response;
  },

  // Submit content for a progress item
  submitContent: async (participationId: string, data: { progressId: string; contentUrl: string; contentType: string }) => {
    const response = await api.post(`/api/campaigns/participation/${participationId}/submit-content`, data);
    return response;
  },

  // Update a submission
  updateSubmission: async (submissionId: string, data: { contentUrl: string }) => {
    const response = await api.put(`/api/campaigns/submission/${submissionId}`, data);
    return response;
  },

  // Delete a submission
  deleteSubmission: async (submissionId: string) => {
    const response = await api.delete(`/api/campaigns/submission/${submissionId}`);
    return response;
  }
}; 