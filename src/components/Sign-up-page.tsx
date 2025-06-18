import { Button, TextField, Box, Typography, Container, CircularProgress, Alert } from '@mui/material';
import { fetch } from '@tauri-apps/plugin-http';
import { useState, FormEvent } from 'react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    urlencoded.append("scope", import.meta.env.VITE_KEYCLOAK_SCOPE);
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
        throw new Error(`Invalid credentials: ${response.status}`);
      }
      
      const rawText = await response.text();
      const data = JSON.parse(rawText);
      
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      
      // First, check user type/role from a central endpoint
      try {
        const userResponse = await fetch("https://walrus-app-j9qyk.ondigitalocean.app/users/email/" + email, {
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
          const medecinResponse = await fetch("https://walrus-app-j9qyk.ondigitalocean.app/medecin/email/" + email, {method:"GET"});
          if (medecinResponse.ok) {
            const medecinData = await medecinResponse.json();
            
            // Store with proper structure to avoid "user.role" undefined error
            localStorage.setItem("user", JSON.stringify({ 
              user: { ...medecinData, role: "MEDECIN", firstName: medecinData.firstName || '', lastName: medecinData.lastName || '' } 
            }));
            window.location.href = "http://localhost:1420";
            return;
          }
        } 
        else if (userRole === "ETUDIANT") {
          const etudiantResponse = await fetch("https://walrus-app-j9qyk.ondigitalocean.app/etudiant/email/" + email, {method:"GET"});
          if (etudiantResponse.ok) {
            const etudiantData = await etudiantResponse.json();
            localStorage.setItem("user", JSON.stringify({ 
              user: { ...etudiantData, role: "ETUDIANT" } 
            }));
            window.location.href = "http://localhost:1420";
            return;
          }
        } 
        else if (userRole === "ADMIN") {
          const adminResponse = await fetch("https://walrus-app-j9qyk.ondigitalocean.app/admin/email/" + email, {method:"GET"});
          if (adminResponse.ok) {
            const adminData = await adminResponse.json();
            localStorage.setItem("user", JSON.stringify({ 
              user: { ...adminData, role: "ADMIN", firstName: adminData.keycloakDetails.firstName || '', lastName: adminData.keycloakDetails.lastName || '' } 
            }));
            window.location.href = "http://localhost:1420";
            return;
          }
        } 
        else {
          throw new Error("Unknown user role");
        }
      } catch (e) {
        console.error("Error determining user role:", e);
        
        // Fallback to the previous approach if the central endpoint fails
        try {
          // Try to fetch user data based on email - this might be a medecin
          const medecinData = await (await fetch("https://walrus-app-j9qyk.ondigitalocean.app/medecin/email/" + email, {method:"GET"})).json();
          if (medecinData) {
            localStorage.setItem("user", JSON.stringify({ 
              user: { ...medecinData, role: "MEDECIN" } 
            }));
            window.location.href = "http://localhost:1420";
            return;
          }
        } catch (e) {
          console.log("Not a medecin user, trying other roles...");
        }
        
        try {
          const etudiantData = await (await fetch("https://walrus-app-j9qyk.ondigitalocean.app/etudiant/email/" + email, {method:"GET"})).json();
          if (etudiantData) {
            localStorage.setItem("user", JSON.stringify({ 
              user: { ...etudiantData, role: "ETUDIANT" } 
            }));
            window.location.href = "http://localhost:1420";
            return;
          }
        } catch (e) {
          console.log("Not an etudiant user, trying admin...");
        }
        
        try {
          const adminData = await (await fetch("https://walrus-app-j9qyk.ondigitalocean.app/admin/email/" + email, {method:"GET"})).json();
          if (adminData) {
            localStorage.setItem("user", JSON.stringify({ 
              user: { ...adminData, role: "ADMIN" } 
            }));
            window.location.href = "http://localhost:1420";
            return;
          }
        } catch (e) {
          console.log("Could not determine user role");
          setError("User role could not be determined");
        }
      }
    } catch (err) {
      console.error("Request error:", err);
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
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
            </Box>
          </>
        )}
      </Box>
    </Container>
  );
}

