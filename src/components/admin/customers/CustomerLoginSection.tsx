import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  TextField,
  Tooltip,
  Typography,
  IconButton,
  Alert,
} from '@mui/material';
import {
  VpnKey as KeyIcon,
  Refresh as RefreshIcon,
  ContentCopy as ContentCopyIcon,
  WhatsApp as WhatsAppIcon,
  PersonAdd as PersonAddIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axiosInstance from '../../../util/axios';
import { normalizeIndianMobile } from '../../../util/phone';

const LOGIN_URL = 'https://marketplace.pupscribe.in/login';

interface CustomerLogin {
  _id: string;
  name?: string;
  email?: string;
  phone?: number | string;
  status?: string;
  has_password?: boolean;
  phone_info?: PhoneInfo;
  created_by_salesperson?: boolean;
}

interface PhoneInfo {
  phone: string | null;
  valid: boolean;
  reason: string;
}

/** An account that already claims the mobile or email being used. */
interface LoginConflict {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  status?: string;
  customer_id?: string | null;
  customer_name?: string | null;
  same_customer?: boolean;
  conflict_on: string[];
}

interface PhoneCheck {
  available: boolean;
  phone: PhoneInfo;
  conflicts: LoginConflict[];
}

const EMPTY_FORM = { name: '', email: '', phone: '', password: '' };

/**
 * Create and share marketplace logins for a customer, from the customer record
 * itself. A customer can hold several logins — one per number/contact person —
 * which is how a shop whose primary number is already taken still gets access.
 */
const CustomerLoginSection: React.FC<{ contactId: string }> = ({ contactId }) => {
  const [loading, setLoading] = useState(true);
  const [logins, setLogins] = useState<CustomerLogin[]>([]);
  const [customer, setCustomer] = useState<any>(null);
  const [conflicts, setConflicts] = useState<LoginConflict[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  // Holds the _id being sent, so only that row shows a spinner.
  const [sending, setSending] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  // Password of the login created in THIS session, keyed by its _id — it is
  // unknowable once the drawer is reopened.
  const [createdPassword, setCreatedPassword] = useState<{ id: string; password: string } | null>(
    null
  );
  const [phoneCheck, setPhoneCheck] = useState<PhoneCheck | null>(null);
  const [checking, setChecking] = useState(false);

  const fetchLogin = useCallback(async () => {
    if (!contactId) return;
    setLoading(true);
    try {
      const { data } = await axiosInstance.get(`/admin/users/customer-login/${contactId}`);
      const list: CustomerLogin[] = data.logins || [];
      setLogins(list);
      setCustomer(data.customer);
      setConflicts(data.conflicts || []);
      if (!list.length) {
        setShowForm(true);
        setForm({
          name: data.customer?.contact_name || data.customer?.name || '',
          email: data.customer?.email || '',
          phone: data.customer?.raw_phone ? String(data.customer.raw_phone) : '',
          password: '',
        });
      } else {
        setShowForm(false);
      }
    } catch (error: any) {
      console.error('Error loading customer login:', error);
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    setCreatedPassword(null);
    fetchLogin();
  }, [fetchLogin]);

  const formPhoneInfo = useMemo(() => normalizeIndianMobile(form.phone), [form.phone]);

  // Check the typed number against every existing account before the POST —
  // this is what tells the admin "try the customer's other number".
  useEffect(() => {
    if (!showForm || !formPhoneInfo.valid) {
      setPhoneCheck(null);
      return;
    }
    let cancelled = false;
    setChecking(true);
    const timer = setTimeout(async () => {
      try {
        const { data } = await axiosInstance.get(
          `/admin/users/customer-login/${contactId}/check-phone`,
          { params: { phone: form.phone, email: form.email.trim() || undefined } }
        );
        if (!cancelled) setPhoneCheck(data);
      } catch {
        if (!cancelled) setPhoneCheck(null);
      } finally {
        if (!cancelled) setChecking(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      setChecking(false);
    };
  }, [contactId, form.phone, form.email, formPhoneInfo.valid, showForm]);

  const openAddForm = () => {
    // Blank number on purpose: the point of a second login is a DIFFERENT number.
    setForm({
      name: customer?.contact_name || customer?.name || '',
      email: '',
      phone: '',
      password: '',
    });
    setPhoneCheck(null);
    setShowForm(true);
  };

  const handleGeneratePassword = async () => {
    setGenerating(true);
    try {
      const { data } = await axiosInstance.get('/admin/users/generate-password');
      setForm((prev) => ({ ...prev, password: data.password }));
    } catch {
      toast.error('Failed to generate password');
    } finally {
      setGenerating(false);
    }
  };

  const handleCreate = async () => {
    if (!formPhoneInfo.valid) {
      toast.error(formPhoneInfo.reason);
      return;
    }
    if (form.password.trim() && !form.email.trim()) {
      toast.error('An email is needed to set a password');
      return;
    }
    setCreating(true);
    try {
      const { data } = await axiosInstance.post(`/admin/users/customer-login/${contactId}`, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone,
        password: form.password || undefined,
      });
      if (form.password) {
        setCreatedPassword({ id: data.login._id, password: form.password });
      }
      toast.success(data.message);
      setShowForm(false);
      setForm(EMPTY_FORM);
      setPhoneCheck(null);
      fetchLogin();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Failed to create login');
    } finally {
      setCreating(false);
    }
  };

  const handleSend = async (userId: string) => {
    setSending(userId);
    try {
      const { data } = await axiosInstance.post(
        `/admin/users/customer-login/${contactId}/send`,
        null,
        { params: { user_id: userId } }
      );
      toast.success(data.message);
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Failed to send WhatsApp message');
    } finally {
      setSending(null);
    }
  };

  const handleCopy = (login: CustomerLogin) => {
    const lines = [
      'Your Pupscribe marketplace account is ready.',
      '',
      `Login Link: ${LOGIN_URL}`,
    ];
    if (login.email) lines.push(`Email: ${login.email}`);
    if (createdPassword?.id === login._id) lines.push(`Password: ${createdPassword.password}`);
    navigator.clipboard.writeText(lines.join('\n')).then(
      () => toast.success('Credentials copied'),
      () => toast.error('Failed to copy')
    );
  };

  const renderConflicts = (items: LoginConflict[], title: string, note: string) => (
    <Alert severity="error" sx={{ mb: 2 }}>
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
        {title}
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {items.map((conflict) => (
          <Box key={conflict._id}>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {conflict.name || conflict.email || conflict.phone}
              </Typography>
              {conflict.role && <Chip size="small" label={conflict.role} />}
              {conflict.conflict_on.map((field) => (
                <Chip
                  key={field}
                  size="small"
                  color="error"
                  variant="outlined"
                  label={`same ${field}`}
                />
              ))}
              {conflict.same_customer && (
                <Chip size="small" variant="outlined" label="this customer" />
              )}
            </Box>
            <Typography variant="caption" color="text.secondary">
              {[
                conflict.email,
                conflict.phone,
                conflict.customer_name
                  ? `linked to ${conflict.customer_name}`
                  : conflict.customer_id
                    ? `linked to ${conflict.customer_id}`
                    : 'not linked to a customer',
              ]
                .filter(Boolean)
                .join(' · ')}
            </Typography>
          </Box>
        ))}
      </Box>
      <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
        {note}
      </Typography>
    </Alert>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  const blockedByPhone = !!phoneCheck && !phoneCheck.available;

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Marketplace Login
      </Typography>

      {/* Someone else holds the customer's own number/email — shown even before
          the form is opened, since it explains why the obvious number won't work. */}
      {!logins.length &&
        conflicts.length > 0 &&
        renderConflicts(
          conflicts,
          `${conflicts.length === 1 ? 'Another account already uses' : 'Other accounts already use'} this customer's details`,
          'Use one of the customer’s other numbers below, or fix the number on the other account — two accounts on one mobile make OTP login ambiguous.'
        )}

      {logins.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
          {logins.map((item) => {
            const itemPhone = item.phone_info?.phone || String(item.phone ?? '-');
            const itemPhoneValid = item.phone_info?.valid ?? false;
            const shownPassword =
              createdPassword?.id === item._id ? createdPassword.password : null;
            return (
              <Paper key={item._id} variant="outlined" sx={{ p: 1.5 }}>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    gap: 1.5,
                  }}
                >
                  <Box>
                    <Typography variant="caption" color="text.secondary">Name</Typography>
                    <Typography variant="body2">{item.name || '-'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Email</Typography>
                    <Typography variant="body2">{item.email || '— (OTP only)'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Mobile</Typography>
                    <Typography variant="body2" color={itemPhoneValid ? 'text.primary' : 'error.main'}>
                      {itemPhone}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Sign-in</Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.25, flexWrap: 'wrap' }}>
                      <Chip
                        size="small"
                        label={item.status}
                        color={item.status === 'active' ? 'success' : 'default'}
                      />
                      <Chip
                        size="small"
                        variant="outlined"
                        label={item.has_password ? 'Password + OTP' : 'OTP only'}
                      />
                      {item.created_by_salesperson && (
                        <Chip size="small" variant="outlined" label="by salesperson" />
                      )}
                    </Box>
                  </Box>
                </Box>

                {/* The password is only knowable in the session that set it. */}
                {shownPassword && (
                  <Paper variant="outlined" sx={{ p: 1.5, mt: 1.5 }}>
                    <Typography variant="body2" fontFamily="monospace" whiteSpace="pre-line">
                      {`Login Link: ${LOGIN_URL}\nEmail: ${item.email}\nPassword: ${shownPassword}`}
                    </Typography>
                  </Paper>
                )}

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1.5 }}>
                  <Tooltip
                    title={
                      itemPhoneValid
                        ? 'Sends the approved WhatsApp template from our number'
                        : item.phone_info?.reason || 'Unusable mobile number'
                    }
                  >
                    <span>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        disabled={sending === item._id || !itemPhoneValid}
                        startIcon={
                          sending === item._id ? <CircularProgress size={16} /> : <WhatsAppIcon />
                        }
                        onClick={() => handleSend(item._id)}
                      >
                        Send login link
                      </Button>
                    </span>
                  </Tooltip>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<ContentCopyIcon />}
                    onClick={() => handleCopy(item)}
                  >
                    Copy credentials
                  </Button>
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}

      {showForm ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {logins.length
              ? 'Add another login on a different mobile number — useful when the shop has several contacts, or when the first number is already taken by another account.'
              : 'No login yet. Creating one lets this customer order online; it also appears in Customer Management.'}
          </Typography>

          {/* Live verdict on the typed number. */}
          {blockedByPhone &&
            phoneCheck!.conflicts.length > 0 &&
            renderConflicts(
              phoneCheck!.conflicts,
              'This mobile number is already in use',
              'Every account signs in by OTP on its own number, so a number can back only one login. Enter one of the customer’s other numbers.'
            )}
          {phoneCheck?.available && (
            <Alert severity="success" sx={{ py: 0.25 }}>
              {phoneCheck.phone.phone} is free — this login can be created.
            </Alert>
          )}

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField
              size="small"
              label="Name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              helperText={logins.length ? 'Who at the shop this login belongs to' : ' '}
            />
            <TextField
              size="small"
              label="Email (optional)"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              helperText="Blank = OTP-only login"
            />
            <TextField
              size="small"
              label="Mobile"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              error={!!form.phone && !formPhoneInfo.valid}
              helperText={
                !form.phone
                  ? 'Must differ from every other login'
                  : formPhoneInfo.valid
                    ? checking
                      ? 'Checking availability…'
                      : `Saved as ${formPhoneInfo.phone}`
                    : formPhoneInfo.reason
              }
            />
            <TextField
              size="small"
              label="Password (optional)"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              helperText="Blank = OTP-only login"
              InputProps={{
                endAdornment: (
                  <Tooltip title="Generate password">
                    <span>
                      <IconButton size="small" onClick={handleGeneratePassword} disabled={generating}>
                        {generating ? <CircularProgress size={16} /> : <RefreshIcon fontSize="small" />}
                      </IconButton>
                    </span>
                  </Tooltip>
                ),
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="small"
              disabled={creating || checking || !formPhoneInfo.valid || blockedByPhone}
              startIcon={creating ? <CircularProgress size={16} /> : <KeyIcon />}
              onClick={handleCreate}
            >
              {logins.length ? 'Create additional login' : 'Create login'}
            </Button>
            {logins.length > 0 && (
              <Button
                variant="text"
                size="small"
                startIcon={<CloseIcon />}
                onClick={() => {
                  setShowForm(false);
                  setPhoneCheck(null);
                }}
              >
                Cancel
              </Button>
            )}
          </Box>
        </Box>
      ) : (
        <Button variant="outlined" size="small" startIcon={<PersonAddIcon />} onClick={openAddForm}>
          Add another login
        </Button>
      )}
      <Divider sx={{ mt: 3 }} />
    </Box>
  );
};

export default CustomerLoginSection;
