# Authentication Error Handling Test Guide

## How the Authentication Error Handling Works

Your application now has comprehensive authentication error handling that automatically redirects users to the login page when they receive 401 (Unauthorized) or 403 (Forbidden) errors from the server.

### What Was Implemented

1. **fetchWithAuth Function** (in `authService.ts`):
   - Automatically adds authentication headers to requests
   - Intercepts 401/403 responses
   - Clears session storage
   - Redirects to `/login` page
   - Throws an error to prevent further processing

2. **useAuthErrorHandler Hook** (in `useAuthErrorHandler.ts`):
   - Provides a backup error handler for components
   - Handles authentication errors that might slip through
   - Can be used in component catch blocks

3. **Updated Services**:
   - All service files now use `fetchWithAuth` consistently
   - This ensures all API calls have automatic authentication error handling

### How to Test

1. **Natural Session Expiry**:
   - Log into the application
   - Wait for your session to expire (or manually clear tokens from browser storage)
   - Try to navigate to any page or perform any action
   - You should be automatically redirected to the login page

2. **Manual Token Deletion**:
   - Log into the application
   - Open browser DevTools > Application > Storage > Session Storage
   - Delete the `access_token` and `refresh_token` entries
   - Try to perform any action (like viewing patients, consultations, etc.)
   - You should be redirected to login

3. **Invalid Token**:
   - Log into the application
   - Open browser DevTools > Application > Storage > Session Storage
   - Modify the `access_token` value to something invalid
   - Try to perform any action
   - You should be redirected to login

### Files Modified

- `src/services/authService.ts` - Enhanced fetchWithAuth function
- `src/services/consultationService.ts` - Now uses fetchWithAuth
- `src/services/seanceService.ts` - Now uses fetchWithAuth  
- `src/services/userService.ts` - Now uses fetchWithAuth
- `src/components/Dashboard.tsx` - Added useAuthErrorHandler
- `src/utiles/useAuthErrorHandler.ts` - Enhanced error handling

### Benefits

1. **Automatic Handling**: No need to manually check for 401/403 in every component
2. **Consistent Behavior**: All authentication errors are handled the same way
3. **Better UX**: Users are automatically redirected instead of seeing error messages
4. **Security**: Session data is automatically cleared when authentication fails
5. **Maintainable**: Centralized authentication error handling logic

### How It Works in Practice

When a user's session expires:

1. User tries to perform an action (e.g., fetch patients)
2. Service calls `fetchWithAuth` which includes the expired token
3. Server returns 401 Unauthorized
4. `fetchWithAuth` detects the 401 status
5. Session storage is cleared automatically
6. User is redirected to `/login` page
7. An error is thrown to prevent the component from continuing

This all happens automatically without any additional code needed in your components!
