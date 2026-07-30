import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControl,
  InputAdornment,
  InputLabel,
  Link,
  MenuItem,
  Paper,
  Select,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import {
  CheckCircleOutlined,
  ContentCopyOutlined,
  DescriptionOutlined,
  LockOutlined,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';
import { accent } from '../../src/components/marketing/marketplace';

/**
 * Invite-only distributor / brand onboarding form.
 *
 * There is no public distributor sign-up. An admin mints a link in
 * /admin/distributor_invites and sends it to the brand; that token is the only
 * way to reach this page, so it carries no marketing pitch — a brand arriving
 * here has already been spoken to. It is the form and nothing else.
 *
 * The mobile number is still verified over WhatsApp before the application is
 * accepted, so the sales team never chases a dead number.
 *
 * The link stays live until an admin revokes it: a brand that comes back sees
 * what they submitted last time and edits it, rather than filing a second
 * application. Everything server-side lives in
 * routes/distributor_registrations.py.
 *
 * Every step is autosaved to the invite, which does two jobs: the brand can
 * close the tab and pick up where they left off, and /admin/distributor_invites
 * can show how far each brand got instead of only "done / not done". The draft
 * is deliberately separate from the application — it is partial by definition
 * and only becomes a real record through the final submit.
 */

const STEPS = ['Verify mobile', 'Company', 'Addresses', 'Brand'];

// Long enough that it is not saving mid-word, short enough that closing the tab
// straight after typing still keeps the work.
const DRAFT_SAVE_DEBOUNCE_MS = 1200;

const REACH_POLL_INTERVAL_MS = 2500;
const REACH_POLL_TIMEOUT_MS = 20000;

const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: '10px' } };

const buttonSx = {
  textTransform: 'none',
  py: 1.5,
  borderRadius: '10px',
  fontWeight: 600,
  minHeight: 48,
} as const;

type Address = {
  address: string;
  street2: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  attention: string;
};

const emptyAddress: Address = {
  address: '',
  street2: '',
  city: '',
  state: '',
  zip: '',
  phone: '',
  attention: '',
};

/** Reads an address off a saved submission, ignoring the extra keys the API
 *  sends back (country) and filling in anything missing. */
const toAddress = (raw: any): Address => ({
  ...emptyAddress,
  ...Object.fromEntries(
    Object.keys(emptyAddress).map((key) => [key, raw?.[key] ?? '']),
  ),
});

/** Same field set and order as the billing/shipping blocks on the customer
 *  onboarding modal, laid out on a CSS grid that collapses to one column. */
const AddressFields = ({
  value,
  onChange,
  cities,
  citiesLoading,
  states,
  idPrefix,
}: {
  value: Address;
  onChange: (field: keyof Address, next: string) => void;
  cities: string[];
  citiesLoading: boolean;
  states: string[];
  idPrefix: string;
}) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', sm: 'repeat(6, 1fr)' },
      gap: 2,
    }}
  >
    <Box sx={{ gridColumn: { sm: 'span 6' } }}>
      <TextField
        fullWidth
        required
        label='Street address'
        value={value.address}
        onChange={(e) => onChange('address', e.target.value)}
        placeholder='Building, street'
        sx={inputSx}
      />
    </Box>
    <Box sx={{ gridColumn: { sm: 'span 6' } }}>
      <TextField
        fullWidth
        label='Street 2 (optional)'
        value={value.street2}
        onChange={(e) => onChange('street2', e.target.value)}
        placeholder='Area, landmark'
        sx={inputSx}
      />
    </Box>
    <Box sx={{ gridColumn: { sm: 'span 3' } }}>
      <Autocomplete
        fullWidth
        freeSolo
        options={cities}
        value={value.city || null}
        onChange={(_, next) => onChange('city', next || '')}
        onInputChange={(_, next) => onChange('city', next || '')}
        loading={citiesLoading}
        renderInput={(params) => (
          <TextField {...params} required label='City' placeholder='Search or type' sx={inputSx} />
        )}
      />
    </Box>
    <Box sx={{ gridColumn: { sm: 'span 3' } }}>
      <FormControl fullWidth required sx={inputSx}>
        <InputLabel id={`${idPrefix}-state`}>State</InputLabel>
        <Select
          labelId={`${idPrefix}-state`}
          label='State'
          value={value.state}
          onChange={(e) => onChange('state', e.target.value)}
          MenuProps={{ PaperProps: { style: { maxHeight: 320 } } }}
        >
          {states.map((state) => (
            <MenuItem key={state} value={state}>
              {state}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
    <Box sx={{ gridColumn: { sm: 'span 3', lg: 'span 2' } }}>
      <TextField
        fullWidth
        required
        label='Pincode'
        value={value.zip}
        onChange={(e) => onChange('zip', e.target.value)}
        sx={inputSx}
      />
    </Box>
    <Box sx={{ gridColumn: { sm: 'span 3', lg: 'span 2' } }}>
      <TextField
        fullWidth
        label='Phone'
        value={value.phone}
        onChange={(e) => onChange('phone', e.target.value)}
        sx={inputSx}
      />
    </Box>
    <Box sx={{ gridColumn: { sm: 'span 6', lg: 'span 2' } }}>
      <TextField
        fullWidth
        label='Attention'
        value={value.attention}
        onChange={(e) => onChange('attention', e.target.value)}
        placeholder='Contact person'
        sx={inputSx}
      />
    </Box>
  </Box>
);

const SectionLabel = ({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 1.5,
      flexWrap: 'wrap',
      mb: 0.5,
    }}
  >
    <Typography variant='subtitle1' fontWeight={600} color='primary.main'>
      {children}
    </Typography>
    {action}
  </Box>
);

const Shell = ({ children }: { children: React.ReactNode }) => (
  <Box sx={{ width: '100%', maxWidth: 780, mx: 'auto', px: { xs: 2, sm: 3 }, py: { xs: 3.5, md: 6 } }}>
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        borderRadius: '20px',
        p: { xs: 2.5, sm: 3.5, md: 4 },
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: (t) =>
          t.palette.mode === 'dark'
            ? '0 18px 44px rgba(0,0,0,0.45)'
            : '0 18px 44px rgba(16,12,44,0.10)',
      }}
    >
      {children}
    </Paper>
  </Box>
);

const DistributorInvitePage = () => {
  const router = useRouter();
  const apiBase = `${process.env.api_url}`;
  const token = typeof router.query.token === 'string' ? router.query.token : '';

  // Invite gate
  const [inviteLoading, setInviteLoading] = useState(true);
  const [inviteError, setInviteError] = useState('');
  const [note, setNote] = useState('');
  const [agreementUrl, setAgreementUrl] = useState('');
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [stateOptions, setStateOptions] = useState<string[]>([]);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  // Where they got to last time. Applied only after the phone is re-verified,
  // so a resumed session still proves ownership of the number.
  const [resumeStep, setResumeStep] = useState(0);

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [cities, setCities] = useState<string[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);

  // Step 0 — phone verification
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [verifiedToken, setVerifiedToken] = useState('');
  const [reachWarning, setReachWarning] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Steps 1–3 — the application
  const [form, setForm] = useState({
    companyName: '',
    gstNumber: '',
    panNumber: '',
    email: '',
    contactPersonName: '',
    brandName: '',
    margin: '',
  });
  const [billing, setBilling] = useState<Address>({ ...emptyAddress });
  const [shipFrom, setShipFrom] = useState<Address>({ ...emptyAddress });
  const [categories, setCategories] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);

  const setField = (key: keyof typeof form) => (e: any) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const phone10 = useMemo(() => phone.replace(/\D/g, '').slice(-10), [phone]);

  const inviteBase = `${apiBase}/distributor_registrations/${encodeURIComponent(token)}`;

  // The invite carries the dropdown options and any earlier submission, so the
  // whole page comes up in one request once the token is known.
  useEffect(() => {
    if (!router.isReady) return;
    if (!token) {
      setInviteError('This registration link is not valid.');
      setInviteLoading(false);
      return;
    }
    let cancelled = false;
    axios
      .get(`${apiBase}/distributor_registrations/${encodeURIComponent(token)}`)
      .then((res) => {
        if (cancelled) return;
        const data = res.data || {};
        setNote(data.note || '');
        setAgreementUrl(data.agreementUrl || '');
        setCategoryOptions(Array.isArray(data.categories) ? data.categories : []);
        setStateOptions(Array.isArray(data.states) ? data.states : []);

        // Precedence: an unfinished draft is the freshest thing they typed, then
        // a completed application they are coming back to edit, then whatever
        // the admin pre-filled for them.
        const saved = data.submission;
        const draft = data.draft;
        const source = draft || saved || data.prefill || {};
        setAlreadySubmitted(Boolean(saved));
        if (typeof data.draftStep === 'number') setResumeStep(data.draftStep);

        setForm({
          companyName: source.companyName || '',
          gstNumber: source.gstNumber || '',
          panNumber: source.panNumber || '',
          email: source.email || '',
          contactPersonName: source.contactPersonName || '',
          brandName: source.brandName || '',
          margin: source.margin || '',
        });
        if (source.phone) setPhone(source.phone);
        if (draft || saved) {
          setBilling(toAddress(source.billingAddress));
          setShipFrom(toAddress(source.shipFromAddress));
          setCategories(Array.isArray(source.categories) ? source.categories : []);
          setStates(Array.isArray(source.distributionStates) ? source.distributionStates : []);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setInviteError(
          err?.response?.data?.detail ||
            'This registration link is not valid. Please ask your Pupscribe contact for a new one.',
        );
      })
      .finally(() => {
        if (!cancelled) setInviteLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [router.isReady, token, apiBase]);

  useEffect(() => {
    setCitiesLoading(true);
    axios
      .get(`${apiBase}/util/indian-cities`)
      .then((res) => {
        if (Array.isArray(res.data?.cities)) setCities(res.data.cities);
      })
      .catch(() => {})
      .finally(() => setCitiesLoading(false));
  }, [apiBase]);

  /**
   * Autosave. Runs only once past the OTP step: step 0 holds nothing worth
   * keeping, and writing a draft the moment the page loads would report every
   * idle open as "in progress" on the admin table.
   *
   * A failed save is swallowed — the brand is mid-form and an error toast here
   * would be noise about something they did not ask for and cannot fix.
   */
  useEffect(() => {
    if (inviteLoading || inviteError || submitted || step < 1) return;
    const timer = setTimeout(() => {
      axios
        .put(`${inviteBase}/draft`, {
          step,
          data: {
            ...form,
            phone: phone10,
            billingAddress: billing,
            shipFromAddress: shipFrom,
            categories,
            distributionStates: states,
          },
        })
        .catch(() => {});
    }, DRAFT_SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [
    step,
    form,
    billing,
    shipFrom,
    categories,
    states,
    phone10,
    inviteBase,
    inviteLoading,
    inviteError,
    submitted,
  ]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  /**
   * Plivo accepts the message before Meta decides whether the number is on
   * WhatsApp, so an unregistered number only shows up in the delivery report a
   * few seconds later. Poll for it and warn rather than block — a code that
   * actually arrives is the real proof, and the user may already be typing it.
   */
  const pollReachability = (target: string) => {
    stopPolling();
    const startedAt = Date.now();
    pollRef.current = setInterval(async () => {
      if (Date.now() - startedAt > REACH_POLL_TIMEOUT_MS) {
        stopPolling();
        return;
      }
      try {
        const res = await axios.get(`${inviteBase}/otp/status`, {
          params: { phone: target },
        });
        if (res.data?.state === 'unreachable') {
          stopPolling();
          setReachWarning(
            'This number does not appear to be on WhatsApp — we could not deliver the code. Please use a WhatsApp-enabled mobile number.',
          );
        } else if (res.data?.state === 'reachable') {
          stopPolling();
          setReachWarning('');
        }
      } catch {
        // Transient poll failure — the next tick tries again.
      }
    }, REACH_POLL_INTERVAL_MS);
  };

  const sendCode = async (e: any) => {
    e.preventDefault();
    if (phone10.length !== 10) {
      toast.error('Enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    setReachWarning('');
    try {
      await axios.post(`${inviteBase}/otp/request`, { phone: phone10 });
      toast.success('Code sent to your WhatsApp');
      setCodeSent(true);
      pollReachability(phone10);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Could not send the code');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (e: any) => {
    e.preventDefault();
    if (!code) return;
    setLoading(true);
    try {
      const res = await axios.post(`${inviteBase}/otp/verify`, {
        phone: phone10,
        code,
      });
      stopPolling();
      setReachWarning('');
      setVerifiedToken(res.data.verificationToken);
      // Pre-fill the address phone with the number we just verified.
      setBilling((prev) => ({ ...prev, phone: prev.phone || phone10 }));
      toast.success('Mobile number verified');
      // Drop them back where they left off rather than at the top of a form
      // they have already half-filled.
      const target = Math.min(Math.max(resumeStep, 1), STEPS.length - 1);
      if (target > 1) toast.info(`Picking up where you left off — ${STEPS[target]}`);
      setStep(target);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  const goToAddresses = (e: any) => {
    e.preventDefault();
    if (!form.gstNumber.trim() && !form.panNumber.trim()) {
      toast.error('Enter either a GST number or a PAN');
      return;
    }
    setStep(2);
  };

  const addressComplete = (a: Address) => Boolean(a.address && a.city && a.state && a.zip);

  const goToBrand = (e: any) => {
    e.preventDefault();
    if (!addressComplete(billing)) {
      toast.error('Complete the billing address');
      return;
    }
    if (!addressComplete(shipFrom)) {
      toast.error('Complete the ship-from address');
      return;
    }
    setStep(3);
  };

  const copyBillingToShipFrom = () => {
    if (!billing.address) {
      toast.warning('Enter the billing address first');
      return;
    }
    setShipFrom({ ...billing });
    toast.success('Billing address copied');
  };

  const submit = async (e: any) => {
    e.preventDefault();
    if (categories.length === 0) {
      toast.error('Select or type at least one category');
      return;
    }
    if (states.length === 0) {
      toast.error('Select at least one distribution state');
      return;
    }
    setLoading(true);
    try {
      await axios.post(inviteBase, {
        ...form,
        phone: phone10,
        billingAddress: { ...billing, country: 'India' },
        shipFromAddress: { ...shipFrom, country: 'India' },
        categories,
        distributionStates: states,
        verificationToken: verifiedToken,
      });
      setSubmitted(true);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Could not submit your application');
      if (err?.response?.status === 401) {
        // Token expired mid-form — send them back to re-verify.
        setVerifiedToken('');
        setStep(0);
        setCodeSent(false);
      }
      if (err?.response?.status === 404 || err?.response?.status === 410) {
        // The link was revoked while the form was open.
        setInviteError(typeof detail === 'string' ? detail : 'This registration link has been closed.');
      }
    } finally {
      setLoading(false);
    }
  };

  // The link is private, so it must never be indexed or shared as a preview.
  const head = (
    <Head>
      <title>Distributor Registration | Pupscribe</title>
      <meta name='robots' content='noindex, nofollow' />
    </Head>
  );

  if (inviteLoading) {
    return (
      <>
        {head}
        <Shell>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        </Shell>
      </>
    );
  }

  if (inviteError) {
    return (
      <>
        {head}
        <Shell>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <LockOutlined sx={{ fontSize: 52, color: 'text.disabled', mb: 2 }} />
            <Typography variant='h5' fontWeight={700} color='text.primary' mb={1}>
              Link unavailable
            </Typography>
            <Typography color='text.secondary' sx={{ maxWidth: 440, mx: 'auto' }}>
              {inviteError}
            </Typography>
          </Box>
        </Shell>
      </>
    );
  }

  return (
    <>
      {head}
      <Shell>
        {submitted ? (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <CheckCircleOutlined sx={{ fontSize: 56, color: accent('green'), mb: 2 }} />
            <Typography variant='h5' fontWeight={700} color='text.primary' mb={1}>
              {alreadySubmitted ? 'Details updated' : 'Application received'}
            </Typography>
            <Typography color='text.secondary' sx={{ maxWidth: 440, mx: 'auto' }}>
              Thank you — our distribution team will review your details and get in
              touch on {`+91 ${phone10}`} shortly.
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mt: 2 }}>
              You can return to this link any time to correct your details.
            </Typography>
          </Box>
        ) : (
          <>
            <Box mb={3}>
              <Typography variant='h5' fontWeight={700} color='text.primary' mb={0.75}>
                Distributor registration
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {alreadySubmitted
                  ? 'You have already submitted these details. Verify your mobile number to review and update them.'
                  : resumeStep > 0
                    ? 'We saved what you filled in earlier. Verify your mobile number to carry on from where you stopped.'
                    : 'Takes about two minutes. We verify your mobile number on WhatsApp first so our team can reach you.'}
              </Typography>
            </Box>

            {note && (
              <Alert severity='info' sx={{ mb: 3 }}>
                {note}
              </Alert>
            )}

            {agreementUrl && (
              <Alert
                severity='info'
                icon={<DescriptionOutlined fontSize='inherit' />}
                sx={{ mb: 3 }}
                action={
                  <Button
                    size='small'
                    href={agreementUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    sx={{ textTransform: 'none' }}
                  >
                    Open
                  </Button>
                }
              >
                Distribution agreement — please read before submitting.
              </Alert>
            )}

            {/* The full stepper needs room for four labels; below `sm` it
                becomes a single line of text instead of four cramped ones. */}
            <Box sx={{ display: { xs: 'none', sm: 'block' }, mb: 4 }}>
              <Stepper activeStep={step} alternativeLabel>
                {STEPS.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>
            <Box sx={{ display: { xs: 'block', sm: 'none' }, mb: 3 }}>
              <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 600, letterSpacing: '0.05em' }}>
                STEP {step + 1} OF {STEPS.length} — {STEPS[step].toUpperCase()}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.75, mt: 1 }}>
                {STEPS.map((label, i) => (
                  <Box
                    key={label}
                    sx={{
                      flex: 1,
                      height: 4,
                      borderRadius: 2,
                      bgcolor: i <= step ? 'primary.main' : 'divider',
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* Step 0 — WhatsApp verification */}
            {step === 0 && (
              <Box
                component='form'
                onSubmit={codeSent ? verifyCode : sendCode}
                sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
              >
                <TextField
                  label='Mobile number'
                  type='tel'
                  fullWidth
                  required
                  disabled={codeSent}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder='10-digit WhatsApp number'
                  helperText='Must be on WhatsApp — we send a one-time code to it'
                  slotProps={{
                    input: { startAdornment: <InputAdornment position='start'>+91</InputAdornment> },
                  }}
                  sx={inputSx}
                />

                {reachWarning && <Alert severity='warning'>{reachWarning}</Alert>}

                {codeSent && (
                  <TextField
                    label='Enter code'
                    type='tel'
                    fullWidth
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    autoComplete='one-time-code'
                    placeholder='6-digit code'
                    helperText={`Sent to +91 ${phone10} on WhatsApp`}
                    sx={inputSx}
                  />
                )}

                <Button type='submit' variant='contained' size='large' fullWidth disabled={loading} sx={buttonSx}>
                  {loading ? (
                    <CircularProgress size={22} color='inherit' />
                  ) : codeSent ? (
                    'Verify & continue'
                  ) : (
                    'Send code on WhatsApp'
                  )}
                </Button>

                {codeSent && (
                  <Link
                    component='button'
                    type='button'
                    variant='body2'
                    onClick={() => {
                      stopPolling();
                      setCodeSent(false);
                      setCode('');
                      setReachWarning('');
                    }}
                    sx={{ color: 'primary.main', fontWeight: 500, textAlign: 'center' }}
                  >
                    Change number
                  </Link>
                )}
              </Box>
            )}

            {/* Step 1 — company */}
            {step === 1 && (
              <Box component='form' onSubmit={goToAddresses} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TextField label='Company name' fullWidth required value={form.companyName} onChange={setField('companyName')} sx={inputSx} />
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
                  <TextField label='GST number' fullWidth value={form.gstNumber} onChange={setField('gstNumber')} sx={inputSx} />
                  <TextField label='PAN' fullWidth value={form.panNumber} onChange={setField('panNumber')} sx={inputSx} />
                </Box>
                <Typography variant='caption' color='text.secondary' sx={{ mt: -1.5 }}>
                  Either one is fine — GST if you are registered, otherwise PAN.
                </Typography>
                <TextField label='Contact person name' fullWidth required value={form.contactPersonName} onChange={setField('contactPersonName')} sx={inputSx} />
                <TextField label='Email' type='email' fullWidth required value={form.email} onChange={setField('email')} sx={inputSx} />
                <TextField
                  label='Mobile number'
                  fullWidth
                  value={`+91 ${phone10}`}
                  disabled
                  helperText='Verified on WhatsApp'
                  sx={inputSx}
                />
                <Button type='submit' variant='contained' size='large' fullWidth sx={buttonSx}>
                  Continue
                </Button>
              </Box>
            )}

            {/* Step 2 — addresses */}
            {step === 2 && (
              <Box component='form' onSubmit={goToBrand} sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <SectionLabel>Billing address</SectionLabel>
                  <AddressFields
                    value={billing}
                    onChange={(field, next) => setBilling((prev) => ({ ...prev, [field]: next }))}
                    cities={cities}
                    citiesLoading={citiesLoading}
                    states={stateOptions}
                    idPrefix='billing'
                  />
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <SectionLabel
                    action={
                      <Button
                        variant='outlined'
                        size='small'
                        startIcon={<ContentCopyOutlined />}
                        onClick={copyBillingToShipFrom}
                        sx={{ textTransform: 'none' }}
                      >
                        Copy from Billing
                      </Button>
                    }
                  >
                    Ship-from address
                  </SectionLabel>
                  <AddressFields
                    value={shipFrom}
                    onChange={(field, next) => setShipFrom((prev) => ({ ...prev, [field]: next }))}
                    cities={cities}
                    citiesLoading={citiesLoading}
                    states={stateOptions}
                    idPrefix='shipfrom'
                  />
                </Box>

                <Box sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column-reverse', sm: 'row' } }}>
                  <Button variant='outlined' size='large' fullWidth onClick={() => setStep(1)} sx={buttonSx}>
                    Back
                  </Button>
                  <Button type='submit' variant='contained' size='large' fullWidth sx={buttonSx}>
                    Continue
                  </Button>
                </Box>
              </Box>
            )}

            {/* Step 3 — brand & distribution */}
            {step === 3 && (
              <Box component='form' onSubmit={submit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TextField label='Brand name' fullWidth required value={form.brandName} onChange={setField('brandName')} sx={inputSx} />

                {/* freeSolo: a brand whose category is not on our list types
                    their own rather than being forced into "Others". */}
                <Autocomplete
                  multiple
                  freeSolo
                  autoHighlight
                  options={categoryOptions}
                  value={categories}
                  onChange={(_, value) =>
                    setCategories(
                      Array.from(
                        new Set(
                          (value as string[])
                            .map((v) => v.trim().replace(/\s+/g, ' '))
                            .filter(Boolean)
                            .slice(0, 15),
                        ),
                      ),
                    )
                  }
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => {
                      const { key, ...tagProps } = getTagProps({ index });
                      return <Chip key={key} label={option} size='small' {...tagProps} />;
                    })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label='Category'
                      placeholder={categories.length ? '' : 'Select or type your own'}
                      helperText='Pick what applies, or type your own category and press Enter.'
                      sx={inputSx}
                    />
                  )}
                />

                <Autocomplete
                  multiple
                  disableCloseOnSelect
                  options={stateOptions}
                  value={states}
                  onChange={(_, value) => setStates(value as string[])}
                  renderOption={(props, option, { selected }) => {
                    const { key, ...optionProps } = props as any;
                    return (
                      <li key={key} {...optionProps}>
                        <Checkbox checked={selected} sx={{ mr: 1, p: 0.5 }} />
                        {option}
                      </li>
                    );
                  }}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => {
                      const { key, ...tagProps } = getTagProps({ index });
                      return <Chip key={key} label={option} size='small' {...tagProps} />;
                    })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label='Distribution location — states'
                      placeholder={states.length ? '' : 'Start typing a state'}
                      helperText='Every state you can distribute in.'
                      sx={inputSx}
                    />
                  )}
                />

                <Button
                  type='button'
                  size='small'
                  onClick={() =>
                    setStates(states.length === stateOptions.length ? [] : [...stateOptions])
                  }
                  sx={{ alignSelf: 'flex-start', textTransform: 'none', mt: -1.5 }}
                >
                  {states.length === stateOptions.length ? 'Clear all states' : 'Select all India'}
                </Button>

                <TextField
                  label='Margin offered'
                  fullWidth
                  value={form.margin}
                  onChange={setField('margin')}
                  placeholder='e.g. 35% on MRP'
                  helperText='The distributor margin you can offer. An approximate figure is fine.'
                  sx={inputSx}
                />

                <Box sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column-reverse', sm: 'row' } }}>
                  <Button variant='outlined' size='large' fullWidth onClick={() => setStep(2)} sx={buttonSx}>
                    Back
                  </Button>
                  <Button type='submit' variant='contained' size='large' fullWidth disabled={loading} sx={buttonSx}>
                    {loading ? (
                      <CircularProgress size={22} color='inherit' />
                    ) : alreadySubmitted ? (
                      'Update details'
                    ) : (
                      'Submit application'
                    )}
                  </Button>
                </Box>
              </Box>
            )}
          </>
        )}
      </Shell>
    </>
  );
};

export default DistributorInvitePage;
