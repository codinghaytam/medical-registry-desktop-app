import { fetch } from '@tauri-apps/plugin-http';

const BASE_URL = 'https://walrus-app-j9qyk.ondigitalocean.app';

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
      const response = await fetch(`${BASE_URL}/consultation`);
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
      const response = await fetch(`${BASE_URL}/consultation`, {
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
      const response = await fetch(`${BASE_URL}/consultation/${id}`, {
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
      const response = await fetch(`${BASE_URL}/consultation/${id}`, {
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
      const response = await fetch(`${BASE_URL}/consultation/${consultationId}/diagnosis`, {
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
      const response = await fetch(`${BASE_URL}/consultation/diagnosis/${diagnosisId}`, {
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
      const response = await fetch(`${BASE_URL}/consultation/${id}`);
      
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
      const response = await fetch(`${BASE_URL}/consultation`);
      
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
