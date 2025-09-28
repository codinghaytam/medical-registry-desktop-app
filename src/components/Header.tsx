import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  IconButton, 
  Typography, 
  Box, 
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Menu } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {
  handleDrawerToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ handleDrawerToggle }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: theme.zIndex.drawer + 1,
        boxShadow: 'none',
        backgroundColor: 'background.paper',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'
      }}
    >
      
      <Toolbar>
        {isMobile && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <Menu />
          </IconButton>
        )}

        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', ml: isMobile ? 0 : 2 }}>
          <img 
            src="/medica-name.svg" 
            alt="Logo Medica"
            style={{
              height: '45px',
              width: 'auto',
            }} 
          />
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ThemeToggle />
          
          <Box sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
            
            <Box sx={{ ml: 1, display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {(() => {
                  const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
                  let userRole;
                  if (JSON.parse(sessionStorage.getItem("user") as string)?.user!=null)
                  {
                    userRole = JSON.parse(sessionStorage.getItem("user") as string)?.user.role;
                  }else
                  {
                    userRole = JSON.parse(sessionStorage.getItem("user") as string)?.role;

                  }
                  console.log(userData.user.name)
                  // Format the display name based on role
                  if (userRole === 'MEDECIN' && userData.user?.user?.name) {
                    return `Dr. ${userData.user.user.name}`;
                  } else if (userRole === 'MEDECIN' && userData.user?.user?.profession) {
                    return (userData.user.profession=== 'PARODONTAIRE' ? 'Parodontiste' : 'Orthodontiste');
                  } else if (userRole === 'ETUDIANT' && userData.user?.user?.name) {
                    return userData.user.user.name;
                  } else if (userRole === 'ADMIN' && userData.user.name) {
                    return userData.user.name;
                  } else {
                    return "Utilisateur";
                  }
                })()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {(() => {
                  const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
                  let userRole;
                  if (JSON.parse(sessionStorage.getItem("user") as string)?.user!=null)
                  {
                    userRole = JSON.parse(sessionStorage.getItem("user") as string)?.user.role;
                  }else
                  {
                    userRole = JSON.parse(sessionStorage.getItem("user") as string)?.role;

                  }                  
                  if (userRole === 'MEDECIN' && userData.user?.profession) {
                    return (userData.user.profession === 'PARODONTAIRE' ? 'Parodontiste' : 'Orthodontiste');
                  } else {
                    return userRole || "Utilisateur";
                  }
                })()}
              </Typography>
            </Box>
           
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;