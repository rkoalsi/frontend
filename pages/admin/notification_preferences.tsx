'use client';
import { useCallback, useEffect, useState } from 'react';
import {
  Typography,
  Box,
  Paper,
  CircularProgress,
  Button,
  Divider,
  Stack,
  Alert,
  Container,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  NotificationsActive,
  NotificationsOff,
  NotificationsNone,
  Save,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axiosInstance from '../../src/util/axios';

const CATEGORY_MAP: Record<string, string[]> = {
  Orders: ['order_placed', 'order_edited'],
  'Catalogue & Products': ['new_catalogue', 'product_back_in_stock', 'new_product'],
  Returns: ['return_order_created', 'return_order_status'],
  'Customer Requests': [
    'customer_request_submitted',
    'customer_request_status',
    'customer_request_comment',
    'customer_request_reply',
  ],
  'Registrations & Leads': ['b2b_user_verified', 'new_lead'],
  'Daily Visits': ['daily_visit_created', 'daily_visit_updated', 'daily_visit_comment'],
  'Expense Estimates': [
    'expense_submitted',
    'expense_approved_stage',
    'expense_rejected',
    'expense_advance_released',
    'expense_actuals_submitted',
  ],
  Cheques: ['cheque_uploaded', 'cheque_comment'],
  Broadcasts: ['new_training', 'new_announcement'],
  Shipments: ['shipment_dispatched', 'shipment_delivered'],
  'Zoho Events': ['estimate_accepted', 'draft_sales_order', 'draft_invoice'],
};

type PrefState = 'default' | 'always' | 'muted';

const NotificationPreferences = () => {
  const theme = useTheme();
  const [allTypes, setAllTypes] = useState<Record<string, string>>({});
  const [states, setStates] = useState<Record<string, PrefState>>({});
  const [canSubscribe, setCanSubscribe] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const fetchPreferences = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get('/notifications/preferences');
      const types: Record<string, string> = data.all_types || {};
      const next: Record<string, PrefState> = {};
      Object.keys(types).forEach(t => {
        next[t] = 'default';
      });
      (data.subscribed_types || []).forEach((t: string) => {
        next[t] = 'always';
      });
      (data.disabled_types || []).forEach((t: string) => {
        next[t] = 'muted';
      });
      setAllTypes(types);
      setStates(next);
      setCanSubscribe(data.can_subscribe !== false);
    } catch (err) {
      toast.error('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const setState = (types: string[], value: PrefState) => {
    setStates(prev => {
      const next = { ...prev };
      types.forEach(t => {
        next[t] = value;
      });
      return next;
    });
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const entries = Object.entries(states);
      await axiosInstance.put('/notifications/preferences', {
        disabled_types: entries.filter(([, s]) => s === 'muted').map(([t]) => t),
        subscribed_types: entries.filter(([, s]) => s === 'always').map(([t]) => t),
      });
      toast.success('Notification preferences saved');
      setDirty(false);
    } catch {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  // Anything the backend knows about but this page hasn't categorised — so new
  // notification types are never silently unconfigurable.
  const categories: Record<string, string[]> = { ...CATEGORY_MAP };
  const mapped = new Set(Object.values(CATEGORY_MAP).flat());
  const uncategorised = Object.keys(allTypes).filter(t => !mapped.has(t));
  if (uncategorised.length) categories.Other = uncategorised;

  return (
    <Container maxWidth='md' sx={{ py: { xs: 2, md: 4 } }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 4,
          border: `1px solid ${theme.palette.divider}`,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: 'white',
            p: { xs: 3, md: 4 },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <NotificationsActive sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant='h5' fontWeight={700}>
                Notification Preferences
              </Typography>
              <Typography variant='body2' sx={{ opacity: 0.9, mt: 0.5 }}>
                Choose which in-app notifications you want to receive
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Alert severity='info' sx={{ mb: 3, borderRadius: 2 }}>
                <strong>Default</strong> follows the normal routing rules — you get the
                notification only if it is addressed to you (your role, your customers,
                your requests).{' '}
                {canSubscribe && (
                  <>
                    <strong>Always</strong> subscribes you to every notification of that
                    type across the platform, even when it isn&apos;t addressed to you.{' '}
                  </>
                )}
                <strong>Muted</strong> keeps it out of your bell feed entirely. Other
                users are unaffected either way.
              </Alert>

              <Stack spacing={3}>
                {Object.entries(categories).map(([category, types]) => {
                  const relevant = types.filter(t => t in allTypes);
                  if (!relevant.length) return null;
                  return (
                    <Paper
                      key={category}
                      elevation={0}
                      sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}
                    >
                      <Box
                        sx={{
                          px: 2,
                          py: 1.5,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          borderBottom: `1px solid ${theme.palette.divider}`,
                          bgcolor: theme.palette.action.hover,
                        }}
                      >
                        <Typography variant='subtitle1' fontWeight={700}>
                          {category}
                        </Typography>
                        <Stack direction='row' spacing={1}>
                          {canSubscribe && (
                            <Button
                              size='small'
                              variant='text'
                              onClick={() => setState(relevant, 'always')}
                              disabled={relevant.every(t => states[t] === 'always')}
                              sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                            >
                              Always all
                            </Button>
                          )}
                          <Button
                            size='small'
                            variant='text'
                            onClick={() => setState(relevant, 'default')}
                            disabled={relevant.every(t => states[t] === 'default')}
                            sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                          >
                            Reset all
                          </Button>
                          <Button
                            size='small'
                            variant='text'
                            color='error'
                            onClick={() => setState(relevant, 'muted')}
                            disabled={relevant.every(t => states[t] === 'muted')}
                            sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                          >
                            Mute all
                          </Button>
                        </Stack>
                      </Box>
                      <Stack divider={<Divider />}>
                        {relevant.map(type => {
                          const state = states[type] || 'default';
                          const isMuted = state === 'muted';
                          return (
                            <Box
                              key={type}
                              sx={{
                                px: 2,
                                py: 1.25,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: 1.5,
                                flexWrap: 'wrap',
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                {isMuted ? (
                                  <NotificationsOff sx={{ fontSize: 18, color: 'text.disabled' }} />
                                ) : state === 'always' ? (
                                  <NotificationsActive sx={{ fontSize: 18, color: 'success.main' }} />
                                ) : (
                                  <NotificationsNone sx={{ fontSize: 18, color: 'primary.main' }} />
                                )}
                                <Box>
                                  <Typography variant='body2' fontWeight={500} color={isMuted ? 'text.disabled' : 'text.primary'}>
                                    {allTypes[type]}
                                  </Typography>
                                  <Typography variant='caption' color='text.disabled' sx={{ fontFamily: 'monospace' }}>
                                    {type}
                                  </Typography>
                                </Box>
                              </Box>
                              <ToggleButtonGroup
                                size='small'
                                exclusive
                                value={state}
                                onChange={(_, value) => value && setState([type], value)}
                                sx={{
                                  '& .MuiToggleButton-root': {
                                    textTransform: 'none',
                                    fontSize: '0.7rem',
                                    py: 0.25,
                                    px: 1.25,
                                  },
                                }}
                              >
                                <ToggleButton value='default'>Default</ToggleButton>
                                {canSubscribe && (
                                  <ToggleButton value='always'>
                                    <Tooltip title='Receive every notification of this type, platform-wide'>
                                      <span>Always</span>
                                    </Tooltip>
                                  </ToggleButton>
                                )}
                                <ToggleButton value='muted'>Muted</ToggleButton>
                              </ToggleButtonGroup>
                            </Box>
                          );
                        })}
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>

              {/* Save button */}
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant='contained'
                  size='large'
                  startIcon={saving ? <CircularProgress size={18} color='inherit' /> : <Save />}
                  onClick={handleSave}
                  disabled={!dirty || saving}
                  sx={{ borderRadius: 2, textTransform: 'none', px: 4 }}
                >
                  {saving ? 'Saving…' : 'Save Preferences'}
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default NotificationPreferences;
