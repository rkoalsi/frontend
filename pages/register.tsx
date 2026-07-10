import { useState, useContext } from 'react';
import {
  TextField,
  Button,
  Box,
  Typography,
  Paper,
  CircularProgress,
  Link,
  Stepper,
  Step,
  StepLabel,
  InputAdornment,
} from '@mui/material';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useRouter } from 'next/router';
import AuthContext from '../src/components/Auth';
import { event as trackEvent } from '../src/util/gtag';

const STEPS = ['Mobile number', 'Verify OTP'];

const RegisterPage = () => {
  const router = useRouter();
  const { registerWithOtp }: any = useContext(AuthContext);
  const apiBase = `${process.env.api_url}`;

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  const sendOtp = async (e: any) => {
    e.preventDefault();
    if (phone.replace(/\D/g, '').length < 10) {
      toast.error('Enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${apiBase}/users/otp/request`, { phone, purpose: 'register' });
      trackEvent('sign_up_start', { method: 'otp' });
      toast.success('OTP sent to your WhatsApp');
      setStep(1);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Could not send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: any) => {
    e.preventDefault();
    if (!otp) return;
    setLoading(true);
    try {
      // Verifying creates the account and logs the user straight in — the
      // AuthContext handles the redirect to the home page on success.
      await registerWithOtp(phone, otp);
      trackEvent('sign_up', { method: 'otp' });
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Invalid or expired OTP');
      setLoading(false);
    }
  };

  const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: '10px' } };

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
          maxWidth: 480,
          borderRadius: '20px',
          p: { xs: 3, sm: 5 },
          bgcolor: 'background.paper',
          boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
        }}
      >
        <Box mb={3}>
          <Typography variant='h5' fontWeight={700} color='text.primary' mb={0.75}>
            Become a B2B partner
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Verify your mobile number to create your account — you can add your shop
            and tax details later from your profile page.
          </Typography>
        </Box>

        <Stepper activeStep={step} alternativeLabel sx={{ mb: 4 }}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {step === 0 && (
          <Box component='form' onSubmit={sendOtp} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label='Mobile number'
              type='tel'
              fullWidth
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder='10-digit WhatsApp number'
              helperText='We will send a one-time code to this number on WhatsApp'
              slotProps={{ input: { startAdornment: <InputAdornment position='start'>+91</InputAdornment> } }}
              sx={inputSx}
            />
            <Button
              type='submit'
              variant='contained'
              size='large'
              fullWidth
              disabled={loading}
              sx={{ textTransform: 'none', py: 1.5, borderRadius: '10px', fontWeight: 600, minHeight: 48 }}
            >
              {loading ? <CircularProgress size={22} color='inherit' /> : 'Send OTP'}
            </Button>
          </Box>
        )}

        {step === 1 && (
          <Box component='form' onSubmit={verifyOtp} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label='Enter OTP'
              type='tel'
              fullWidth
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              autoComplete='one-time-code'
              placeholder='6-digit code'
              helperText={`Sent to +91 ${phone.replace(/\D/g, '').slice(-10)} on WhatsApp`}
              sx={inputSx}
            />
            <Button
              type='submit'
              variant='contained'
              size='large'
              fullWidth
              disabled={loading}
              sx={{ textTransform: 'none', py: 1.5, borderRadius: '10px', fontWeight: 600, minHeight: 48 }}
            >
              {loading ? <CircularProgress size={22} color='inherit' /> : 'Verify & continue'}
            </Button>
            <Link
              component='button'
              type='button'
              variant='body2'
              onClick={() => setStep(0)}
              sx={{ color: 'primary.main', fontWeight: 500, textAlign: 'center' }}
            >
              Change number
            </Link>
          </Box>
        )}

        <Typography variant='body2' color='text.secondary' sx={{ mt: 4, textAlign: 'center' }}>
          Already have an account?{' '}
          <Link component='button' type='button' onClick={() => router.push('/login')} sx={{ fontWeight: 600 }}>
            Sign in
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
};

export default RegisterPage;
