import { fetchWithAuth } from './authService';

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const NOTIFICATION_API_URL = `${API_BASE_URL}/notifications`;

export interface Notification {
    id: string;
    userId: string;
    eventType: 'PATIENT_ASSIGNED' | 'PATIENT_TRANSFERRED' | 'PATIENT_REEVALUATED';
    message: string;
    metadata?: any;
    isRead: boolean;
    createdAt: string;
}

export const notificationService = {
    getNotifications: async (limit = 50, offset = 0) => {
        const response = await fetchWithAuth(`${NOTIFICATION_API_URL}?limit=${limit}&offset=${offset}`, {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch notifications: ${response.status}`);
        }

        return await response.json() as Notification[];
    },

    getUnreadCount: async () => {
        const response = await fetchWithAuth(`${NOTIFICATION_API_URL}/unread-count`, {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch unread count: ${response.status}`);
        }

        const data = await response.json() as { count: number };
        return data.count;
    },

    markAsRead: async (id: string) => {
        const response = await fetchWithAuth(`${NOTIFICATION_API_URL}/${id}/read`, {
            method: 'PATCH'
        });

        if (!response.ok) {
            throw new Error(`Failed to mark notification as read: ${response.status}`);
        }

        return await response.json() as Notification;
    },

    markAllAsRead: async () => {
        const response = await fetchWithAuth(`${NOTIFICATION_API_URL}/mark-all-read`, {
            method: 'PATCH'
        });

        if (!response.ok) {
            throw new Error(`Failed to mark all as read: ${response.status}`);
        }

        const data = await response.json() as { count: number };
        return data;
    },

    deleteNotification: async (id: string) => {
        const response = await fetchWithAuth(`${NOTIFICATION_API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`Failed to delete notification: ${response.status}`);
        }
    }
};
