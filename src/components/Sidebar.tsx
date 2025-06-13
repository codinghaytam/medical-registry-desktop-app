import React from 'react';
import { 
  Box, 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Divider, 
  IconButton,
  Typography,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  LayoutDashboard, 
  Users, 
  HelpCircle, 
  LogOut, 
  ChevronLeft,
  Calendar,
  User,
  FileText,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { hasAccess} from '../utiles/RoleAccess';
import { UserRole } from '../utiles/RoleAccess';

const drawerWidth = 240;

interface SidebarProps {
  open: boolean;
  handleDrawerToggle: () => void;
}

interface MenuItem {
  text: string;
  icon: React.ReactNode;
  path: string;
  allowedRoles: UserRole[];
}

const Sidebar: React.FC<SidebarProps> = ({ open, handleDrawerToggle }) => {
  const theme = useTheme();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const allMenuItems: MenuItem[] = [
    { 
      text: 'Dashboard', 
      icon: <LayoutDashboard size={22} />, 
      path: '/',
      allowedRoles: ['ADMIN', 'MEDECIN', 'ETUDIANT']
    },
    { 
      text: 'Users', 
      icon: <Users size={22} />, 
      path: '/users',
      allowedRoles: ['ADMIN'] 
    },
    { 
      text: 'Patients', 
      icon: <HelpCircle size={22} />, 
      path: '/patients',
      allowedRoles: ['ADMIN', 'MEDECIN', 'ETUDIANT'] 
    },
    { 
      text: 'Consultations', 
      icon: <FileText size={22} />, 
      path: '/consultation',
      allowedRoles: ['ADMIN', 'MEDECIN', 'ETUDIANT'] 
    },
    { 
      text: 'Seance', 
      icon: <Calendar size={22} />, 
      path: '/sceance',
      allowedRoles: ['ADMIN', 'MEDECIN', 'ETUDIANT'] 
    },
    { 
      text: 'Médecins', 
      icon: <User size={22} />, 
      path: '/medecins',
      allowedRoles: ['ADMIN'] 
    },
    
  ];

  // Filter menu items based on user role
  const menuItems = allMenuItems.filter(item => 
    hasAccess(item.allowedRoles)
  );

  const drawer = (
    <>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: 2
      }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
          DashPro
        </Typography>
        {isMobile && (
          <IconButton onClick={handleDrawerToggle}>
            <ChevronLeft />
          </IconButton>
        )}
      </Box>
      <Divider />
      
      <List sx={{ mt: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ display: 'block', mb: 0.5 }}>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
              sx={{
                minHeight: 48,
                px: 2.5,
                borderRadius: '0 24px 24px 0',
                mr: 2,
                ...(location.pathname === item.path && {
                  backgroundColor: theme.palette.primary.light + '20',
                  '&:hover': {
                    backgroundColor: theme.palette.primary.light + '30',
                  },
                }),
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: 2,
                  color: location.pathname === item.path ? theme.palette.primary.main : 'inherit',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{
                  fontWeight: location.pathname === item.path ? 'bold' : 'regular',
                  color: location.pathname === item.path ? theme.palette.primary.main : 'inherit',
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ mt: 'auto' }} />
      <List>
        <ListItem disablePadding>
          <ListItemButton component={Link} to="/logout" sx={{ px: 2.5 }}>
            <ListItemIcon sx={{ minWidth: 0, mr: 2 }}>
              <LogOut size={22} />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
    >
      {/* Mobile drawer */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={open}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
      ) : (
        // Desktop drawer
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: '1px solid',
              borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
              boxShadow: 'none'
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      )}
    </Box>
  );
};

export default Sidebar;