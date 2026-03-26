import React, { useState } from 'react';
import {
  TextField,
  Button,
  Box,
  Typography,
  Paper,
  CircularProgress,
  Link,
} from '@mui/material';
import { ArrowBack, MailOutline } from '@mui/icons-material';
import axios from 'axios';
import { useRouter } from 'next/router';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(
        `${process.env.api_url}/users/forgot_password`,
        { email }
      );
      setMessage(response.data.message);
      setSubmitted(true);
    } catch (error) {
      console.error(error);
      setMessage('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
        {/* Back link */}
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

        {/* Icon */}
        <Box
          sx={{
            width: 52, height: 52, borderRadius: '14px',
            background: 'linear-gradient(135deg, #2B4864, #172335)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            mb: 3,
          }}
        >
          <MailOutline sx={{ color: 'white', fontSize: 24 }} />
        </Box>

        <Box mb={4}>
          <Typography variant='h5' fontWeight={700} color='text.primary' mb={0.75}>
            Forgot password?
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Enter your email and we&apos;ll send you a link to reset your password.
          </Typography>
        </Box>

        {submitted ? (
          <Box
            sx={{
              p: 2.5,
              borderRadius: '10px',
              bgcolor: message.includes('error') || message.includes('occurred')
                ? 'error.light'
                : '#f0fdf4',
              border: '1px solid',
              borderColor: message.includes('error') || message.includes('occurred')
                ? 'error.main'
                : '#bbf7d0',
            }}
          >
            <Typography
              variant='body2'
              fontWeight={500}
              color={message.includes('error') || message.includes('occurred') ? 'error.main' : 'success.dark'}
            >
              {message}
            </Typography>
          </Box>
        ) : (
          <Box
            component='form'
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
          >
            <TextField
              label='Email address'
              type='email'
              fullWidth
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              variant='outlined'
              autoComplete='email'
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
              {loading ? <CircularProgress size={22} color='inherit' /> : 'Send reset link'}
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ForgotPassword;
