'use client';
import { useContext, useState } from 'react';
import {
  Typography,
  Box,
  Container,
  useTheme,
  useMediaQuery,
  Paper,
  TextField,
  Button,
  Avatar,
  Divider,
  Alert,
  Snackbar,
} from '@mui/material';
import AuthContext from '../../../src/components/Auth';
import {
  Person,
  Email,
  Phone,
  Business,
  Save,
} from '@mui/icons-material';

const CustomerAccount = () => {
  const { user }: any = useContext(AuthContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // User data from context
  const userData = user?.data || {};

  const handleSaveChanges = () => {
    // This would typically make an API call to update user data
    setSnackbarMessage('Profile settings are managed by your administrator');
    setSnackbarOpen(true);
  };

  const InfoField = ({
    icon,
    label,
    value,
  }: {
    icon: React.ReactNode;
    label: string;
    value: string;
  }) => (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Box sx={{ color: 'text.secondary', mr: 1 }}>{icon}</Box>
        <Typography variant='body2' color='text.secondary'>
          {label}
        </Typography>
      </Box>
      <Typography variant='body1' fontWeight={500} sx={{ pl: 4 }}>
        {value || 'Not provided'}
      </Typography>
    </Box>
  );

  return (
    <Container maxWidth='lg' sx={{ py: { xs: 2, md: 4 } }}>
      <Paper
        elevation={0}
        sx={{
          backgroundColor: 'background.paper',
          borderRadius: 4,
          overflow: 'hidden',
          minHeight: '80vh',
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        {/* Header section */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #1a365d 0%, #2d4a6f 100%)',
            color: 'white',
            padding: { xs: 3, md: 4 },
          }}
        >
          <Typography
            variant={isMobile ? 'h5' : 'h4'}
            sx={{ fontWeight: 700, mb: 1 }}
          >
            My Account
          </Typography>
          <Typography variant='body1' sx={{ opacity: 0.9 }}>
            View and manage your account information
          </Typography>
        </Box>

        {/* Main content */}
        <Box sx={{ p: { xs: 3, md: 4 } }}>
          {/* Profile Section */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 4,
              flexWrap: 'wrap',
              gap: 3,
            }}
          >
            <Avatar
              sx={{
                width: 100,
                height: 100,
                fontSize: '2.5rem',
                backgroundColor: '#38a169',
              }}
            >
              {userData.first_name?.charAt(0)?.toUpperCase() || 'C'}
            </Avatar>
            <Box>
              <Typography variant='h5' fontWeight={600}>
                {userData.first_name} {userData.last_name}
              </Typography>
              <Typography variant='body1' color='text.secondary'>
                Customer Account
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 4 }} />

          {/* Account Information */}
          <Typography variant='h6' fontWeight={600} sx={{ mb: 3 }}>
            Account Information
          </Typography>

          <Paper
            elevation={0}
            sx={{
              p: 3,
              backgroundColor: 'grey.50',
              borderRadius: 2,
              mb: 4,
            }}
          >
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 3,
              }}
            >
              <InfoField
                icon={<Person fontSize='small' />}
                label='First Name'
                value={userData.first_name}
              />
              <InfoField
                icon={<Person fontSize='small' />}
                label='Last Name'
                value={userData.last_name}
              />
              <InfoField
                icon={<Email fontSize='small' />}
                label='Email Address'
                value={userData.email}
              />
              <InfoField
                icon={<Phone fontSize='small' />}
                label='Phone Number'
                value={userData.phone}
              />
              <InfoField
                icon={<Business fontSize='small' />}
                label='Customer Code'
                value={userData.code}
              />
              <InfoField
                icon={<Person fontSize='small' />}
                label='Account Type'
                value='Customer'
              />
            </Box>
          </Paper>

          {/* Account Status */}
          <Typography variant='h6' fontWeight={600} sx={{ mb: 3 }}>
            Account Status
          </Typography>

          <Paper
            elevation={0}
            sx={{
              p: 3,
              backgroundColor: 'grey.50',
              borderRadius: 2,
              mb: 4,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: '#38a169',
                }}
              />
              <Typography fontWeight={500}>Active</Typography>
            </Box>
            <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
              Your account is active and in good standing
            </Typography>
          </Paper>

          {/* Help Section */}
          <Typography variant='h6' fontWeight={600} sx={{ mb: 3 }}>
            Need Help?
          </Typography>

          <Alert severity='info' sx={{ borderRadius: 2 }}>
            <Typography variant='body2'>
              To update your account information or if you have any questions,
              please contact your sales representative or administrator.
            </Typography>
          </Alert>
        </Box>
      </Paper>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      />
    </Container>
  );
};

export default CustomerAccount;
