import { useState, useContext, useEffect, useRef } from 'react';
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
  Alert,
  ButtonBase,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  CheckCircleOutline,
  ChevronRight,
  PersonAddAlt,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';
import NextLink from 'next/link';
import AuthContext from '../src/components/Auth';
import { useRouter } from 'next/router';
import { event as trackEvent } from '../src/util/gtag';

// Same wordmark the digital business card uses (pages/cards/[id].tsx).
const WORDMARK_SRC = 'https://assets.pupscribe.in/cards/pupscribe-wordmark.svg';

const FEATURES = [
  'Place wholesale orders online, anytime',
  'Live stock and retailer pricing',
  'Track orders, invoices and payments',
];

// Logged-out visitors are redirected here from every private route, so this is
// the one page a first-time retailer — or a brand looking for a distributor —
// reliably lands on. Real <a> tags (NextLink) so both stay crawlable.
// Single-line on purpose: the card has to clear the fold on a laptop and on a
// phone, and a subtitle per tile costs ~34px each that the sign-in form needs.
// The marketplace tour is not here — it is a topbar action on every logged-out
// route now (src/components/Layout.tsx).
const DESTINATIONS = [
  {
    href: '/register',
    icon: <PersonAddAlt sx={{ fontSize: 18 }} />,
    title: 'Register as a new B2B client',
    emphasis: true,
  },
];

// A 768p laptop leaves roughly 670px under the topbar — enough for the card
// only if the breathing room comes off. Keyed on viewport height rather than
// width so a tall phone keeps the roomier spacing.
const SHORT = '@media (max-height: 780px)';
// Below this the card cannot fit at all without giving something up, so the
// decorative bits (copyright, brand-panel prose) go rather than the form.
const TINY = '@media (max-height: 700px)';

const DestinationTile = ({
  href,
  icon,
  title,
  emphasis = false,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  /** The primary next step for a new visitor — carries the brand outline. */
  emphasis?: boolean;
}) => (
  <ButtonBase
    component={NextLink}
    href={href}
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      width: '100%',
      textAlign: 'left',
      px: 1.25,
      py: 1.25,
      borderRadius: '10px',
      border: '1px solid',
      borderColor: emphasis ? 'primary.main' : 'divider',
      transition: 'border-color 120ms, background-color 120ms',
      '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
    }}
  >
    <Box sx={{ display: 'flex', color: 'primary.main', flexShrink: 0 }}>{icon}</Box>
    {/* Wraps rather than truncates: the longest label needs ~290px and a
        360px phone leaves the text about 200px. */}
    <Typography
      sx={{ fontSize: '0.8125rem', fontWeight: 600, lineHeight: 1.35, flex: 1, minWidth: 0 }}
      color={emphasis ? 'primary.main' : 'text.primary'}
    >
      {title}
    </Typography>
    <ChevronRight sx={{ fontSize: 18, color: 'text.disabled', flexShrink: 0 }} />
  </ButtonBase>
);

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

  // Login-link token (?t=…) from the onboarding WhatsApp message. It stands in for
  // the customer's number, which stays server-side — we only ever show it masked.
  const [linkToken, setLinkToken] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [resolvingLink, setResolvingLink] = useState(false);
  const [inAppBrowser, setInAppBrowser] = useState(false);

  const apiBase = `${process.env.api_url}`;

  // One tap in WhatsApp should land on the code entry screen with the code already
  // sent — /start resolves the token, logs the click and sends the OTP in one call.
  // The ref stops React strict-mode's double effect from sending twice.
  const startedRef = useRef('');

  useEffect(() => {
    if (!router.isReady) return;
    const token = router.query.t;
    if (typeof token !== 'string' || !token) return;
    if (startedRef.current === token) return;
    startedRef.current = token;

    setMode('mobile');
    setResolvingLink(true);
    axios
      .post(`${apiBase}/users/login-link/${encodeURIComponent(token)}/start`)
      .then((response) => {
        setLinkToken(token);
        setMaskedPhone(response.data.masked_phone);
        if (response.data.otp_sent || response.data.already_sent) {
          // Straight to code entry: the code is sitting in the same WhatsApp chat.
          setOtpSent(true);
          toast.success(response.data.detail || 'OTP sent to your WhatsApp');
        } else if (response.data.detail) {
          toast.error(response.data.detail);
        }
      })
      .catch((error: any) => {
        toast.error(error?.response?.data?.detail || 'This login link is no longer valid');
      })
      .finally(() => setResolvingLink(false));
  }, [router.isReady, router.query.t]);

  // WhatsApp opens links in an in-app WebView whose cookies are thrown away when
  // it closes, so a login there doesn't carry over to the real browser. There is
  // no way to force the system browser from the template, so offer the jump here.
  useEffect(() => {
    const ua = navigator.userAgent || '';
    setInAppBrowser(/WhatsApp/i.test(ua) || /\bwv\b/.test(ua) || /FBAN|FBAV|Instagram/i.test(ua));
  }, []);

  const openInSystemBrowser = () => {
    const url = window.location.href;
    const ua = navigator.userAgent || '';

    if (/android/i.test(ua)) {
      // Android intent:// hands the URL to Chrome; falls back to the same https URL.
      const withoutScheme = url.replace(/^https?:\/\//, '');
      window.location.href =
        `intent://${withoutScheme}#Intent;scheme=https;package=com.android.chrome;` +
        `S.browser_fallback_url=${encodeURIComponent(url)};end`;
      return;
    }

    // iOS has no reliable "open in Safari" scheme from a WebView, so copying the
    // link and telling them where to paste it is the honest fallback.
    navigator.clipboard?.writeText(url).then(
      () => toast.success('Link copied — paste it in Safari or Chrome'),
      () => toast.info('Tap the ⋯ menu and choose "Open in browser"')
    );
  };

  const clearLinkToken = () => {
    setLinkToken('');
    setMaskedPhone('');
  };

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
    if (!linkToken && phone.replace(/\D/g, '').length < 10) {
      toast.error('Enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${apiBase}/users/otp/request`, linkToken
        ? { token: linkToken, purpose: 'login' }
        : { phone, purpose: 'login' });
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
      await loginWithOtp(phone, otp, linkToken || undefined);
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
        // The topbar is sticky and 64px, so this is exactly the space left. The
        // card is sized to fit inside it — see the tightened spacing below —
        // rather than pushing the page into a scroll. dvh so mobile browser
        // chrome collapsing does not leave a dead gap.
        minHeight: 'calc(100vh - 64px)',
        '@supports (min-height: 100dvh)': { minHeight: 'calc(100dvh - 64px)' },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        py: { xs: 2, md: 3 },
        px: { xs: 2, sm: 3 },
        [SHORT]: { py: 1.5 },
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
            background: 'linear-gradient(160deg, #191536 0%, #100D26 100%)',
            p: 6,
            [SHORT]: { p: 4.5 },
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative blobs */}
          <Box sx={{
            position: 'absolute', top: -80, right: -80,
            width: 260, height: 260, borderRadius: '50%',
            background: 'rgba(70,51,184,0.4)',
            pointerEvents: 'none',
          }} />
          <Box sx={{
            position: 'absolute', bottom: -60, left: -60,
            width: 200, height: 200, borderRadius: '50%',
            background: 'rgba(70,51,184,0.25)',
            pointerEvents: 'none',
          }} />

          <Box sx={{ position: 'relative', zIndex: 1 }}>
            {/* The wordmark artwork from the business card (pages/cards/[id]).
                It is drawn in solid white, so it only works on a dark panel —
                which is exactly what this is. No separate mark: the topbar and
                the favicon already carry it. */}
            <Box
              component='img'
              src={WORDMARK_SRC}
              alt='Pupscribe'
              sx={{ height: 34, display: 'block', mb: 1.5 }}
            />
            <Typography variant='h6' fontWeight={400} sx={{ color: 'rgba(255,255,255,0.5)', mb: 4, fontSize: '1rem' }}>
              Marketplace
            </Typography>

            <Typography variant='body2' sx={{ color: 'rgba(255,255,255,0.6)', mb: 3, lineHeight: 1.7 }}>
              The B2B ordering portal for pet retailers. Registered retailers can
              browse the full Pupscribe catalogue and place wholesale orders
              directly from here.
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
            p: { xs: 2.5, sm: 4 },
            [SHORT]: { p: { xs: 2, sm: 3 } },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            bgcolor: 'background.paper',
          }}
        >
          {/* No in-card logo below md: the topbar wordmark is right above it,
              and the ~60px it cost was the difference between fitting a phone
              screen and scrolling. */}
          <Box mb={2.5}>
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
            sx={{ mb: 2.5, minHeight: 40, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 40 } }}
          >
            <Tab value='email' label='Email & Password' />
            <Tab value='mobile' label='Mobile OTP' />
          </Tabs>

          {mode === 'email' ? (
            <Box
              component='form'
              onSubmit={handleSubmit}
              sx={{ display: 'flex', flexDirection: 'column', gap: 2, [SHORT]: { gap: 1.75 }, [TINY]: { gap: 1.5 } }}
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
              sx={{ display: 'flex', flexDirection: 'column', gap: 2, [SHORT]: { gap: 1.75 }, [TINY]: { gap: 1.5 } }}
            >
              {/* A login inside WhatsApp's WebView is lost when it closes, so nudge
                  them into the real browser before they sign in. */}
              {linkToken && inAppBrowser && (
                <Alert
                  severity='info'
                  action={
                    <Button color='inherit' size='small' onClick={openInSystemBrowser}>
                      Open
                    </Button>
                  }
                  sx={{ borderRadius: '10px' }}
                >
                  Open in your browser to stay signed in after closing WhatsApp.
                </Alert>
              )}

              {linkToken ? (
                <Box>
                  <TextField
                    label='Mobile number'
                    fullWidth
                    value={maskedPhone}
                    variant='outlined'
                    disabled
                    helperText='Your registered WhatsApp number'
                    slotProps={{ input: { readOnly: true, startAdornment: <InputAdornment position='start'>+91</InputAdornment> } }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                  />
                  {!otpSent && (
                    <Link
                      component='button'
                      type='button'
                      variant='body2'
                      onClick={clearLinkToken}
                      sx={{ color: 'primary.main', fontSize: '0.8rem', fontWeight: 500 }}
                    >
                      Use a different number
                    </Link>
                  )}
                </Box>
              ) : (
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
              )}

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
                      {linkToken ? 'Sent to this WhatsApp chat — copy it here' : 'Sent to your WhatsApp'}
                    </Typography>
                    {/* Arriving by link, the number is fixed, so resending beats
                        offering to change it. */}
                    {linkToken ? (
                      <Link
                        component='button'
                        type='button'
                        variant='body2'
                        onClick={handleSendOtp}
                        sx={{ color: 'primary.main', fontSize: '0.8rem', fontWeight: 500 }}
                      >
                        Resend code
                      </Link>
                    ) : (
                      <Link
                        component='button'
                        type='button'
                        variant='body2'
                        onClick={() => { setOtpSent(false); setOtp(''); clearLinkToken(); }}
                        sx={{ color: 'primary.main', fontSize: '0.8rem', fontWeight: 500 }}
                      >
                        Change number
                      </Link>
                    )}
                  </Box>
                </Box>
              )}

              <Button
                type='submit'
                variant='contained'
                color='primary'
                size='large'
                fullWidth
                disabled={loading || resolvingLink}
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
                {loading || resolvingLink ? (
                  <CircularProgress size={22} color='inherit' />
                ) : otpSent ? (
                  'Verify & sign in'
                ) : (
                  'Send OTP'
                )}
              </Button>
            </Box>
          )}

          <Divider sx={{ my: 2.5, [SHORT]: { my: 2 } }}>
            <Typography variant='caption' color='text.secondary'>
              New here?
            </Typography>
          </Divider>

          {/* Both onward routes as tiles of the same shape — full width rather
              than two-up, since neither label survives a half-width tile at
              the desktop card size without being cut off. */}
          <Box sx={{ display: 'grid', gap: 1 }}>
            {DESTINATIONS.map((d) => (
              <DestinationTile key={d.href} {...d} />
            ))}
          </Box>

          <Typography
            variant='caption'
            color='text.disabled'
            // Base declarations first: emotion emits them in key order, so a
            // `display` after the media query would override the hide.
            sx={{ mt: 2.5, textAlign: 'center', display: 'block', [SHORT]: { mt: 2 }, [TINY]: { display: 'none' } }}
          >
            © {new Date().getFullYear()} Pupscribe. All rights reserved.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginPage;
