import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';

export const Logout = () => {
    useEffect(() => {
        const performLogout = async () => {
            // Use the enhanced logout method that handles both Keycloak and local cleanup
            await authService.logoutFromKeycloak();
        };
        
        performLogout();
    }, []);

    // Clear session storage immediately for UI responsiveness
    sessionStorage.clear();
    return <Navigate to="/login" />;
};