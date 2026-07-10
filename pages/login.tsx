import { useState, useContext } from 'react';
import {
  TextField,
  Button,
  Box,
  Typography,
  Paper,
  IconButton,
  InputAdornment,
  CircularProgress,
  Link,
  Divider,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  CheckCircleOutline,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';
import AuthContext from '../src/components/Auth';
import { useRouter } from 'next/router';
import { event as trackEvent } from '../src/util/gtag';

const FEATURES = ['Order management', 'Customer portal', 'Sales analytics'];

const LoginPage = () => {
  const { login, loginWithOtp }: any = useContext(AuthContext);
  const [mode, setMode] = useState<'email' | 'mobile'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Mobile / OTP state
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const router = useRouter();

  const apiBase = `${process.env.api_url}`;

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      await login(email, password);
      trackEvent('login', { method: 'password' });
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (event: any) => {
    event.preventDefault();
    if (phone.replace(/\D/g, '').length < 10) {
      toast.error('Enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${apiBase}/users/otp/request`, { phone, purpose: 'login' });
      setOtpSent(true);
      toast.success('OTP sent to your WhatsApp');
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Could not send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event: any) => {
    event.preventDefault();
    if (!otp) return;
    setLoading(true);
    try {
      await loginWithOtp(phone, otp);
      trackEvent('login', { method: 'otp' });
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Invalid or expired OTP');
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
          maxWidth: { xs: '100%', sm: 480, md: 900 },
          borderRadius: '20px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
        }}
      >
        {/* Left brand panel — desktop only */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            flex: '0 0 380px',
            background: 'linear-gradient(160deg, #0f1923 0%, #070e15 100%)',
            p: 6,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative blobs */}
          <Box sx={{
            position: 'absolute', top: -80, right: -80,
            width: 260, height: 260, borderRadius: '50%',
            background: 'rgba(43,72,100,0.4)',
            pointerEvents: 'none',
          }} />
          <Box sx={{
            position: 'absolute', bottom: -60, left: -60,
            width: 200, height: 200, borderRadius: '50%',
            background: 'rgba(43,72,100,0.25)',
            pointerEvents: 'none',
          }} />

          <Box sx={{ position: 'relative', zIndex: 1 }}>
            {/* Logo mark */}
            <Box
              sx={{
                width: 56, height: 56, borderRadius: '14px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                mb: 4,
              }}
            >
              <Typography sx={{ fontSize: 26, fontWeight: 800, color: 'white', lineHeight: 1 }}>
                P
              </Typography>
            </Box>

            <Typography variant='h4' fontWeight={700} color='white' mb={1} lineHeight={1.2}>
              Pupscribe
            </Typography>
            <Typography variant='h6' fontWeight={400} sx={{ color: 'rgba(255,255,255,0.5)', mb: 4, fontSize: '1rem' }}>
              Order Form
            </Typography>

            <Typography variant='body2' sx={{ color: 'rgba(255,255,255,0.6)', mb: 3, lineHeight: 1.7 }}>
              Manage your orders and customer relationships in one powerful platform.
            </Typography>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 3 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {FEATURES.map((feat) => (
                <Box key={feat} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CheckCircleOutline sx={{ fontSize: 16, color: '#6B5B95' }} />
                  <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>
                    {feat}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        {/* Right form panel */}
        <Box
          sx={{
            flex: 1,
            p: { xs: 3, sm: 5 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            bgcolor: 'background.paper',
            minHeight: { xs: 'auto', md: 520 },
          }}
        >
          {/* Mobile logo */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1.5, mb: 4 }}>
            <Box
              sx={{
                width: 38, height: 38, borderRadius: '10px',
                background: 'linear-gradient(135deg, #2B4864, #172335)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Typography sx={{ fontSize: 17, fontWeight: 800, color: 'white' }}>P</Typography>
            </Box>
            <Typography fontWeight={700} color='primary.main' fontSize='1.1rem'>
              Pupscribe
            </Typography>
          </Box>

          <Box mb={3}>
            <Typography variant='h5' fontWeight={700} color='text.primary' mb={0.75}>
              Welcome back
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Sign in to your account to continue
            </Typography>
          </Box>

          <Tabs
            value={mode}
            onChange={(_, v) => {
              setMode(v);
              setOtpSent(false);
              setOtp('');
            }}
            variant='fullWidth'
            sx={{ mb: 3, minHeight: 40, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 40 } }}
          >
            <Tab value='email' label='Email & Password' />
            <Tab value='mobile' label='Mobile OTP' />
          </Tabs>

          {mode === 'email' ? (
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

              <Box>
                <TextField
                  label='Password'
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  variant='outlined'
                  autoComplete='current-password'
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
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                  <Link
                    component='button'
                    type='button'
                    variant='body2'
                    onClick={() => router.push('/forgot_password')}
                    sx={{
                      color: 'primary.main',
                      textDecoration: 'none',
                      fontWeight: 500,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    Forgot password?
                  </Link>
                </Box>
              </Box>

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
                  mt: 0.5,
                  minHeight: 48,
                }}
              >
                {loading ? <CircularProgress size={22} color='inherit' /> : 'Sign in'}
              </Button>
            </Box>
          ) : (
            <Box
              component='form'
              onSubmit={otpSent ? handleVerifyOtp : handleSendOtp}
              sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
            >
              <TextField
                label='Mobile number'
                type='tel'
                fullWidth
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                variant='outlined'
                autoComplete='tel'
                disabled={otpSent}
                placeholder='10-digit WhatsApp number'
                slotProps={{ input: { startAdornment: <InputAdornment position='start'>+91</InputAdornment> } }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />

              {otpSent && (
                <Box>
                  <TextField
                    label='Enter OTP'
                    type='tel'
                    fullWidth
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    variant='outlined'
                    autoComplete='one-time-code'
                    placeholder='6-digit code'
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant='caption' color='text.secondary'>
                      Sent to your WhatsApp
                    </Typography>
                    <Link
                      component='button'
                      type='button'
                      variant='body2'
                      onClick={() => { setOtpSent(false); setOtp(''); }}
                      sx={{ color: 'primary.main', fontSize: '0.8rem', fontWeight: 500 }}
                    >
                      Change number
                    </Link>
                  </Box>
                </Box>
              )}

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
                  mt: 0.5,
                  minHeight: 48,
                }}
              >
                {loading ? (
                  <CircularProgress size={22} color='inherit' />
                ) : otpSent ? (
                  'Verify & sign in'
                ) : (
                  'Send OTP'
                )}
              </Button>
            </Box>
          )}

          <Divider sx={{ my: 3 }}>
            <Typography variant='caption' color='text.secondary'>
              New here?
            </Typography>
          </Divider>

          <Button
            variant='outlined'
            color='primary'
            fullWidth
            onClick={() => router.push('/register')}
            sx={{
              textTransform: 'none',
              fontSize: '0.95rem',
              py: 1.25,
              borderRadius: '10px',
              fontWeight: 600,
            }}
          >
            Register as a new B2B client
          </Button>

          <Typography
            variant='caption'
            color='text.disabled'
            sx={{ mt: 3, textAlign: 'center', display: 'block' }}
          >
            © {new Date().getFullYear()} Pupscribe. All rights reserved.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginPage;
