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
  name?: string; // Added name field to match API structure
  role: string;
  phone?: string; // Added phone field
}

// User service handles base user operations, specific user types (medecin/etudiant) 
// are handled by their respective services

export const userService = {  getAll: async () => {
    const response = await fetch(`${BASE_URL}/users`, { headers: withAuthHeader().headers });
    const users = await response.json();
    
    // Map the data to extract firstName and lastName from name attribute
    return users.map((user: any) => {
      if (user.name) {
        const nameParts = user.name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        return {
          ...user,
          firstName,
          lastName
        };
      }
      return user;
    });
  },  create: async (data: Omit<UserData, 'id' | 'enabled'>) => {
    // Create a copy of the data for modification
    const createData = { ...data };
    
    // Combine firstName and lastName into name if they exist
    if (createData.firstName || createData.lastName) {
      createData.name = `${createData.firstName || ''} ${createData.lastName || ''}`.trim();
    }
    
    const response = await fetch(`${BASE_URL}/users`, { ...withAuthHeader(),
      method: 'POST',
      body: JSON.stringify(createData),
      headers: { 'Content-Type': 'application/json' },
    });
    
    const result = await response.json();
    
    // Map back to our expected format with firstName and lastName
    if (result.name) {
      const nameParts = result.name.split(' ');
      result.firstName = nameParts[0] || '';
      result.lastName = nameParts.slice(1).join(' ') || '';
    }
    
    return result;
  },
  update: async (id: string, data: Partial<UserData>) => {
    // Create a copy of the data for modification
    const updatedData = { ...data };
    
    // Combine firstName and lastName into name if they exist
    if (updatedData.firstName || updatedData.lastName) {
      updatedData.name = `${updatedData.firstName || ''} ${updatedData.lastName || ''}`.trim();
    }
    
    const response = await fetch(`${BASE_URL}/users/${id}`, { ...withAuthHeader(),
      method: 'PUT',
      body: JSON.stringify(updatedData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const result = await response.json();
    
    // Map back to our expected format with firstName and lastName
    if (result.name) {
      const nameParts = result.name.split(' ');
      result.firstName = nameParts[0] || '';
      result.lastName = nameParts.slice(1).join(' ') || '';
    }
    
    return result;
  },
  delete: async (id: string) => {
    await fetch(`${BASE_URL}/users/${id}`, {
      ...withAuthHeader(),
      method: 'DELETE',
    });
  },

  getMedecins: async (): Promise<MedecinData[]> => {
    const response = await fetch(`${BASE_URL}/medecin`, { headers: withAuthHeader().headers });
    return response.json();
  }
};
