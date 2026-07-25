import React, { useCallback, useEffect, useState } from 'react';
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
}

interface PhoneInfo {
  phone: string | null;
  valid: boolean;
  reason: string;
}

/**
 * Create and share a marketplace login for a customer, from the customer record
 * itself. Mirrors the flow on /admin/customer_requests; accounts created here
 * show up in /admin/customer_management the same way.
 */
const CustomerLoginSection: React.FC<{ contactId: string }> = ({ contactId }) => {
  const [loading, setLoading] = useState(true);
  const [login, setLogin] = useState<CustomerLogin | null>(null);
  const [phoneInfo, setPhoneInfo] = useState<PhoneInfo | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [createdPassword, setCreatedPassword] = useState('');

  const fetchLogin = useCallback(async () => {
    if (!contactId) return;
    setLoading(true);
    try {
      const { data } = await axiosInstance.get(`/admin/users/customer-login/${contactId}`);
      setLogin(data.login);
      setPhoneInfo(data.phone);
      if (!data.login) {
        setForm({
          name: data.customer?.contact_name || data.customer?.name || '',
          email: data.customer?.email || '',
          phone: data.customer?.raw_phone ? String(data.customer.raw_phone) : '',
          password: '',
        });
      }
    } catch (error: any) {
      console.error('Error loading customer login:', error);
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    setCreatedPassword('');
    fetchLogin();
  }, [fetchLogin]);

  const formPhoneInfo = normalizeIndianMobile(form.phone);
  const effectivePhoneInfo: PhoneInfo = login ? (phoneInfo ?? formPhoneInfo) : formPhoneInfo;

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
      setLogin(data.login);
      setCreatedPassword(form.password);
      toast.success(data.message);
      fetchLogin();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Failed to create login');
    } finally {
      setCreating(false);
    }
  };

  const handleSend = async () => {
    setSending(true);
    try {
      const { data } = await axiosInstance.post(`/admin/users/customer-login/${contactId}/send`);
      toast.success(data.message);
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Failed to send WhatsApp message');
    } finally {
      setSending(false);
    }
  };

  const handleCopy = () => {
    const lines = [
      'Your Pupscribe marketplace account is ready.',
      '',
      `Login Link: ${LOGIN_URL}`,
      `Email: ${login?.email}`,
    ];
    if (createdPassword) lines.push(`Password: ${createdPassword}`);
    navigator.clipboard.writeText(lines.join('\n')).then(
      () => toast.success('Credentials copied'),
      () => toast.error('Failed to copy')
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Marketplace Login
      </Typography>

      {/* Phone usability is the first thing to know - it gates the WhatsApp send. */}
      {!effectivePhoneInfo.valid && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          This number can&apos;t receive WhatsApp: {effectivePhoneInfo.reason}
        </Alert>
      )}

      {login ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">Name</Typography>
              <Typography variant="body2">{login.name || '-'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Email</Typography>
              <Typography variant="body2">{login.email || '-'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Mobile</Typography>
              <Typography variant="body2">{effectivePhoneInfo.phone || String(login.phone ?? '-')}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Sign-in</Typography>
              <Box sx={{ display: 'flex', gap: 0.5, mt: 0.25 }}>
                <Chip
                  size="small"
                  label={login.status}
                  color={login.status === 'active' ? 'success' : 'default'}
                />
                <Chip
                  size="small"
                  variant="outlined"
                  label={login.has_password ? 'Password + OTP' : 'OTP only'}
                />
              </Box>
            </Box>
          </Box>

          {createdPassword && (
            <Paper variant="outlined" sx={{ p: 1.5 }}>
              <Typography variant="body2" fontFamily="monospace" whiteSpace="pre-line">
                {`Login Link: ${LOGIN_URL}\nEmail: ${login.email}\nPassword: ${createdPassword}`}
              </Typography>
            </Paper>
          )}

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Tooltip
              title={
                effectivePhoneInfo.valid
                  ? 'Sends the approved WhatsApp template from our number'
                  : effectivePhoneInfo.reason
              }
            >
              <span>
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  disabled={sending || !effectivePhoneInfo.valid}
                  startIcon={sending ? <CircularProgress size={16} /> : <WhatsAppIcon />}
                  onClick={handleSend}
                >
                  Send login link
                </Button>
              </span>
            </Tooltip>
            {createdPassword && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<ContentCopyIcon />}
                onClick={handleCopy}
              >
                Copy credentials
              </Button>
            )}
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            No login yet. Creating one lets this customer order online; it also appears in Customer Management.
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField
              size="small"
              label="Name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
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
              error={!formPhoneInfo.valid}
              helperText={
                formPhoneInfo.valid
                  ? `Saved as ${formPhoneInfo.phone}`
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
          <Box>
            <Button
              variant="contained"
              size="small"
              disabled={creating || !formPhoneInfo.valid}
              startIcon={creating ? <CircularProgress size={16} /> : <KeyIcon />}
              onClick={handleCreate}
            >
              Create login
            </Button>
          </Box>
        </Box>
      )}
      <Divider sx={{ mt: 3 }} />
    </Box>
  );
};

export default CustomerLoginSection;
