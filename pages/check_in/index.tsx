import React, { useContext, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  CircularProgress,
  Stack,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Login as LoginIcon, Logout as LogoutIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';
import AuthContext from '../../src/components/Auth';

const Checkin = () => {
  // Simulating AuthContext - replace with your actual context
  const { user }: any = useContext(AuthContext);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [checkedIn, setCheckedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAttendance = async () => {
    setIsLoading(true);
    const payload = {
      phone: user?.data?.phone,
      user_id: user?.data?._id,
      action: checkedIn ? 'checkout' : 'checkin',
    };

    try {
      const response = await axios.post(
        `${process.env.api_url}/attendance/check_in`,
        payload
      );

      if (response.status === 200) {
        setCheckedIn(!checkedIn);
        const { message = '', is_check_in } = response.data;
        toast.success(
          is_check_in
            ? `${message} Checked-in Successfully`
            : `${message} Checked-out Successfully`
        );
      } else {
        toast.error('Failed to update attendance');
      }
    } catch (error) {
      toast.error('Error processing your request');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container
      maxWidth='xs'
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        py: 4,
      }}
    >
      <Stack
        spacing={3}
        alignItems='center'
        sx={{
          width: '100%',
          backgroundColor: 'background.paper',
          borderRadius: 2,
          p: isMobile ? 2 : 4,
          boxShadow: 3,
        }}
      >
        <Box
          sx={{
            width: isMobile ? 80 : 100,
            height: isMobile ? 80 : 100,
            backgroundColor: checkedIn ? 'error.main' : 'primary.main',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}
        >
          {checkedIn ? (
            <LogoutIcon fontSize='large' />
          ) : (
            <LoginIcon fontSize='large' />
          )}
        </Box>

        <Typography
          variant={isMobile ? 'h6' : 'h5'}
          align='center'
          fontWeight='bold'
        >
          {user?.data?.name ? `Hello, ${user.data.name}` : 'Welcome'}
        </Typography>

        <Typography variant='subtitle1' color='text.secondary' align='center'>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Typography>

        <Button
          fullWidth
          variant='contained'
          color={checkedIn ? 'error' : 'primary'}
          onClick={handleAttendance}
          disabled={isLoading}
          startIcon={
            isLoading ? (
              <CircularProgress size={24} />
            ) : checkedIn ? (
              <LogoutIcon />
            ) : (
              <LoginIcon />
            )
          }
          sx={{
            py: 1.5,
            fontSize: isMobile ? '0.9rem' : '1rem',
            fontWeight: 'bold',
            borderRadius: 2,
          }}
        >
          {isLoading ? 'Processing...' : checkedIn ? 'Check Out' : 'Check In'}
        </Button>
      </Stack>
    </Container>
  );
};

export default Checkin;
