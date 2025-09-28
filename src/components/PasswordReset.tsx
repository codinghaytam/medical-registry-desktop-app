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
        throw new Error(errorData.error || `Échec de la requête: ${response.status}`);
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
      setError(err instanceof Error ? err.message : 'La demande de réinitialisation du mot de passe a échoué');
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
      setError("Les mots de passe ne correspondent pas");
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
        throw new Error(errorData.error || `Échec de la requête: ${response.status}`);
      }
      
      setSuccess(true);
      setStep('complete');
    } catch (err) {
      console.error("Request error:", err);
      setError(err instanceof Error ? err.message : 'La modification du mot de passe a échoué');
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
        throw new Error(errorData.error || `Échec de la requête: ${response.status}`);
      }
      
      const data = await response.json();
      setVerificationStatus(data);
      
      if (data.emailVerified) {
        setStep('change');
      }
      
    } catch (err) {
      console.error("Request error:", err);
      setError(err instanceof Error ? err.message : "Échec de la vérification de l'email");
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
        throw new Error(errorData.error || `Échec de la requête: ${response.status}`);
      }
      
      setSuccess(true);
    } catch (err) {
      console.error("Request error:", err);
      setError(err instanceof Error ? err.message : "Échec de l'envoi de l'email de vérification");
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
              Traitement en cours...
            </Typography>
            <CircularProgress size={40} sx={{ my: 4 }} />
          </>
        ) : success && step === 'request' ? (
          <>
            <Typography component="h1" variant="h5" gutterBottom>
              Vérification de l'e-mail envoyée
            </Typography>
            <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
              Si un compte existe avec cet e-mail, vous recevrez des instructions de vérification par e-mail.
              Veuillez vérifier votre e-mail et suivre les instructions pour vérifier votre adresse avant de réinitialiser votre mot de passe.
            </Alert>
            <Box sx={{ mt: 2, width: '100%' }}>
              <Button
                fullWidth
                variant="outlined"
                sx={{ mb: 2, height: 48 }}
                onClick={checkVerificationStatus}
              >
                J'ai vérifié mon e-mail
              </Button>
              <Button
                fullWidth
                variant="text"
                sx={{ mb: 2 }}
                onClick={handleResendVerification}
              >
                Renvoyer l'e-mail de vérification
              </Button>
              <Button
                fullWidth
                variant="text"
                onClick={handleBackToLogin}
              >
                Retour à la connexion
              </Button>
            </Box>
          </>
        ) : success && step === 'complete' ? (
          <>
            <Typography component="h1" variant="h5" gutterBottom>
              Réinitialisation du mot de passe terminée
            </Typography>
            <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
              Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
            </Alert>
            <Button
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, height: 48 }}
              onClick={handleBackToLogin}
            >
              Aller à la connexion
            </Button>
          </>
        ) : step === 'change' ? (
          <>
            <Typography component="h1" variant="h5" gutterBottom>
              Définir un nouveau mot de passe
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handlePasswordChange} sx={{ width: '100%' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Entrez votre nouveau mot de passe ci-dessous
              </Typography>
              <TextField
                margin="normal"
                required
                fullWidth
                name="newPassword"
                label="Nouveau mot de passe"
                type="password"
                id="newPassword"
                autoComplete="new-password"
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirmer le mot de passe"
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
                Réinitialiser le mot de passe
              </Button>
              
              <Button
                fullWidth
                variant="text"
                onClick={handleBackToLogin}
                sx={{ mt: 1 }}
              >
                Annuler
              </Button>
            </Box>
          </>
        ) : (
          <>
            <Typography component="h1" variant="h5" gutterBottom>
              Réinitialiser le mot de passe
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handlePasswordReset} sx={{ width: '100%' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Saisissez votre adresse e-mail et nous vous enverrons des instructions pour réinitialiser votre mot de passe
              </Typography>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Adresse e-mail"
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
                Demander la réinitialisation du mot de passe
              </Button>
              
              <Button
                fullWidth
                variant="text"
                onClick={handleBackToLogin}
                sx={{ mt: 1 }}
              >
                Retour à la connexion
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Container>
  );
}
