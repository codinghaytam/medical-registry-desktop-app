import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Chip,
  Grid,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import {
  ArrowLeft,
  Calendar,
  FileText,
  User,
  Edit,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { patientService, PatientData } from '../services/patientService';
import { consultationService } from '../services/consultationService';
import { seanceService } from '../services/seanceService';
import { authService } from '../services/authService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`patient-tabpanel-${index}`}
      aria-labelledby={`patient-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `patient-tab-${index}`,
    'aria-controls': `patient-tabpanel-${index}`,
  };
}

const PatientDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [seances, setSeances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editPatientData, setEditPatientData] = useState<PatientData | null>(null);
  const [motifs, setMotifs] = useState<string[]>([]);
  const [typeMastications, setTypeMastications] = useState<string[]>([]);
  const [hygienes, setHygienes] = useState<string[]>([]);
  const [seanceTypes] = useState<string[]>([]);
  const [isConsultationDialogOpen, setIsConsultationDialogOpen] = useState(false);
  const [newConsultation, setNewConsultation] = useState({
    date: '',
    idConsultation: '',
    patientId: '',
    medecinId: ''
  });
  const [isSeanceDialogOpen, setIsSeanceDialogOpen] = useState(false);
  const [newSeance, setNewSeance] = useState({
    type: '',
    id: '',
    date: new Date().toISOString().split('T')[0],
    patientId: '',
    medecinId: ''
  });
  const [medecins, setMedecins] = useState<any[]>([]);
  const [filteredSeanceTypes, setFilteredSeanceTypes] = useState<string[]>([]);

  useEffect(() => {
    const fetchPatientData = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch patient details
        const patientData = await patientService.getById(id);
        setPatient(patientData);
        
        // Fetch patient's consultations
        const consultationsData = await consultationService.getAll().then(consultations => 
          consultations.filter((consultation: any) => consultation.patientId === id)
        );
        setConsultations(consultationsData);
        
        // Fetch patient's seances
        const seancesData = await seanceService.getByPatientId(id);
        setSeances(seancesData);
      } catch (err) {
        console.error('Error fetching patient data:', err);
        setError('Failed to load patient information. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPatientData();
  }, [id]);

  useEffect(() => {
    // Fetch enumeration values for dropdowns
    const fetchEnums = async () => {
      try {        const token = authService.getToken()?.access_token;
        const headers = { "Authorization": `Bearer ${token}` };
        
        const [motifsResponse, masticationsResponse, hygienesResponse] = await Promise.all([
          fetch('https://walrus-app-j9qyk.ondigitalocean.app/enum/motif-consultation', { headers }).then(res => res.json()),
          fetch('https://walrus-app-j9qyk.ondigitalocean.app/enum/type-mastication', { headers }).then(res => res.json()),
          fetch('https://walrus-app-j9qyk.ondigitalocean.app/enum/hygiene-bucco-dentaire', { headers }).then(res => res.json()),
        ]);
        
        setMotifs(motifsResponse);
        setTypeMastications(masticationsResponse);
        setHygienes(hygienesResponse);
      } catch (error) {
        console.error('Error fetching enum values:', error);
      }
    };
    
    fetchEnums();
  }, []);

  useEffect(() => {    // Additional effect to fetch médecins for the consultation and séance creation forms
    const fetchMedecins = async () => {
      try {
        const token = authService.getToken()?.access_token;
        const response = await fetch('https://walrus-app-j9qyk.ondigitalocean.app/medecin', {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        const medecinsData = await response.json();
        setMedecins(medecinsData);
      } catch (error) {
        console.error('Error fetching médecins:', error);
      }
    };
    
    fetchMedecins();
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleGoBack = () => {
    navigate('/patients');
  };

  

  const handleEditDialogClose = () => {
    setIsEditDialogOpen(false);
  };

  const handleEditInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setEditPatientData(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleEditSelectChange = (event: SelectChangeEvent) => {
    const { name, value } = event.target;
    setEditPatientData(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleSavePatient = async () => {
    if (!editPatientData || !id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await patientService.update(id, editPatientData);
      setPatient(editPatientData);
      setIsEditDialogOpen(false);
    } catch (err) {
      console.error('Error updating patient:', err);
      setError('Failed to update patient. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConsultationDialogOpen = () => {
    // Generate a consultation ID and pre-fill the patient ID when opening dialog
    setNewConsultation({
      date: new Date().toISOString().split('T')[0],
      idConsultation: `CONS-${Date.now()}`,
      patientId: id || '',
      medecinId: ''
    });
    setIsConsultationDialogOpen(true);
  };

  const handleConsultationDialogClose = () => {
    setIsConsultationDialogOpen(false);
  };

  const handleConsultationInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setNewConsultation(prev => ({ ...prev, [name]: value }));
  };

  const handleConsultationSelectChange = (event: SelectChangeEvent) => {
    const { name, value } = event.target;
    setNewConsultation(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateConsultation = async () => {
    try {
      setLoading(true);
      
      // Check if we're updating or creating
      if (newConsultation.idConsultation) {
        // Update existing consultation
        await consultationService.update(newConsultation.idConsultation.toString(), newConsultation);
      } else {
        // Create new consultation
        await consultationService.create(newConsultation);
      }
      
      // Refresh consultations list
      const consultationsData = await consultationService.getByPatientId(id || '');
      setConsultations(consultationsData);
      
      // Close dialog
      setIsConsultationDialogOpen(false);
    } catch (err) {
      console.error('Error saving consultation:', err);
      setError('Failed to save consultation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSeanceDialogOpen = () => {
    // Pre-fill the patient ID when opening dialog
    setNewSeance({
      type: '',
      id: '',
      date: new Date().toISOString().split('T')[0],
      patientId: id || '',
      medecinId: ''
    });
    setIsSeanceDialogOpen(true);
  };

  const handleSeanceDialogClose = () => {
    setIsSeanceDialogOpen(false);
  };

  const handleSeanceInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setNewSeance(prev => ({ ...prev, [name]: value }));
  };

  const handleSeanceSelectChange = (event: SelectChangeEvent) => {
    const { name, value } = event.target;
    if (name === 'medecinId') {
      // Reset type when médecin changes
      setNewSeance(prev => ({ ...prev, [name]: value, type: '' }));
      // Filter seance types based on the selected médecin's profession
      filterSeanceTypesByMedecinId(value);
    } else {
      setNewSeance(prev => ({ ...prev, [name]: value }));
    }
  };

  // Function to filter seance types based on médecin profession
  const filterSeanceTypesByMedecinId = (medecinId: string) => {
    if (!medecinId) {
      setFilteredSeanceTypes([]);
      return;
    }
    
    const selectedMedecin = medecins.find(medecin => medecin.id === medecinId);
    if (!selectedMedecin) {
      setFilteredSeanceTypes([]);
      return;
    }
    
    if (selectedMedecin.profession === 'PARODONTAIRE') {
      setFilteredSeanceTypes(['DETARTRAGE', 'SURFACAGE', 'REEVALUATION']);
    } else if (selectedMedecin.profession === 'ORTHODONTAIRE') {
      setFilteredSeanceTypes(['ACTIVATION', 'RECOLLAGE']);
    } else {
      // If médecin has no specific profession, show all types
      setFilteredSeanceTypes(seanceTypes);
    }
  };

  const handleCreateSeance = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if we're updating or creating a new séance
      if (newSeance.id) {
        // Update existing séance
        await seanceService.update(newSeance.id, { ...newSeance, date: new Date(newSeance.date) })
          .catch(error => {
            console.error('Error updating seance:', error);
            if (error.response) {
              return error.response.json().then((data: any) => {
                throw new Error(data.error || 'Failed to update seance. Please try again.');
              });
            }
            throw new Error('Failed to update seance. Please try again.');
          });
      } else {
        // Create new séance
        await seanceService.create({ ...newSeance, date: new Date(newSeance.date) })
          .catch(error => {
            console.error('Error creating seance:', error);
            if (error.response) {
              return error.response.json().then((data: any) => {
                throw new Error(data.error || 'Failed to create seance. Please try again.');
              });
            }
            throw new Error('Failed to create seance. Please try again.');
          });
      }
      
      // Refresh seances list
      const seancesData = await seanceService.getByPatientId(id || '');
      setSeances(seancesData);
      
      // Close dialog
      setIsSeanceDialogOpen(false);
    } catch (err: any) {
      console.error('Error saving seance:', err);
      setError(err.message || 'Failed to save seance. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditConsultation = async (consultationId: string) => {
    try {
      // Fetch the selected consultation data
      const consultationData = await consultationService.getById(consultationId);
      
      // Set the consultation data to the form
      setNewConsultation({
        date: consultationData.date,
        idConsultation: consultationData.idConsultation,
        patientId: consultationData.patientId,
        medecinId: consultationData.medecinId
      });
      
      // Open dialog in edit mode
      setIsConsultationDialogOpen(true);
    } catch (error) {
      console.error('Failed to fetch consultation for editing:', error);
      setError('Failed to load consultation data. Please try again.');
    }
  };

  const handleEditSeance = async (seanceId: string) => {
    try {
      // Fetch the selected seance data
      const seanceData = await seanceService.getById(seanceId);
      
      // Set the seance data to the form
      setNewSeance({
        id: seanceData.id,
        type: seanceData.type,
        date: new Date(seanceData.date).toISOString().split('T')[0],
        patientId: seanceData.patientId,
        medecinId: seanceData.medecinId
      });
      
      // Filter seance types based on médecin
      filterSeanceTypesByMedecinId(seanceData.medecinId);
      
      // Open dialog in edit mode
      setIsSeanceDialogOpen(true);
    } catch (error) {
      console.error('Failed to fetch seance for editing:', error);
      setError('Failed to load seance data. Please try again.');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Button startIcon={<ArrowLeft />} onClick={handleGoBack} sx={{ mb: 2 }}>
          Back to Patients
        </Button>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!patient) {
    return (
      <Box sx={{ p: 3 }}>
        <Button startIcon={<ArrowLeft />} onClick={handleGoBack} sx={{ mb: 2 }}>
          Back to Patients
        </Button>
        <Alert severity="warning">Patient not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowLeft />} onClick={handleGoBack} sx={{ mr: 2 }}>
          Back
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
          Patient Details
        </Typography>
        
      </Box>

      {/* Patient overview card */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <User size={20} style={{ marginRight: 8 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                  Patient Information
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
                {patient.nom} {patient.prenom}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Numéro de dossier: {patient.numeroDeDossier}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                Contact Information
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {patient.tel}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {patient.adresse}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                Medical Information
              </Typography>
              <Chip 
                label={patient.motifConsultation?.replace(/_/g, ' ').toLowerCase()} 
                size="small" 
                color="primary" 
                variant="outlined" 
                sx={{ mb: 1 }}
              />
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Hygiène:</strong> {patient.hygieneBuccoDentaire?.replace(/_/g, ' ').toLowerCase()}
              </Typography>
              <Typography variant="body2">
                <strong>Mastication:</strong> {patient.typeMastication?.replace(/_/g, ' ').toLowerCase()}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                Summary
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Consultations:</strong> {consultations.length}
              </Typography>
              <Typography variant="body2">
                <strong>Séances:</strong> {seances.length}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs for different sections */}
      <Card >
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="patient tabs"
            sx={{ px: 2 }}
          >
            <Tab 
              icon={<User size={18} />} 
              label="Details" 
              {...a11yProps(0)} 
              iconPosition="start"
            />
            <Tab 
              icon={<FileText size={18} />} 
              label="Consultations" 
              {...a11yProps(1)} 
              iconPosition="start"
              sx={{ ml: 2 }}
            />
            <Tab 
              icon={<Calendar size={18} />} 
              label="Séances" 
              {...a11yProps(2)} 
              iconPosition="start"
              sx={{ ml: 2 }}
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0} >
          <Grid container spacing={3} paddingLeft={10}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ mb: 2 }}>Medical History</Typography>
              
              <Typography variant="subtitle2" sx={{ mt: 2 }}>Anamnèse Générale</Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {patient.anameseGenerale || 'Not provided'}
              </Typography>
              
              <Typography variant="subtitle2" sx={{ mt: 2 }}>Anamnèse Familiale</Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {patient.anamneseFamiliale || 'Not provided'}
              </Typography>
              
              <Typography variant="subtitle2" sx={{ mt: 2 }}>Anamnèse Locale</Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {patient.anamneseLocale || 'Not provided'}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ mb: 2 }}>Dental Information</Typography>
              
              <Typography variant="subtitle2" sx={{ mt: 2 }}>Antécédents Dentaires</Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {patient.antecedentsDentaires || 'Not provided'}
              </Typography>
              
              <Typography variant="subtitle2" sx={{ mt: 2 }}>Type de Mastication</Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {patient.typeMastication?.replace(/_/g, ' ').toLowerCase() || 'Not specified'}
              </Typography>
              
              <Typography variant="subtitle2" sx={{ mt: 2 }}>Hygiène Bucco-Dentaire</Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {patient.hygieneBuccoDentaire?.replace(/_/g, ' ').toLowerCase() || 'Not specified'}
              </Typography>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1} >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }} paddingLeft={3}>
            <Typography variant="h6">Consultations</Typography>
            <Button startIcon={<Plus size={18} />} variant="contained" onClick={handleConsultationDialogOpen}>
              New Consultation
            </Button>
          </Box>
          
          {consultations.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Médecin</TableCell>
                    <TableCell>Diagnostiques</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {consultations.map((consultation) => (
                    <TableRow 
                      key={consultation.id}
                      onClick={() => navigate(`/consultations/${consultation.id}`)}
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        }
                      }}
                    >
                      <TableCell>{consultation.idConsultation}</TableCell>
                      <TableCell>
                        {consultation.date && format(new Date(consultation.date), 'PP')}
                      </TableCell>
                      <TableCell>
                        {consultation.medecin?.user?.name || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        {consultation.diagnostiques?.length || 0} diagnostique(s)
                      </TableCell>
                      <TableCell align="right">
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent navigating away
                            handleEditConsultation(consultation.id);
                          }}
                        >
                          <Edit size={16} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">
              No consultations found for this patient
            </Alert>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2} >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }} paddingLeft={3}>
            <Typography variant="h6">Séances</Typography>
            <Button startIcon={<Plus size={18} />} variant="contained" onClick={handleSeanceDialogOpen}>
              New Séance
            </Button>
          </Box>
          
          {seances.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Médecin</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {seances.map((seance) => (
                    <TableRow 
                      key={seance.id}
                      onClick={() => navigate(`/seances/${seance.id}`)}
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        }
                      }}
                    >
                      <TableCell>
                        <Chip 
                          label={seance.type?.replace(/_/g, ' ').toLowerCase()} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {seance.date && format(new Date(seance.date), 'PP')}
                      </TableCell>
                      <TableCell>
                        {seance.medecin?.user?.name}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent navigating away
                            handleEditSeance(seance.id);
                          }}
                        >
                          <Edit size={16} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">
              No séances found for this patient
            </Alert>
          )}
        </TabPanel>
      </Card>

      <Dialog open={isEditDialogOpen} onClose={handleEditDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Patient</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nom"
                name="nom"
                value={editPatientData?.nom || ''}
                onChange={handleEditInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Prénom"
                name="prenom"
                value={editPatientData?.prenom || ''}
                onChange={handleEditInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Numéro de dossier"
                name="numeroDeDossier"
                value={editPatientData?.numeroDeDossier || ''}
                onChange={handleEditInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Téléphone"
                name="tel"
                value={editPatientData?.tel || ''}
                onChange={handleEditInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Adresse"
                name="adresse"
                value={editPatientData?.adresse || ''}
                onChange={handleEditInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Motif de consultation</InputLabel>
                <Select
                  name="motifConsultation"
                  value={editPatientData?.motifConsultation || ''}
                  onChange={handleEditSelectChange}
                >
                  {motifs.map((motif) => (
                    <MenuItem key={motif} value={motif}>
                      {motif.replace(/_/g, ' ').toLowerCase()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type de mastication</InputLabel>
                <Select
                  name="typeMastication"
                  value={editPatientData?.typeMastication || ''}
                  onChange={handleEditSelectChange}
                >
                  {typeMastications.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type.replace(/_/g, ' ').toLowerCase()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Hygiène bucco-dentaire</InputLabel>
                <Select
                  name="hygieneBuccoDentaire"
                  value={editPatientData?.hygieneBuccoDentaire || ''}
                  onChange={handleEditSelectChange}
                >
                  {hygienes.map((hygiene) => (
                    <MenuItem key={hygiene} value={hygiene}>
                      {hygiene.replace(/_/g, ' ').toLowerCase()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditDialogClose}>Cancel</Button>
          <Button onClick={handleSavePatient} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isConsultationDialogOpen} onClose={handleConsultationDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>New Consultation</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Date"
                name="date"
                type="date"
                value={newConsultation.date}
                onChange={handleConsultationInputChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Médecin</InputLabel>
                <Select
                  name="medecinId"
                  value={newConsultation.medecinId}
                  onChange={handleConsultationSelectChange}
                >
                  {medecins.map((medecin) => (
                    <MenuItem key={medecin.id} value={medecin.id}>
                      {medecin.user.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConsultationDialogClose}>Cancel</Button>
          <Button onClick={handleCreateConsultation} variant="contained" color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isSeanceDialogOpen} onClose={handleSeanceDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>New Séance</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Date"
                name="date"
                type="date"
                value={newSeance.date}
                onChange={handleSeanceInputChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Médecin</InputLabel>
                <Select
                  name="medecinId"
                  value={newSeance.medecinId}
                  onChange={handleSeanceSelectChange}
                  required
                >
                  {medecins.map((medecin) => (
                    <MenuItem key={medecin.id} value={medecin.id}>
                      {medecin.user.name} - {medecin.profession}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  name="type"
                  value={newSeance.type}
                  onChange={handleSeanceSelectChange}
                  required
                  disabled={!newSeance.medecinId}
                >
                  {!newSeance.medecinId ? (
                    <MenuItem disabled value="">Sélectionnez d'abord un médecin</MenuItem>
                  ) : filteredSeanceTypes.length > 0 ? (
                    filteredSeanceTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type.replace(/_/g, ' ').toLowerCase()}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled value="">Aucun type disponible pour ce médecin</MenuItem>
                  )}
                </Select>
              </FormControl>
            </Grid>
            {/* Display error message if any */}
            {error && (
              <Grid item xs={12}>
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSeanceDialogClose}>Cancel</Button>
          <Button onClick={handleCreateSeance} variant="contained" color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PatientDetails;