import React, { ReactNode } from 'react';
import { hasAccess, UserRole } from './RoleAccess';

interface RoleBasedProps {
  requiredRoles: UserRole | UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders children based on user role
 * @param requiredRoles - Role(s) that have access to the children
 * @param children - Content to show if user has required role
 * @param fallback - Optional content to show if user doesn't have required role
 */
const RoleBasedAccess: React.FC<RoleBasedProps> = ({ 
  requiredRoles, 
  children, 
  fallback = null 
}) => {
  const hasPermission = hasAccess(requiredRoles);
  
  return hasPermission ? <>{children}</> : <>{fallback}</>;
};

export default RoleBasedAccess;