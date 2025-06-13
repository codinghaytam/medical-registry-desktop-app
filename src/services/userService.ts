import { fetch } from '@tauri-apps/plugin-http';
import { MedecinData } from './seanceService';
import { withAuthHeader } from './authService';

const BASE_URL = 'https://walrus-app-j9qyk.ondigitalocean.app';

export interface UserData {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

export const userService = {
  getAll: async () => {
    const response = await fetch(`${BASE_URL}/users`, { headers: withAuthHeader().headers });
    return response.json();
  },

  create: async (data: Omit<UserData, 'id' | 'enabled'>) => {
    const response = await fetch(`${BASE_URL}/users`, { ...withAuthHeader(),
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
  },

  update: async (id: string, data: Partial<UserData>) => {
    const response = await fetch(`${BASE_URL}/users/${id}`, { ...withAuthHeader(),
      method: 'PUT',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.json();
  },

  delete: async (id: string) => {
    await fetch(`${BASE_URL}/users/${id}`, { ...withAuthHeader(),
      method: 'DELETE',
    });
  },

  getMedecins: async (): Promise<MedecinData[]> => {
    const response = await fetch(`${BASE_URL}/medecin`, { headers: withAuthHeader().headers });
    return response.json();
  }
};
