import { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  TextField,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Stack,
  Divider,
  Drawer,
  LinearProgress,
} from '@mui/material';
import {
  AddOutlined,
  EditOutlined,
  DeleteOutline,
  SendOutlined,
  BarChartOutlined,
  ScheduleSendOutlined,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axiosInstance from '../../src/util/axios';

const STATUS_COLORS: Record<string, any> = {
  draft: 'default',
  scheduled: 'info',
  sending: 'warning',
  completed: 'success',
  failed: 'error',
  cancelled: 'default',
};

const RECIPIENT_STATUS_COLORS: Record<string, any> = {
  queued: 'default',
  sent: 'info',
  delivered: 'primary',
  read: 'success',
  failed: 'error',
  rate_limit_exceeded: 'warning',
};

// Fields a param token can reference (resolved per-recipient on the backend).
const FIELD_HINTS = ['name', 'companyName', 'tier', 'salesPerson', 'billingCurrentFY'];

const emptyForm = () => ({
  name: '',
  template_name: '',
  segment_id: '',
  params_mapping: [] as string[],
  button_url: '',
  scheduled_at: '',
});

const CampaignsPage = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<any[]>([]);
  const [segments, setSegments] = useState<any[]>([]);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  // Recipient drill-down drawer
  const [detail, setDetail] = useState<any | null>(null);
  const [recipients, setRecipients] = useState<any[]>([]);
  const [recipLoading, setRecipLoading] = useState(false);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/admin/campaigns', { params: { limit: 200 } });
      setCampaigns(res.data.data);
    } catch {
      toast.error('Failed to fetch campaigns.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRefs = async () => {
    try {
      const [t, s] = await Promise.all([
        axiosInstance.get('/admin/templates', { params: { status: 'APPROVED', limit: 500 } }),
        axiosInstance.get('/admin/segments', { params: { limit: 500 } }),
      ]);
      // Only campaign-managed templates; legacy (externally-created) ones are hidden.
      setTemplates((t.data.data || []).filter((tpl: any) => tpl.created_via_app));
      setSegments(s.data.data);
    } catch {
      /* non-fatal */
    }
  };

  useEffect(() => {
    fetchCampaigns();
    fetchRefs();
  }, []);

  // Re-poll while any campaign is sending so stats update live.
  useEffect(() => {
    if (!campaigns.some((c) => c.status === 'sending')) return;
    const h = setInterval(fetchCampaigns, 5000);
    return () => clearInterval(h);
  }, [campaigns]);

  const selectedTemplate = templates.find((t) => t.name === form.template_name);
  const placeholderCount = selectedTemplate
    ? (selectedTemplate.body?.match(/\{\{\d+\}\}/g) || []).length
    : 0;

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setEditorOpen(true);
  };

  const openEdit = (c: any) => {
    setEditing(c);
    setForm({
      name: c.name || '',
      template_name: c.template_name || '',
      segment_id: c.segment_id || '',
      params_mapping: c.params_mapping || [],
      button_url: c.button_url || '',
      scheduled_at: c.scheduled_at ? c.scheduled_at.slice(0, 16) : '',
    });
    setEditorOpen(true);
  };

  // Keep the params_mapping array length in sync with the template placeholders.
  useEffect(() => {
    if (!editorOpen) return;
    setForm((f) => {
      const next = [...f.params_mapping];
      while (next.length < placeholderCount) next.push('');
      next.length = placeholderCount;
      return { ...f, params_mapping: next };
    });
  }, [placeholderCount, editorOpen]); // eslint-disable-line

  const setParam = (i: number, v: string) =>
    setForm((f) => ({ ...f, params_mapping: f.params_mapping.map((p, idx) => (idx === i ? v : p)) }));

  const buildPayload = () => {
    const payload: any = {
      name: form.name.trim(),
      template_name: form.template_name,
      segment_id: form.segment_id || undefined,
      params_mapping: form.params_mapping,
      button_url: form.button_url || undefined,
    };
    if (form.scheduled_at) payload.scheduled_at = new Date(form.scheduled_at).toISOString();
    else payload.scheduled_at = '';
    return payload;
  };

  const saveCampaign = async () => {
    if (!form.name.trim()) return toast.error('Name is required.');
    if (!form.template_name) return toast.error('Select an approved template.');
    if (!form.segment_id) return toast.error('Select a segment.');
    setSaving(true);
    try {
      if (editing) {
        await axiosInstance.put(`/admin/campaigns/${editing._id}`, buildPayload());
        toast.success('Campaign updated.');
      } else {
        await axiosInstance.post('/admin/campaigns', buildPayload());
        toast.success('Campaign created.');
      }
      setEditorOpen(false);
      fetchCampaigns();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to save campaign.');
    } finally {
      setSaving(false);
    }
  };

  const sendCampaign = async (c: any) => {
    if (!window.confirm(`Send campaign "${c.name}" now? This messages the full audience.`)) return;
    try {
      await axiosInstance.post(`/admin/campaigns/${c._id}/send`);
      toast.success('Campaign is sending in the background.');
      fetchCampaigns();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to send.');
    }
  };

  const deleteCampaign = async (c: any) => {
    if (!window.confirm(`Delete campaign "${c.name}"?`)) return;
    try {
      await axiosInstance.delete(`/admin/campaigns/${c._id}`);
      toast.success('Campaign deleted.');
      fetchCampaigns();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to delete.');
    }
  };

  const openDetail = async (c: any) => {
    setDetail(c);
    setRecipLoading(true);
    setRecipients([]);
    try {
      const res = await axiosInstance.get(`/admin/campaigns/${c._id}/recipients`, { params: { limit: 1000 } });
      setRecipients(res.data.data);
    } catch {
      toast.error('Failed to load recipients.');
    } finally {
      setRecipLoading(false);
    }
  };

  const StatChips = ({ stats }: any) => {
    if (!stats || !stats.total) return <Typography variant='caption' color='text.secondary'>—</Typography>;
    const order = ['queued', 'sent', 'delivered', 'read', 'failed'];
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        <Chip size='small' label={`${stats.total} total`} />
        {order.filter((s) => stats[s]).map((s) => (
          <Chip key={s} size='small' color={RECIPIENT_STATUS_COLORS[s]} label={`${stats[s]} ${s}`} />
        ))}
      </Box>
    );
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Paper elevation={3} sx={{ padding: 4, borderRadius: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant='h4' gutterBottom sx={{ fontWeight: 'bold' }}>WhatsApp Campaigns</Typography>
          <Stack direction='row' spacing={1}>
            <Button variant='outlined' startIcon={<BarChartOutlined />} href='/admin/whatsapp_analytics'>
              Analytics
            </Button>
            <Button variant='contained' startIcon={<AddOutlined />} onClick={openCreate}>New Campaign</Button>
          </Stack>
        </Box>
        <Typography variant='body1' sx={{ mb: 3 }} color='text.secondary'>
          Send an approved template to a saved segment. Track delivery and reads per campaign.
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : campaigns.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant='h6' color='text.secondary'>No campaigns yet.</Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Template</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Delivery</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align='right'>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {campaigns.map((c) => {
                  const seg = segments.find((s) => s._id === c.segment_id);
                  const editable = !['sending', 'completed'].includes(c.status);
                  return (
                    <TableRow key={c._id} hover>
                      <TableCell sx={{ fontWeight: 500 }}>
                        {c.name}
                        <Typography variant='caption' display='block' color='text.secondary'>
                          {seg ? `→ ${seg.name}` : '→ inline rule'}
                          {c.scheduled_at && c.status === 'scheduled' ? ` · ⏰ ${new Date(c.scheduled_at + 'Z').toLocaleString('en-IN')}` : ''}
                        </Typography>
                      </TableCell>
                      <TableCell>{c.template_name}</TableCell>
                      <TableCell>
                        <Chip size='small' label={c.status} color={STATUS_COLORS[c.status] || 'default'} />
                        {c.status === 'sending' && <LinearProgress sx={{ mt: 0.5 }} />}
                      </TableCell>
                      <TableCell sx={{ minWidth: 240 }}><StatChips stats={c.stats} /></TableCell>
                      <TableCell align='right' sx={{ whiteSpace: 'nowrap' }}>
                        <Tooltip title='Recipients & delivery'>
                          <IconButton size='small' onClick={() => openDetail(c)}><BarChartOutlined fontSize='small' /></IconButton>
                        </Tooltip>
                        {(c.status === 'draft' || c.status === 'scheduled' || c.status === 'failed') && (
                          <Tooltip title='Send now'>
                            <IconButton size='small' color='primary' onClick={() => sendCampaign(c)}><SendOutlined fontSize='small' /></IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title={editable ? 'Edit' : 'Cannot edit while sending/completed'}>
                          <span>
                            <IconButton size='small' onClick={() => openEdit(c)} disabled={!editable}><EditOutlined fontSize='small' /></IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title='Delete'>
                          <span>
                            <IconButton size='small' color='error' onClick={() => deleteCampaign(c)} disabled={c.status === 'sending'}>
                              <DeleteOutline fontSize='small' />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Editor */}
      <Dialog open={editorOpen} onClose={() => setEditorOpen(false)} fullWidth maxWidth='sm'>
        <DialogTitle>{editing ? `Edit: ${editing.name}` : 'New Campaign'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label='Campaign name' value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} fullWidth />
            <FormControl fullWidth>
              <InputLabel>Approved template</InputLabel>
              <Select label='Approved template' value={form.template_name} onChange={(e) => setForm((f) => ({ ...f, template_name: e.target.value }))}>
                {templates.length === 0 && <MenuItem value='' disabled>No approved templates</MenuItem>}
                {templates.map((t) => <MenuItem key={t._id} value={t.name}>{t.name} ({t.language})</MenuItem>)}
              </Select>
            </FormControl>
            {selectedTemplate && (
              <Alert severity='info' sx={{ whiteSpace: 'pre-line' }}>{selectedTemplate.body}</Alert>
            )}
            <FormControl fullWidth>
              <InputLabel>Segment</InputLabel>
              <Select label='Segment' value={form.segment_id} onChange={(e) => setForm((f) => ({ ...f, segment_id: e.target.value }))}>
                {segments.map((s) => (
                  <MenuItem key={s._id} value={s._id}>
                    {s.name} {typeof s.last_resolved_count === 'number' ? `(~${s.last_resolved_count})` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {placeholderCount > 0 && (
              <>
                <Divider textAlign='left'><Typography variant='caption' color='text.secondary'>Template variables</Typography></Divider>
                <Typography variant='caption' color='text.secondary'>
                  Use literals or {`{field}`} tokens. Available: {FIELD_HINTS.map((f) => `{${f}}`).join(', ')}
                </Typography>
                {Array.from({ length: placeholderCount }).map((_, i) => (
                  <TextField
                    key={i}
                    size='small'
                    label={`{{${i + 1}}}`}
                    value={form.params_mapping[i] || ''}
                    onChange={(e) => setParam(i, e.target.value)}
                    fullWidth
                  />
                ))}
              </>
            )}

            <TextField
              label='Button URL (optional, supports {field})'
              value={form.button_url}
              onChange={(e) => setForm((f) => ({ ...f, button_url: e.target.value }))}
              fullWidth
            />
            <TextField
              label='Schedule (optional)'
              type='datetime-local'
              value={form.scheduled_at}
              onChange={(e) => setForm((f) => ({ ...f, scheduled_at: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              helperText='Leave empty to send manually with the Send button.'
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditorOpen(false)}>Cancel</Button>
          <Button variant='contained' onClick={saveCampaign} disabled={saving} startIcon={form.scheduled_at ? <ScheduleSendOutlined /> : undefined}>
            {saving ? <CircularProgress size={20} /> : editing ? 'Save' : form.scheduled_at ? 'Schedule' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Recipients drawer */}
      <Drawer anchor='right' open={!!detail} onClose={() => setDetail(null)} PaperProps={{ sx: { width: { xs: '100%', sm: 560 } } }}>
        <Box sx={{ p: 3 }}>
          <Typography variant='h6' sx={{ fontWeight: 'bold' }}>{detail?.name}</Typography>
          <Box sx={{ my: 1 }}><StatChips stats={detail?.stats} /></Box>
          <Divider sx={{ my: 2 }} />
          {recipLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
          ) : recipients.length === 0 ? (
            <Typography variant='body2' color='text.secondary'>No recipients recorded yet.</Typography>
          ) : (
            <TableContainer component={Paper} variant='outlined'>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recipients.map((r) => (
                    <TableRow key={r._id}>
                      <TableCell>{r.name || '-'}</TableCell>
                      <TableCell>{r.phone}</TableCell>
                      <TableCell>
                        <Tooltip title={r.error || ''}>
                          <Chip size='small' label={r.status} color={RECIPIENT_STATUS_COLORS[r.status] || 'default'} />
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Drawer>
    </Box>
  );
};

export default CampaignsPage;
