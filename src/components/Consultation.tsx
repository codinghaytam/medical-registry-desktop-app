import React, { useState, useEffect } from 'react';
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
  Alert,
  Tooltip,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Divider,
  Collapse,
  Snackbar
} from '@mui/material';
import { 
  Search, 
  Plus, 
  MoreVertical, 
  Trash2,
  User,
  Stethoscope,
  Calendar,
  Eye,
  Save,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react';
import { patientService, HygieneBuccoDentaire, MotifConsultation, TypeMastication } from '../services/patientService';
import { consultationService, ConsultationData, DiagnosisData } from '../services/consultationService';
import { getUserRole, canEdit, canOnlyView } from '../utiles/RoleAccess';
import RoleBasedAccess from '../utiles/RoleBasedAccess';
import { medecinService } from '../services/medecinService';

interface Diagnosis {
  id?: string;
  type: string;
  text: string;
  medecinId: string;
  Medecin?: {
    profession: string;
    user?: {
      name: string;
    }
  }
}

interface ConsultationState {
  id: string;
  date: string;
  idConsultation: string;
  patientId: string;
  medecinId: string;
  patient: {
    id: string;
    nom: string;
    prenom: string;
  };
  medecin: {
    id: string;
    profession: string;
    user: {
      name: string;
    }
  };
  diagnostiques: Diagnosis[];
}

// Define interfaces for form data
interface PatientFormData {
  nom: string;
  prenom: string;
  adresse: string;
  tel: string;
  numeroDeDossier: string;
  motifConsultation: MotifConsultation;
  anameseGenerale?: string;
  anamneseFamiliale?: string;
  anamneseLocale?: string;
  hygieneBuccoDentaire: HygieneBuccoDentaire;
  typeMastication: TypeMastication;
  antecedentsDentaires?: string;
}

interface IntegratedConsultationForm {
  // Consultation data
  date: string;
  idConsultation: string;
  medecinId: string;
  // Patient data
  patient: PatientFormData;
  // Optional diagnosis data
  diagnosis?: {
    type: string;
    text: string;
    medecinId: string;
  };
}

const Consultations: React.FC = () => {
  const [consultations, setConsultations] = useState<ConsultationState[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [hoveredText] = useState<string | null>(null);
  const [hoverPosition] = useState<{ x: number; y: number } | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDiagnosisDialog, setOpenDiagnosisDialog] = useState(false);
  const [newConsultation, setNewConsultation] = useState<ConsultationData>({
    date: '',
    patientId: '',
    medecinId: '',
    idConsultation: ''
  });
  const [newDiagnosis, setNewDiagnosis] = useState<DiagnosisData>({
    type: '',
    text: '',
    medecinId: ''
  });
  const [patients, setPatients] = useState<any[]>([]);
  const [medecins, setMedecins] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedConsultation, setSelectedConsultation] = useState<string | null>(null);
  const [diagnosisTypes] = useState<string[]>(['PARODONTAIRE', 'ORTHODONTAIRE']);
  // Get current user role
  const userRole = getUserRole();
  
  const [activeStep, setActiveStep] = useState(0);
  const [integratedForm, setIntegratedForm] = useState<IntegratedConsultationForm>({
    // Consultation data
    date: '',
    idConsultation: '',
    medecinId: '',
    // Patient data
    patient: {
      nom: '',
      prenom: '',
      adresse: '',
      tel: '',
      numeroDeDossier: '',
      motifConsultation: 'ESTHETIQUE',
      hygieneBuccoDentaire: 'MOYENNE',
      typeMastication: 'BILATERALE',
      anameseGenerale: '',
      anamneseFamiliale: '',
      anamneseLocale: '',
      antecedentsDentaires: ''
    },
    // Optional diagnosis
    diagnosis: {
      type: 'PARODONTAIRE',
      text: '',
      medecinId: ''
    }
  });
  const [includesDiagnosis, setIncludesDiagnosis] = useState(false);
  const [openIntegratedDialog, setOpenIntegratedDialog] = useState(false);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  // State for loading and error handling
  const [isLoading, setIsLoading] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);
  // Add delete confirmation dialog state
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [consultationToDelete, setConsultationToDelete] = useState<string | null>(null);
  
  // Type for feedback notification styling
  type FeedbackType = 'success' | 'error' | 'info';
  
  // State for feedback notifications
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('success');
  
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
  
  // Function to fetch all necessary data
  const fetchData = async () => {
    setIsLoading(true);
    setNetworkError(null);
    try {
      const [patientsData, medecinsData, consultationsData] = await Promise.all([
        patientService.getAll(),
        medecinService.getAll(),
        consultationService.getAll()
      ]);
      
      setPatients(patientsData);
      setMedecins(medecinsData);
      
      // Make sure consultationsData is actually an array
      let consultationsArray = Array.isArray(consultationsData) ? consultationsData : [];
      
      // If user is MEDECIN, filter consultations to only show their own
      if (userRole === 'MEDECIN') {
        // Get current user ID from sessionStorage
        const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
        // The user object in session storage contains the Medecin profile.
        // The root 'id' is overwritten by the Medecin ID due to the backend merge strategy.
        // We prioritize userData.id (MedecinID) over userData.user.id (UserID)
        const medecinId = userData.id || userData.user?.id;

        if (medecinId) {
          consultationsArray = consultationsArray.filter(
            consultation => consultation.medecinId === medecinId
          );
        } else {
          // If we can't identify the doctor profile, show nothing for safety
          consultationsArray = [];
        }
      }
      
      // Ensure each consultation has the correct structure
      setConsultations(consultationsArray);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setNetworkError(error.message || 'Échec du chargement des consultations. Veuillez réessayer.');
      // Still set empty arrays instead of failing completely
      setPatients([]);
      setMedecins([]);
      setConsultations([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Set up auto-refresh for consultations list every 5 minutes
  useInterval(() => {
    fetchData();
  }, 300000); // 5 minutes in milliseconds
  
  useEffect(() => {
    fetchData();
  }, [userRole]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>, consultationId: string) => {
    setSelectedConsultation(consultationId);
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };


  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewConsultation({
      date: '',
      patientId: '',
      medecinId: '',
      idConsultation: ''
    });
  };

  const handleInputChange = (
    event: SelectChangeEvent<string> | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const name = event.target.name as keyof ConsultationData;
    const value = event.target.value;
    setNewConsultation(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // If user is MEDECIN, force the medecinId to be the current user's ID
    if (userRole === 'MEDECIN') {
      const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
      const currentUserId = userData.user?.id || userData.id;
      
      const currentMedecin = medecins.find((m: any) => m.userId === currentUserId);
      
      if (currentMedecin?.id) {
        newConsultation.medecinId = currentMedecin.id;
      }
    }
    
    try {
      await consultationService.create(newConsultation);
      showFeedback('Consultation créée avec succès');
      handleCloseDialog();
      
      // Refresh the consultations list
      try {
        const updatedConsultations = await consultationService.getAll();
        
        // If user is MEDECIN, filter consultations again
        if (userRole === 'MEDECIN') {
          const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
          const currentUserId = userData.user?.id || userData.id;
          const currentMedecin = medecins.find((m: any) => m.userId === currentUserId);
          const medecinId = currentMedecin?.id;
          
          if (medecinId) {
            const filteredConsultations = updatedConsultations.filter(
              (consultation: ConsultationState) => consultation.medecinId === medecinId
            );
            setConsultations(filteredConsultations);
          } else {
            setConsultations(updatedConsultations);
          }
        } else {
          setConsultations(updatedConsultations);
        }
      } catch (refreshError) {
        console.error('Error refreshing data:', refreshError);
        // Don't block the UX flow on refresh errors
        showFeedback('Consultation créée, mais impossible de rafraîchir la liste', 'info');
      }
    } catch (error: any) {
      console.error('Error creating consultation:', error);
      const errorMessage = error.message || 'Échec de la création de la consultation. Veuillez réessayer.';
      showFeedback(errorMessage, 'error');
    }
  };

  // Show delete confirmation dialog
  const handleConfirmDelete = (id: string) => {
    setConsultationToDelete(id);
    setOpenDeleteDialog(true);
    handleMenuClose();
  };

  // Close delete confirmation dialog
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setConsultationToDelete(null);
  };

  // Proceed with delete after confirmation
  const handleConfirmedDelete = async () => {
    if (!consultationToDelete) return;
    
    setIsLoading(true);
    try {
      await consultationService.delete(consultationToDelete);
      // Refresh the consultations list
      const updatedConsultations = await consultationService.getAll();
      setConsultations(updatedConsultations);
    } catch (error) {
      console.error('Error deleting consultation:', error);
      setNetworkError("Échec de la suppression de la consultation. Veuillez réessayer plus tard.");
    } finally {
      setIsLoading(false);
      setOpenDeleteDialog(false);
      setConsultationToDelete(null);
    }
  };

  // Replace the existing handleDelete function with the confirm dialog
  const handleDelete = async (id: string) => {
    // Only ADMIN or MEDECIN (for their own consultations) can delete
    if (!canEdit()) {
      handleMenuClose();
      return;
    }
    
    handleConfirmDelete(id);
  };

  // Handle diagnosis form dialog
  const handleOpenDiagnosisDialog = (consultationId: string) => {
    setSelectedConsultation(consultationId);
    setOpenDiagnosisDialog(true);
  };

  const handleCloseDiagnosisDialog = () => {
    setOpenDiagnosisDialog(false);
    setNewDiagnosis({
      type: '',
      text: '',
      medecinId: ''
    });
  };

  const handleDiagnosisInputChange = (
    event: SelectChangeEvent<string> | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const name = event.target.name as keyof DiagnosisData;
    const value = event.target.value;
    setNewDiagnosis(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDiagnosisSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // If user is MEDECIN, force the medecinId to be the current user's ID
    if (userRole === 'MEDECIN') {
      const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
      const currentUserId = userData.user?.id || userData.id;
      const currentMedecin = medecins.find((m: any) => m.userId === currentUserId);
      if (currentMedecin?.id) {
        newDiagnosis.medecinId = currentMedecin.id;
      }
    }
    
    try {
      if (selectedConsultation) {
        await consultationService.addDiagnosis(selectedConsultation, newDiagnosis);
        showFeedback('Diagnostic ajouté avec succès');
        handleCloseDiagnosisDialog();
        
        // Refresh the consultations list
        try {
          const updatedConsultations = await consultationService.getAll();
          
          // Filter if needed
          if (userRole === 'MEDECIN') {
            const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
            const currentUserId = userData.user?.id || userData.id;
            const currentMedecin = medecins.find((m: any) => m.userId === currentUserId);
            const medecinId = currentMedecin?.id;
            
            if (medecinId) {
              const filteredConsultations = updatedConsultations.filter(
                (consultation: ConsultationState) => consultation.medecinId === medecinId
              );
              setConsultations(filteredConsultations);
            } else {
              setConsultations(updatedConsultations);
            }
          } else {
            setConsultations(updatedConsultations);
          }
        } catch (refreshError) {
          console.error('Error refreshing data:', refreshError);
          showFeedback('Diagnostic ajouté, mais impossible de rafraîchir la liste', 'info');
        }
      }
    } catch (error: any) {
      console.error('Error adding diagnosis:', error);
      const errorMessage = error.message || 'Échec de l\'ajout du diagnostic. Veuillez réessayer.';
      showFeedback(errorMessage, 'error');
    } finally {
    }
  };

  // Handle integrated form
  const handleOpenIntegratedDialog = () => {
    // Set default medecin if user is a medecin
    if (userRole === 'MEDECIN') {
      const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
      const currentUserId = userData.user?.id || userData.id;
      const currentMedecin = medecins.find((m: any) => m.userId === currentUserId);
      const medecinId = currentMedecin?.id;

      if (medecinId) {
        setIntegratedForm(prev => ({
          ...prev,
          medecinId: medecinId,
          // Auto generate consultation ID (timestamp based)
          idConsultation: `CONS-${Date.now()}`,
          diagnosis: {
            ...prev.diagnosis!,
            medecinId: medecinId
          }
        }));
      }
    } else {
      // For non-MEDECIN users, still auto-generate ID
      setIntegratedForm(prev => ({
        ...prev,
        idConsultation: `CONS-${Date.now()}`
      }));
    }
    setOpenIntegratedDialog(true);
  };

  const handleCloseIntegratedDialog = () => {
    setOpenIntegratedDialog(false);
    setActiveStep(0);
    setIntegratedForm({
      date: '',
      idConsultation: '',
      medecinId: '',
      patient: {
        nom: '',
        prenom: '',
        adresse: '',
        tel: '',
        numeroDeDossier: '',
        motifConsultation: 'ESTHETIQUE',
        hygieneBuccoDentaire: 'MOYENNE',
        typeMastication: 'BILATERALE',
        anameseGenerale: '',
        anamneseFamiliale: '',
        anamneseLocale: '',
        antecedentsDentaires: ''
      },
      diagnosis: {
        type: 'PARODONTAIRE',
        text: '',
        medecinId: ''
      }
    });
    setIncludesDiagnosis(false);
  };

  const handleIntegratedInputChange = (
    event: SelectChangeEvent<string> | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    section: 'consultation' | 'patient' | 'diagnosis'
  ) => {
    const { name, value } = event.target;
    
    if (section === 'consultation') {
      setIntegratedForm(prev => ({
        ...prev,
        [name]: value
      }));
    } else if (section === 'patient') {
      setIntegratedForm(prev => ({
        ...prev,
        patient: {
          ...prev.patient,
          [name]: value
        }
      }));
    } else if (section === 'diagnosis') {
      setIntegratedForm(prev => ({
        ...prev,
        diagnosis: {
          ...prev.diagnosis!,
          [name]: value
        }
      }));
    }
  };

  const handleNextStep = () => {
    setActiveStep(prevActiveStep => prevActiveStep + 1);
  };

  const handleBackStep = () => {
    setActiveStep(prevActiveStep => prevActiveStep - 1);
  };

  const handleIntegratedSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // If user is MEDECIN, force the medecinId to be the current user's ID
    if (userRole === 'MEDECIN') {
      const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
      const currentUserId = userData.user?.id || userData.id;
      const currentMedecin = medecins.find((m: any) => m.userId === currentUserId);
      
      if (currentMedecin?.id) {
        integratedForm.medecinId = currentMedecin.id;
        if (includesDiagnosis && integratedForm.diagnosis) {
          integratedForm.diagnosis.medecinId = currentMedecin.id;
        }
      }
    }
    
    try {
      // 1. Create consultation with patient data
      const consultationData: ConsultationData & { patient: PatientFormData } = {
        date: integratedForm.date,
        idConsultation: integratedForm.idConsultation,
        medecinId: integratedForm.medecinId,
        patientId: '', // This will be ignored as we're creating a patient inline
        patient: integratedForm.patient
      };
      
      // Create consultation with new patient
      const newConsultation = await consultationService.create(consultationData as any);
      
      // 2. If including diagnosis, add it to the new consultation
      if (includesDiagnosis && integratedForm.diagnosis && newConsultation.id) {
        await consultationService.addDiagnosis(
          newConsultation.id, 
          integratedForm.diagnosis
        );
      }
      
      showFeedback('Patient et consultation créés avec succès');
      handleCloseIntegratedDialog();
      
      // 3. Refresh the consultations list
      try {
        const updatedConsultations = await consultationService.getAll();
        
        // Filter if needed for MEDECIN users
        if (userRole === 'MEDECIN') {
          const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
          const currentUserId = userData.user?.id || userData.id;
          const currentMedecin = medecins.find((m: any) => m.userId === currentUserId);
          const medecinId = currentMedecin?.id;
          
          if (medecinId) {
            const filteredConsultations = updatedConsultations.filter(
              (consultation: ConsultationState) => consultation.medecinId === medecinId
            );
            setConsultations(filteredConsultations);
          } else {
            setConsultations(updatedConsultations);
          }
        } else {
          setConsultations(updatedConsultations);
        }
      } catch (refreshError) {
        console.error('Error refreshing data:', refreshError);
        showFeedback('Données créées avec succès, mais impossible de rafraîchir la liste', 'info');
      }
    } catch (error: any) {
      console.error('Error creating consultation with patient:', error);
      const errorMessage = error.message || 'Échec de la création de la consultation avec le patient. Veuillez réessayer.';
      showFeedback(errorMessage, 'error');
    } finally {
    }
  };

  const filteredConsultations = React.useMemo(() => {
    if (!Array.isArray(consultations)) return [];
    return consultations.filter(consultation => 
      (consultation.patient?.nom?.toLowerCase().includes(searchQuery?.toLowerCase() || '') ||
       consultation.patient?.prenom?.toLowerCase().includes(searchQuery?.toLowerCase() || '') ||
       new Date(consultation.date).toLocaleDateString().includes(searchQuery?.toLowerCase() || ''))
    );
  }, [consultations, searchQuery]);

  const handleRowClick = (consultationId: string) => {
    setExpandedRows(prevExpandedRows =>
      prevExpandedRows.includes(consultationId)
        ? prevExpandedRows.filter(id => id !== consultationId)
        : [...prevExpandedRows, consultationId]
    );
  };

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
            Rafraîchir
          </Button>
        </Box>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
         Consultations
        </Typography>
        
        {/* Only ADMIN and MEDECIN can add new consultations */}
        <RoleBasedAccess requiredRoles={['ADMIN', 'MEDECIN']}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="contained" 
              startIcon={<User size={18} />}
              sx={{ borderRadius: 2 }}
              onClick={handleOpenIntegratedDialog}
              disabled={isLoading}
            >
              Nouveau patient et consultation
            </Button>
          </Box>
        </RoleBasedAccess>
      </Box>

      {/* Role-specific message banner */}
      {userRole === 'ETUDIANT' && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Vous avez un accès en lecture seule aux consultations.
        </Alert>
      )}
      {userRole === 'MEDECIN' && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Vous pouvez consulter, créer et modifier uniquement vos propres consultations.
        </Alert>
      )}

      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <TextField
            placeholder="Rechercher des consultations..."
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
            {/* Refresh button for all users */}
            <Tooltip title="Rafraîchir les données">

              <Button 
              variant="outlined" 
              size="small"
              startIcon={<RefreshCw size={16} />}
              onClick={fetchData}
              disabled={isLoading}
            >
              Rafraîchir
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
                <TableCell>Date</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Médecin de Cs initiale</TableCell>
                <TableCell align="right">Actions</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && filteredConsultations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Chargement des consultations...
                  </TableCell>
                </TableRow>
              ) : filteredConsultations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body1" sx={{ py: 2 }}>
                      {networkError ? "Impossible de charger les consultations à cause d'une erreur réseau" : "Aucune consultation trouvée"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredConsultations
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((consultation) => (
                  <React.Fragment key={consultation.id}>
                    <TableRow
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Calendar size={14} style={{ marginRight: 8 }} />
                          <Typography variant="body2">{new Date(consultation.date).toLocaleDateString()}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <User size={14} style={{ marginRight: 8 }}></User>
                          <Typography variant="body2">
                            {consultation.patient?.nom} {consultation.patient?.prenom}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Stethoscope size={14} style={{ marginRight: 8 }}/>
                          <Typography variant="body2">
                            {consultation.medecin.user.name 
                              ? `${consultation.medecin.user.name} (${consultation.medecin.profession === 'PARODONTAIRE' ? 'Paro' : 'Ortho'})`
                              : (consultation.medecin?.user?.name || 'Inconnu')}
                          </Typography>
                        </Box>
                      </TableCell>
                      
                      <TableCell align="right">
                        {/* Different action buttons based on role */}
                        {canOnlyView() ? (
                          <Tooltip title="Voir les détails">
                            <IconButton size="small">
                              <Eye size={18} />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <>
                            <Tooltip title="Ajouter un diagnostic">
                              <IconButton
                                size="small" 
                                onClick={() => handleOpenDiagnosisDialog(consultation.id)}
                                disabled={userRole === 'MEDECIN' && (() => {
                                  const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
                                  const currentUserId = userData.user?.id || userData.id;
                                  const currentMedecin = medecins.find((m: any) => m.userId === currentUserId);
                                  return consultation.medecinId !== currentMedecin?.id;
                                })()}
                                sx={{ mr: 1 }}
                              >
                                <Plus size={18} />
                              </IconButton>
                            </Tooltip>
                            <IconButton 
                              size="small" 
                              onClick={(event) => handleMenuClick(event, consultation.id)}
                              // For MEDECIN, only allow actions on their own consultations
                              disabled={userRole === 'MEDECIN' && (() => {
                                const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
                                const currentUserId = userData.user?.id || userData.id;
                                const currentMedecin = medecins.find((m: any) => m.userId === currentUserId);
                                return consultation.medecinId !== currentMedecin?.id;
                              })()}
                            >
                              <MoreVertical size={18} />
                            </IconButton>
                          </>
                        )}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleRowClick(consultation.id)}
                        >
                          {expandedRows.includes(consultation.id) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={7} style={{ paddingBottom: 0, paddingTop: 0 }}>
                        <Collapse in={expandedRows.includes(consultation.id)} timeout="auto" unmountOnExit>
                          <Box margin={1}>
                            {consultation.diagnostiques && consultation.diagnostiques.map((diagnosis, index) => (
                              <Typography key={index} variant="body2" paragraph>
                                <strong>{diagnosis.type === 'PARODONTAIRE' ? 'Parodontal' : (diagnosis.type === 'ORTHODONTAIRE' ? 'Orthodontique' : diagnosis.type)}:</strong> {diagnosis.text}
                                {diagnosis.Medecin && (
                                  <Box component="span" sx={{ ml: 1, color: 'text.secondary', fontSize: '0.9em' }}>
                                    (Dr. {diagnosis.Medecin.user
                                      ? `${diagnosis.Medecin.user.name}`
                                      : (diagnosis.medecinId)})
                                  </Box>
                                )}
                              </Typography>
                            ))}
                            {(!consultation.diagnostiques || consultation.diagnostiques.length === 0) && (
                              <Typography variant="body2" color="text.secondary">
                                Aucun diagnostic
                              </Typography>
                            )}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                )))}
            </TableBody>
            </Table>  
          </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={consultations.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>

      {/* Only ADMIN or MEDECIN (for their own) can see the action menu */}
      <RoleBasedAccess requiredRoles={['ADMIN', 'MEDECIN']}>
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
          
          <MenuItem onClick={() => handleDelete(selectedConsultation!)} sx={{ color: 'error.main' }}>
            <Trash2 size={16} style={{ marginRight: 8 }} />
            Supprimer
          </MenuItem>
        </Menu>
      </RoleBasedAccess>

      {hoveredText && hoverPosition && (
        <Box
          sx={{
            position: 'fixed',
            top: hoverPosition.y + 10,
            left: hoverPosition.x + 10,
            backgroundColor: 'white',
            border: '1px solid rgba(0, 0, 0, 0.2)',
            borderRadius: 2,
            boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
            padding: 1,
            zIndex: 1000,
            maxWidth: 300,
            wordWrap: 'break-word',
          }}
        >
          <Typography variant="body2">{hoveredText}</Typography>
        </Box>
      )}

      {/* Only ADMIN or MEDECIN can add/edit consultations */}
      <RoleBasedAccess requiredRoles={['ADMIN', 'MEDECIN']}>
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Mettre à jour la consultation</DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <TextField
                fullWidth
                label="Date"
                name="date"
                type="date"
                value={newConsultation.date}
                onChange={handleInputChange}
                required
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
              />
              {/* Consultation ID is auto-generated and hidden from the user */}
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Patient</InputLabel>
                <Select
                  label="Patient"
                  name="patientId"
                  value={newConsultation.patientId}
                  onChange={handleInputChange}
                  required
                >
                  {Array.isArray(patients) && patients.map((patient) => (
                    <MenuItem key={patient.id} value={patient.id}>
                      {patient.nom} {patient.prenom}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              {/* Only ADMIN can choose medecin, MEDECIN is restricted to their own ID */}
              <RoleBasedAccess 
                requiredRoles="ADMIN"
                fallback={
                  <Alert severity="info" sx={{ mb: 2 }}>
                    En tant que médecin, vous serez automatiquement assigné comme consultant.
                  </Alert>
                }
              >
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Médecin</InputLabel>
                  <Select
                    label="Médecin"
                    name="medecinId"
                    value={newConsultation.medecinId}
                    onChange={handleInputChange}
                    required
                  >
                    {Array.isArray(medecins) && medecins.map((medecin) => (
                      <MenuItem key={medecin.id} value={medecin.id}>
                        {medecin.user?.name}- {(medecin.profession== 'PARODONTAIRE')?'Parodontie':'Orthodontie'}

                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </RoleBasedAccess>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Annuler</Button>
              <Button type="submit" variant="contained">Enregistrer</Button>
            </DialogActions>
          </form>
        </Dialog>
        
        {/* Diagnosis Dialog */}
        <Dialog open={openDiagnosisDialog} onClose={handleCloseDiagnosisDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Ajouter un diagnostic</DialogTitle>
          <form onSubmit={handleDiagnosisSubmit}>
            <DialogContent>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Type</InputLabel>
                <Select
                  label="Type"
                  name="type"
                  value={newDiagnosis.type}
                  onChange={handleDiagnosisInputChange}
                  required
                >
                  {diagnosisTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type === 'PARODONTAIRE' ? 'Parodontal' : (type === 'ORTHODONTAIRE' ? 'Orthodontique' : type)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                label="Texte du diagnostic"
                name="text"
                value={newDiagnosis.text}
                onChange={handleDiagnosisInputChange}
                multiline
                rows={4}
                required
                sx={{ mb: 2 }}
              />
              
              {/* Only ADMIN can choose medecin, MEDECIN is restricted to their own ID */}
              <RoleBasedAccess 
                requiredRoles="ADMIN"
                fallback={
                  <Alert severity="info" sx={{ mb: 2 }}>
                    En tant que médecin, vous serez automatiquement assigné comme diagnosticien.
                  </Alert>
                }
              >
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Médecin</InputLabel>
                  <Select
                    label="Médecin"
                    name="medecinId"
                    value={newDiagnosis.medecinId}
                    onChange={handleDiagnosisInputChange}
                    required
                  >
                    {Array.isArray(medecins) && medecins.map((medecin) => (
                      <MenuItem key={medecin.id} value={medecin.id}>
                        {medecin.user?.name} - {(medecin.profession == 'PARODONTAIRE') ? 'Parodontie' : 'Orthodontie'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </RoleBasedAccess>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDiagnosisDialog}>Annuler</Button>
              <Button type="submit" variant="contained">Enregistrer</Button>
            </DialogActions>
          </form>
        </Dialog>
      </RoleBasedAccess>

      <RoleBasedAccess requiredRoles={['ADMIN', 'MEDECIN']}>
        {/* Integrated Patient + Consultation + Diagnosis Form Dialog */}
        <Dialog open={openIntegratedDialog} onClose={handleCloseIntegratedDialog} maxWidth="md" fullWidth>
          <DialogTitle>   
            Créer un nouveau patient et une consultation
            <Typography variant="body2" color="text.secondary">
              Complétez toutes les étapes pour créer un dossier patient avec consultation
            </Typography>
          </DialogTitle>
          
          <form onSubmit={handleIntegratedSubmit}>
            <DialogContent>
              <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                <Step>
                  <StepLabel>Informations du patient</StepLabel>
                </Step>
                <Step>
                  <StepLabel>Détails de la consultation</StepLabel>
                </Step>
                <Step>
                  <StepLabel>Diagnostic (optionnel)</StepLabel>
                </Step>
              </Stepper>
              
              {/* Step 1: Patient Information */}
              {activeStep === 0 && (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>Informations de base du patient</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Nom"
                      name="nom"
                      value={integratedForm.patient.nom}
                      onChange={(e) => handleIntegratedInputChange(e, 'patient')}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Prénom"
                      name="prenom"
                      value={integratedForm.patient.prenom}
                      onChange={(e) => handleIntegratedInputChange(e, 'patient')}
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Adresse"
                      name="adresse"
                      value={integratedForm.patient.adresse}
                      onChange={(e) => handleIntegratedInputChange(e, 'patient')}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Téléphone"
                      name="tel"
                      value={integratedForm.patient.tel}
                      onChange={(e) => handleIntegratedInputChange(e, 'patient')}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Numéro de dossier"
                      name="numeroDeDossier"
                      value={integratedForm.patient.numeroDeDossier}
                      onChange={(e) => handleIntegratedInputChange(e, 'patient')}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>Informations cliniques</Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Motif de consultation</InputLabel>
                      <Select
                        label="Motif de consultation"
                        name="motifConsultation"
                        value={integratedForm.patient.motifConsultation}
                        onChange={(e) => handleIntegratedInputChange(e, 'patient')}
                        required
                      >
                        <MenuItem value="ESTHETIQUE">Esthétique</MenuItem>
                        <MenuItem value="FONCTIONNELLE">Fonctionnelle</MenuItem>
                        <MenuItem value="ADRESSE_PAR_CONFRERE">Adressé par confrère</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Hygiène bucco-dentaire</InputLabel>
                      <Select
                        label="Hygiène bucco-dentaire"
                        name="hygieneBuccoDentaire"
                        value={integratedForm.patient.hygieneBuccoDentaire}
                        onChange={(e) => handleIntegratedInputChange(e, 'patient')}
                        required
                      >
                        <MenuItem value="BONNE">Bonne</MenuItem>
                        <MenuItem value="MOYENNE">Moyenne</MenuItem>
                        <MenuItem value="MAUVAISE">Mauvaise</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Type de mastication</InputLabel>
                      <Select
                        label="Type de mastication"
                        name="typeMastication"
                        value={integratedForm.patient.typeMastication}
                        onChange={(e) => handleIntegratedInputChange(e, 'patient')}
                        required
                      >
                        <MenuItem value="UNILATERALE_ALTERNEE">Unilatérale alternée</MenuItem>
                        <MenuItem value="UNILATERALE_STRICTE">Unilatérale stricte</MenuItem>
                        <MenuItem value="BILATERALE">Bilatérale</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Anamnèse générale"
                      name="anameseGenerale"
                      value={integratedForm.patient.anameseGenerale || ''}
                      onChange={(e) => handleIntegratedInputChange(e, 'patient')}
                      multiline
                      rows={2}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Anamnèse familiale"
                      name="anamneseFamiliale"
                      value={integratedForm.patient.anamneseFamiliale || ''}
                      onChange={(e) => handleIntegratedInputChange(e, 'patient')}
                      multiline
                      rows={2}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Anamnèse locale"
                      name="anamneseLocale"
                      value={integratedForm.patient.anamneseLocale || ''}
                      onChange={(e) => handleIntegratedInputChange(e, 'patient')}
                      multiline
                      rows={2}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Antécédents dentaires"
                      name="antecedentsDentaires"
                      value={integratedForm.patient.antecedentsDentaires || ''}
                      onChange={(e) => handleIntegratedInputChange(e, 'patient')}
                      multiline
                      rows={2}
                    />
                  </Grid>
                </Grid>
              )}
              
              {/* Step 2: Consultation Details */}
              {activeStep === 1 && (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>Informations sur la consultation</Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Date"
                      name="date"
                      type="date"
                      value={integratedForm.date}
                      onChange={(e) => handleIntegratedInputChange(e, 'consultation')}
                      required
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  
                  {/* Consultation ID is auto-generated and hidden from the user */}
                  
                  {/* Only ADMIN can choose medecin, MEDECIN is restricted to their own ID */}
                  <Grid item xs={12} sx={{ mt: 2 }}>
                    <RoleBasedAccess 
                      requiredRoles="ADMIN"
                      fallback={
                        <Alert severity="info">
                          En tant que médecin, vous serez automatiquement assigné comme consultant.
                        </Alert>
                      }
                    >
                      <FormControl fullWidth>
                        <InputLabel>Médecin</InputLabel>
                        <Select
                          label="Médecin"
                          name="medecinId"
                          value={integratedForm.medecinId}
                          onChange={(e) => handleIntegratedInputChange(e, 'consultation')}
                          required
                        >
                          {Array.isArray(medecins) && medecins.map((medecin) => (
                            <MenuItem key={medecin.id} value={medecin.id}>
                              {medecin.user?.name} - {(medecin.profession === 'PARODONTAIRE') ? 'Parodontie' : 'Orthodontie'}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </RoleBasedAccess>
                  </Grid>
                </Grid>
              )}
              
              {/* Step 3: Diagnosis (Optional) */}
              {activeStep === 2 && (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">Informations sur le diagnostic</Typography>
                      <FormControl component="fieldset">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ mr: 1 }}>Inclure un diagnostic</Typography>
                          <Button
                            variant={includesDiagnosis ? "contained" : "outlined"}
                            size="small"
                            onClick={() => setIncludesDiagnosis(!includesDiagnosis)}
                          >
                            {includesDiagnosis ? "Oui" : "Non"}
                          </Button>
                        </Box>
                      </FormControl>
                    </Box>
                  </Grid>
                  
                  {includesDiagnosis && (
                    <>
                      <Grid item xs={12}>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                          <InputLabel>Type</InputLabel>
                          <Select
                            label="Type"
                            name="type"
                            value={integratedForm.diagnosis?.type || ''}
                            onChange={(e) => handleIntegratedInputChange(e, 'diagnosis')}
                            required={includesDiagnosis}
                          >
                            {diagnosisTypes.map((type) => (
                              <MenuItem key={type} value={type}>
                                {type === 'PARODONTAIRE' ? 'Parodontal' : (type === 'ORTHODONTAIRE' ? 'Orthodontique' : type)}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Texte du diagnostic"
                          name="text"
                          value={integratedForm.diagnosis?.text || ''}
                          onChange={(e) => handleIntegratedInputChange(e, 'diagnosis')}
                          multiline
                          rows={4}
                          required={includesDiagnosis}
                          sx={{ mb: 2 }}
                        />
                      </Grid>
                      
                      {/* Only ADMIN can choose medecin, MEDECIN is restricted to their own ID */}
                      <Grid item xs={12}>
                        <RoleBasedAccess 
                          requiredRoles="ADMIN"
                          fallback={
                            <Alert severity="info">
                              En tant que médecin, vous serez automatiquement assigné comme diagnosticien.
                            </Alert>
                          }
                        >
                          <FormControl fullWidth>
                            <InputLabel>Médecin</InputLabel>
                            <Select
                              label="Médecin"
                              name="medecinId"
                              value={integratedForm.diagnosis?.medecinId || ''}
                              onChange={(e) => handleIntegratedInputChange(e, 'diagnosis')}
                              required={includesDiagnosis}
                            >
                              {Array.isArray(medecins) && medecins.map((medecin) => (
                                <MenuItem key={medecin.id} value={medecin.id}>
                                  {medecin.user?.name} - {(medecin.profession === 'PARODONTAIRE') ? 'Parodontie' : 'Orthodontie'}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </RoleBasedAccess>
                      </Grid>
                    </>
                  )}
                  
                  {!includesDiagnosis && (
                    <Grid item xs={12}>
                      <Alert severity="info" sx={{ mt: 2 }}>
                        Vous pourrez ajouter un diagnostic ultérieurement en cliquant sur le bouton "+" dans la colonne actions.
                      </Alert>
                    </Grid>
                  )}
                </Grid>
              )}
            </DialogContent>
            
            <DialogActions>
              <Button onClick={handleCloseIntegratedDialog}>Annuler</Button>
              {activeStep > 0 && (
                <Button onClick={handleBackStep}>Retour</Button>
              )}
              {activeStep < 2 && (
                <Button variant="contained" onClick={handleNextStep}>Suivant</Button>
              )}
              {activeStep === 2 && (
                <Button type="submit" variant="contained" startIcon={<Save size={18} />}>
                  Enregistrer le patient et la consultation
                </Button>
              )}
            </DialogActions>
          </form>
        </Dialog>
      </RoleBasedAccess>
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
            Êtes-vous sûr de vouloir supprimer cette consultation ? Cette action est irréversible.
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
      {/* Feedback Snackbar */}
      <Snackbar
        open={feedbackOpen}
        autoHideDuration={6000}
        onClose={handleCloseFeedback}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseFeedback} 
          severity={feedbackType} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {feedbackMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Consultations;

