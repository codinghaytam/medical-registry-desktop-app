import { Button, TextField, Box, Typography, Container, CircularProgress, Alert } from '@mui/material';
import { useState, FormEvent, useEffect } from 'react';
import { fetch } from '@tauri-apps/plugin-http';
import { useSearchParams } from 'react-router-dom';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function PasswordReset() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState('request'); // 'request', 'verify', 'change', 'complete'
  const [email, setEmail] = useState('');
  const [, setVerificationStatus] = useState<{
    emailVerified: boolean;
    userEnabled: boolean;
  } | null>(null);
  
  // Check for verification token in URL params
  useEffect(() => {
    const token = searchParams.get('token');
    const emailParam = searchParams.get('email');
    
    if (token && emailParam) {
      setEmail(emailParam);
      setStep('change');
    }
  }, [searchParams]);

  const handlePasswordReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(event.currentTarget);
    const emailInput = formData.get('email') as string;
    setEmail(emailInput);
    
    try {
      console.log(`Requesting password reset for email: ${emailInput}`);
      
      // Call the email verification endpoint to initiate password reset
      const response = await fetch(`${BASE_URL}/verify-email/${emailInput}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({
          redirectUri: window.location.origin + "/reset-password",
          clientId: "medical-registry"
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Request failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.emailVerified) {
        // If email is already verified, move to password change step
        setVerificationStatus({
          emailVerified: true,
          userEnabled: true
        });
        setStep('change');
      } else {
        setSuccess(true);
      }
      
    } catch (err) {
      console.error("Request error:", err);
      setError(err instanceof Error ? err.message : 'Password reset request failed');
    } finally {
      setLoading(false);
    }
  };
  const handlePasswordChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    
    const formData = new FormData(event.currentTarget);
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
    
    try {
      // For password reset flow, we need to use a placeholder for the current password
      // Or modify the backend to accept a token instead for reset flows
      const token = searchParams.get('token');
      
      const response = await fetch(`${BASE_URL}/password-change/${email}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({
          currentPassword: "RESET_TOKEN:" + (token || ''),  // Using a special prefix to indicate this is a token-based reset
          newPassword
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Request failed: ${response.status}`);
      }
      
      setSuccess(true);
      setStep('complete');
    } catch (err) {
      console.error("Request error:", err);
      setError(err instanceof Error ? err.message : 'Password change failed');
    } finally {
      setLoading(false);
    }
  };
  
  const checkVerificationStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${BASE_URL}/verify-email/${email}/status`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Request failed: ${response.status}`);
      }
      
      const data = await response.json();
      setVerificationStatus(data);
      
      if (data.emailVerified) {
        setStep('change');
      }
      
    } catch (err) {
      console.error("Request error:", err);
      setError(err instanceof Error ? err.message : 'Failed to check verification status');
    } finally {
      setLoading(false);
    }
  };
  
  const handleResendVerification = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${BASE_URL}/verify-email/${email}/resend`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({
          redirectUri: window.location.origin + "/reset-password",
          clientId: "medical-registry"
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Request failed: ${response.status}`);
      }
      
      setSuccess(true);
    } catch (err) {
      console.error("Request error:", err);
      setError(err instanceof Error ? err.message : 'Failed to resend verification email');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    window.location.href = "/login";
  };

  return (
    <Container component="main" maxWidth="xs" sx={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      py: 4
    }}>
      <Box sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        p: 4,
        borderRadius: 2,
        boxShadow: 3,
        bgcolor: 'background.paper'
      }}>
        {loading ? (
          <>
            <Typography component="h1" variant="h5" gutterBottom>
              Processing...
            </Typography>
            <CircularProgress size={40} sx={{ my: 4 }} />
          </>
        ) : success && step === 'request' ? (
          <>
            <Typography component="h1" variant="h5" gutterBottom>
              Email Verification Sent
            </Typography>
            <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
              If an account exists with that email, you will receive email verification instructions.
              Please check your email and follow the instructions to verify your email before resetting your password.
            </Alert>
            <Box sx={{ mt: 2, width: '100%' }}>
              <Button
                fullWidth
                variant="outlined"
                sx={{ mb: 2, height: 48 }}
                onClick={checkVerificationStatus}
              >
                I've Verified My Email
              </Button>
              <Button
                fullWidth
                variant="text"
                sx={{ mb: 2 }}
                onClick={handleResendVerification}
              >
                Resend Verification Email
              </Button>
              <Button
                fullWidth
                variant="text"
                onClick={handleBackToLogin}
              >
                Back to Login
              </Button>
            </Box>
          </>
        ) : success && step === 'complete' ? (
          <>
            <Typography component="h1" variant="h5" gutterBottom>
              Password Reset Complete
            </Typography>
            <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
              Your password has been successfully reset. You can now login with your new password.
            </Alert>
            <Button
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, height: 48 }}
              onClick={handleBackToLogin}
            >
              Go to Login
            </Button>
          </>
        ) : step === 'change' ? (
          <>
            <Typography component="h1" variant="h5" gutterBottom>
              Set New Password
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handlePasswordChange} sx={{ width: '100%' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Enter your new password below
              </Typography>
              <TextField
                margin="normal"
                required
                fullWidth
                name="newPassword"
                label="New Password"
                type="password"
                id="newPassword"
                autoComplete="new-password"
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                id="confirmPassword"
                autoComplete="new-password"
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, height: 48 }}
                disabled={loading}
              >
                Reset Password
              </Button>
              
              <Button
                fullWidth
                variant="text"
                onClick={handleBackToLogin}
                sx={{ mt: 1 }}
              >
                Cancel
              </Button>
            </Box>
          </>
        ) : (
          <>
            <Typography component="h1" variant="h5" gutterBottom>
              Reset Password
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handlePasswordReset} sx={{ width: '100%' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Enter your email address and we will send you instructions to reset your password
              </Typography>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, height: 48 }}
                disabled={loading}
              >
                Request Password Reset
              </Button>
              
              <Button
                fullWidth
                variant="text"
                onClick={handleBackToLogin}
                sx={{ mt: 1 }}
              >
                Back to Login
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Container>
  );
}
