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
  phone_info?: PhoneInfo;
  created_by_salesperson?: boolean;
}

interface PhoneInfo {
  phone: string | null;
  valid: boolean;
  reason: string;
}

/** An account belonging to someone else that already claims this mobile or email. */
interface LoginConflict {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  status?: string;
  customer_id?: string | null;
  customer_name?: string | null;
  conflict_on: string[];
}

/**
 * Create and share a marketplace login for a customer, from the customer record
 * itself. Mirrors the flow on /admin/customer_requests; accounts created here
 * show up in /admin/customer_management the same way.
 */
const CustomerLoginSection: React.FC<{ contactId: string }> = ({ contactId }) => {
  const [loading, setLoading] = useState(true);
  const [logins, setLogins] = useState<CustomerLogin[]>([]);
  const [phoneInfo, setPhoneInfo] = useState<PhoneInfo | null>(null);
  const [conflicts, setConflicts] = useState<LoginConflict[]>([]);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [creating, setCreating] = useState(false);
  // Holds the _id being sent, so only that row shows a spinner.
  const [sending, setSending] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [createdPassword, setCreatedPassword] = useState('');

  const fetchLogin = useCallback(async () => {
    if (!contactId) return;
    setLoading(true);
    try {
      const { data } = await axiosInstance.get(`/admin/users/customer-login/${contactId}`);
      setLogins(data.logins || []);
      setPhoneInfo(data.phone);
      setConflicts(data.conflicts || []);
      if (!(data.logins || []).length) {
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
  const effectivePhoneInfo: PhoneInfo = logins.length ? (phoneInfo ?? formPhoneInfo) : formPhoneInfo;

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
      setCreatedPassword(form.password);
      toast.success(data.message);
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

  const handleCopy = () => {
    const lines = [
      'Your Pupscribe marketplace account is ready.',
      '',
      `Login Link: ${LOGIN_URL}`,
      `Email: ${logins[0]?.email}`,
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

      {/* Someone else already holds this mobile/email, so creating would be
          rejected. Show who, so the right record can be fixed. */}
      {conflicts.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            {conflicts.length === 1 ? 'Another account already uses' : 'Other accounts already use'}{' '}
            this customer&apos;s details
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {conflicts.map((conflict) => (
              <Box key={conflict._id}>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {conflict.name || conflict.email || conflict.phone}
                  </Typography>
                  {conflict.role && <Chip size="small" label={conflict.role} />}
                  {conflict.conflict_on.map((field) => (
                    <Chip key={field} size="small" color="error" variant="outlined" label={`same ${field}`} />
                  ))}
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
            Creating a login here will be rejected. Fix the number or email on the other
            account first — two accounts on one mobile make OTP login ambiguous.
          </Typography>
        </Alert>
      )}

      {logins.length > 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {logins.length > 1 && (
            <Alert severity="info" sx={{ py: 0.5 }}>
              {logins.length} logins are linked to this customer. They share one mobile
              only if the numbers below match — OTP sign-in resolves by number, so
              duplicates on the same number are worth cleaning up.
            </Alert>
          )}

          {logins.map((item, index) => {
            const itemPhone = item.phone_info?.phone || String(item.phone ?? '-');
            const itemPhoneValid = item.phone_info?.valid ?? false;
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
                {index === 0 && createdPassword && (
                  <Paper variant="outlined" sx={{ p: 1.5, mt: 1.5 }}>
                    <Typography variant="body2" fontFamily="monospace" whiteSpace="pre-line">
                      {`Login Link: ${LOGIN_URL}\nEmail: ${item.email}\nPassword: ${createdPassword}`}
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
                  {index === 0 && createdPassword && (
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
              </Paper>
            );
          })}
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
              disabled={creating || !formPhoneInfo.valid || conflicts.length > 0}
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
