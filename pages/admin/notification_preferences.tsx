'use client';
import { useCallback, useEffect, useState } from 'react';
import {
  Typography,
  Box,
  Paper,
  Switch,
  FormControlLabel,
  CircularProgress,
  Button,
  Divider,
  Stack,
  Chip,
  Alert,
  Container,
  useTheme,
} from '@mui/material';
import { NotificationsActive, NotificationsOff, Save } from '@mui/icons-material';
import { toast } from 'react-toastify';
import axiosInstance from '../../src/util/axios';

const CATEGORY_MAP: Record<string, string[]> = {
  Orders: ['order_placed', 'order_edited'],
  'Catalogue & Products': ['new_catalogue', 'product_back_in_stock'],
  Returns: ['return_order_created'],
  'Customer Requests': [
    'customer_request_submitted',
    'customer_request_status',
    'customer_request_comment',
    'customer_request_reply',
  ],
  'Daily Visits': ['daily_visit_created', 'daily_visit_updated', 'daily_visit_comment'],
  Broadcasts: ['new_training', 'new_announcement'],
  Shipments: ['shipment_dispatched', 'shipment_delivered'],
  'Zoho Events': ['estimate_accepted', 'draft_sales_order', 'draft_invoice', 'new_product'],
};

const NotificationPreferences = () => {
  const theme = useTheme();
  const [allTypes, setAllTypes] = useState<Record<string, string>>({});
  const [disabled, setDisabled] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const fetchPreferences = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get('/notifications/preferences');
      setAllTypes(data.all_types || {});
      setDisabled(new Set(data.disabled_types || []));
    } catch (err) {
      toast.error('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const toggle = (type: string) => {
    setDisabled(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axiosInstance.put('/notifications/preferences', {
        disabled_types: Array.from(disabled),
      });
      toast.success('Notification preferences saved');
      setDirty(false);
    } catch {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const muteAll = (types: string[]) => {
    setDisabled(prev => {
      const next = new Set(prev);
      types.forEach(t => next.add(t));
      return next;
    });
    setDirty(true);
  };

  const enableAll = (types: string[]) => {
    setDisabled(prev => {
      const next = new Set(prev);
      types.forEach(t => next.delete(t));
      return next;
    });
    setDirty(true);
  };

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
                Muted notification types will no longer appear in your bell notification feed. They will still be sent to other users.
              </Alert>

              <Stack spacing={3}>
                {Object.entries(CATEGORY_MAP).map(([category, types]) => {
                  const relevant = types.filter(t => t in allTypes);
                  if (!relevant.length) return null;
                  const allMuted = relevant.every(t => disabled.has(t));
                  const allEnabled = relevant.every(t => !disabled.has(t));
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
                          <Button
                            size='small'
                            variant='text'
                            onClick={() => enableAll(relevant)}
                            disabled={allEnabled}
                            sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                          >
                            Enable all
                          </Button>
                          <Button
                            size='small'
                            variant='text'
                            color='error'
                            onClick={() => muteAll(relevant)}
                            disabled={allMuted}
                            sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                          >
                            Mute all
                          </Button>
                        </Stack>
                      </Box>
                      <Stack divider={<Divider />}>
                        {relevant.map(type => {
                          const isMuted = disabled.has(type);
                          return (
                            <Box
                              key={type}
                              sx={{
                                px: 2,
                                py: 1.25,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                {isMuted ? (
                                  <NotificationsOff sx={{ fontSize: 18, color: 'text.disabled' }} />
                                ) : (
                                  <NotificationsActive sx={{ fontSize: 18, color: 'primary.main' }} />
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
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={!isMuted}
                                    onChange={() => toggle(type)}
                                    size='small'
                                  />
                                }
                                label={
                                  <Chip
                                    size='small'
                                    label={isMuted ? 'Muted' : 'On'}
                                    color={isMuted ? 'default' : 'success'}
                                    sx={{ fontWeight: 600, height: 20, fontSize: '0.65rem' }}
                                  />
                                }
                                labelPlacement='start'
                                sx={{ mr: 0 }}
                              />
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
