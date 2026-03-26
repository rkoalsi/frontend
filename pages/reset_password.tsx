import React, { useState } from 'react';
import {
  TextField,
  Button,
  Box,
  Typography,
  Paper,
  CircularProgress,
  Link,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { ArrowBack, LockOutlined, Visibility, VisibilityOff } from '@mui/icons-material';
import { useRouter } from 'next/router';
import axios from 'axios';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { token } = router.query;

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(
        `${process.env.api_url}/users/reset_password`,
        { token, new_password: newPassword }
      );
      setMessage(response.data.message);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error: any) {
      console.error(error);
      setMessage(
        error.response?.data?.detail || 'An error occurred. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const cardContent = (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        maxWidth: 440,
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
        bgcolor: 'white',
        p: { xs: 3, sm: 5 },
      }}
    >
      <Link
        component='button'
        type='button'
        variant='body2'
        onClick={() => router.push('/login')}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          color: 'text.secondary',
          textDecoration: 'none',
          fontWeight: 500,
          fontSize: '0.8rem',
          mb: 4,
          cursor: 'pointer',
          '&:hover': { color: 'primary.main' },
        }}
      >
        <ArrowBack sx={{ fontSize: 15 }} />
        Back to sign in
      </Link>

      <Box
        sx={{
          width: 52, height: 52, borderRadius: '14px',
          background: 'linear-gradient(135deg, #2B4864, #172335)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          mb: 3,
        }}
      >
        <LockOutlined sx={{ color: 'white', fontSize: 24 }} />
      </Box>

      <Box mb={4}>
        <Typography variant='h5' fontWeight={700} color='text.primary' mb={0.75}>
          {!token ? 'Invalid link' : 'Set new password'}
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          {!token
            ? 'This password reset link is invalid or has expired.'
            : 'Your new password must be at least 8 characters long.'}
        </Typography>
      </Box>

      {!token ? (
        <Button
          variant='contained'
          color='primary'
          fullWidth
          onClick={() => router.push('/forgot_password')}
          sx={{
            textTransform: 'none',
            fontSize: '1rem',
            py: 1.5,
            borderRadius: '10px',
            fontWeight: 600,
          }}
        >
          Request a new link
        </Button>
      ) : message ? (
        <Box
          sx={{
            p: 2.5,
            borderRadius: '10px',
            bgcolor: message.includes('successfully') ? '#f0fdf4' : 'error.light',
            border: '1px solid',
            borderColor: message.includes('successfully') ? '#bbf7d0' : 'error.main',
          }}
        >
          <Typography
            variant='body2'
            fontWeight={500}
            color={message.includes('successfully') ? 'success.dark' : 'error.main'}
          >
            {message}
          </Typography>
          {message.includes('successfully') && (
            <Typography variant='caption' color='text.secondary' sx={{ mt: 0.5, display: 'block' }}>
              Redirecting you to sign in…
            </Typography>
          )}
        </Box>
      ) : (
        <Box
          component='form'
          onSubmit={handleSubmit}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
        >
          <TextField
            label='New password'
            type={showPassword ? 'text' : 'password'}
            fullWidth
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            variant='outlined'
            autoComplete='new-password'
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position='end'>
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge='end'
                      size='small'
                      tabIndex={-1}
                    >
                      {showPassword ? <VisibilityOff fontSize='small' /> : <Visibility fontSize='small' />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />

          <Button
            type='submit'
            variant='contained'
            color='primary'
            size='large'
            fullWidth
            disabled={loading}
            sx={{
              textTransform: 'none',
              fontSize: '1rem',
              py: 1.5,
              borderRadius: '10px',
              fontWeight: 600,
              minHeight: 48,
            }}
          >
            {loading ? <CircularProgress size={22} color='inherit' /> : 'Reset password'}
          </Button>
        </Box>
      )}
    </Paper>
  );

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        py: { xs: 3, md: 5 },
        px: { xs: 2, sm: 3 },
      }}
    >
      {cardContent}
    </Box>
  );
};

export default ResetPassword;
