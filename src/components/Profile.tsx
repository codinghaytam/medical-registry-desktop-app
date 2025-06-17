import React, { useEffect, useState } from 'react';
import { 
  Card, 
  Container, 
  Typography, 
  Grid, 
  Paper, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  FormControl,
  InputLabel,
  Select as MuiSelect,
  MenuItem,
  CircularProgress,
  FormControlLabel,
  Switch,
  InputAdornment,
  Box,
  Snackbar,
  Alert,
  SelectChangeEvent
} from '@mui/material';
import { Edit, Phone } from 'lucide-react';
import { userService } from '../services/userService';
import { medecinService, Profession } from '../services/medecinService';
import { etudiantService } from '../services/etudiantService';

export const Profile: React.FC = () => {
  const [userData, setUserData] = useState<any>(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    phone: '',
    // Additional fields for MEDECIN role
    profession: 'PARODENTAIRE' as Profession,
    isSpecialiste: false,
    // Additional field for ETUDIANT role
    niveau: 1,
  });
  
  // Phone number validation function for Moroccan numbers
  const validatePhone = (phone: string): string => {
    // Empty check
    if (!phone.trim()) {
      return '';  // Allow empty phone
    }

    // Moroccan phone number validation (9 digits)
    // Typical formats: 6XXXXXXXX, 7XXXXXXXX, 5XXXXXXXX
    const phoneRegex = /^[567]\d{8}$/;

    if (!phoneRegex.test(phone)) {
      return "Invalid Moroccan phone format. Use 9 digits starting with 5, 6, or 7";
    }

    return ''; // No error
  };

  // Handle phone input changes with validation
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    
    // Update the phone value
    setEditFormData(prev => ({
      ...prev,
      phone: value
    }));
    
    // Validate and set error
    const error = validatePhone(value);
    setPhoneError(error);
  };
  
  useEffect(() => {
    loadUserData();
  }, []);
  
  const loadUserData = () => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUserData(parsedUser);
      }
    } catch (error) {
      console.error("Failed to parse user data from localStorage:", error);
    }
  };

  if (!userData) return <Typography>Loading profile...</Typography>;

  // Determine user role and data structure
  const userRole = localStorage.getItem('userRole') || 
                 (userData.user?.role || userData.role || "");
  
  // Extract user info based on role
  const getUserInfo = () => {
    if (userRole === 'MEDECIN') {
      return {
        id: userData.user?.id || userData.id || "",
        name: userData.user?.user?.name || userData.user?.name || "N/A",
        firstName: userData.user?.firstName || userData.user?.user?.firstName || "",
        lastName: userData.user?.lastName || userData.user?.user?.lastName || "",
        email: userData.user?.user?.email || userData.user?.email || "N/A",
        phone: userData.user?.tel || "Not provided",
        profession: userData.user?.profession || "Not provided",
        isSpecialiste: userData.user?.isSpecialiste || false,
        licenseNumber: userData.user?.licenseNumber || "Not provided"
      };
    } else if (userRole === 'ETUDIANT') {
      return {
        id: userData.user?.id || userData.id || "",
        name: userData.user?.user?.name || "N/A",
        firstName: userData.user?.firstName || userData.user?.user?.firstName || "",
        lastName: userData.user?.lastName || userData.user?.user?.lastName || "",
        email: userData.user?.user?.email || userData.user?.email || "N/A",
        phone: userData.user?.phone || "Not provided",
        profession: "Etudiant",
        niveau: userData.user?.niveau || 1,
        licenseNumber: userData.user?.niveau ? `Level ${userData.user.niveau}` : "Not provided"
      };
    } else { // ADMIN or other
      return {
        id: userData.user?.id || userData.id || "",
        name: userData.user?.name || "N/A",
        firstName: userData.user?.firstName || "",
        lastName: userData.user?.lastName || "",
        email: userData.user?.email || "N/A",
        phone: userData.user?.phone || "Not provided",
        profession: "Administrator",
        licenseNumber: "N/A"
      };
    }
  };

  const userInfo = getUserInfo();
  
  const handleOpenEditDialog = () => {
    // Strip +212 prefix from phone number if present
    let phoneNumber = userInfo.phone || '';
    if (phoneNumber.startsWith('+212')) {
      phoneNumber = phoneNumber.substring(4); // Remove +212 prefix
    }
    
    // Initialize form with current user data
    setEditFormData({
      firstName: userInfo.firstName || '',
      lastName: userInfo.lastName || '',
      email: userInfo.email || '',
      username: userInfo.email || '',  // Use email as username
      password: '', // Leave password empty when editing
      phone: phoneNumber === 'Not provided' ? '' : phoneNumber,
      profession: (userInfo.profession === 'PARODENTAIRE' || userInfo.profession === 'ORTHODENTAIRE') 
        ? userInfo.profession 
        : 'PARODENTAIRE',
      isSpecialiste: userInfo.isSpecialiste || false,
      niveau: userInfo.niveau || 1,
    });
    
    setOpenEditDialog(true);
    setError(null);
  };
  
  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setError(null);
    setPhoneError('');
  };
  
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleEditSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: checked,
    }));
  };
  
  const handleEditNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    setEditFormData(prev => ({
      ...prev,
      [event.target.name]: isNaN(value) ? 1 : value,
    }));
  };
    const handleEditProfessionChange = (event: SelectChangeEvent) => {
    setEditFormData(prev => ({
      ...prev,
      profession: event.target.value as Profession,
    }));
  };
  
  const handleSubmitEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Validate phone number before submitting
    const phoneValidationError = validatePhone(editFormData.phone);
    if (phoneValidationError) {
      setPhoneError(phoneValidationError);
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const { password, ...data } = editFormData;
      
      // Prepend +212 to the phone number for Moroccan format
      const formattedPhone = data.phone ? `+212${data.phone}` : '';
      
      // Prepare a base update object
      const updateData = {
        username: data.email,  // Always use email as username
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: formattedPhone,
        ...(password ? { password } : {}),  // Only include password if provided
      };
      
      // Call appropriate service based on user role
      if (userRole === 'MEDECIN') {
        await medecinService.update(userInfo.id, {
          ...updateData,
          profession: data.profession,
          isSpecialiste: data.isSpecialiste,
          ...(password ? { pwd: password } : {}),  // Medecin uses 'pwd' instead of 'password'
        });
      } else if (userRole === 'ETUDIANT') {
        await etudiantService.update(userInfo.id, {
          ...updateData,
          niveau: data.niveau,
          role: 'ETUDIANT',
        });
      } else {
        await userService.update(userInfo.id, updateData);
      }
      
      // Show success message
      setSuccess("Profile updated successfully!");
      
      // Reload user data from localStorage after update
      loadUserData();
      
      // Close dialog
      handleCloseEditDialog();
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      setError(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCloseSnackbar = () => {
    setSuccess(null);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h4" gutterBottom>
              Profile
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<Edit />}
              onClick={handleOpenEditDialog}
            >
              Edit Profile
            </Button>
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
                {userRole === 'MEDECIN' && userInfo.isSpecialiste && " (Specialist)"}
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
      
      {/* Edit Profile Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Profile</DialogTitle>
        <form onSubmit={handleSubmitEdit}>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <TextField
              fullWidth
              label="First Name"
              name="firstName"
              value={editFormData.firstName}
              onChange={handleEditChange}
              required
              disabled={isSubmitting}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Last Name"
              name="lastName"
              value={editFormData.lastName}
              onChange={handleEditChange}
              required
              disabled={isSubmitting}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={editFormData.email}
              onChange={handleEditChange}
              required
              disabled={isSubmitting}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Password (leave empty to keep current)"
              name="password"
              type="password"
              value={editFormData.password}
              onChange={handleEditChange}
              disabled={isSubmitting}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Phone Number"
              name="phone"
              value={editFormData.phone}
              onChange={handlePhoneChange}
              disabled={isSubmitting}
              error={!!phoneError}
              helperText={phoneError || "Moroccan format: 6XXXXXXXX (9 digits)"}
              sx={{ mb: 2 }}
              placeholder="6XXXXXXXX"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Phone size={16} style={{ marginRight: '4px' }} />
                      +212
                    </Box>
                  </InputAdornment>
                ),
              }}
            />
            
            {/* MEDECIN specific fields */}
            {userRole === 'MEDECIN' && (
              <>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Profession</InputLabel>                  <MuiSelect
                    value={editFormData.profession}
                    label="Profession"
                    onChange={handleEditProfessionChange}
                    required
                    disabled={isSubmitting}
                  >
                    <MenuItem value="PARODENTAIRE">PARODENTAIRE</MenuItem>
                    <MenuItem value="ORTHODENTAIRE">ORTHODENTAIRE</MenuItem>
                  </MuiSelect>
                </FormControl>
                
                <FormControlLabel
                  control={
                    <Switch
                      name="isSpecialiste"
                      checked={editFormData.isSpecialiste}
                      onChange={handleEditSwitchChange}
                      disabled={isSubmitting}
                    />
                  }
                  label="Est Spécialiste"
                  sx={{ mb: 2 }}
                />
              </>
            )}
            
            {/* ETUDIANT specific fields */}
            {userRole === 'ETUDIANT' && (
              <TextField
                fullWidth
                type="number"
                label="Niveau"
                name="niveau"
                value={editFormData.niveau}
                onChange={handleEditNumberChange}
                required
                disabled={isSubmitting}
                sx={{ mb: 2 }}
                InputProps={{
                  inputProps: { min: 1, max: 7 }
                }}
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseEditDialog} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} /> : undefined}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      
      {/* Success message */}
      <Snackbar 
        open={!!success} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Profile;
