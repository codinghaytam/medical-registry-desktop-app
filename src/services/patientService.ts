import { fetchWithAuth } from './authService';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
      const response = await fetchWithAuth(`${BASE_URL}/patient`);
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
      const response = await fetchWithAuth(`${BASE_URL}/patient/${id}`);
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
      const response = await fetchWithAuth(`${BASE_URL}/patient`, {
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
      const response = await fetchWithAuth(`${BASE_URL}/patient/${id}`, {
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
      const response = await fetchWithAuth(`${BASE_URL}/patient/${id}`, {
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
      const response = await fetchWithAuth(`${BASE_URL}/patient/Paro-Ortho/${id}`, {
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
  },

  // New function to transfer patient from ORTHODONTAIRE to PARODONTAIRE
  transferOrthoToParo: async (id: string, medecinId: string) => {
    try {
      const response = await fetchWithAuth(`${BASE_URL}/patient/Ortho-Paro/${id}`, {
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
      console.error(`Error transferring patient ${id} to Parodontaire:`, error);
      throw error;
    }
  }
};

// ============================================================================
// CLIENT-SIDE HELPER FUNCTIONS
// ============================================================================

/**
 * Filter patients by profession (client-side helper)
 * 
 * NOTE: The API automatically filters patients server-side for MEDECIN users.
 * This function is provided as a client-side helper for additional filtering
 * or for displaying filtered results in the UI.
 * 
 * @param patients - Array of patients to filter
 * @param profession - Profession to filter by ('ORTHODONTAIRE' or 'PARODONTAIRE')
 * @returns Filtered array of patients matching the profession
 */
export const filterPatientsByProfession = (
  patients: PatientData[],
  profession: 'ORTHODONTAIRE' | 'PARODONTAIRE'
): PatientData[] => {
  return patients.filter(patient => patient.state === profession);
};

/**
 * Check if a patient matches the user's profession
 * 
 * @param patient - Patient to check
 * @param profession - User's profession
 * @returns true if patient state matches profession
 */
export const patientMatchesProfession = (
  patient: PatientData,
  profession: 'ORTHODONTAIRE' | 'PARODONTAIRE'
): boolean => {
  return patient.state === profession;
};

