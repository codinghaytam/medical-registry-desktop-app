import React, { useEffect, useState } from 'react';
import { Card, Container, Typography, Grid, Paper } from '@mui/material';

export const Profile: React.FC = () => {
  const [userData, setUserData] = useState<any>(null);
  
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUserData(parsedUser);
      }
    } catch (error) {
      console.error("Failed to parse user data from localStorage:", error);
    }
  }, []);

  if (!userData) return <Typography>Loading profile...</Typography>;

  // Determine user role and data structure
  const userRole = localStorage.getItem('userRole') || 
                 (userData.user?.role || userData.role || "");
  
  // Extract user info based on role
  const getUserInfo = () => {
    if (userRole === 'MEDECIN') {
      return {
        name: userData.user?.user?.name || userData.user?.name || "N/A",
        email: userData.user?.user?.email || userData.user?.email || "N/A",
        phone: userData.user?.tel || "Not provided",
        profession: userData.user?.profession || "Not provided",
        licenseNumber: userData.user?.licenseNumber || "Not provided"
      };
    } else if (userRole === 'ETUDIANT') {
      return {
        name: userData.user?.user?.name || "N/A",
        email: userData.user?.user?.email || "N/A",
        phone: "Not provided",
        profession: "Etudiant",
        licenseNumber: userData.user?.niveau ? `Level ${userData.user.niveau}` : "Not provided"
      };
    } else { // ADMIN or other
      return {
        name: userData.user.name || "N/A",
        email: userData.user.email || "N/A",
        phone: userData.user.phone || "Not provided",
        profession: "Administrator",
        licenseNumber: "N/A"
      };
    }
  };

  const userInfo = getUserInfo();

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} display="flex" justifyContent="center">

          </Grid>
          <Grid item xs={12}>
            <Typography variant="h4" align="center" gutterBottom>
              {userInfo.name}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 2 }}>
              <Typography variant="subtitle1">Email</Typography>
              <Typography variant="body1" color="text.secondary">
                {userInfo.email}
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 2 }}>
              <Typography variant="subtitle1">Phone</Typography>
              <Typography variant="body1" color="text.secondary">
                {userInfo.phone}
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 2 }}>
              <Typography variant="subtitle1">Specialty</Typography>
              <Typography variant="body1" color="text.secondary">
                {userInfo.profession}
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 2 }}>
              <Typography variant="subtitle1">License Number</Typography>
              <Typography variant="body1" color="text.secondary">
                {userInfo.licenseNumber}
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default Profile;
