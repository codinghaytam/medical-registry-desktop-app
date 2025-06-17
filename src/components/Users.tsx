import React, { useState, useEffect } from 'react';
import useInterval from '../utiles/useInterval';
import { 
  Box, Typography, Card, CardContent, Button, TextField, InputAdornment,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, Paper, IconButton, Menu, MenuItem, Dialog,
  DialogTitle, DialogContent, DialogActions, FormControl, InputLabel,
  Select, SelectChangeEvent, CircularProgress, Tooltip, Switch, FormControlLabel
} from '@mui/material';
import { Search, Plus, MoreVertical, Edit, Trash2, User, RefreshCw } from 'lucide-react';
import { userService, UserData } from '../services/userService';
import { medecinService, Profession } from '../services/medecinService';
import { etudiantService } from '../services/etudiantService';

const Users: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  // Add delete confirmation dialog state
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [userToEdit, setUserToEdit] = useState<UserData | null>(null);
  const [editFormData, setEditFormData] = useState({
    id: '',
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: '',
    // Additional fields for MEDECIN role
    profession: 'PARODENTAIRE' as Profession,
    isSpecialiste: false,
    // Additional field for ETUDIANT role
    niveau: 1,
  });
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: '',
    // Additional fields for MEDECIN role
    profession: 'PARODENTAIRE' as Profession,
    isSpecialiste: false,
    // Additional field for ETUDIANT role
    niveau: 1,
  });
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUsers = async () => {
    setIsLoading(true);
    setNetworkError(null);
    try {
      const data = await userService.getAll();
      setUsers(data);
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      setNetworkError(error.message || 'Failed to load users. Please try again.');
      // Still set empty array instead of failing completely
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Set up auto-refresh for users list every 5 minutes
  useInterval(() => {
    fetchUsers();
  }, 300000); // 5 minutes in milliseconds

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>, userId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedUserId(userId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUserId(null);
  };

  const handleOpenEditDialog = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    setUserToEdit(user);
    
    // Initialize form with current user data
    setEditFormData({
      id: user.id,
      username: user.username,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email,
      password: '', // Leave password empty when editing
      role: user.role,
      profession: 'PARODENTAIRE',
      isSpecialiste: false,
      niveau: 1,
    });

    // Load role-specific data
    loadRoleSpecificData(user);
    
    setOpenEditDialog(true);
    handleMenuClose();
  };

  const loadRoleSpecificData = async (user: UserData) => {
    try {
      if (user.role === 'MEDECIN') {
        const medecinData = await medecinService.getById(user.id);
        if (medecinData) {
          setEditFormData(prev => ({
            ...prev,
            profession: medecinData.profession,
            isSpecialiste: medecinData.isSpecialiste || false,
          }));
        }
      } else if (user.role === 'ETUDIANT') {
        const etudiantData = await etudiantService.getById(user.id);
        if (etudiantData) {
          setEditFormData(prev => ({
            ...prev,
            niveau: etudiantData.niveau || 1,
          }));
        }
      }
    } catch (error) {
      console.error('Error loading role-specific data:', error);
      setError('Failed to load user data. Please try again.');
    }
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setUserToEdit(null);
    setError(null);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditRoleChange = (event: SelectChangeEvent) => {
    setEditFormData(prev => ({
      ...prev,
      role: event.target.value,
    }));
  };

  const handleEditProfessionChange = (event: SelectChangeEvent) => {
    setEditFormData(prev => ({
      ...prev,
      profession: event.target.value as Profession,
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

  const handleSubmitEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!userToEdit) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      const { id, password, ...data } = editFormData;
      
      // Prepare a base update object
      const updateData = {
        username: data.email,  // Always use email as username
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        ...(password ? { password } : {}),  // Only include password if provided
      };

      // Call appropriate service based on user role
      if (userToEdit.role === 'MEDECIN') {
        await medecinService.update(id, {
          ...updateData,
          profession: data.profession,
          isSpecialiste: data.isSpecialiste,
          ...(password ? { pwd: password } : {}),  // Medecin uses 'pwd' instead of 'password'
        });
      } else if (userToEdit.role === 'ETUDIANT') {
        await etudiantService.update(id, {
          ...updateData,
          niveau: data.niveau,
        });
      } else {
        await userService.update(id, updateData);
      }

      // Refresh users list and close dialog
      fetchUsers();
      handleCloseEditDialog();
    } catch (error: any) {
      console.error('Failed to update user:', error);
      setError(error.message || 'Failed to update user. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
    setError(null);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setError(null);
    setNewUser({
      username: '',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: '',
      profession: 'PARODENTAIRE',
      isSpecialiste: false,
      niveau: 1,
    });
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    
    // If email is changed, automatically update username with the same value
    if (name === 'email') {
      setNewUser(prev => ({
        ...prev,
        [name]: value,
        username: value
      }));
    } else {
      setNewUser(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleEditInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRoleChange = (event: SelectChangeEvent) => {
    setNewUser(prev => ({
      ...prev,
      role: event.target.value
    }));
  };

  const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewUser(prev => ({
      ...prev,
      [event.target.name]: event.target.checked
    }));
  };

  const handleNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    setNewUser(prev => ({
      ...prev,
      [event.target.name]: isNaN(value) ? 1 : value
    }));
  };

  const handleProfessionChange = (event: SelectChangeEvent) => {
    setNewUser(prev => ({
      ...prev,
      profession: event.target.value as Profession
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Always use email as username
      const baseUserData = {
        username: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        pwd: newUser.password,
      };
      
      if (newUser.role === 'MEDECIN') {
        // For MEDECIN, use medecinService
        const medecinData = {
          ...baseUserData,
          profession: newUser.profession,
          isSpecialiste: newUser.isSpecialiste,
          pwd: newUser.password, // medecinService expects 'pwd' instead of 'password'
        };
        await medecinService.create(medecinData);
      } else if (newUser.role === 'ETUDIANT') {
        // For ETUDIANT, use etudiantService
        const etudiantData = {
          ...baseUserData,
          role: 'ETUDIANT',
          niveau: newUser.niveau,
        };
        await etudiantService.create(etudiantData);
      } else {
        // For ADMIN role, use standard user creation
        const userData = {
          ...baseUserData,
          role: newUser.role,
        };
        await userService.create(userData);
      }
      
      handleCloseDialog();
      fetchUsers();
    } catch (error: any) {
      console.error('Failed to create user:', error);
      setError(error.message || "Une erreur s'est produite lors de l'enregistrement de l'utilisateur");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show delete confirmation dialog
  const handleConfirmDelete = (id: string) => {
    setUserToDelete(id);
    setOpenDeleteDialog(true);
    handleMenuClose();
  };

  // Close delete confirmation dialog
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setUserToDelete(null);
  };

  // Proceed with delete after confirmation
  const handleConfirmedDelete = async () => {
    if (!userToDelete) return;
    console.log('Deleting user:', userToDelete);
    setIsLoading(true);
    try {
      // Find the user to determine its role
      const userToDeleteObj = users.filter(user => user.id === userToDelete)[0];
      if (!userToDeleteObj) {
        throw new Error("User not found");
      }
      
      // Delete based on user role
      switch (userToDeleteObj.role) {
        case 'MEDECIN':
          await medecinService.delete(userToDelete);
          break;
        case 'ETUDIANT':
          await etudiantService.delete(userToDelete);
          break;
        case 'ADMIN':
        default:
          // For ADMIN or any other role, use the generic user service
          await userService.delete(userToDelete);
          break;
      }
      
      // Refresh users list after deletion
      fetchUsers();
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      setNetworkError(error.message || "Failed to delete user");
    } finally {
      setIsLoading(false);
      setOpenDeleteDialog(false);
      setUserToDelete(null);
    }
  };



  const filteredUsers = React.useMemo(() => {
    if (!Array.isArray(users)) return [];
    return users.filter(user => 
      user.firstName?.toLowerCase().includes(searchQuery?.toLowerCase() || '') ||
      user.lastName?.toLowerCase().includes(searchQuery?.toLowerCase() || '') ||
      user.email?.toLowerCase().includes(searchQuery?.toLowerCase() || '') ||
      user.username?.toLowerCase().includes(searchQuery?.toLowerCase() || '')
    );
  }, [users, searchQuery]);

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Show network error message at the top if present */}
      {networkError && (
        <Box sx={{ 
          mb: 4, 
          p: 2, 
          bgcolor: 'error.light', 
          color: 'error.dark',
          borderRadius: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="body1">
            {networkError}
          </Typography>
          <Button 
            variant="outlined" 
            color="error" 
            size="small"
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </Box>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Users
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh users list">
            <IconButton 
              size="small" 
              onClick={fetchUsers}
              disabled={isLoading}
            >
            </IconButton>
          </Tooltip>
          <Button 
            variant="contained" 
            size="small" 
            startIcon={<Plus size={16} />}
            onClick={handleOpenDialog}
            disabled={isLoading}
          >
            Add New User
          </Button>
        </Box>
      </Box>

      {/* Search Card */}
      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <TextField
            placeholder="Search users..."
            variant="outlined"
            size="small"
            sx={{ width: { xs: '100%', sm: 300 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={20} />
                </InputAdornment>
              ),
            }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
            <Button 
              variant="outlined" 
              size="small"
              startIcon={<RefreshCw size={16} />}
              onClick={fetchUsers}
              disabled={isLoading}
            >
              Refresh
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <TableContainer component={Paper} elevation={0}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Username</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress size={24} sx={{ mr: 1 }} />
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body1" sx={{ py: 2 }}>
                      {networkError ? "Couldn't load users due to a network error" : "No users found"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <User size={14} style={{ marginRight: 8 }} />
                          {`${user.firstName || ''} ${user.lastName || ''}`}
                        </Box>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role || 'No roles'}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell align="right">
                        <IconButton 
                          size="small" 
                          onClick={(event) => handleMenuClick(event, user.id)}
                          disabled={isLoading}
                        >
                          <MoreVertical size={18} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredUsers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
            mt: 1.5,
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1,
              borderRadius: 1,
              mb: 0.5,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => selectedUserId && handleOpenEditDialog(selectedUserId.toString())}>
          <Edit size={16} style={{ marginRight: 8 }} />
          Edit
        </MenuItem>
        <MenuItem 
          onClick={() => selectedUserId && handleConfirmDelete(selectedUserId.toString())} 
          sx={{ color: 'error.main' }}
          disabled={isLoading}
        >
          <Trash2 size={16} style={{ marginRight: 8 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Delete confirmation dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <Typography id="delete-dialog-description">
            Are you sure you want to delete this user? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmedDelete} 
            color="error" 
            variant="contained"
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add New User</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {/* Show error message if present */}
            {error && (
              <Box sx={{ 
                mb: 3,
                p: 2, 
                bgcolor: 'error.light', 
                color: 'error.dark',
                borderRadius: 1,
                fontSize: '0.875rem'
              }}>
                {error}
              </Box>
            )}
            
            {/* Username field is hidden as it will be auto-filled with email */}
            <TextField
              type="hidden"
              name="username"
              value={newUser.username}
            />
            
            <TextField
              fullWidth
              label="First Name"
              name="firstName"
              value={newUser.firstName}
              onChange={handleInputChange}
              required
              disabled={isSubmitting}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Last Name"
              name="lastName"
              value={newUser.lastName}
              onChange={handleInputChange}
              required
              disabled={isSubmitting}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={newUser.email}
              onChange={handleInputChange}
              required
              disabled={isSubmitting}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={newUser.password}
              onChange={handleInputChange}
              required
              disabled={isSubmitting}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Role</InputLabel>
              <Select
                value={newUser.role}
                label="Role"
                onChange={handleRoleChange}
                required
                disabled={isSubmitting}
              >
                <MenuItem value="ADMIN">Admin</MenuItem>
                <MenuItem value="MEDECIN">Médecin</MenuItem>
                <MenuItem value="ETUDIANT">Etudiant</MenuItem>
              </Select>
            </FormControl>
            
            {/* MEDECIN specific fields */}
            {newUser.role === 'MEDECIN' && (
              <>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Profession</InputLabel>
                  <Select
                    value={newUser.profession}
                    label="Profession"
                    onChange={handleProfessionChange}
                    required
                    disabled={isSubmitting}
                  >
                    <MenuItem value="PARODONTAIRE">PARODONTAIRE</MenuItem>
                    <MenuItem value="ORTHODONTAIRE">ORTHODONTAIRE</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControlLabel
                  control={
                    <Switch
                      name="isSpecialiste"
                      checked={newUser.isSpecialiste}
                      onChange={handleSwitchChange}
                      disabled={isSubmitting}
                    />
                  }
                  label="Est Spécialiste"
                  sx={{ mb: 2 }}
                />
              </>
            )}
            
            {/* ETUDIANT specific fields */}
            {newUser.role === 'ETUDIANT' && (
              <TextField
                fullWidth
                type="number"
                label="Niveau"
                name="niveau"
                value={newUser.niveau}
                onChange={handleNumberChange}
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
            <Button onClick={handleCloseDialog} disabled={isSubmitting}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} /> : undefined}
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <form onSubmit={handleSubmitEdit}>
          <DialogContent>
            {error && (
              <Box sx={{ 
                mb: 3,
                p: 2, 
                bgcolor: 'error.light', 
                color: 'error.dark',
                borderRadius: 1,
                fontSize: '0.875rem'
              }}>
                {error}
              </Box>
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
            
            {/* Role is shown but disabled for editing */}
            <FormControl fullWidth sx={{ mb: 2 }} disabled>
              <InputLabel>Role</InputLabel>
              <Select
                value={editFormData.role}
                label="Role"
                onChange={handleEditRoleChange}
              >
                <MenuItem value="ADMIN">Admin</MenuItem>
                <MenuItem value="MEDECIN">Médecin</MenuItem>
                <MenuItem value="ETUDIANT">Etudiant</MenuItem>
              </Select>
            </FormControl>
            
            {/* MEDECIN specific fields */}
            {userToEdit && userToEdit.role === 'MEDECIN' && (
              <>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Profession</InputLabel>
                  <Select
                    value={editFormData.profession}
                    label="Profession"
                    onChange={handleEditProfessionChange}
                    required
                    disabled={isSubmitting}
                  >
                    <MenuItem value="PARODENTAIRE">PARODENTAIRE</MenuItem>
                    <MenuItem value="ORTHODENTAIRE">ORTHODENTAIRE</MenuItem>
                  </Select>
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
            {userToEdit && userToEdit.role === 'ETUDIANT' && (
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
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Users;