'use client';
import { useContext, useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Container,
  useTheme,
  useMediaQuery,
  Paper,
  TextField,
  Button,
  Divider,
  Alert,
  AlertTitle,
  MenuItem,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import AuthContext from '../../../src/components/Auth';
import { Person, Email, Phone, Business, Receipt, UploadFile } from '@mui/icons-material';
import { toast } from 'react-toastify';
import axiosInstance from '../../../src/util/axios';
import ContactSupport from '../../../src/components/ContactSupport';
import { trackActivity } from '../../../src/util/trackActivity';

const INDIAN_STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
  'Chandigarh', 'Chhattisgarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir', 'Jharkhand', 'Karnataka',
  'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

const emptyAddress = { attention: '', address: '', street2: '', city: '', state: '', zip: '', phone: '' };

const CustomerAccount = () => {
  const { user }: any = useContext(AuthContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const userData = user || {};
  const isSelfRegistered = Boolean(userData.self_registered);
  const hasCustomer = Boolean(userData.customer_id);
  // Editable only for self-registered customers who aren't linked to a Zoho
  // customer yet. Everyone with a customer_id sees a read-only view.
  const editable = isSelfRegistered && !hasCustomer;

  useEffect(() => {
    if (user) trackActivity({ action: 'view_account', category: 'portal' });
  }, [user]);

  const [loadingData, setLoadingData] = useState(true);

  // ── Read-only customer record (has customer_id) ───────────────────────────────
  const [customer, setCustomer] = useState<any>(null);
  const [selectedAddrIdx, setSelectedAddrIdx] = useState(0);

  // ── Editable form state (self-registered, not yet linked) ─────────────────────
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [requestStatus, setRequestStatus] = useState('');
  const rejected = requestStatus === 'rejected';
  const [form, setForm] = useState({
    shop_name: '',
    customer_name: '',
    email: '',
    gst_no: '',
    pan_card_no: '',
    multiple_branches: 'no',
  });
  const [billing, setBilling] = useState({ ...emptyAddress });
  const [shipping, setShipping] = useState({ ...emptyAddress });
  const [shipSame, setShipSame] = useState(true);
  const [docs, setDocs] = useState<{ gst?: string; pan?: string; aadhar?: string }>({});
  const [uploading, setUploading] = useState<string | null>(null);

  const setField = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const needsTaxId = !form.gst_no.trim() && !form.pan_card_no.trim();

  const uploadDoc = async (
    file: File,
    docType: 'gst_certificate' | 'pan_card' | 'aadhar',
    key: 'gst' | 'pan' | 'aadhar',
  ) => {
    setUploading(key);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('doc_type', docType);
      const res = await axiosInstance.post('/customer_creation_requests/upload-document', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setDocs((d) => ({ ...d, [key]: res.data.url }));
      toast.success('Document uploaded');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(null);
    }
  };

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      try {
        if (hasCustomer) {
          const res = await axiosInstance.get('/customer_creation_requests/my-customer');
          if (active) setCustomer(res.data.customer);
        } else if (isSelfRegistered) {
          const res = await axiosInstance.get('/customer_creation_requests/mine');
          const req = res.data.request;
          if (active && req) {
            setSubmitted(true);
            setRequestStatus(req.status || '');
            setForm({
              shop_name: req.shop_name || '',
              customer_name: req.customer_name || '',
              email: req.email || '',
              gst_no: req.gst_no || '',
              pan_card_no: req.pan_card_no || '',
              multiple_branches: req.multiple_branches || 'no',
            });
            if (req.billing_address) setBilling({ ...emptyAddress, ...req.billing_address });
            if (req.shipping_address) {
              setShipping({ ...emptyAddress, ...req.shipping_address });
              setShipSame(JSON.stringify(req.billing_address) === JSON.stringify(req.shipping_address));
            }
            setDocs({
              gst: req.gst_certificate_url || undefined,
              pan: req.pan_card_url || undefined,
              aadhar: req.aadhar_url || undefined,
            });
          }
        }
      } catch {
        // no data yet — fine
      } finally {
        if (active) setLoadingData(false);
      }
    })();
    return () => { active = false; };
  }, [user, hasCustomer, isSelfRegistered]);

  const handleSubmitDetails = async (e: any) => {
    e.preventDefault();
    if (!form.shop_name || !form.customer_name || !form.email) {
      toast.error('Shop name, your name and email are required');
      return;
    }
    if (needsTaxId) {
      toast.error('Provide either a GSTIN or a PAN — at least one is required to purchase');
      return;
    }
    if (!billing.address || !billing.city || !billing.state || !billing.zip || !billing.phone) {
      toast.error('Please complete the billing address (address, city, state, pincode, phone)');
      return;
    }
    const ship = shipSame ? billing : shipping;
    if (!ship.state || !ship.zip) {
      toast.error('Please complete the shipping address state and pincode');
      return;
    }
    setSaving(true);
    try {
      await axiosInstance.post('/customer_creation_requests/self-service', {
        shop_name: form.shop_name,
        customer_name: form.customer_name,
        email: form.email,
        gst_no: form.gst_no || null,
        pan_card_no: form.pan_card_no || null,
        multiple_branches: form.multiple_branches,
        billing_address: { ...billing, country: 'India' },
        shipping_address: { ...ship, country: 'India' },
        gst_certificate_url: docs.gst || null,
        pan_card_url: docs.pan || null,
        aadhar_url: docs.aadhar || null,
      });
      toast.success('Details submitted — awaiting approval');
      setSubmitted(true);
      setRequestStatus('pending');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Could not submit details');
    } finally {
      setSaving(false);
    }
  };

  const addressFields = (addr: typeof emptyAddress, set: (a: typeof emptyAddress) => void) => (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
      <TextField label='Address line 1' required value={addr.address} onChange={(e) => set({ ...addr, address: e.target.value })} sx={{ gridColumn: { sm: '1 / -1' } }} />
      <TextField label='Address line 2' value={addr.street2} onChange={(e) => set({ ...addr, street2: e.target.value })} sx={{ gridColumn: { sm: '1 / -1' } }} />
      <TextField label='City' required value={addr.city} onChange={(e) => set({ ...addr, city: e.target.value })} />
      <TextField label='State' required select value={addr.state} onChange={(e) => set({ ...addr, state: e.target.value })}>
        {INDIAN_STATES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
      </TextField>
      <TextField label='Pincode' required value={addr.zip} onChange={(e) => set({ ...addr, zip: e.target.value })} />
      <TextField label='Contact phone' required value={addr.phone} onChange={(e) => set({ ...addr, phone: e.target.value })} />
      <TextField label='Attention (optional)' value={addr.attention} onChange={(e) => set({ ...addr, attention: e.target.value })} sx={{ gridColumn: { sm: '1 / -1' } }} />
    </Box>
  );

  const renderAddress = (addr: typeof emptyAddress) => (
    <Box sx={{ color: 'text.primary' }}>
      {addr.attention && <Typography variant='body2' fontWeight={600}>{addr.attention}</Typography>}
      <Typography variant='body2' color='text.secondary' sx={{ whiteSpace: 'pre-line' }}>
        {[
          addr.address,
          addr.street2,
          [addr.city, addr.state, addr.zip].filter(Boolean).join(', '),
          addr.phone ? `Phone: ${addr.phone}` : '',
        ].filter(Boolean).join('\n') || 'Not provided'}
      </Typography>
    </Box>
  );

  const ReadField = ({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) => (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Box sx={{ color: 'text.secondary', mr: 1 }}>{icon}</Box>
        <Typography variant='body2' color='text.secondary'>{label}</Typography>
      </Box>
      <Typography variant='body1' fontWeight={500} sx={{ pl: 4 }}>{value || 'Not provided'}</Typography>
    </Box>
  );

  const cardSx = {
    p: { xs: 2, md: 3 },
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'grey.50',
    border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 4,
  } as const;

  const addresses: any[] = customer?.addresses || [];
  const selectedAddr = addresses[selectedAddrIdx];

  return (
    <Container maxWidth='lg' sx={{ py: { xs: 1.5, md: 4 }, px: { xs: 1.5, sm: 2, md: 3 } }}>
      <Paper
        elevation={0}
        sx={{ backgroundColor: 'background.paper', borderRadius: { xs: 3, md: 4 }, overflow: 'hidden', minHeight: '80vh', border: `1px solid ${theme.palette.divider}` }}
      >
        {/* Header */}
        <Box
          sx={{
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`
              : 'linear-gradient(135deg, #1a365d 0%, #2d4a6f 100%)',
            color: 'white', padding: { xs: 2.5, sm: 3, md: 4 },
          }}
        >
          <Typography variant={isMobile ? 'h5' : 'h4'} sx={{ fontWeight: 700, mb: 1 }}>My Account</Typography>
          <Typography variant='body1' sx={{ opacity: 0.9 }}>
            {editable ? 'Complete your business details to start ordering' : 'View your account information'}
          </Typography>
        </Box>

        <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          {loadingData ? (
            <Box sx={{ textAlign: 'center', py: 8 }}><CircularProgress /></Box>
          ) : editable && submitted && !rejected ? (
            /* ───────────── Submitted — locked, read-only summary ───────────── */
            <>
              <Typography variant='h6' fontWeight={600} sx={{ mb: 2 }}>Business Details</Typography>
              <Alert severity='info' sx={{ mb: 3, borderRadius: 2 }}>
                <AlertTitle>Awaiting approval</AlertTitle>
                Your details have been submitted and can’t be edited. We’ll activate your account shortly —
                to make any changes, please contact your sales representative or administrator.
              </Alert>
              <Paper elevation={0} sx={cardSx}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                  <ReadField icon={<Business fontSize='small' />} label='Business name' value={form.shop_name} />
                  <ReadField icon={<Person fontSize='small' />} label='Contact name' value={form.customer_name} />
                  <ReadField icon={<Email fontSize='small' />} label='Email' value={form.email} />
                  <ReadField icon={<Phone fontSize='small' />} label='Registered mobile' value={userData.phone} />
                  <ReadField icon={<Receipt fontSize='small' />} label='GSTIN' value={form.gst_no} />
                  <ReadField icon={<Receipt fontSize='small' />} label='PAN' value={form.pan_card_no} />
                  <ReadField icon={<Business fontSize='small' />} label='Multiple branches' value={form.multiple_branches === 'yes' ? 'Yes' : 'No'} />
                </Box>
              </Paper>

              <Typography variant='h6' fontWeight={600} sx={{ mb: 2 }}>Billing address</Typography>
              <Paper elevation={0} sx={cardSx}>{renderAddress(billing)}</Paper>
              <Typography variant='h6' fontWeight={600} sx={{ mb: 2 }}>Shipping address</Typography>
              <Paper elevation={0} sx={cardSx}>{renderAddress(shipSame ? billing : shipping)}</Paper>

              {(docs.gst || docs.pan || docs.aadhar) && (
                <>
                  <Typography variant='h6' fontWeight={600} sx={{ mb: 2 }}>Documents</Typography>
                  <Paper elevation={0} sx={cardSx}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {docs.gst && <a href={docs.gst} target='_blank' rel='noopener noreferrer'>GST Certificate</a>}
                      {docs.pan && <a href={docs.pan} target='_blank' rel='noopener noreferrer'>PAN Card</a>}
                      {docs.aadhar && <a href={docs.aadhar} target='_blank' rel='noopener noreferrer'>Aadhaar</a>}
                    </Box>
                  </Paper>
                </>
              )}
            </>
          ) : editable ? (
            /* ───────────── Editable business-details form (first submission or after rejection) ───────────── */
            <>
              <Typography variant='h6' fontWeight={600} sx={{ mb: 1 }}>Business Details</Typography>
              {rejected ? (
                <Alert severity='warning' sx={{ mb: 3, borderRadius: 2 }}>
                  <AlertTitle>Your details weren’t approved</AlertTitle>
                  Please review and update your business details below, then resubmit — we’ll take another look.
                </Alert>
              ) : (
                <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
                  Enter your shop and tax details below. These can’t be changed once submitted, so please
                  double-check them. Once approved by our team, you can start placing orders.
                </Typography>
              )}

              <Box component='form' onSubmit={handleSubmitDetails} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TextField label='Registered mobile' value={userData.phone || ''} disabled helperText='This is your login number and contact number' />
                <TextField label='Shop / business name' required value={form.shop_name} onChange={(e) => setField('shop_name', e.target.value)} />
                <TextField label='Your name' required value={form.customer_name} onChange={(e) => setField('customer_name', e.target.value)} />
                <TextField label='Email' type='email' required value={form.email} onChange={(e) => setField('email', e.target.value)} />

                <Divider><Typography variant='caption' color='text.secondary'>Tax details — GSTIN or PAN required</Typography></Divider>
                <TextField label='GSTIN' value={form.gst_no} onChange={(e) => setField('gst_no', e.target.value.toUpperCase())} error={needsTaxId} />
                <TextField label='PAN' value={form.pan_card_no} onChange={(e) => setField('pan_card_no', e.target.value.toUpperCase())} error={needsTaxId} helperText={needsTaxId ? 'Enter a GSTIN or a PAN' : ' '} />

                <TextField label='Do you have multiple branches?' select value={form.multiple_branches} onChange={(e) => setField('multiple_branches', e.target.value)}>
                  <MenuItem value='no'>No</MenuItem>
                  <MenuItem value='yes'>Yes</MenuItem>
                </TextField>

                <Divider><Typography variant='caption' color='text.secondary'>Billing address</Typography></Divider>
                {addressFields(billing, setBilling)}

                <FormControlLabel
                  control={<Checkbox checked={shipSame} onChange={(e) => setShipSame(e.target.checked)} />}
                  label='Shipping address same as billing'
                />
                {!shipSame && (
                  <>
                    <Divider><Typography variant='caption' color='text.secondary'>Shipping address</Typography></Divider>
                    {addressFields(shipping, setShipping)}
                  </>
                )}

                <Divider><Typography variant='caption' color='text.secondary'>Documents (optional)</Typography></Divider>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
                  {([
                    { key: 'gst', docType: 'gst_certificate', label: 'GST Certificate' },
                    { key: 'pan', docType: 'pan_card', label: 'PAN Card' },
                    { key: 'aadhar', docType: 'aadhar', label: 'Aadhaar' },
                  ] as const).map(({ key, docType, label }) => (
                    <Box key={key} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Button
                        component='label'
                        variant='outlined'
                        startIcon={<UploadFile fontSize='small' />}
                        disabled={uploading === key}
                        sx={{ textTransform: 'none', borderRadius: '10px', justifyContent: 'flex-start' }}
                      >
                        {uploading === key ? 'Uploading…' : (docs as any)[key] ? `${label} ✓` : label}
                        <input
                          type='file'
                          hidden
                          accept='image/*,application/pdf'
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) uploadDoc(f, docType, key);
                            e.target.value = '';
                          }}
                        />
                      </Button>
                      {(docs as any)[key] && (
                        <a href={(docs as any)[key]} target='_blank' rel='noopener noreferrer' style={{ fontSize: 12 }}>
                          View uploaded file
                        </a>
                      )}
                    </Box>
                  ))}
                </Box>

                <Button type='submit' variant='contained' size='large' disabled={saving} sx={{ textTransform: 'none', py: 1.5, borderRadius: '10px', fontWeight: 600, minHeight: 48, mt: 1, alignSelf: { sm: 'flex-start' }, px: 4 }}>
                  {saving ? <CircularProgress size={22} color='inherit' /> : 'Submit for approval'}
                </Button>
              </Box>
            </>
          ) : hasCustomer ? (
            /* ───────────── Read-only customer record + addresses ───────────── */
            <>
              <Typography variant='h6' fontWeight={600} sx={{ mb: 3 }}>Business Details</Typography>
              <Paper elevation={0} sx={cardSx}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                  <ReadField icon={<Business fontSize='small' />} label='Business name' value={customer?.company_name} />
                  <ReadField icon={<Person fontSize='small' />} label='Contact name' value={customer?.contact_name} />
                  <ReadField icon={<Email fontSize='small' />} label='Email' value={customer?.email || userData.email} />
                  <ReadField icon={<Phone fontSize='small' />} label='Phone' value={customer?.phone || userData.phone} />
                  <ReadField icon={<Receipt fontSize='small' />} label='GSTIN' value={customer?.gst_no} />
                  <ReadField icon={<Receipt fontSize='small' />} label='PAN' value={customer?.pan_no} />
                </Box>
              </Paper>

              <Typography variant='h6' fontWeight={600} sx={{ mb: 2 }}>Addresses</Typography>
              {addresses.length === 0 ? (
                <Alert severity='info' sx={{ borderRadius: 2 }}>No addresses on file yet.</Alert>
              ) : (
                <Paper elevation={0} sx={cardSx}>
                  <FormControl fullWidth size='small' sx={{ mb: 2, maxWidth: 420 }}>
                    <InputLabel id='addr-select-label'>Select address</InputLabel>
                    <Select
                      labelId='addr-select-label'
                      label='Select address'
                      value={selectedAddrIdx}
                      onChange={(e) => setSelectedAddrIdx(Number(e.target.value))}
                    >
                      {addresses.map((a, i) => (
                        <MenuItem key={a.address_id || i} value={i}>
                          {[a.attention, a.address, a.city].filter(Boolean).join(', ') || `Address ${i + 1}`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {selectedAddr && (
                    <Box sx={{ pl: 0.5, color: 'text.primary' }}>
                      {selectedAddr.attention && <Typography variant='body2' fontWeight={600}>{selectedAddr.attention}</Typography>}
                      <Typography variant='body2' color='text.secondary' sx={{ whiteSpace: 'pre-line' }}>
                        {[
                          selectedAddr.address,
                          selectedAddr.street2,
                          [selectedAddr.city, selectedAddr.state, selectedAddr.zip].filter(Boolean).join(', '),
                          selectedAddr.country,
                          selectedAddr.phone ? `Phone: ${selectedAddr.phone}` : '',
                        ].filter(Boolean).join('\n')}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              )}

              <Alert severity='info' sx={{ borderRadius: 2 }}>
                To update your business details or addresses, please contact your sales representative or administrator.
              </Alert>
            </>
          ) : (
            /* ───────────── Internal customer without a linked record ───────────── */
            <>
              <Typography variant='h6' fontWeight={600} sx={{ mb: 3 }}>Account Information</Typography>
              <Paper elevation={0} sx={cardSx}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                  <ReadField icon={<Person fontSize='small' />} label='Name' value={userData.name || [userData.first_name, userData.last_name].filter(Boolean).join(' ')} />
                  <ReadField icon={<Email fontSize='small' />} label='Email' value={userData.email} />
                  <ReadField icon={<Phone fontSize='small' />} label='Phone' value={userData.phone} />
                </Box>
              </Paper>
              <Alert severity='info' sx={{ borderRadius: 2 }}>
                To update your account information, please contact your sales representative or administrator.
              </Alert>
            </>
          )}

          {!loadingData && (
            <ContactSupport context={userData.phone ? `Mobile: ${userData.phone}` : undefined} />
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default CustomerAccount;
