import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { notificationService, Notification } from '../services/notificationService';

// Base URL for Socket.IO
const SOCKET_URL = import.meta.env.VITE_API_BASE_URL;

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    isConnected: boolean;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
    refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

interface NotificationProviderProps {
    children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

    // Check auth status
    useEffect(() => {
        const checkAuth = () => {
            const token = sessionStorage.getItem('access_token') || localStorage.getItem('auth_token');
            setIsAuthenticated(!!token);
        };

        checkAuth();
        // Listen for storage changes (cross-window) and custom same-window auth events
        window.addEventListener('storage', checkAuth);
        window.addEventListener('auth:changed', checkAuth as EventListener);
        // Custom event for same-window updates is dispatched by authService
        return () => {
            window.removeEventListener('storage', checkAuth);
            window.removeEventListener('auth:changed', checkAuth as EventListener);
        };
    }, []);

    // Initialize Socket.IO
    useEffect(() => {
        const token = sessionStorage.getItem('access_token') || localStorage.getItem('auth_token');

        if (!token) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        console.debug('NotificationProvider: initializing socket', { SOCKET_URL, hasToken: !!token });

        const newSocket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling']
        });

        newSocket.on('connect', () => {
            console.log('Connected to notification server', { socketId: newSocket.id });
            setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('Disconnected from notification server');
            setIsConnected(false);
        });

        // Listen for new notifications
        newSocket.on('notification:new', (notification: Notification) => {
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);

            // Optional: Play sound or show browser notification
            if ('Notification' in window && window.Notification.permission === 'granted') {
                new window.Notification('New Notification', {
                    body: notification.message,
                    icon: '/logo.png' // Adjust path as needed
                });
            }
        });

        // Listen for all read event (e.g. from another tab/device)
        newSocket.on('notifications:all-read', () => {
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [isAuthenticated]); // Re-connect if auth state changes

    // Fetch initial notifications
    const refreshNotifications = async () => {
        try {
            if (!isAuthenticated) return;

            const [list, count] = await Promise.all([
                notificationService.getNotifications(),
                notificationService.getUnreadCount()
            ]);

            setNotifications(list);
            setUnreadCount(count);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    useEffect(() => {
        refreshNotifications();
    }, [isAuthenticated]);

    const markAsRead = async (id: string) => {
        try {
            // Optimistic update
            setNotifications(prev => prev.map(n =>
                n.id === id ? { ...n, isRead: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));

            await notificationService.markAsRead(id);
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
            // Revert on error (could implement more robust rollback)
            refreshNotifications();
        }
    };

    const markAllAsRead = async () => {
        try {
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);

            await notificationService.markAllAsRead();
        } catch (error) {
            console.error('Failed to mark all as read:', error);
            refreshNotifications();
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            const notification = notifications.find(n => n.id === id);
            const wasUnread = notification && !notification.isRead;

            setNotifications(prev => prev.filter(n => n.id !== id));
            if (wasUnread) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }

            await notificationService.deleteNotification(id);
        } catch (error) {
            console.error('Failed to delete notification:', error);
            refreshNotifications();
        }
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            isConnected,
            markAsRead,
            markAllAsRead,
            deleteNotification,
            refreshNotifications
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
