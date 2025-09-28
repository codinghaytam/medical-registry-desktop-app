import React, { useEffect, useState } from 'react';
import useInterval from '../utiles/useInterval'
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../services/authService';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
  Tooltip,
  Chip,
  Alert,
  Snackbar
} from '@mui/material';
import { 
  Search, 
  Plus, 
  MoreVertical,
  Edit, 
  Trash2,
  User,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import { patientService, PatientData } from '../services/patientService';
import { getUserRole } from '../utiles/RoleAccess';
import { authService } from '../services/authService';

// Define feedback type for consistent notification styling
type FeedbackType = 'success' | 'error' | 'info';

const Patients: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [expandedRow] = useState<number | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  // Add delete confirmation dialog state
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<string | null>(null);
  // Add states for transfer functionality
  const [openTransferDialog, setOpenTransferDialog] = useState(false);
  const [patientToTransfer, setPatientToTransfer] = useState<string | null>(null);
  // Add states for Ortho to Paro transfer functionality
  const [openTransferOrthoToParoDialog, setOpenTransferOrthoToParoDialog] = useState(false);
  const [patientToTransferOrthoToParo, setPatientToTransferOrthoToParo] = useState<string | null>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [Motifs, setMotifs] = useState<string[]>([]);
  const [typeMastications, setTypeMastications] = useState<string[]>([]);
  const [hygienes, setHygienes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userRole] = useState(getUserRole());
  const [userProfession, setUserProfession] = useState<string | null>(null);
  
  // New state for feedback notifications
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('success');
  
  const [newPatient, setNewPatient] = useState<PatientData>({
    id: '',
    nom: '',
    prenom: '',
    numeroDeDossier: '',
    adresse: '',
    tel: '',
    motifConsultation: 'ESTHETIQUE',
    anameseGenerale: '',
    anamneseFamiliale: '',
    anamneseLocale: '',
    typeMastication: 'BILATERALE',
    hygieneBuccoDentaire: 'BONNE',
    antecedentsDentaires: '',
    state: 'PARODONTAIRE',
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Show feedback notification
  const showFeedback = (message: string, type: FeedbackType = 'success') => {
    setFeedbackMessage(message);
    setFeedbackType(type);
    setFeedbackOpen(true);
  };
  
  // Close feedback notification
  const handleCloseFeedback = () => {
    setFeedbackOpen(false);
  };

  // Get the current user's profession if they are a médecin
  useEffect(() => {
    if (userRole === 'MEDECIN') {
      try {
        const userString = sessionStorage.getItem('user');
        if (userString) {
          const userData = JSON.parse(userString);
          
          // Check all possible locations for profession information
          const profession = userData.profession || 
                            (userData.user && userData.user.profession) ||
                            '';
          
          setUserProfession(profession);
        }
      } catch (error) {
        console.error('Error getting user profession:', error);
      }
    }
  }, [userRole]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>, patientId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedUserId(patientId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUserId(null);
  };

  const handleEditPatient = async () => {
    if (!selectedUserId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      // Fetch the selected patient data
      const patientData = await patientService.getById(selectedUserId);
      
      // Set it to the form
      setNewPatient(patientData);
      
      // Open dialog in edit mode
      setOpenDialog(true);
      
      // Close menu
      handleMenuClose();
    } catch (error: any) {
      console.error('Failed to fetch patient for editing:', error);
      showFeedback('Échec de la récupération des données du patient. Veuillez réessayer.', 'error');
      setError('Échec de la récupération des données du patient. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRowClick = (patientId: string) => {
    // Navigate to patient details page instead of expanding the row
    navigate(`/patients/${patientId}`);
  };

  const handleOpenDialog = () => setOpenDialog(true);
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setError(null);
    setNewPatient({
      id: '',
      nom: '',
      prenom: '',
      numeroDeDossier: '',
      adresse: '',
      tel: '',
      motifConsultation: 'ESTHETIQUE',
      anameseGenerale: '',
      anamneseFamiliale: '',
      anamneseLocale: '',
      typeMastication: 'BILATERALE',
      hygieneBuccoDentaire: 'BONNE',
      antecedentsDentaires: '',
      state: 'PARODONTAIRE',
    });
  };

  const handleTextInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setNewPatient(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (event: SelectChangeEvent) => {
    const { name, value } = event.target;
    setNewPatient(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      if (newPatient.id) {
        // Update existing patient
        await patientService.update(newPatient.id.toString(), newPatient);
        showFeedback('Patient mis à jour avec succès');
      } else {
        // Create new patient
        await patientService.create(newPatient);
        showFeedback('Nouveau patient créé avec succès');
      }
      handleCloseDialog();
      // Refresh patients list after successful creation/update
      const success = await fetchPatients();
      if (!success) {
        showFeedback('Patient enregistré, mais impossible de rafraîchir la liste', 'info');
      }
    } catch (error: any) {
      console.error('Failed to save patient:', error);
      // Set error message for display
      if (error.response) {
        try {
          const errorData = await error.response.json().catch(() => null);
          const errorMsg = errorData?.error || error.message || "Une erreur s'est produite lors de l'enregistrement du patient";
          setError(errorMsg);
          showFeedback(errorMsg, 'error');
        } catch (e) {
          const errorMsg = error.message || "Une erreur s'est produite lors de l'enregistrement du patient";
          setError(errorMsg);
          showFeedback(errorMsg, 'error');
        }
      } else {
        const errorMsg = error.message || "Une erreur s'est produite lors de l'enregistrement du patient";
        setError(errorMsg);
        showFeedback(errorMsg, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show delete confirmation dialog
  const handleConfirmDelete = (id: string) => {
    setPatientToDelete(id);
    setOpenDeleteDialog(true);
    handleMenuClose();
  };

  // Close delete confirmation dialog
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setPatientToDelete(null);
  };

  // Proceed with delete after confirmation
  const handleConfirmedDelete = async () => {
    if (!patientToDelete) return;
    
    setIsLoading(true);
    setError(null);
    try {
      await patientService.delete(patientToDelete);
      showFeedback('Patient supprimé avec succès');

      // Refresh patients list after deletion
      const success = await fetchPatients();
      if (!success) {
        showFeedback('Patient supprimé, mais impossible de rafraîchir la liste', 'info');
      }
    } catch (error: any) {
      console.error('Failed to delete patient:', error);
      showFeedback(error.message || "Échec de la suppression du patient", 'error');
      setNetworkError(error.message || "Échec de la suppression du patient");
    } finally {
      setIsLoading(false);
      setOpenDeleteDialog(false);
      setPatientToDelete(null);
    }
  };

  // Show transfer confirmation dialog
  const handleConfirmTransfer = (id: string) => {
    setPatientToTransfer(id);
    setOpenTransferDialog(true);
    handleMenuClose();
  };

  // Close transfer confirmation dialog
  const handleCloseTransferDialog = () => {
    setOpenTransferDialog(false);
    setPatientToTransfer(null);
  };

  // Proceed with transfer after confirmation
  const handleConfirmedTransfer = async () => {
    if (!patientToTransfer) return;
    
    setIsLoading(true);
    setError(null);
    try {
      // Get current user's ID (for medecin) or the first orthodontaire medecin for admin
      let medecinId = '';
      
      if (userRole === 'MEDECIN') {
        const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
        medecinId = userData.id || userData.user?.id;
      } else {
        // For ADMIN, we need to choose a medecin with ORTHODONTAIRE profession
        // This would be better with a dropdown selection, but for simplicity we'll use the first available        const token = authService.getToken()?.access_token;
        const response = await fetchWithAuth(`${BASE_URL}/medecin`, {
          headers: {
            "Authorization": `Bearer ${authService.getToken()?.access_token}`
          }
        });
        const medecins = await response.json();
        const orthodontist = medecins.find((m: any) => m.profession === 'ORTHODONTAIRE');
        
        if (orthodontist) {
          medecinId = orthodontist.id;
        } else {
          throw new Error('Aucun orthodontiste trouvé dans le système. Veuillez en ajouter un d\'abord.');
        }
      }
      
      if (!medecinId) {
        throw new Error('Impossible de déterminer l\'ID du médecin pour le transfert');
      }
      
      // Call the transfer service
      await patientService.transferParoToOrtho(patientToTransfer, medecinId);
      showFeedback('Patient transféré avec succès au service d\'Orthodontie');

      // Refresh patients list after transfer
      const success = await fetchPatients();
      if (!success) {
        showFeedback('Patient transféré, mais impossible de rafraîchir la liste', 'info');
      }
    } catch (error: any) {
      console.error('Failed to transfer patient:', error);
      showFeedback(error.message || "Échec du transfert du patient", 'error');
      setNetworkError(error.message || "Échec du transfert du patient");
    } finally {
      setIsLoading(false);
      setOpenTransferDialog(false);
      setPatientToTransfer(null);
    }
  };

  // Show transfer confirmation dialog for Ortho to Paro
  const handleConfirmTransferOrthoToParo = (id: string) => {
    setPatientToTransferOrthoToParo(id);
    setOpenTransferOrthoToParoDialog(true);
    handleMenuClose();
  };

  // Close transfer confirmation dialog for Ortho to Paro
  const handleCloseTransferOrthoToParoDialog = () => {
    setOpenTransferOrthoToParoDialog(false);
    setPatientToTransferOrthoToParo(null);
  };

  // Proceed with Ortho to Paro transfer after confirmation
  const handleConfirmedTransferOrthoToParo = async () => {
    if (!patientToTransferOrthoToParo) return;
    
    setIsLoading(true);
    setError(null);
    try {
      // Get current user's ID (for medecin) or the first parodontaire medecin for admin
      let medecinId = '';
      
      if (userRole === 'MEDECIN') {
        const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
        medecinId = userData.id || userData.user?.id;
      } else {
        // For ADMIN, we need to choose a medecin with PARODONTAIRE profession
        const response = await fetchWithAuth(`${BASE_URL}/medecin`, {
          headers: {
            "Authorization": `Bearer ${authService.getToken()?.access_token}`
          }
        });
        const medecins = await response.json();
        const parodontist = medecins.find((m: any) => m.profession === 'PARODONTAIRE');
        
        if (parodontist) {
          medecinId = parodontist.id;
        } else {
          throw new Error('Aucun parodontiste trouvé dans le système. Veuillez en ajouter un d\'abord.');
        }
      }
      
      if (!medecinId) {
        throw new Error('Impossible de déterminer l\'ID du médecin pour le transfert');
      }
      
      // Call the transfer service
      await patientService.transferOrthoToParo(patientToTransferOrthoToParo, medecinId);
      showFeedback('Patient transféré avec succès au service de Parodontie');

      // Refresh patients list after transfer
      const success = await fetchPatients();
      if (!success) {
        showFeedback('Patient transféré, mais impossible de rafraîchir la liste', 'info');
      }
    } catch (error: any) {
      console.error('Failed to transfer patient:', error);
      showFeedback(error.message || "Échec du transfert du patient", 'error');
      setNetworkError(error.message || "Échec du transfert du patient");
    } finally {
      setIsLoading(false);
      setOpenTransferOrthoToParoDialog(false);
      setPatientToTransferOrthoToParo(null);
    }
  };

  // Function to fetch patients data
  const fetchPatients = async (): Promise<boolean> => {
    setIsLoading(true);
    setNetworkError(null);
    try {
      const data = await patientService.getAll();
      
      // If user is a médecin, filter patients based on their profession
      if (userRole === 'MEDECIN' && userProfession) {
        // Filter patients to match the médecin's profession
        const filteredData = data.filter((patient: any) => 
          patient.State === userProfession
        );
        setPatients(filteredData);
      } else {
        // Admin or other roles see all patients
        setPatients(data);
      }
      return true;
    } catch (error: any) {
      console.error('Error fetching patients:', error);
      setNetworkError(error.message || 'Échec du chargement des patients. Veuillez réessayer.');
      // Still set empty array instead of failing completely
      setPatients([]);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Set up auto-refresh for patients list every 5 minutes
  useInterval(() => {
    fetchPatients();
  }, 300000); // 5 minutes in milliseconds

  useEffect(() => {
    fetchPatients();
  }, [userProfession]); // Refetch when userProfession changes
  
  // Handle refresh button click with visual feedback
  const handleRefreshClick = async () => {
    setIsLoading(true);
    const success = await fetchPatients();
    if (success) {
      showFeedback('Données rafraîchies avec succès');
    } else {
      showFeedback('Échec du rafraîchissement des données', 'error');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const fetchEnums = async () => {
      try {        const token = authService.getToken()?.access_token;
        const headers = { "Authorization": `Bearer ${token}` };
        
        const [motifsResponse, masticationsResponse, hygienesResponse] = await Promise.all([
          fetchWithAuth(`${BASE_URL}/enum/motif-consultation`, { headers }).then(res => res.json()),
          fetchWithAuth(`${BASE_URL}/enum/type-mastication`, { headers }).then(res => res.json()),
          fetchWithAuth(`${BASE_URL}/enum/hygiene-bucco-dentaire`, { headers }).then(res => res.json())
        ]);
        
        setMotifs(motifsResponse);
        setTypeMastications(masticationsResponse);
        setHygienes(hygienesResponse);
      } catch (error) {
        console.error('Error fetching enum values:', error);
        // Use empty arrays as fallback
        setMotifs([]);
        setTypeMastications([]);
        setHygienes([]);
      }
    };
    
    fetchEnums();
  }, []);

  const filteredPatients = React.useMemo(() => {
    if (!Array.isArray(patients)) return [];
    return patients.filter(patient => 
      patient.nom?.toLowerCase().includes(searchQuery?.toLowerCase() || '') ||
      patient.prenom?.toLowerCase().includes(searchQuery?.toLowerCase() || '') ||
      patient.numeroDeDossier?.toLowerCase().includes(searchQuery?.toLowerCase() || '')
    );
  }, [patients, searchQuery]);

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
            onClick={() => handleRefreshClick()}
            disabled={isLoading}
          >
            Rafraîchir
          </Button>
        </Box>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Patients
          </Typography>
          
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Plus size={18} />}
          sx={{ borderRadius: 2 }}
          onClick={handleOpenDialog}
          disabled={isLoading}
        >
          Ajouter un patient
        </Button>
      </Box>

      {userRole === 'MEDECIN' && userProfession && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Vous consultez les patients du service {(userProfession=="PARODONTAIRE")? "Parodontie":"Orthodontie"} selon votre spécialité.
        </Alert>
      )}

      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <TextField
            placeholder="Rechercher des patients..."
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
            <Tooltip title="Rafraîchir la liste des patients">
              <Button
              variant="outlined" 
              size="small"
              startIcon={<RefreshCw size={16} />}
              onClick={handleRefreshClick}
              disabled={isLoading}
            >Rafraîchir
            </Button>
            </Tooltip>
           
          </Box>
        </CardContent>
      </Card>

      <Card>
        <TableContainer component={Paper} elevation={0}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell></TableCell>
                <TableCell>Num dossier</TableCell>
                <TableCell>Nom</TableCell>
                <TableCell>Prénom</TableCell>
                <TableCell>Adresse</TableCell>
                <TableCell>Téléphone</TableCell>
                {userRole === 'ADMIN' && <TableCell>Département</TableCell>}
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && patients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={userRole === 'ADMIN' ? 8 : 7} align="center">
                    Chargement des patients...
                  </TableCell>
                </TableRow>
              ) : filteredPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={userRole === 'ADMIN' ? 8 : 7} align="center">
                    <Typography variant="body1" sx={{ py: 2 }}>
                      {networkError ? "Impossible de charger les patients à cause d'une erreur réseau" : "Aucun patient trouvé"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPatients
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((patient) => (
                    <React.Fragment key={patient.id}>
                      <TableRow
                        onClick={() => handleRowClick(patient.id)}
                        sx={{ 
                          '&:last-child td, &:last-child th': { border: 0 },
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: 'action.hover',
                          },
                        }}
                      >
                        <TableCell>
                          <User size={14} style={{ marginRight: 8 }} />
                        </TableCell>
                        <TableCell>{patient.numeroDeDossier}</TableCell>
                        <TableCell>{patient.nom}</TableCell>
                        <TableCell>{patient.prenom}</TableCell>
                        <TableCell>{patient.adresse}</TableCell>
                        <TableCell>{patient.tel}</TableCell>
                        {userRole === 'ADMIN' && (
                          <TableCell>
                            <Chip 
                              label={patient.State?.replace(/_/g, ' ').toLowerCase() || 'non affecté'}
                              size="small"
                              color={patient.State === 'PARODONTAIRE' ? 'primary' : 'secondary'} 
                              variant="outlined"
                            />
                          </TableCell>
                        )}
                        <TableCell align="right">
                          <IconButton 
                            size="small" 
                            onClick={(event) => {
                              event.stopPropagation();
                              handleMenuClick(event, patient.id);
                            }}
                            disabled={isLoading}
                          >
                            <MoreVertical size={18} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                      {expandedRow === patient.id && (
                        <TableRow>
                          <TableCell colSpan={userRole === 'ADMIN' ? 8 : 7}>
                            <Table size="small" sx={{ bgcolor: 'background.default', borderRadius: 1 }}>
                              <TableBody>
                                <TableRow>
                                  <TableCell><strong>Motif de Consultation:</strong></TableCell>
                                  <TableCell>{patient.motifConsultation?.replace(/_/g, ' ').toLowerCase()}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell><strong>Anamnèses Générale:</strong></TableCell>
                                  <TableCell>{patient.anameseGenerale}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell><strong>Anamnèses Familiale:</strong></TableCell>
                                  <TableCell>{patient.anamneseFamiliale}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell><strong>Anamnèses Locale:</strong></TableCell>
                                  <TableCell>{patient.anamneseLocale}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell><strong>Type de Mastication:</strong></TableCell>
                                  <TableCell>{patient.typeMastication?.replace(/_/g, ' ').toLowerCase()}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell><strong>Hygiène Bucco-Dentaire:</strong></TableCell>
                                  <TableCell>{patient.hygieneBuccoDentaire?.replace(/_/g, ' ').toLowerCase()}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell><strong>Antécédents Dentaires:</strong></TableCell>
                                  <TableCell>{patient.antecedentsDentaires}</TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredPatients.length}
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
        <MenuItem onClick={handleEditPatient}>
          <Edit size={16} style={{ marginRight: 8 }} />
          Modifier
        </MenuItem>
        {/* Add transfer option - show for PARODONTAIRE patients to transfer to ORTHODONTAIRE */}
        {selectedUserId && patients.find(p => p.id === selectedUserId)?.State === 'PARODONTAIRE' && (
          <MenuItem 
            onClick={() => selectedUserId && handleConfirmTransfer(selectedUserId)}
            sx={{ color: 'secondary.main' }}
          >
            <IconButton size="small" color="secondary" sx={{ mr: 1, p: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 8L21 12M21 12L17 16M21 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </IconButton>
            Transférer vers Orthodontie
          </MenuItem>
        )}
        {/* Add transfer option - show for ORTHODONTAIRE patients to transfer to PARODONTAIRE */}
        {selectedUserId && patients.find(p => p.id === selectedUserId)?.State === 'ORTHODONTAIRE' && (
          <MenuItem 
            onClick={() => selectedUserId && handleConfirmTransferOrthoToParo(selectedUserId)}
            sx={{ color: 'primary.main' }}
          >
            <IconButton size="small" color="primary" sx={{ mr: 1, p: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 8L3 12M3 12L7 16M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </IconButton>
            Transférer vers Parodontie
          </MenuItem>
        )}
        <MenuItem 
          onClick={() => selectedUserId && handleConfirmDelete(selectedUserId)} 
          sx={{ color: 'error.main' }}
        >
          <Trash2 size={16} style={{ marginRight: 8 }} />
          Supprimer
        </MenuItem>
      </Menu>

      {/* Add delete confirmation dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Confirmer la suppression
        </DialogTitle>
        <DialogContent>
          <Typography id="delete-dialog-description">
            Êtes-vous sûr de vouloir supprimer ce patient ? Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            Annuler
          </Button>
          <Button 
            onClick={handleConfirmedDelete} 
            color="error" 
            variant="contained"
            disabled={isLoading}
          >
            {isLoading ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add transfer confirmation dialog */}
      <Dialog
        open={openTransferDialog}
        onClose={handleCloseTransferDialog}
        aria-labelledby="transfer-dialog-title"
        aria-describedby="transfer-dialog-description"
      >
        <DialogTitle id="transfer-dialog-title">
          Confirmer le transfert du patient
        </DialogTitle>
        <DialogContent>
          <Typography id="transfer-dialog-description">
            Êtes-vous sûr de vouloir transférer ce patient au service d'Orthodontie ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTransferDialog} color="primary">
            Annuler
          </Button>
          <Button 
            onClick={handleConfirmedTransfer} 
            color="secondary" 
            variant="contained"
            disabled={isLoading}
          >
            {isLoading ? 'Traitement...' : 'Transférer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add transfer confirmation dialog for Ortho to Paro */}
      <Dialog
        open={openTransferOrthoToParoDialog}
        onClose={handleCloseTransferOrthoToParoDialog}
        aria-labelledby="transfer-ortho-paro-dialog-title"
        aria-describedby="transfer-ortho-paro-dialog-description"
      >
        <DialogTitle id="transfer-ortho-paro-dialog-title">
          Confirmer le transfert du patient
        </DialogTitle>
        <DialogContent>
          <Typography id="transfer-ortho-paro-dialog-description" paragraph>
              Êtes-vous sûr de vouloir transférer ce patient au service de Parodontie ?
          </Typography>
          <Typography variant="body2" color="text.secondary">
              Cette action transférera le patient vers le service de parodontie et créera un dossier de transfert. Le transfert peut nécessiter une approbation.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTransferOrthoToParoDialog} color="primary">
            Annuler
          </Button>
          <Button 
            onClick={handleConfirmedTransferOrthoToParo} 
            color="primary" 
            variant="contained"
            disabled={isLoading}
          >
            {isLoading ? 'Traitement...' : 'Transférer'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{newPatient.id ? 'Modifier le patient' : 'Ajouter un patient'}</DialogTitle>
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
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              {/* Left column - Text fields */}
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>Informations Générales</Typography>
                <TextField
                  size="small"
                  label="Nom"
                  name="nom"
                  value={newPatient.nom}
                  onChange={handleTextInputChange}
                  required
                  sx={{ mb: 2, width: '100%' }}
                  disabled={isLoading}
                />
                <TextField
                  size="small"
                  label="Prénom"
                  name="prenom"
                  value={newPatient.prenom}
                  onChange={handleTextInputChange}
                  required
                  sx={{ mb: 2, width: '100%' }}
                  disabled={isLoading}
                />
                <TextField
                  size="small"
                  label="Numéro de Dossier"
                  name="numeroDeDossier"
                  value={newPatient.numeroDeDossier}
                  onChange={handleTextInputChange}
                  required
                  sx={{ mb: 2, width: '100%' }}
                  disabled={isLoading}
                />
                <TextField
                  size="small"
                  label="Adresse"
                  name="adresse"
                  value={newPatient.adresse}
                  onChange={handleTextInputChange}
                  sx={{ mb: 2, width: '100%' }}
                  disabled={isLoading}
                />
                <TextField
                  size="small"
                  label="Téléphone"
                  name="tel"
                  value={newPatient.tel}
                  onChange={handleTextInputChange}
                  sx={{ mb: 2, width: '100%' }}
                  disabled={isLoading}
                />
                <TextField
                  size="small"
                  label="Antécédents Dentaires"
                  name="antecedentsDentaires"
                  value={newPatient.antecedentsDentaires}
                  onChange={handleTextInputChange}
                  multiline
                  rows={2}
                  sx={{ mb: 2, width: '100%' }}
                  disabled={isLoading}
                />
              </Box>

              {/* Right column - Select fields and multiline text fields */}
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>Informations Médicales</Typography>
                <FormControl size="small" fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Motif de Consultation</InputLabel>
                  <Select
                    name="motifConsultation"
                    value={newPatient.motifConsultation}
                    onChange={handleSelectChange}
                    label="Motif de Consultation"
                    disabled={isLoading}
                  >
                    {Array.isArray(Motifs) && Motifs.length > 0 ? (
                      Motifs.map((motif: string) => (
                        <MenuItem key={motif} value={motif}>
                          {motif.toLowerCase().replace(/_/g, ' ')}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled value="">Aucune option disponible</MenuItem>
                    )}
                  </Select>
                </FormControl>

                <FormControl size="small" fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Type de Mastication</InputLabel>
                  <Select
                    name="typeMastication"
                    value={newPatient.typeMastication}
                    onChange={handleSelectChange}
                    label="Type de Mastication"
                    disabled={isLoading}
                  >
                    {Array.isArray(typeMastications) && typeMastications.length > 0 ? (
                      typeMastications.map((type: string) => (
                        <MenuItem key={type} value={type}>
                          {type.toLowerCase().replace(/_/g, ' ')}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled value="">Aucune option disponible</MenuItem>
                    )}
                  </Select>
                </FormControl>

                <FormControl size="small" fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Hygiène Bucco-Dentaire</InputLabel>
                  <Select
                    name="hygieneBuccoDentaire"
                    value={newPatient.hygieneBuccoDentaire}
                    onChange={handleSelectChange}
                    label="Hygiène Bucco-Dentaire"
                    disabled={isLoading}
                  >
                    {Array.isArray(hygienes) && hygienes.length > 0 ? (
                      hygienes.map((hygiene: string) => (
                        <MenuItem key={hygiene} value={hygiene}>
                          {hygiene.toLowerCase().replace(/_/g, ' ')}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled value="">Aucune option disponible</MenuItem>
                    )}
                  </Select>
                </FormControl>

                {userRole === 'ADMIN' && (
                  <FormControl size="small" fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Département</InputLabel>
                    <Select
                      name="State"
                      value={newPatient.state || 'PARODONTAIRE'}
                      onChange={handleSelectChange}
                      label="Département"
                      disabled={isLoading}
                    >
                      <MenuItem value="PARODONTAIRE">Parodontie</MenuItem>
                      <MenuItem value="ORTHODONTAIRE">Orthodontie</MenuItem>
                    </Select>
                  </FormControl>
                )}

                <TextField
                  size="small"
                  label="Anamnèse Générale"
                  name="anameseGenerale"
                  value={newPatient.anameseGenerale}
                  onChange={handleTextInputChange}
                  multiline
                  rows={2}
                  sx={{ mb: 2, width: '100%' }}
                  disabled={isLoading}
                />
                <TextField
                  size="small"
                  label="Anamnèse Familiale"
                  name="anamneseFamiliale"
                  value={newPatient.anamneseFamiliale}
                  onChange={handleTextInputChange}
                  multiline
                  rows={2}
                  sx={{ mb: 2, width: '100%' }}
                  disabled={isLoading}
                />
                <TextField
                  size="small"
                  label="Anamnèse Locale"
                  name="anamneseLocale"
                  value={newPatient.anamneseLocale}
                  onChange={handleTextInputChange}
                  multiline
                  rows={2}
                  sx={{ mb: 2, width: '100%' }}
                  disabled={isLoading}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={isLoading}>Annuler</Button>
            <Button type="submit" variant="contained" disabled={isLoading}>
              {isLoading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      
      {/* Toast notification for providing user feedback */}
      <Snackbar
        open={feedbackOpen}
        autoHideDuration={6000}
        onClose={handleCloseFeedback}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        sx={{
          '& .MuiPaper-root': {
            backgroundColor: 
              feedbackType === 'success' ? 'success.main' : 
              feedbackType === 'error' ? 'error.main' : 'info.main',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            pr: 1
          }
        }}
        message={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {feedbackType === 'success' && <CheckCircle size={20} />}
            {feedbackType === 'error' && <AlertCircle size={20} />}
            {feedbackType === 'info' && <AlertCircle size={20} />}
            {feedbackMessage}
          </Box>
        }
        action={
          <IconButton size="small" color="inherit" onClick={handleCloseFeedback}>
            <X size={18} />
          </IconButton>
        }
      />
    </Box>
  );
};

export default Patients;

