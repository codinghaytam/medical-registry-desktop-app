import { fetch } from '@tauri-apps/plugin-http';
import { withAuthHeader } from './authService';

const BASE_URL = 'https://walrus-app-j9qyk.ondigitalocean.app';

export interface ReevaluationData {
  id?: string;
  indiceDePlaque: number;
  indiceGingivale: number;
  sondagePhoto?: string | File;
  seanceId: string;
  seance?: any;
}

export const reevaluationService = {
  getAll: async () => {
    const response = await fetch(`${BASE_URL}/reevaluation`, { headers: withAuthHeader().headers });
    return response.json();
  },

  getById: async (id: string) => {
    const response = await fetch(`${BASE_URL}/reevaluation/${id}`, { headers: withAuthHeader().headers });
    return response.json();
  },

  getBySeanceId: async (seanceId: string) => {
    const response = await fetch(`${BASE_URL}/reevaluation`, { headers: withAuthHeader().headers });
    const reevaluations = await response.json();
    return reevaluations.filter((reeval: any) => reeval.seanceId === seanceId);
  },

  create: async (data: FormData) => {
    try {
      // Log FormData contents for debugging
      for (const pair of data.entries()) {
        console.log('FormData entry:', pair[0], pair[1] instanceof File ? 
          `[File: ${(pair[1] as File).name}, ${(pair[1] as File).size} bytes]` : pair[1]);
      }

      const response = await fetch(`${BASE_URL}/reevaluation`, { ...withAuthHeader(),
        method: 'POST',
        // Do NOT set Content-Type header when sending FormData
        // The browser will set the proper multipart/form-data boundary
        body: data,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: errorText || 'Unknown error' };
        }
        console.error('Error response:', response.status, errorData);
        throw Object.assign(new Error(errorData.error || `Failed with status: ${response.status}`), { 
          response,
          status: response.status,
          data: errorData
        });
      }
      
      return response.json();
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  },

  update: async (id: string, data: FormData) => {
    try {
      // Log FormData contents for debugging
      for (const pair of data.entries()) {
        console.log('Update FormData entry:', pair[0], pair[1] instanceof File ? 
          `[File: ${(pair[1] as File).name}, ${(pair[1] as File).size} bytes]` : pair[1]);
      }

      const response = await fetch(`${BASE_URL}/reevaluation/${id}`, { ...withAuthHeader(),
        method: 'PUT',
        // Do NOT set Content-Type header when sending FormData
        body: data,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: errorText || 'Unknown error' };
        }
        console.error('Error response:', response.status, errorData);
        throw Object.assign(new Error(errorData.error || `Failed with status: ${response.status}`), { 
          response,
          status: response.status,
          data: errorData
        });
      }
      
      return response.json();
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  },

  delete: async (id: string) => {
    await fetch(`${BASE_URL}/reevaluation/${id}`, {
      ...withAuthHeader(),
      method: 'DELETE',
    });
  }
};