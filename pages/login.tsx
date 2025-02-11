import { useState, useContext } from 'react';
import {
  TextField,
  Button,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  Paper,
} from '@mui/material';
import AuthContext from '../src/components/Auth';
import { useRouter } from 'next/router';

const LoginPage = () => {
  const { login }: any = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();
  const handleSubmit = async (event: any) => {
    event.preventDefault();
    try {
      if (email && password) {
        await login(email, password);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Box
      sx={{
        minHeight: isMobile ? '85vh' : null,
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
          padding: isMobile ? 3 : 4,
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        {/* Header Section */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant='h4' fontWeight='bold' color='primary'>
            Sales Login
          </Typography>
          <Typography variant='body2' color='textSecondary'>
            Please enter your credentials to continue.
          </Typography>
        </Box>

        {/* Login Form */}
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
          <TextField
            label='Password'
            type='password'
            fullWidth
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            variant='outlined'
            size='medium'
          />

          {/* Login Button */}
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
            Login
          </Button>
          <Button
            type='submit'
            variant='contained'
            color='secondary'
            size='large'
            fullWidth
            onClick={() => router.push('/forgot_password')}
            sx={{
              textTransform: 'none',
              fontSize: '1rem',
              padding: '10px',
            }}
          >
            Forgot Password?
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginPage;
