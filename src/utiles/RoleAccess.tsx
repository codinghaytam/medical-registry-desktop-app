// Role types
export type UserRole = 'ADMIN' | 'MEDECIN' | 'ETUDIANT';

// Get user role from sessionStorage
export const getUserRole = (): UserRole => {
  try {
    const userString = sessionStorage.getItem('user');
    if (!userString) return 'ETUDIANT';
    
    const userData = JSON.parse(userString);
    
    // Check for stored role directly from sessionStorage first (most reliable)
    const storedRole = userData.user.role;
    if (storedRole && (storedRole === 'ADMIN' || storedRole === 'MEDECIN' || storedRole === 'ETUDIANT')) {
      return storedRole as UserRole;
    }
    
    // Check for role at all possible nested levels
    const checkNestedRole = (obj: any): UserRole | null => {
      if (!obj || typeof obj !== 'object') return null;
      
      // Direct role property
      if (obj.role === 'ADMIN' || obj.role === 'MEDECIN' || obj.role === 'ETUDIANT') {
        return obj.role as UserRole;
      }
      
      // Check if role is in the user property
      if (obj.user && typeof obj.user === 'object') {
        if (obj.user.role === 'ADMIN' || obj.user.role === 'MEDECIN' || obj.role === 'ETUDIANT') {
          return obj.user.role as UserRole;
        }
        
        // Check one level deeper inside user.user
        if (obj.user.user && typeof obj.user.user === 'object') {
          if (obj.user.user.role === 'ADMIN' || obj.user.user.role === 'MEDECIN' || obj.user.user.role === 'ETUDIANT') {
            return obj.user.user.role as UserRole;
          }
        }
      }
      
      return null;
    };
    
    const detectedRole = checkNestedRole(userData);
    if (detectedRole) {
      return detectedRole;
    }
    
    // Check for profession field which might indicate MEDECIN role
    if (userData.profession === 'PARODONTAIRE' || userData.profession === 'ORTHODONTAIRE' || 
        (userData.user && userData.user.profession === 'PARODONTAIRE') || 
        (userData.user && userData.user.profession === 'ORTHODONTAIRE')) {
      return 'MEDECIN';
    }
    
    // Default to student role if no role was found
    return 'ETUDIANT';
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'ETUDIANT'; // Default to lowest privilege on error
  }
};

// Check if user has specified access level
export const hasAccess = (requiredRole: UserRole | UserRole[]): boolean => {
  const userRole = getUserRole();
  
  // Admin has access to everything
  if (userRole === 'ADMIN') return true;
  
  // Check against array of roles
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userRole);
  }
  
  // Check against single role
  return userRole === requiredRole;
};

// Check if user can edit content
export const canEdit = (): boolean => {
  const role = getUserRole();
  return role === 'ADMIN' || role === 'MEDECIN';
};

// Check if user can only view content
export const canOnlyView = (): boolean => {
  return getUserRole() === 'ETUDIANT';
};

// Check if user has full access
export const hasFullAccess = (): boolean => {
  return getUserRole() === 'ADMIN';
};

// Debug function to check role detection and data structure
export const debugUserRole = (): any => {
  try {    const userString = sessionStorage.getItem('user');
    if (!userString) return { error: 'No user data in sessionStorage' };
    
    const userData = JSON.parse(userString);
    const detectedRole = getUserRole();
    
    // For debugging purposes, check role at various levels of nesting
    let roleChecks = {
      topLevelRole: userData?.role,
      userNestedRole: userData?.user?.role,
      userUserNestedRole: userData?.user?.user?.role,
      profession: userData?.profession || userData?.user?.profession,
    };
    
    return {
      detectedRole,
      userData,
      roleChecks,
      storedRole: sessionStorage.getItem('userRole'),
      canEditPermission: canEdit(),
      hasFullAccessPermission: hasFullAccess()
    };
  } catch (error) {
    return { error: 'Error parsing user data', details: error };
  }
};