import { fetch } from '@tauri-apps/plugin-http';

const BASE_URL = 'https://walrus-app-j9qyk.ondigitalocean.app';

export type MotifConsultation = 'ESTHETIQUE' | 'FONCTIONNELLE' | 'ADRESSE_PAR_CONFRERE';
export type HygieneBuccoDentaire = 'BONNE' | 'MOYENNE' | 'MAUVAISE';
export type TypeMastication = 'UNILATERALE_ALTERNEE' | 'UNILATERALE_STRICTE' | 'BILATERALE';

export interface PatientData {
  id?: string;
  nom: string;
  prenom: string;
  numeroDeDossier: string;
  adresse: string;
  tel: string;
  motifConsultation: MotifConsultation;
  anameseGenerale?: string;
  anamneseFamiliale?: string;
  anamneseLocale?: string;
  hygieneBuccoDentaire: HygieneBuccoDentaire;
  typeMastication: TypeMastication;
  antecedentsDentaires?: string;
  state?: string;
}

export const patientService = {
  getAll: async () => {
    try {
      const response = await fetch(`${BASE_URL}/patient`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw Object.assign(new Error(errorData.error || `Failed with status: ${response.status}`), { 
          response,
          status: response.status
        });
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching patients:', error);
      throw error;
    }
  },

  getById: async (id: string) => {
    try {
      const response = await fetch(`${BASE_URL}/patient/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw Object.assign(new Error(errorData.error || `Failed with status: ${response.status}`), { 
          response,
          status: response.status
        });
      }
      return response.json();
    } catch (error) {
      console.error(`Error fetching patient ${id}:`, error);
      throw error;
    }
  },

  create: async (data: PatientData) => {
    try {
      const response = await fetch(`${BASE_URL}/patient`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw Object.assign(new Error(errorData.error || `Failed with status: ${response.status}`), { 
          response,
          status: response.status
        });
      }
      return response.json();
    } catch (error) {
      console.error('Error creating patient:', error);
      throw error;
    }
  },

  update: async (id: string, data: Partial<PatientData>) => {
    try {
      const response = await fetch(`${BASE_URL}/patient/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw Object.assign(new Error(errorData.error || `Failed with status: ${response.status}`), { 
          response,
          status: response.status
        });
      }
      return response.json();
    } catch (error) {
      console.error(`Error updating patient ${id}:`, error);
      throw error;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await fetch(`${BASE_URL}/patient/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw Object.assign(new Error(errorData.error || `Failed with status: ${response.status}`), { 
          response,
          status: response.status
        });
      }
      return { success: true, id };
    } catch (error) {
      console.error(`Error deleting patient ${id}:`, error);
      throw error;
    }
  },
  
  // New function to transfer patient from PARODONTAIRE to ORTHODONTAIRE
  transferParoToOrtho: async (id: string, medecinId: string) => {
    try {
      const response = await fetch(`${BASE_URL}/patient/Paro-Ortho/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ medecinId }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw Object.assign(new Error(errorData.error || `Failed with status: ${response.status}`), { 
          response,
          status: response.status
        });
      }
      return response.json();
    } catch (error) {
      console.error(`Error transferring patient ${id} to Orthodontaire:`, error);
      throw error;
    }
  }
};
