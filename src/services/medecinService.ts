import { fetch } from '@tauri-apps/plugin-http';

const BASE_URL = 'https://walrus-app-j9qyk.ondigitalocean.app';

export type Profession = 'PARODENTAIRE' | 'ORTHODENTAIRE';

export interface MedecinData {
  pwd: string;
  id: string;
  profession: Profession;
  isSpecialiste: boolean;
  userId: string;
  user?: {
    id: string;
    username: string;
    email: string;
    name: string;
    role: string;
  };
}

export interface CreateMedecinData {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  profession: Profession;
  isSpecialiste: boolean;
  pwd: string;
}

export const medecinService = {
  getAll: async () => {
    const response = await fetch(`${BASE_URL}/medecin`);
    return response.json();
  },

  getById: async (id: string) => {
    const response = await fetch(`${BASE_URL}/medecin/${id}`);
    return response.json();
  },
  

  create: async (data: CreateMedecinData) => {
    const response = await fetch(`${BASE_URL}/medecin`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create doctor');
    }
    return response.json();
  },

  update: async (id: string, data: Partial<CreateMedecinData>) => {
    const response = await fetch(`${BASE_URL}/medecin/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.json();
  },

  delete: async (id: string) => {
    await fetch(`${BASE_URL}/medecin/${id}`, {
      method: 'DELETE',
    });
  }
};