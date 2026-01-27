import { fetch } from '@tauri-apps/plugin-http';
import { reevaluationService, ReevaluationData } from './reevaluationService';
import { fetchWithAuth } from './authService';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface SeanceData {
  id?: string;
  type: string;
  autreMotif?: string;
  date: Date;
  patientId: string;
  medecinId: string;
  patient?: {
    nom: string;
    prenom: string;
  };
  medecin?: MedecinData;
  Reevaluation?: ReevaluationData;
}

export interface MedecinData {
  id: string;
  profession: string;
  isSpecialiste?: boolean;
  userId?: string;
  user?: {
    id?: string;
    username?: string;
    email?: string;
    name?: string;
    role?: string;
  };
}

export const seanceService = {  getAll: async () => {
    const response = await fetchWithAuth(`${BASE_URL}/seance`);
    return response.json();
  },
  getById: async (id: string) => {
    const response = await fetchWithAuth(`${BASE_URL}/seance/${id}`);
    return response.json();
  },
  getByPatientId: async (patientId: string) => {
    const response = await fetchWithAuth(`${BASE_URL}/seance`);
    const seances = await response.json();
    return seances.filter((seance: any) => seance.patient?.id === patientId);
  },

  create: async (data: SeanceData) => {
    // Format date object for API
    const formattedData = {
      ...data,
      date: data.date instanceof Date ? data.date.toISOString() : data.date
    };
    
    // If this is a REEVALUATION type, redirect to reevaluationService
    if (data.type === 'REEVALUATION' && data.Reevaluation) {
      const reevalData = new FormData();
      
      // Add required fields for reevaluation
      reevalData.append('indiceDePlaque', data.Reevaluation.indiceDePlaque.toString());
      reevalData.append('indiceGingivale', data.Reevaluation.indiceGingivale.toString());
      reevalData.append('patientId', data.patientId);
      reevalData.append('medecinId', data.medecinId);
      reevalData.append('date', formattedData.date);
      
      if (Array.isArray(data.Reevaluation.sondagePhotos)) {
        data.Reevaluation.sondagePhotos.forEach((file) => {
          if (file instanceof File) {
            reevalData.append('sondagePhotos', file);
            console.log('Adding file to reevaluation FormData:', file.name);
          }
        });
      }
      
      // Create the reevaluation and return the result
      return reevaluationService.create(reevalData);
    }
    
    // Otherwise use the regular seance endpoint
    try {
      
      
        const response = await fetchWithAuth(`${BASE_URL}/seance`, {
        method: 'POST',
        body: JSON.stringify(formattedData),
        headers: {
          'Content-Type': 'application/json',
        },
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

  update: async (id: string, data: Partial<SeanceData>) => {
    // Convert date to ISO string for JSON serialization if it's a Date object
    let formattedData: any = {
      ...data,
      date: data.date instanceof Date ? data.date.toISOString() : data.date
    };
    
    // If this is a REEVALUATION type and we have reevaluation data, redirect to reevaluationService
    if (data.type === 'REEVALUATION' && data.Reevaluation) {
      // First update the seance record
      const seanceResponse = await fetch(`${BASE_URL}/seance/${id}`, {
        method: 'PUT',
        body: JSON.stringify(formattedData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!seanceResponse.ok) {
        const errorData = await seanceResponse.json().catch(() => ({}));
        throw Object.assign(new Error(errorData.error || 'Failed to update seance'), { response: seanceResponse });
      }
      
      // Now handle the reevaluation update
      const reevalData = new FormData();
      reevalData.append('indiceDePlaque', data.Reevaluation.indiceDePlaque.toString());
      reevalData.append('indiceGingivale', data.Reevaluation.indiceGingivale.toString());
      reevalData.append('patientId', data.patientId!);
      reevalData.append('medecinId', data.medecinId!);
      reevalData.append('date', formattedData.date);
      reevalData.append('seanceId', id);
      
      if (Array.isArray(data.Reevaluation.sondagePhotos)) {
        data.Reevaluation.sondagePhotos.forEach((file) => {
          if (file instanceof File) {
            reevalData.append('sondagePhotos', file);
          }
        });
      }
      
      // Check if reevaluation already exists
      if (data.Reevaluation.id) {
        return reevaluationService.update(data.Reevaluation.id, reevalData);
      } else {
        return reevaluationService.create(reevalData);
      }    }
    
    // For non-reevaluation types, just update the seance
    const response = await fetchWithAuth(`${BASE_URL}/seance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(formattedData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw Object.assign(new Error(errorData.error || 'Failed to update seance'), { response });
    }
    
    return response.json();
  },

  delete: async (id: string, type?: string) => {
    // If this is a REEVALUATION type, we need to check if there's an associated reevaluation to delete
    if (type === 'REEVALUATION') {
      try {
        // First get all reevaluations
        const reevaluations = await reevaluationService.getAll();
        // Find if there's a reevaluation associated with this seance
        const associatedReevaluation = reevaluations.find((r: ReevaluationData) => r.seanceId === id);
        
        if (associatedReevaluation) {
          // Delete the reevaluation first
          await reevaluationService.delete(associatedReevaluation.id!);
        }
      } catch (error) {
        console.error('Error deleting associated reevaluation:', error);
        // Continue with deleting the seance even if reevaluation delete fails
      }
    }
      // Now delete the seance
    await fetchWithAuth(`${BASE_URL}/seance/${id}`, {
      method: 'DELETE',
    });
  }
};
