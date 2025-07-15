import { MedecinData } from './seanceService';
import { fetchWithAuth } from './authService';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface UserData {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string; // Added name field to match API structure
  role: string;
  phone?: string; // Added phone field
  pwd?: string; // Added password field to match API structure
}

// User service handles base user operations, specific user types (medecin/etudiant) 
// are handled by their respective services

export const userService = {
  getAll: async () => {
    const response = await fetchWithAuth(`${BASE_URL}/users`);
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
  },

  create: async (data: Omit<UserData, 'id'>) => {
    // Create a copy of the data for modification
    const createData = { ...data };
    
    // Backend expects firstName and lastName fields, not name
    // Remove name field if it exists to avoid confusion
    delete createData.name;
    
    // Ensure firstName and lastName are provided
    if (!createData.firstName && !createData.lastName && data.name) {
      // If name is provided but not firstName/lastName, split it
      const nameParts = data.name.split(' ');
      createData.firstName = nameParts[0] || '';
      createData.lastName = nameParts.slice(1).join(' ') || '';
    }
    
    // Ensure we have default values for required fields
    if (!createData.firstName) createData.firstName = '';
    if (!createData.lastName) createData.lastName = '';
    
    const response = await fetchWithAuth(`${BASE_URL}/users`, {
      method: 'POST',
      body: JSON.stringify(createData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Create user failed:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Failed to create user: ${response.status} ${response.statusText}`);
    }
    
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
    
    // Remove name field to avoid confusion with backend logic
    delete updatedData.name;
    
    // Ensure firstName and lastName are provided if name was given
    if (!updatedData.firstName && !updatedData.lastName && data.name) {
      const nameParts = data.name.split(' ');
      updatedData.firstName = nameParts[0] || '';
      updatedData.lastName = nameParts.slice(1).join(' ') || '';
    }
    
    const response = await fetchWithAuth(`${BASE_URL}/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updatedData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Update user failed:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Failed to update user: ${response.status} ${response.statusText}`);
    }
    
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
    await fetchWithAuth(`${BASE_URL}/users/${id}`, {
      method: 'DELETE',
    });
  },

  getById: async (id: string): Promise<UserData> => {
    const response = await fetchWithAuth(`${BASE_URL}/users/${id}`);
    const user = await response.json();
    
    // Map the data to extract firstName and lastName from name attribute
    if (user.name) {
      const nameParts = user.name.split(' ');
      user.firstName = nameParts[0] || '';
      user.lastName = nameParts.slice(1).join(' ') || '';
    }
    
    return user;
  },

  getByEmail: async (email: string): Promise<UserData> => {
    const response = await fetchWithAuth(`${BASE_URL}/users/email/${email}`);
    const user = await response.json();
    
    // Map the data to extract firstName and lastName from name attribute
    if (user.name) {
      const nameParts = user.name.split(' ');
      user.firstName = nameParts[0] || '';
      user.lastName = nameParts.slice(1).join(' ') || '';
    }
    
    return user;
  },

  getByRole: async (role: string): Promise<UserData[]> => {
    const response = await fetchWithAuth(`${BASE_URL}/users/role/${role}`);
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
  },

  getMedecins: async (): Promise<MedecinData[]> => {
    const response = await fetchWithAuth(`${BASE_URL}/users/medecins`);
    return response.json();
  }
};
