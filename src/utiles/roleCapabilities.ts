/**
 * Role-Based Access Control Capabilities
 * 
 * This file defines the capabilities for each role in the medical registry system.
 * These constants match the API's RBAC implementation as defined in ROLE_CAPABILITIES.md
 */

export type UserRole = 'ADMIN' | 'MEDECIN' | 'ETUDIANT';

/**
 * Role capabilities matrix matching the API implementation
 * Each module defines which roles can perform which operations
 */
export const ROLE_CAPABILITIES = {
    PATIENT: {
        LIST: ['ADMIN', 'MEDECIN', 'ETUDIANT'] as UserRole[],
        VIEW: ['ADMIN', 'MEDECIN', 'ETUDIANT'] as UserRole[],
        CREATE: ['ADMIN', 'MEDECIN'] as UserRole[],
        UPDATE: ['ADMIN', 'MEDECIN'] as UserRole[],
        DELETE: ['ADMIN', 'MEDECIN'] as UserRole[],
        TRANSFER: ['ADMIN', 'MEDECIN'] as UserRole[],
    },
    CONSULTATION: {
        LIST: ['ADMIN', 'MEDECIN', 'ETUDIANT'] as UserRole[],
        VIEW: ['ADMIN', 'MEDECIN', 'ETUDIANT'] as UserRole[],
        CREATE: ['ADMIN', 'MEDECIN'] as UserRole[],
        UPDATE: ['ADMIN', 'MEDECIN'] as UserRole[], // + ownership check for MEDECIN
        DELETE: ['ADMIN', 'MEDECIN'] as UserRole[], // + ownership check for MEDECIN
    },
    SEANCE: {
        LIST: ['ADMIN', 'MEDECIN', 'ETUDIANT'] as UserRole[],
        VIEW: ['ADMIN', 'MEDECIN', 'ETUDIANT'] as UserRole[],
        CREATE: ['ADMIN', 'MEDECIN'] as UserRole[],
        UPDATE: ['ADMIN', 'MEDECIN'] as UserRole[], // + ownership check for MEDECIN
        DELETE: ['ADMIN', 'MEDECIN'] as UserRole[], // + ownership check for MEDECIN
    },
    USER: {
        LIST: ['ADMIN', 'MEDECIN', 'ETUDIANT'] as UserRole[],
        VIEW: ['ADMIN', 'MEDECIN', 'ETUDIANT'] as UserRole[],
        CREATE: ['ADMIN'] as UserRole[],
        UPDATE: ['ADMIN'] as UserRole[],
        DELETE: ['ADMIN'] as UserRole[],
    },
    MEDECIN: {
        LIST: ['ADMIN', 'MEDECIN', 'ETUDIANT'] as UserRole[],
        VIEW: ['ADMIN', 'MEDECIN', 'ETUDIANT'] as UserRole[],
        CREATE: ['ADMIN'] as UserRole[],
        UPDATE: ['ADMIN'] as UserRole[],
        DELETE: ['ADMIN'] as UserRole[],
    },
    ETUDIANT: {
        LIST: ['ADMIN', 'MEDECIN', 'ETUDIANT'] as UserRole[],
        VIEW: ['ADMIN', 'MEDECIN', 'ETUDIANT'] as UserRole[],
        CREATE: ['ADMIN'] as UserRole[],
        UPDATE: ['ADMIN'] as UserRole[],
        DELETE: ['ADMIN'] as UserRole[],
    },
    ACTIONS: {
        LIST: ['ADMIN'] as UserRole[],
        VALIDATE_TRANSFER: ['ADMIN'] as UserRole[],
    },
} as const;

/**
 * Filtering rules for different roles
 */
export const FILTERING_RULES = {
    /**
     * MEDECIN users see only patients matching their profession
     * - ORTHODONTAIRE doctors see only ORTHODONTAIRE patients
     * - PARODONTAIRE doctors see only PARODONTAIRE patients
     */
    PATIENT_BY_PROFESSION: true,

    /**
     * MEDECIN users see only their own consultations
     * - Filtered by consultation.medecinId === user.id
     */
    CONSULTATION_BY_OWNERSHIP: true,

    /**
     * MEDECIN users see only their own seances
     * - Filtered by seance.medecinId === user.id
     */
    SEANCE_BY_OWNERSHIP: true,
} as const;

/**
 * User-friendly error messages for permission denials
 */
export const PERMISSION_MESSAGES = {
    ETUDIANT_READ_ONLY: 'Les étudiants ont un accès en lecture seule. Vous ne pouvez pas créer, modifier ou supprimer des enregistrements.',
    MEDECIN_OWNERSHIP_REQUIRED: 'Vous ne pouvez modifier ou supprimer que vos propres enregistrements.',
    ADMIN_ONLY: 'Cette action est réservée aux administrateurs uniquement.',
    UNAUTHORIZED: 'Vous n\'avez pas les permissions nécessaires pour effectuer cette action.',
    PROFESSION_FILTERED: 'Vous ne voyez que les patients correspondant à votre profession.',
} as const;
