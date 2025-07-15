import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

export const useAuthErrorHandler = () => {
  const navigate = useNavigate();

  const handleError = useCallback((error: any) => {
    // Check if this is a network/fetch error that was already handled by fetchWithAuth
    if (error.message === 'Session expired. Redirecting to login...') {
      console.log('Authentication error already handled by fetchWithAuth');
      return true; // Error was handled
    }

    // Check if error has response status (from fetch)
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log('Handling 401/403 error from response object');
      // Clear session storage
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('refresh_token');
      sessionStorage.removeItem('user');
      
      // Redirect to login page
      navigate('/login');
      return true; // Indicates the error was handled
    }
    
    // Check if error has status property directly
    if (error.status === 401 || error.status === 403) {
      console.log('Handling 401/403 error from status property');
      // Clear session storage
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('refresh_token');
      sessionStorage.removeItem('user');
      
      // Redirect to login page
      navigate('/login');
      return true; // Indicates the error was handled
    }
    
    return false; // Error was not handled, let the component handle it
  }, [navigate]);

  return { handleError };
};
