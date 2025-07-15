import { fetchWithAuth } from './authService';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface EtudiantData {
  id: string;
  niveau: number;
  userId: string;
  user?: {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export interface CreateEtudiantData {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  pwd: string;
  role: string;
  niveau: number;
}

export const etudiantService = {
  getAll: async () => {
    const response = await fetchWithAuth(`${BASE_URL}/etudiant`);
    return response.json();
  },

  getById: async (id: string) => {
    const response = await fetchWithAuth(`${BASE_URL}/etudiant/${id}`);
    return response.json();
  },

  create: async (data: CreateEtudiantData) => {
    const response = await fetchWithAuth(`${BASE_URL}/etudiant`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create student');
    }
    
    return response.json();
  },

  update: async (id: string, data: Partial<CreateEtudiantData>) => {
    const response = await fetchWithAuth(`${BASE_URL}/etudiant/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.json();
  },

  delete: async (id: string) => {
    await fetchWithAuth(`${BASE_URL}/etudiant/${id}`, {
      method: 'DELETE',
    });
  }
};
