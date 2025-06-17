import React, { useEffect, useState } from 'react';
import useInterval from '../utiles/useInterval';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Switch,
  FormControlLabel,

  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Search,
  Plus,
  MoreVertical,
  Trash2,
  User,
  RefreshCw,
} from 'lucide-react';
import { medecinService, MedecinData, CreateMedecinData } from '../services/medecinService';

const Medecins: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMedecinId, setSelectedMedecinId] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  // Add delete confirmation dialog state
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [medecinToDelete, setMedecinToDelete] = useState<string | null>(null);
  const [medecins, setMedecins] = useState<MedecinData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMedecin, setNewMedecin] = useState<CreateMedecinData>({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    profession: 'PARODENTAIRE',
    isSpecialiste: false,
    pwd: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);

  const fetchMedecins = async () => {
    setIsLoading(true);
    setNetworkError(null);
    try {
      const response = await medecinService.getAll();
      const data = await response.json();
      if (response.ok) {
        setMedecins(data);
      } else {
        throw new Error(data.error || 'Failed to load doctors');
      }
    } catch (error: any) {
      console.error('Error fetching medecins:', error);
      setMedecins([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Set up auto-refresh for medecins list every 5 minutes
  useInterval(() => {
    fetchMedecins();
  }, 300000); // 5 minutes in milliseconds

  useEffect(() => {
    fetchMedecins();
  }, []);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>, id: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedMedecinId(id);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMedecinId(null);
  };

  const handleOpenDialog = (medecin?: MedecinData) => {
    if (medecin) {
      // Split name into firstName and lastName if available
      const fullName = medecin.user?.name || '';
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      setNewMedecin({
        username: medecin.user?.username || '',
        firstName: firstName,
        lastName: lastName,
        email: medecin.user?.email || '',
        profession: medecin.profession,
        isSpecialiste: medecin.isSpecialiste,
        pwd: medecin.pwd
      });
      setIsEditing(true);
      setSelectedMedecinId(medecin.id);
    } else {
      setNewMedecin({
        username: '',
        firstName: '',
        lastName: '',
        email: '',
        profession: 'PARODENTAIRE',
        isSpecialiste: false,
        pwd: ''
      });
      setIsEditing(false);
      setSelectedMedecinId(null);
    }
    setOpenDialog(true);
    setError(null);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setIsEditing(false);
    setError(null);
  };

  const handleTextInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setNewMedecin(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (event: SelectChangeEvent) => {
    const { name, value } = event.target;
    setNewMedecin(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewMedecin(prev => ({ ...prev, isSpecialiste: event.target.checked }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Validate required fields
    if (!newMedecin.firstName || !newMedecin.lastName || !newMedecin.email || !newMedecin.pwd) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      const submissionData: CreateMedecinData = {
        username: newMedecin.username.trim(),
        firstName: newMedecin.firstName.trim(),
        lastName: newMedecin.lastName.trim(),
        email: newMedecin.email.trim().toLowerCase(),
        profession: newMedecin.profession,
        isSpecialiste: newMedecin.isSpecialiste,
        pwd: newMedecin.pwd
      };

      if (isEditing && selectedMedecinId) {
        await medecinService.update(selectedMedecinId, submissionData);
      } else {
        await medecinService.create(submissionData);
      }
      
      // Reset form state after successful submission
      setNewMedecin({
        username: '',
        firstName: '',
        lastName: '',
        email: '',
        profession: 'PARODENTAIRE',
        isSpecialiste: false,
        pwd: ''
      });
      
      handleCloseDialog();
      fetchMedecins();
    } catch (error: any) {
      console.error('Failed to save medecin:', error);
      const errorMessage = error.response 
        ? (await error.response.json()).error || error.message 
        : error.message || "Une erreur s'est produite lors de l'enregistrement du médecin";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show delete confirmation dialog
  const handleConfirmDelete = (id: string) => {
    setMedecinToDelete(id);
    setOpenDeleteDialog(true);
    handleMenuClose();
  };

  // Close delete confirmation dialog
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setMedecinToDelete(null);
  };

  // Proceed with delete after confirmation
  const handleConfirmedDelete = async () => {
    if (!medecinToDelete) return;
    
    setIsLoading(true);
    setError(null);
    try {
      await medecinService.delete(medecinToDelete);
      // Refresh medecins list after deletion
      fetchMedecins();
    } catch (error: any) {
      console.error('Failed to delete medecin:', error);
      setNetworkError(error.message || "Failed to delete doctor");
    } finally {
      setIsLoading(false);
      setOpenDeleteDialog(false);
      setMedecinToDelete(null);
    }
  };

  

  const filteredMedecins = React.useMemo(() => {
    if (!Array.isArray(medecins)) return [];
    const query = (searchQuery || '').toLowerCase();
    return medecins.filter(medecin => 
      medecin.user?.username?.toLowerCase().includes(query) ||
      medecin.user?.email?.toLowerCase().includes(query) ||
      medecin.user?.name?.toLowerCase().includes(query) ||
      medecin.profession.toLowerCase().includes(query)
    );
  }, [medecins, searchQuery]);

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
          Médecins
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh médecins list">
              <IconButton 
                size="small" 
                onClick={fetchMedecins}
                disabled={isLoading}
              >
                <RefreshCw size={16} />
              </IconButton>
            </Tooltip>
            <Button 
              variant="contained" 
              startIcon={<Plus size={18} />}
              sx={{ borderRadius: 2 }}
              onClick={() => handleOpenDialog()}
              disabled={isLoading}
            >
              Add New Médecin
            </Button>
          </Box>
      </Box>

      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <TextField
            placeholder="Search doctors..."
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ width: { xs: '100%', sm: 300 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={20} />
                </InputAdornment>
              ),
            }}
          />
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }}>
            <Button 
              variant="outlined" 
              size="small"
              startIcon={<RefreshCw size={16} />}
              onClick={fetchMedecins}
              disabled={isLoading}
              sx={{ minWidth: 120 }}
            >
              Refresh
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <TableContainer component={Paper} elevation={0}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell></TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Profession</TableCell>
                <TableCell>Specialist</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && medecins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <CircularProgress size={24} sx={{ mr: 1 }} />
                    Loading doctors...
                  </TableCell>
                </TableRow>
              ) : filteredMedecins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body1" sx={{ py: 2 }}>
                      {networkError ? "Couldn't load doctors due to a network error" : "No doctors found"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredMedecins
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((medecin) => (
                    <TableRow
                      key={medecin.id}
                      sx={{
                        '&:last-child td, &:last-child th': { border: 0 },
                      }}
                    >
                      <TableCell>
                        <User size={14} style={{ marginRight: 8 }} />
                      </TableCell>
                      <TableCell>{medecin.user?.username}</TableCell>
                      <TableCell>{medecin.user?.email}</TableCell>
                      <TableCell>{medecin.user?.name}</TableCell>
                      <TableCell>{medecin.user?.role}</TableCell>
                      <TableCell>{medecin.profession}</TableCell>
                      <TableCell>{medecin.isSpecialiste ? 'Yes' : 'No'}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(event) => handleMenuClick(event, medecin.id)}
                          disabled={isLoading}
                          sx={{ color: 'text.secondary' }}
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
          count={filteredMedecins.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>

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
        <MenuItem onClick={() => {
          const medecin = medecins.find(m => m.id === selectedMedecinId);
          if (medecin) {
            handleOpenDialog(medecin);
          }
          handleMenuClose();
        }}>

        </MenuItem>
        <MenuItem
          onClick={() => selectedMedecinId && handleConfirmDelete(selectedMedecinId)}
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
            Are you sure you want to delete this doctor? This action cannot be undone.
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

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>new Docter</DialogTitle>
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
            
            <TextField
              size="small"
              label="First Name"
              name="firstName"
              value={newMedecin.firstName || ''}
              onChange={handleTextInputChange}
              required
              sx={{ mb: 2, width: '100%' }}
            />
            <TextField
              size="small"
              label="Last Name"
              name="lastName"
              value={newMedecin.lastName || ''}
              onChange={handleTextInputChange}
              required
              sx={{ mb: 2, width: '100%' }}
            />
            <TextField
              size="small"
              label="Email"
              name="email"
              type="email"
              value={newMedecin.email}
              onChange={handleTextInputChange}
              required
              sx={{ mb: 2, width: '100%' }}
            />
             <TextField
              size="small"
              label="password"
              name="pwd"
              type="password"
              value={newMedecin.pwd}
              onChange={handleTextInputChange}
              required
              sx={{ mb: 2, width: '100%' }}
            />
            <FormControl size="small" fullWidth sx={{ mb: 2 }}>
              <InputLabel>Profession</InputLabel>
              <Select
                name="profession"
                value={newMedecin.profession}
                onChange={handleSelectChange}
                label="Profession"
                disabled={isSubmitting}
              >
                <MenuItem value="PARODENTAIRE">Parodentaire</MenuItem>
                <MenuItem value="ORTHODONTAIRE">Orthodontaire</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={newMedecin.isSpecialiste}
                  onChange={handleSwitchChange}
                  name="isSpecialiste"
                  disabled={isSubmitting}
                />
              }
              label="Is Specialist"
            />
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
    </Box>
  );
};

export default Medecins;