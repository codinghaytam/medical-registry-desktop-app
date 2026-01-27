import { Button, TextField, Box, Typography, Container, CircularProgress, Alert, Link } from '@mui/material';
import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, fetchWithAuth } from '../services/authService';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // The client auth was automatically running on page load, which isn't ideal for role handling
  // Now we only authenticate when user explicitly submits credentials
  const handleUserLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const apiBase = import.meta.env.VITE_API_BASE_URL;

    const fetchJson = async (path: string) => {
      const response = await fetchWithAuth(`${apiBase}${path}`, { method: 'GET' });
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      return response.json();
    };

    try {
      await authService.loginWithCredentials(email, password);

      try {
        const userData = await fetchJson(`/users/email/${email}`);
        const userRole = userData.role;

        if (userRole === 'MEDECIN') {
          const medecinData = await fetchJson(`/medecin/email/${email}`);
          sessionStorage.setItem('user', JSON.stringify({
            user: {
              ...medecinData,
              role: 'MEDECIN',
              firstName: medecinData.firstName || '',
              lastName: medecinData.lastName || ''
            }
          }));
          navigate('/', { replace: true });
          return;
        }

        if (userRole === 'ETUDIANT') {
          const etudiantData = await fetchJson(`/etudiant/email/${email}`);
          sessionStorage.setItem('user', JSON.stringify({ user: { ...etudiantData, role: 'ETUDIANT' } }));
          navigate('/', { replace: true });
          return;
        }

        if (userRole === 'ADMIN') {
          const adminData = await fetchJson(`/admin/email/${email}`);
          sessionStorage.setItem('user', JSON.stringify({
            user: {
              ...adminData,
              role: 'ADMIN',
              firstName: adminData.keycloakDetails?.firstName || '',
              lastName: adminData.keycloakDetails?.lastName || ''
            }
          }));
          navigate('/', { replace: true });
          return;
        }

        throw new Error('Rôle utilisateur inconnu');
      } catch (roleError) {
        console.error('Error determining user role:', roleError);

        try {
          const medecinData = await fetchJson(`/medecin/email/${email}`);
          sessionStorage.setItem('user', JSON.stringify({ user: { ...medecinData, role: 'MEDECIN' } }));
          navigate('/', { replace: true });
          return;
        } catch (medecinError) {
          console.log('Not a medecin user, trying other roles...');
        }

        try {
          const etudiantData = await fetchJson(`/etudiant/email/${email}`);
          sessionStorage.setItem('user', JSON.stringify({ user: { ...etudiantData, role: 'ETUDIANT' } }));
          navigate('/', { replace: true });
          return;
        } catch (etudiantError) {
          console.log('Not an etudiant user, trying admin...');
        }

        try {
          const adminData = await fetchJson(`/admin/email/${email}`);
          if (adminData) {
            sessionStorage.setItem('user', JSON.stringify({ user: { ...adminData, role: 'ADMIN' } }));
            navigate('/', { replace: true });
            return;
          }
        } catch (adminError) {
          console.log('Could not determine user role');
          setError('Impossible de déterminer le rôle utilisateur');
        }
      }
    } catch (err) {
      console.error('Request error:', err);
      setError('Échec de la connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    window.location.href = "/reset-password";
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
              Authentification en cours...
            </Typography>
            <CircularProgress size={40} sx={{ my: 4 }} />
          </>
        ) : (
          <>
            <Typography component="h1" variant="h5" gutterBottom>
              {error ? 'Échec de l\'authentification' : 'Se connecter'}
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleUserLogin} sx={{ width: '100%' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Utilisez vos identifiants pour vous connecter
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
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Mot de passe"
                type="password"
                id="password"
                autoComplete="current-password"
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2, height: 48 }}
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Se connecter'
                )}
              </Button>
              
              <Box sx={{ textAlign: 'center', mt: 1 }}>
                <Link 
                  component="button" 
                  variant="body2" 
                  onClick={handleForgotPassword}
                  sx={{ cursor: 'pointer' }}
                >
                  Mot de passe oublié ?
                </Link>
              </Box>
            </Box>
          </>
        )}
      </Box>
    </Container>
  );
}
