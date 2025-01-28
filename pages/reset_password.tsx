import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Box,
  Typography,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useRouter } from 'next/router';
import axios from 'axios';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();

  const { token } = router.query; // Extract token from query parameters

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    try {
      const response = await axios.post(
        `${process.env.api_url}/users/reset_password`,
        {
          token,
          new_password: newPassword,
        }
      );
      setMessage(response.data.message);
      // Optionally, redirect to login after a delay
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error: any) {
      console.error(error);
      setMessage(
        error.response?.data?.detail || 'An error occurred. Please try again.'
      );
    }
  };

  if (!token) {
    return (
      <Box
        sx={{
          minHeight: isMobile ? '85vh' : '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isMobile ? 2 : 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            width: '100%',
            maxWidth: 400,
            padding: isMobile ? 3 : 4,
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
        >
          <Typography variant='h6' color='error' align='center'>
            Invalid password reset link.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: isMobile ? '85vh' : '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? 2 : 4,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: '100%',
          maxWidth: 400,
          padding: isMobile ? 3 : 4,
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        {/* Header Section */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant='h5' fontWeight='bold' color='primary'>
            Reset Password
          </Typography>
          <Typography variant='body2' color='textSecondary'>
            Enter your new password below.
          </Typography>
        </Box>

        {/* Form */}
        <Box
          component='form'
          onSubmit={handleSubmit}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          <TextField
            label='New Password'
            type='password'
            fullWidth
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            variant='outlined'
            size='medium'
          />

          {/* Submit Button */}
          <Button
            type='submit'
            variant='contained'
            color='primary'
            size='large'
            fullWidth
            sx={{
              textTransform: 'none',
              fontSize: '1rem',
              padding: '10px',
            }}
          >
            Reset Password
          </Button>

          {/* Message */}
          {message && (
            <Typography
              variant='body2'
              color={
                message.includes('successfully') ? 'success.main' : 'error'
              }
              sx={{ mt: 2 }}
            >
              {message}
            </Typography>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default ResetPassword;
