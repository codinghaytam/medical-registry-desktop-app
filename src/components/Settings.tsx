import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  TextField, 
  Grid, 
  Avatar, 
  Divider, 
  Switch, 
  FormControlLabel,
  Tabs,
  Tab,
} from '@mui/material';
import { 
  User, 
  Lock, 
  Bell, 
  CreditCard, 
  Shield, 
  Upload
} from 'lucide-react';

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
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
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
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

const Settings: React.FC = () => {
  const [value, setValue] = useState(0);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        Settings
      </Typography>

      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={value} 
              onChange={handleChange} 
              aria-label="settings tabs"
              sx={{ 
                '& .MuiTabs-indicator': { 
                  height: 3,
                  borderRadius: '3px 3px 0 0'
                },
                px: 2
              }}
            >
              <Tab 
                icon={<User size={18} />} 
                label="Profile" 
                {...a11yProps(0)} 
                iconPosition="start"
                sx={{ minHeight: 64 }}
              />
              <Tab 
                icon={<Lock size={18} />} 
                label="Password" 
                {...a11yProps(1)} 
                iconPosition="start"
                sx={{ minHeight: 64 }}
              />
              <Tab 
                icon={<Bell size={18} />} 
                label="Notifications" 
                {...a11yProps(2)} 
                iconPosition="start"
                sx={{ minHeight: 64 }}
              />
              <Tab 
                icon={<CreditCard size={18} />} 
                label="Billing" 
                {...a11yProps(3)} 
                iconPosition="start"
                sx={{ minHeight: 64 }}
              />
              <Tab 
                icon={<Shield size={18} />} 
                label="Security" 
                {...a11yProps(4)} 
                iconPosition="start"
                sx={{ minHeight: 64 }}
              />
            </Tabs>
          </Box>

          <Box sx={{ px: 3 }}>
            <TabPanel value={value} index={0}>
              <Grid container spacing={4}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Avatar 
                      src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80" 
                      sx={{ width: 120, height: 120, mb: 2 }}
                    />
                    <Button 
                      variant="outlined" 
                      startIcon={<Upload size={16} />}
                      sx={{ mb: 1 }}
                    >
                      Upload Photo
                    </Button>
                    <Typography variant="caption" color="text.secondary">
                      JPG, GIF or PNG. Max size of 800K
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={8}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="First Name"
                        defaultValue="John"
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Last Name"
                        defaultValue="Doe"
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        defaultValue="john.doe@example.com"
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        defaultValue="+1 (555) 123-4567"
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Company"
                        defaultValue="Acme Inc."
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Job Title"
                        defaultValue="Product Manager"
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <Button variant="contained">
                          Save Changes
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={value} index={1}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Current Password"
                    type="password"
                    variant="outlined"
                    sx={{ mb: 3 }}
                  />
                  <TextField
                    fullWidth
                    label="New Password"
                    type="password"
                    variant="outlined"
                    sx={{ mb: 3 }}
                  />
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    type="password"
                    variant="outlined"
                    sx={{ mb: 3 }}
                  />
                  <Button variant="contained">
                    Update Password
                  </Button>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Password Requirements
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Your password must include:
                    </Typography>
                    <ul style={{ paddingLeft: '1.5rem', margin: '0.5rem 0' }}>
                      <li>
                        <Typography variant="body2">
                          Minimum 8 characters
                        </Typography>
                      </li>
                      <li>
                        <Typography variant="body2">
                          At least one uppercase letter
                        </Typography>
                      </li>
                      <li>
                        <Typography variant="body2">
                          At least one lowercase letter
                        </Typography>
                      </li>
                      <li>
                        <Typography variant="body2">
                          At least one number
                        </Typography>
                      </li>
                      <li>
                        <Typography variant="body2">
                          At least one special character
                        </Typography>
                      </li>
                    </ul>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={value} index={2}>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Email Notifications
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Account activity and security updates"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="New features and product updates"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={<Switch />}
                    label="Marketing and promotional emails"
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" sx={{ mb: 3 }}>
                System Notifications
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Browser notifications"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Mobile push notifications"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="SMS notifications"
                  />
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button variant="contained">
                  Save Preferences
                </Button>
              </Box>
            </TabPanel>

            <TabPanel value={value} index={3}>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Payment Methods
              </Typography>
              <Card variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box 
                      component="img" 
                      src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png"
                      alt="Visa"
                      sx={{ height: 30, mr: 2 }}
                    />
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        Visa ending in 4242
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Expires 04/2025
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Button variant="outlined" size="small" sx={{ mr: 1 }}>
                      Edit
                    </Button>
                    <Button variant="outlined" size="small" color="error">
                      Remove
                    </Button>
                  </Box>
                </Box>
              </Card>
              <Button variant="outlined" sx={{ mb: 4 }}>
                Add Payment Method
              </Button>

              <Typography variant="h6" sx={{ mb: 3 }}>
                Billing Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Billing Name"
                    defaultValue="John Doe"
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Billing Email"
                    defaultValue="john.doe@example.com"
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Billing Address"
                    defaultValue="123 Main St, Apt 4B"
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="City"
                    defaultValue="New York"
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="State/Province"
                    defaultValue="NY"
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Zip/Postal Code"
                    defaultValue="10001"
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Country"
                    defaultValue="United States"
                    variant="outlined"
                  />
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button variant="contained">
                  Save Changes
                </Button>
              </Box>
            </TabPanel>

            <TabPanel value={value} index={4}>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Two-Factor Authentication
              </Typography>
              <Card variant="outlined" sx={{ p: 2, mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      Two-factor authentication is disabled
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Add an extra layer of security to your account
                    </Typography>
                  </Box>
                  <Button variant="contained">
                    Enable
                  </Button>
                </Box>
              </Card>

              <Typography variant="h6" sx={{ mb: 3 }}>
                Login Sessions
              </Typography>
              <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      MacBook Pro - Chrome
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      New York, USA - Current session
                    </Typography>
                  </Box>
                </Box>
              </Card>
              <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      iPhone 13 - Safari
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      New York, USA - 2 days ago
                    </Typography>
                  </Box>
                  <Button variant="outlined" color="error" size="small">
                    Logout
                  </Button>
                </Box>
              </Card>
              <Card variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      Windows PC - Firefox
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Boston, USA - 5 days ago
                    </Typography>
                  </Box>
                  <Button variant="outlined" color="error" size="small">
                    Logout
                  </Button>
                </Box>
              </Card>
              <Button variant="outlined" color="error">
                Logout of All Sessions
              </Button>
            </TabPanel>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Settings;