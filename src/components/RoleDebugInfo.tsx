import { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Alert } from '@mui/material';
import { debugUserRole, getUserRole } from '../utiles/RoleAccess';

// This is a temporary debug component to help diagnose role-related issues
const RoleDebugInfo = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [currentRole, setCurrentRole] = useState<string>('');

  useEffect(() => {
    // Get the debug info
    const info = debugUserRole();
    setDebugInfo(info);
    
    // Get current role
    setCurrentRole(getUserRole());
  }, []);

  if (!debugInfo) {
    return <Alert severity="info">Loading role information...</Alert>;
  }

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Role Debug Information
        </Typography>
        <Typography variant="body1">
          Detected Role: <strong>{currentRole}</strong>
        </Typography>
        <Typography variant="body2" sx={{ mt: 2 }}>
          Has Edit Permission: {debugInfo.canEditPermission ? 'Yes' : 'No'}
        </Typography>
        <Typography variant="body2">
          Has Full Access: {debugInfo.hasFullAccessPermission ? 'Yes' : 'No'}
        </Typography>
        <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="caption" component="pre" sx={{ overflow: 'auto' }}>
            {JSON.stringify(debugInfo, null, 2)}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default RoleDebugInfo;