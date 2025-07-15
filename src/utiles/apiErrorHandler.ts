// Global error handler for API responses
export const handleApiError = (error: any, navigate?: (path: string) => void) => {
  // Check if error has response status (from fetch)
  if (error.response?.status === 401 || error.response?.status === 403) {
    // Clear session storage
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('user');
    
    // Redirect to login page
    if (navigate) {
      navigate('/login');
    } else {
      // Fallback: use window.location if navigate is not available
      window.location.href = '/login';
    }
    return;
  }
  
  // Check if error has status property directly
  if (error.status === 401 || error.status === 403) {
    // Clear session storage
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('user');
    
    // Redirect to login page
    if (navigate) {
      navigate('/login');
    } else {
      // Fallback: use window.location if navigate is not available
      window.location.href = '/login';
    }
    return;
  }
  
  // For other errors, just throw them to be handled by the calling component
  throw error;
};

// Enhanced fetch wrapper that automatically handles 401/403 errors
export const fetchWithErrorHandling = async (
  url: string, 
  options: RequestInit = {},
  navigate?: (path: string) => void
): Promise<Response> => {
  try {
    const response = await fetch(url, options);
    
    if (response.status === 401 || response.status === 403) {
      // Clear session storage
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('refresh_token');
      sessionStorage.removeItem('user');
      
      // Redirect to login page
      if (navigate) {
        navigate('/login');
      } else {
        window.location.href = '/login';
      }
      
      // Throw error to prevent further processing
      throw Object.assign(new Error('Session expired'), { 
        response,
        status: response.status
      });
    }
    
    return response;
  } catch (error: any) {
    // Handle network errors or other fetch errors
    if (error.status === 401 || error.status === 403) {
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('refresh_token');
      sessionStorage.removeItem('user');
      
      if (navigate) {
        navigate('/login');
      } else {
        window.location.href = '/login';
      }
    }
    
    throw error;
  }
};