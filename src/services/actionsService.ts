import { fetchWithAuth } from './authService';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface ActionData {
    id: string;
    type: string;
    description: string;
    createdAt: string;
    userId?: string;
    patientId?: string;
}

/**
 * Actions Service - ADMIN ONLY
 * Handles administrative actions including audit logs and transfer validations
 */
export const actionsService = {
    /**
     * Get all actions (audit logs)
     * API: GET /actions - ADMIN ONLY
     */
    getAll: async (): Promise<ActionData[]> => {
        try {
            const response = await fetchWithAuth(`${BASE_URL}/actions`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw Object.assign(new Error(errorData.error || `Failed with status: ${response.status}`), {
                    response,
                    status: response.status
                });
            }
            return response.json();
        } catch (error) {
            console.error('Error fetching actions:', error);
            throw error;
        }
    },

    /**
     * Validate patient transfer from PARODONTAIRE to ORTHODONTAIRE
     * API: PUT /actions/validate-transfer-ortho/:id - ADMIN ONLY
     */
    validateTransferOrtho: async (id: string): Promise<any> => {
        try {
            const response = await fetchWithAuth(`${BASE_URL}/actions/validate-transfer-ortho/${id}`, {
                method: 'PUT',
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
            console.error(`Error validating transfer to orthodontaire for patient ${id}:`, error);
            throw error;
        }
    },

    /**
     * Validate patient transfer from ORTHODONTAIRE to PARODONTAIRE
     * API: PUT /actions/validate-transfer-paro/:id - ADMIN ONLY
     */
    validateTransferParo: async (id: string): Promise<any> => {
        try {
            const response = await fetchWithAuth(`${BASE_URL}/actions/validate-transfer-paro/${id}`, {
                method: 'PUT',
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
            console.error(`Error validating transfer to parodontaire for patient ${id}:`, error);
            throw error;
        }
    },
};
