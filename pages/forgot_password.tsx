import React, { useState } from 'react';
import {
  TextField,
  Button,
  Box,
  Typography,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import axios from 'axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    try {
      const response = await axios.post(
        `${process.env.api_url}/users/forgot_password`,
        {
          email,
        }
      );
      setMessage(response.data.message);
    } catch (error) {
      console.error(error);
      setMessage('An error occurred. Please try again.');
    }
  };

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
            Forgot Password
          </Typography>
          <Typography variant='body2' color='textSecondary'>
            Enter your email to receive a password reset link.
          </Typography>
        </Box>

        {/* Form */}
        <Box
          component='form'
          onSubmit={handleSubmit}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          <TextField
            label='Email'
            type='email'
            fullWidth
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            Send Reset Link
          </Button>

          {/* Message */}
          {message && (
            <Typography
              variant='body2'
              color={message.includes('sent') ? 'success.main' : 'error'}
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

export default ForgotPassword;
