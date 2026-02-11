import { fetchWithAuth } from './authService';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface ConsultationData {
  date: string;
  idConsultation: string;
  patientId: string;
  medecinId: string;
}

export interface DiagnosisData {
  type: string;
  text: string;
  medecinId: string;
}

export const consultationService = {
  getAll: async () => {
    try {
      const response = await fetchWithAuth(`${BASE_URL}/consultation`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw Object.assign(new Error(errorData.error || `Failed with status: ${response.status}`), {
          response,
          status: response.status
        });
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching consultations:', error);
      throw error;
    }
  },
  create: async (data: ConsultationData) => {
    try {
      const response = await fetchWithAuth(`${BASE_URL}/consultation`, {
        method: 'POST',
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
      console.error('Error creating consultation:', error);
      throw error;
    }
  },
  update: async (id: string, data: Partial<ConsultationData>) => {
    try {
      const response = await fetchWithAuth(`${BASE_URL}/consultation/${id}`, {
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
      console.error('Error updating consultation:', error);
      throw error;
    }
  },
  delete: async (id: string) => {
    try {
      const response = await fetchWithAuth(`${BASE_URL}/consultation/${id}`, {
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
      console.error('Error deleting consultation:', error);
      throw error;
    }
  },
  addDiagnosis: async (consultationId: string, data: DiagnosisData) => {
    try {
      const response = await fetchWithAuth(`${BASE_URL}/consultation/${consultationId}/diagnosis`, {
        method: 'POST',
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
      console.error('Error adding diagnosis:', error);
      throw error;
    }
  },
  updateDiagnosis: async (diagnosisId: string, data: Partial<DiagnosisData>) => {
    try {
      const response = await fetchWithAuth(`${BASE_URL}/consultation/diagnosis/${diagnosisId}`, {
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
      console.error('Error updating diagnosis:', error);
      throw error;
    }
  },
  getById: async (id: string) => {
    try {
      const response = await fetchWithAuth(`${BASE_URL}/consultation/${id}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw Object.assign(new Error(errorData.error || `Failed with status: ${response.status}`), {
          response,
          status: response.status
        });
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching consultation by ID:', error);
      throw error;
    }
  },
  getByPatientId: async (patientId: string) => {
    try {
      const response = await fetchWithAuth(`${BASE_URL}/consultation`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw Object.assign(new Error(errorData.error || `Failed with status: ${response.status}`), {
          response,
          status: response.status
        });
      }

      const consultations = await response.json();
      return consultations.filter((consultation: any) => consultation.patientId === patientId);
    } catch (error) {
      console.error('Error fetching consultations by patient ID:', error);
      throw error;
    }
  }
};

// ============================================================================
// CLIENT-SIDE HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a user owns a consultation
 * 
 * NOTE: The API automatically filters consultations server-side for MEDECIN users.
 * This function is provided as a client-side helper for UI permission checks
 * (e.g., showing/hiding edit/delete buttons).
 * 
 * @param consultation - Consultation to check
 * @param userId - User ID to check ownership against
 * @returns true if the user owns this consultation
 */
export const isConsultationOwner = (
  consultation: { medecinId?: string },
  userId: string
): boolean => {
  return consultation.medecinId === userId;
};

/**
 * Filter consultations by owner (client-side helper)
 * 
 * @param consultations - Array of consultations to filter
 * @param userId - User ID to filter by
 * @returns Filtered array of consultations owned by the user
 */
export const filterConsultationsByOwner = (
  consultations: any[],
  userId: string
): any[] => {
  return consultations.filter(consultation => consultation.medecinId === userId);
};
