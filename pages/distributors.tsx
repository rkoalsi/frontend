import { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
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
  SetMealOutlined,
  CleanHandsOutlined,
  ShowerOutlined,
  PetsOutlined,
  LocalOfferOutlined,
  ToysOutlined,
  HealthAndSafetyOutlined,
  ShoppingBasketOutlined,
  LocalShippingOutlined,
  StorefrontOutlined,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';
import { accent, accentTile, AccentKey } from '../src/components/marketing/marketplace';
import { event as trackEvent } from '../src/util/gtag';

/**
 * Public distributor / brand onboarding page.
 *
 * A brand that wants Pupscribe to distribute it lands here — from the marketing
 * page at `/`, from pupscribe.in/marketplace, or from a search for "pet food
 * distributors in India". The mobile number is verified over WhatsApp before the
 * application is accepted, so the sales team never chases a dead number.
 *
 * The "who we are looking for" cards are managed from /admin/leads rather than
 * hard-coded, so the categories we are recruiting for can change without a
 * deploy. DEFAULT_CARDS below is only the fallback for a cold database.
 *
 * The pupscribe.in site carries a styled-components twin of this page at the
 * same path; both post to /api/distributor_registrations.
 */

const STEPS = ['Verify mobile', 'Company', 'Addresses', 'Brand'];

// Mirrors CATEGORIES in routes/distributor_registrations.py. The field is
// free-text-capable — a brand outside these categories types their own.
const CATEGORIES = [
  'Pet Food (Dog & Cat)',
  'Dog Food',
  'Cat Food',
  'Cat Litter',
  'Grooming (Shampoo & Conditioner)',
  'Treats & Chews',
  'Toys',
  'Collars, Leashes & Harnesses',
  'Health & Supplements',
  'Accessories & Others',
];

const INDIAN_STATES = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

// Icon keys the backend stores per card (CARD_ICONS in
// routes/distributor_registrations.py) resolved to the actual glyphs.
const CARD_ICONS: Record<string, React.ReactElement> = {
  pets: <PetsOutlined />,
  food: <SetMealOutlined />,
  litter: <CleanHandsOutlined />,
  grooming: <ShowerOutlined />,
  treats: <LocalOfferOutlined />,
  toys: <ToysOutlined />,
  health: <HealthAndSafetyOutlined />,
  accessories: <ShoppingBasketOutlined />,
  shipping: <LocalShippingOutlined />,
  store: <StorefrontOutlined />,
};

type PageCard = { title: string; text: string; icon: string; accent: string };

const DEFAULT_CARDS: PageCard[] = [
  {
    title: 'Pet food distributors',
    text: 'Dog food and cat food distributors — dry, wet, kitten and therapeutic diets.',
    icon: 'food',
    accent: 'indigo',
  },
  {
    title: 'Cat litter distributors',
    text: 'Clumping, silica, tofu and natural litter brands looking for national reach.',
    icon: 'litter',
    accent: 'magenta',
  },
  {
    title: 'Grooming distributors',
    text: 'Dog and cat shampoo, conditioners, coat care and grooming tools.',
    icon: 'grooming',
    accent: 'green',
  },
  {
    title: 'Treats, toys & accessories',
    text: 'Treats and chews, toys, collars, leashes, harnesses and everyday goods.',
    icon: 'treats',
    accent: 'indigo',
  },
];

// Why a brand should bother — one line each, under the category list.
const PARTNER_POINTS = [
  '700+ pet retailers, breeders, clinics and boarding homes already order here.',
  'Live inventory, GST invoicing and shipment tracking are handled for you.',
  'No listing fee — we buy and distribute, so you sell to one account, not hundreds.',
];

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

/** Same field set and order as the billing/shipping blocks on the customer
 *  onboarding modal, laid out on a CSS grid that collapses to one column. */
const AddressFields = ({
  value,
  onChange,
  cities,
  citiesLoading,
  idPrefix,
}: {
  value: Address;
  onChange: (field: keyof Address, next: string) => void;
  cities: string[];
  citiesLoading: boolean;
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
          {INDIAN_STATES.map((state) => (
            <MenuItem key={state} value={state}>
              {state}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
    {/* At `md` the form sits in a ~520px rail, so three fields on one row would
        crowd; they only go three-up once there is room at `lg`. */}
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

const DistributorsPage = () => {
  const apiBase = `${process.env.api_url}`;

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [cards, setCards] = useState<PageCard[]>(DEFAULT_CARDS);
  const [cities, setCities] = useState<string[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);

  // Step 0 — phone verification
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [token, setToken] = useState('');
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

  // Admin-managed cards; the hard-coded set stays on screen if this fails.
  useEffect(() => {
    axios
      .get(`${apiBase}/distributor_registrations/cards`)
      .then((res) => {
        if (Array.isArray(res.data?.cards) && res.data.cards.length) setCards(res.data.cards);
      })
      .catch(() => {});
  }, [apiBase]);

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

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => stopPolling, []);

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
        const res = await axios.get(`${apiBase}/distributor_registrations/otp/status`, {
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
      await axios.post(`${apiBase}/distributor_registrations/otp/request`, { phone: phone10 });
      trackEvent('generate_lead', { form_name: 'distributor_otp_request' });
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
      const res = await axios.post(`${apiBase}/distributor_registrations/otp/verify`, {
        phone: phone10,
        code,
      });
      stopPolling();
      setReachWarning('');
      setToken(res.data.verificationToken);
      // Pre-fill the address phone with the number we just verified.
      setBilling((prev) => ({ ...prev, phone: prev.phone || phone10 }));
      toast.success('Mobile number verified');
      setStep(1);
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
      await axios.post(`${apiBase}/distributor_registrations`, {
        ...form,
        phone: phone10,
        billingAddress: { ...billing, country: 'India' },
        shipFromAddress: { ...shipFrom, country: 'India' },
        categories,
        distributionStates: states,
        verificationToken: token,
      });
      trackEvent('generate_lead', { form_name: 'distributor_registration' });
      setSubmitted(true);
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Could not submit your application');
      if (err?.response?.status === 401) {
        // Token expired mid-form — send them back to re-verify.
        setToken('');
        setStep(0);
        setCodeSent(false);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Become a Distribution Partner | Pupscribe Marketplace</title>
        <meta
          name='description'
          content='Pupscribe is onboarding pet food distributors, dog and cat food distributors, cat litter distributors and grooming — dog/cat shampoo — distributors across India, plus any other pet category. Register your brand to distribute through the Pupscribe Marketplace.'
        />
        <link rel='canonical' href='https://marketplace.pupscribe.in/distributors' />
        <meta property='og:type' content='website' />
        <meta property='og:url' content='https://marketplace.pupscribe.in/distributors' />
        <meta property='og:title' content='Become a Distribution Partner | Pupscribe Marketplace' />
        <meta
          property='og:description'
          content='Register your brand with Pupscribe — we are looking for pet food, dog/cat food, cat litter and grooming distributors across India.'
        />
      </Head>

      <Box sx={{ width: '100%', maxWidth: 1180, mx: 'auto', px: { xs: 2, sm: 3 }, py: { xs: 3.5, md: 6 } }}>
        {/* ── Hero + form, side by side ─────────────────────────────────────
            The form is the point of the page, so it sits in the first screen
            rather than below a full-width pitch. On `md` and up the pitch takes
            the left rail and the form the right; below that they stack, pitch
            first (it is what makes someone want to fill the form in). */}
        <Box
          component='section'
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1.05fr)' },
            gap: { xs: 4, md: 6, lg: 8 },
            alignItems: 'start',
          }}
        >
          {/* Left rail — the pitch */}
          <Box sx={{ pt: { md: 1 } }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.9,
                px: 1.4,
                py: 0.5,
                borderRadius: '999px',
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                mb: 2,
              }}
            >
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: accent('magenta') }} />
              <Typography
                component='span'
                sx={{
                  fontWeight: 600,
                  fontSize: 11.5,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'text.secondary',
                }}
              >
                Now onboarding
              </Typography>
            </Box>

            <Typography
              variant='h1'
              component='h1'
              sx={{
                fontWeight: 700,
                fontSize: 'clamp(28px, 3.6vw, 42px)',
                lineHeight: 1.14,
                letterSpacing: '-0.022em',
                color: 'text.primary',
              }}
            >
              Become a Pupscribe distribution partner
            </Typography>
            <Typography
              sx={{ fontSize: { xs: 15.5, md: 16.5 }, lineHeight: 1.6, color: 'text.secondary', mt: 2 }}
            >
              We are currently looking for a few distributors to join the Pupscribe
              Marketplace — <strong>pet food</strong>, <strong>dog and cat food</strong>,{' '}
              <strong>cat litter</strong> and <strong>grooming (dog/cat shampoo)</strong>.
              Register your brand and our team will get in touch.
            </Typography>
            {/* The four above are what we are actively recruiting, not a
                whitelist — the category field takes free text, and saying so
                here stops a pet-pharma or bowls brand bouncing off the page. */}
            <Typography sx={{ fontSize: 15, lineHeight: 1.6, color: 'text.secondary', mt: 1.5 }}>
              In another pet category? Still register — these are the ones we are
              pushing hardest right now, not the only ones we take on.
            </Typography>

            {/* What we are looking for — a compact list rather than a card grid,
                so it reads as supporting detail beside the form instead of a
                second full-width section pushing it down. Managed in /admin/leads. */}
            {cards.length > 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.25, mt: { xs: 3.5, md: 4 } }}>
                {cards.map((item) => (
                  <Box key={item.title} sx={{ display: 'flex', gap: 1.75, alignItems: 'flex-start' }}>
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: '11px',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: accentTile((item.accent as AccentKey) || 'indigo'),
                        color: accent((item.accent as AccentKey) || 'indigo'),
                        '& svg': { fontSize: 20 },
                      }}
                    >
                      {CARD_ICONS[item.icon] ?? CARD_ICONS.pets}
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 600, fontSize: 15.5, lineHeight: 1.35 }} color='text.primary'>
                        {item.title}
                      </Typography>
                      <Typography sx={{ fontSize: 14, lineHeight: 1.5, mt: 0.25 }} color='text.secondary'>
                        {item.text}
                      </Typography>
                    </Box>
                  </Box>
                ))}

                {/* Closes the list so it never reads as an exhaustive set. */}
                <Box sx={{ display: 'flex', gap: 1.75, alignItems: 'flex-start' }}>
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: '11px',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px dashed',
                      borderColor: 'divider',
                      color: 'text.disabled',
                      fontSize: 18,
                      fontWeight: 600,
                      lineHeight: 1,
                    }}
                  >
                    +
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: 15.5, lineHeight: 1.35 }} color='text.primary'>
                      Any other pet category
                    </Typography>
                    <Typography sx={{ fontSize: 14, lineHeight: 1.5, mt: 0.25 }} color='text.secondary'>
                      Pharma, supplements, bowls, beds, pet furniture — if it belongs
                      in a pet store, tell us about it.
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}

            {/* Three reasons to bother, kept to one line each. */}
            <Box
              sx={{
                mt: { xs: 3.5, md: 4 },
                pt: 3,
                borderTop: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
                gap: 1.25,
              }}
            >
              {PARTNER_POINTS.map((point) => (
                <Box key={point} sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
                  <CheckCircleOutlined sx={{ fontSize: 18, color: accent('green'), mt: 0.25, flexShrink: 0 }} />
                  <Typography sx={{ fontSize: 14.5, lineHeight: 1.5 }} color='text.secondary'>
                    {point}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Right rail — the form. Sticks to the viewport on tall screens so a
              long state list never scrolls the pitch out of reach. */}
          <Paper
            id='register'
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
              position: { md: 'sticky' },
              top: { md: 88 },
            }}
          >
            {submitted ? (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <CheckCircleOutlined sx={{ fontSize: 56, color: accent('green'), mb: 2 }} />
                <Typography variant='h5' fontWeight={700} color='text.primary' mb={1}>
                  Application received
                </Typography>
                <Typography color='text.secondary' sx={{ maxWidth: 420, mx: 'auto' }}>
                  Thank you — our distribution team will review your details and get
                  in touch on {`+91 ${phone10}`} shortly.
                </Typography>
              </Box>
            ) : (
              <>
                <Box mb={3}>
                  <Typography variant='h5' fontWeight={700} color='text.primary' mb={0.75}>
                    Register your brand
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Takes about two minutes. We verify your mobile number on WhatsApp
                    first so our team can reach you.
                  </Typography>
                </Box>

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
                      options={CATEGORIES}
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
                          helperText='Pick what applies, or type your own category and press Enter — we take brands outside the list too.'
                          sx={inputSx}
                        />
                      )}
                    />

                    <Autocomplete
                      multiple
                      disableCloseOnSelect
                      options={INDIAN_STATES}
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
                        setStates(states.length === INDIAN_STATES.length ? [] : [...INDIAN_STATES])
                      }
                      sx={{ alignSelf: 'flex-start', textTransform: 'none', mt: -1.5 }}
                    >
                      {states.length === INDIAN_STATES.length ? 'Clear all states' : 'Select all India'}
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
                        {loading ? <CircularProgress size={22} color='inherit' /> : 'Submit application'}
                      </Button>
                    </Box>
                  </Box>
                )}
              </>
            )}
          </Paper>
        </Box>
      </Box>
    </>
  );
};

export default DistributorsPage;
