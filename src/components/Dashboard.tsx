import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Card, 
  Typography, 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  CircularProgress
} from '@mui/material';
import { User } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import Profile from './Profile';
import RoleBasedAccess from '../utiles/RoleBasedAccess';
import { getUserRole } from '../utiles/RoleAccess';
import { consultationService } from '../services/consultationService';
import { patientService } from '../services/patientService';
import { seanceService } from '../services/seanceService';
import { useAuthErrorHandler } from '../utiles/useAuthErrorHandler';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const userRole = getUserRole();
  const { handleError } = useAuthErrorHandler();
  const [medecinPatients, setMedecinPatients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    // Only fetch patients if the user is a medecin
    if (userRole === 'MEDECIN') {
      fetchMedecinPatients();
    }
  }, [userRole]);

  const fetchMedecinPatients = async () => {
    setIsLoading(true);
    try {
      // Get the medecin ID from sessionStorage
      const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
      // Use the top-level ID if available (Medecin entity ID), otherwise fallback to user.id
      const medecinId = userData.id || userData.user?.id;
      
      if (!medecinId) {
        console.error('Medecin ID not found in local storage');
        return;
      }

      // Fetch all consultations and seances
      const [consultations, seances] = await Promise.all([
        consultationService.getAll(),
        seanceService.getAll()
      ]);
      
      const patientIds = new Set<string>();

      // Filter consultations by medecin ID and collect patient IDs
      if (Array.isArray(consultations)) {
        consultations
          .filter((c: any) => c.medecinId === medecinId)
          .forEach((c: any) => patientIds.add(c.patientId));
      }

      // Filter seances by medecin ID and collect patient IDs
      if (Array.isArray(seances)) {
        seances
          .filter((s: any) => s.medecinId === medecinId)
          .forEach((s: any) => patientIds.add(s.patientId));
      }
      
      // Fetch all patients
      const allPatients = await patientService.getAll();
      
      // Filter patients by collected IDs
      const filteredPatients = allPatients.filter(
        (patient: any) => patientIds.has(patient.id)
      );
      
      setMedecinPatients(filteredPatients);
    } catch (error) {
      console.error('Error fetching medecin patients:', error);
      // Handle authentication errors
      if (!handleError(error)) {
        // If not an auth error, log the error but don't break the UI
        console.error('Non-auth error in dashboard:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRowClick = (patientId: string) => {
    navigate(`/patients/${patientId}`);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        Tableau de bord
      </Typography>
      <Profile></Profile>
      
      {/* Role information banner */}
      
      
      
      

      
      {/* Medecin-only patients section */}
      <RoleBasedAccess requiredRoles="MEDECIN">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>Vos patients</Typography>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
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
                      <TableCell>Motif de Consultation</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {medecinPatients.length > 0 ? (
                      medecinPatients
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((patient) => (
                          <TableRow
                            key={patient.id}
                            onClick={() => handleRowClick(patient.id)}
                            sx={{ 
                              '&:last-child td, &:last-child th': { border: 0 },
                              cursor: 'pointer',
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
                            <TableCell>
                              {patient.motifConsultation?.toLowerCase().replace(/_/g, ' ')}
                            </TableCell>
                          </TableRow>
                        ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography variant="body1" sx={{ py: 2 }}>
                            Vous n'avez pas encore de patients.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              {medecinPatients.length > 0 && (
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={medecinPatients.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              )}
            </Card>
          )}
        </Box>
      </RoleBasedAccess>
    </Box>
  );
};

export default Dashboard;