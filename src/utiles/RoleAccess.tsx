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
  try {
    const userString = sessionStorage.getItem('user');
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

// ============================================================================
// PROFESSION UTILITIES
// ============================================================================

export type Profession = 'ORTHODONTAIRE' | 'PARODONTAIRE';

/**
 * Get the current user's profession (for MEDECIN role only)
 * @returns The user's profession or null if not a MEDECIN or profession not found
 */
export const getUserProfession = (): Profession | null => {
  try {
    const userString = sessionStorage.getItem('user');
    if (!userString) return null;

    const userData = JSON.parse(userString);

    // Check various nested levels for profession
    const profession = userData?.profession ||
      userData?.user?.profession ||
      userData?.user?.user?.profession;

    if (profession === 'ORTHODONTAIRE' || profession === 'PARODONTAIRE') {
      return profession as Profession;
    }

    return null;
  } catch (error) {
    console.error('Error getting user profession:', error);
    return null;
  }
};

/**
 * Get the current user's ID from session storage
 * @returns The user's ID or null if not found
 */
export const getCurrentUserId = (): string | null => {
  try {
    const userString = sessionStorage.getItem('user');
    if (!userString) return null;

    const userData = JSON.parse(userString);
    return userData?.user?.id || userData?.id || null;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
};

/**
 * Check if the current user should see filtered data based on profession
 * @returns true if user is MEDECIN (requires profession-based filtering)
 */
export const shouldFilterByProfession = (): boolean => {
  return getUserRole() === 'MEDECIN';
};

// ============================================================================
// PATIENT MODULE PERMISSIONS
// ============================================================================

/**
 * Check if user can create patients
 * API: POST /patient - Allowed for ADMIN and MEDECIN
 */
export const canCreatePatient = (): boolean => {
  const role = getUserRole();
  return role === 'ADMIN' || role === 'MEDECIN';
};

/**
 * Check if user can edit patients
 * API: PUT /patient/:id - Allowed for ADMIN and MEDECIN
 */
export const canEditPatient = (): boolean => {
  const role = getUserRole();
  return role === 'ADMIN' || role === 'MEDECIN';
};

/**
 * Check if user can delete patients
 * API: DELETE /patient/:id - Allowed for ADMIN and MEDECIN
 */
export const canDeletePatient = (): boolean => {
  const role = getUserRole();
  return role === 'ADMIN' || role === 'MEDECIN';
};

/**
 * Check if user can transfer patients between professions
 * API: PUT /patient/Paro-Ortho/:id - Allowed for ADMIN and MEDECIN
 */
export const canTransferPatient = (): boolean => {
  const role = getUserRole();
  return role === 'ADMIN' || role === 'MEDECIN';
};

// ============================================================================
// CONSULTATION MODULE PERMISSIONS
// ============================================================================

/**
 * Check if user can create consultations
 * API: POST /consultation - Allowed for ADMIN and MEDECIN
 */
export const canCreateConsultation = (): boolean => {
  const role = getUserRole();
  return role === 'ADMIN' || role === 'MEDECIN';
};

/**
 * Check if user can edit a specific consultation
 * API: PUT /consultation/:id - Allowed for ADMIN and MEDECIN (with ownership check)
 * @param consultation - The consultation object with medecinId
 * @returns true if user can edit this consultation
 */
export const canEditConsultation = (consultation?: { medecinId?: string }): boolean => {
  const role = getUserRole();

  // ADMIN can edit any consultation
  if (role === 'ADMIN') return true;

  // ETUDIANT cannot edit
  if (role === 'ETUDIANT') return false;

  // MEDECIN can only edit their own consultations
  if (role === 'MEDECIN' && consultation) {
    const currentUserId = getCurrentUserId();
    return currentUserId !== null && consultation.medecinId === currentUserId;
  }

  return false;
};

/**
 * Check if user can delete a specific consultation
 * API: DELETE /consultation/:id - Allowed for ADMIN and MEDECIN (with ownership check)
 * @param consultation - The consultation object with medecinId
 * @returns true if user can delete this consultation
 */
export const canDeleteConsultation = (consultation?: { medecinId?: string }): boolean => {
  // Same logic as edit
  return canEditConsultation(consultation);
};

// ============================================================================
// SEANCE MODULE PERMISSIONS
// ============================================================================

/**
 * Check if user can create seances
 * API: POST /seance - Allowed for ADMIN and MEDECIN
 */
export const canCreateSeance = (): boolean => {
  const role = getUserRole();
  return role === 'ADMIN' || role === 'MEDECIN';
};

/**
 * Check if user can edit a specific seance
 * API: PUT /seance/:id - Allowed for ADMIN and MEDECIN (with ownership check)
 * @param seance - The seance object with medecinId
 * @returns true if user can edit this seance
 */
export const canEditSeance = (seance?: { medecinId?: string }): boolean => {
  const role = getUserRole();

  // ADMIN can edit any seance
  if (role === 'ADMIN') return true;

  // ETUDIANT cannot edit
  if (role === 'ETUDIANT') return false;

  // MEDECIN can only edit their own seances
  if (role === 'MEDECIN' && seance) {
    const currentUserId = getCurrentUserId();
    return currentUserId !== null && seance.medecinId === currentUserId;
  }

  return false;
};

/**
 * Check if user can delete a specific seance
 * API: DELETE /seance/:id - Allowed for ADMIN and MEDECIN (with ownership check)
 * @param seance - The seance object with medecinId
 * @returns true if user can delete this seance
 */
export const canDeleteSeance = (seance?: { medecinId?: string }): boolean => {
  // Same logic as edit
  return canEditSeance(seance);
};

// ============================================================================
// USER MANAGEMENT PERMISSIONS
// ============================================================================

/**
 * Check if user can manage other users (create, edit, delete)
 * API: POST/PUT/DELETE /users/* - ADMIN ONLY
 */
export const canManageUsers = (): boolean => {
  return getUserRole() === 'ADMIN';
};

// ============================================================================
// ACTIONS MODULE PERMISSIONS (ADMIN ONLY)
// ============================================================================

/**
 * Check if user can access the actions module
 * API: GET /actions - ADMIN ONLY
 */
export const canAccessActions = (): boolean => {
  return getUserRole() === 'ADMIN';
};

/**
 * Check if user can validate patient transfers
 * API: PUT /actions/validate-transfer-* - ADMIN ONLY
 */
export const canValidateTransfers = (): boolean => {
  return getUserRole() === 'ADMIN';
};