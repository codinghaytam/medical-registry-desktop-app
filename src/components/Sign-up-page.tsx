import { Button, TextField, Box, Typography, Container, CircularProgress, Alert, Link } from '@mui/material';
import { fetch } from '@tauri-apps/plugin-http';
import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

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
    
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

    const urlencoded = new URLSearchParams();
    urlencoded.append("grant_type", "password");
    urlencoded.append("client_id", import.meta.env.VITE_KEYCLOAK_CLIENT_ID);
    urlencoded.append("scope", "email");
    urlencoded.append("username", email);
    urlencoded.append("password", password);
    urlencoded.append("client_secret", import.meta.env.VITE_KEYCLOAK_CLIENT_SECRET);
    try {
      const response = await fetch(`${import.meta.env.VITE_KEYCLOAK_URL}/realms/${import.meta.env.VITE_KEYCLOAK_REALM}/protocol/openid-connect/token`, {
        method: "POST",
        headers: myHeaders,
        body: urlencoded.toString(),
        redirect: "follow" as RequestRedirect,
      });

      if (!response.ok) {
        throw new Error(`Invalid credentials: ${response.status} ${await response.text()}`);
      }
      
      const rawText = await response.text();
      const data = JSON.parse(rawText);
        sessionStorage.setItem('access_token', data.access_token);
      sessionStorage.setItem('refresh_token', data.refresh_token);
      
      // First, check user type/role from a central endpoint
      try {
        const userResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/email/${email}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${data.access_token}`
          }
        });
        
        if (!userResponse.ok) {
          throw new Error("Failed to fetch user information");
        }
        
        const userData = await userResponse.json();
        const userRole = userData.role;
        // Fetch specific user data based on role
        if (userRole === "MEDECIN") {
          const medecinResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/medecin/email/${email}`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${data.access_token}`
            }
          });          if (medecinResponse.ok) {
            const medecinData = await medecinResponse.json();
            // Store with proper structure to avoid "user.role" undefined error
            sessionStorage.setItem("user", JSON.stringify({ 
              user: { ...medecinData, role: "MEDECIN", firstName: medecinData.firstName || '', lastName: medecinData.lastName || '' } 
            }));
            navigate('/', { replace: true });
            return;
          }
        }
        else if (userRole === "ETUDIANT") {
          const etudiantResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/etudiant/email/${email}`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${data.access_token}`
            }
          });
          if (etudiantResponse.ok) {
            const etudiantData = await etudiantResponse.json();
            sessionStorage.setItem("user", JSON.stringify({ 
              user: { ...etudiantData, role: "ETUDIANT" } 
            }));
            navigate('/', { replace: true });
            return;
          }
        }
        else if (userRole === "ADMIN") {
          const adminResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/email/${email}`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${data.access_token}`
            }
          });
          if (adminResponse.ok) {
            const adminData = await adminResponse.json();            sessionStorage.setItem("user", JSON.stringify({ 
              user: { ...adminData, role: "ADMIN", firstName: adminData.keycloakDetails.firstName || '', lastName: adminData.keycloakDetails.lastName || '' } 
            }));
            navigate('/', { replace: true });
            return;
          }        } 
        else {
          throw new Error("Unknown user role");
        }
      } catch (e) {
        console.error("Error determining user role:", e);
        
        // Fallback to the previous approach if the central endpoint fails
        try {
          // Try to fetch user data based on email - this might be a medecin
          const medecinResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/medecin/email/${email}`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${data.access_token}`
            }
          });          if (medecinResponse.ok) {
            const medecinData = await medecinResponse.json();
            sessionStorage.setItem("user", JSON.stringify({ 
              user: { ...medecinData, role: "MEDECIN" } 
            }));
            navigate('/', { replace: true });
            return;
          }
        } catch (e) {
          console.log("Not a medecin user, trying other roles...");
        }
        
        try {
          const etudiantResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/etudiant/email/${email}`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${data.access_token}`
            }
          });          if (etudiantResponse.ok) {
            const etudiantData = await etudiantResponse.json();
            sessionStorage.setItem("user", JSON.stringify({ 
              user: { ...etudiantData, role: "ETUDIANT" } 
            }));
            navigate('/', { replace: true });
            return;
          }
        } catch (e) {
          console.log("Not an etudiant user, trying admin...");
        }
        
        try {
          const adminResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/email/${email}`, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${data.access_token}`
            }
          });
          if (adminResponse.ok) {
            const adminData = await adminResponse.json();
            if (adminData) {              sessionStorage.setItem("user", JSON.stringify({ 
                user: { ...adminData, role: "ADMIN" } 
              }));
              navigate('/', { replace: true });
              return;
            }
          }
        } catch (e) {
          console.log("Could not determine user role");
          setError("User role could not be determined");
        }
      }
    } catch (err) {
      console.error("Request error:", err);
      setError('Login failed');
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
              Authenticating...
            </Typography>
            <CircularProgress size={40} sx={{ my: 4 }} />
          </>
        ) : (
          <>
            <Typography component="h1" variant="h5" gutterBottom>
              {error ? 'Authentication failed' : 'Sign in'}
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleUserLogin} sx={{ width: '100%' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Use your credentials to sign in
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
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
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
                  'Sign In'
                )}
              </Button>
              
              <Box sx={{ textAlign: 'center', mt: 1 }}>
                <Link 
                  component="button" 
                  variant="body2" 
                  onClick={handleForgotPassword}
                  sx={{ cursor: 'pointer' }}
                >
                  Forgot password?
                </Link>
              </Box>
            </Box>
          </>
        )}
      </Box>
    </Container>
  );
}

