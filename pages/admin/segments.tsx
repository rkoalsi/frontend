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
  OutlinedInput,
  Checkbox,
  ListItemText,
} from '@mui/material';
import {
  AddOutlined,
  EditOutlined,
  DeleteOutline,
  VisibilityOutlined,
  PeopleAltOutlined,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axiosInstance from '../../src/util/axios';

const DORMANCY_LABELS: Record<string, string> = {
  all: 'All (no recency filter)',
  last_month: 'Billed in last month',
  last_45_days: 'Billed in last 45 days',
  last_2_months: 'Billed in last 2 months',
  last_3_months: 'Billed in last 3 months',
  not_last_month: 'Dormant > 1 month',
  not_last_45_days: 'Dormant > 45 days',
  not_last_2_months: 'Dormant > 2 months',
  not_last_3_months: 'Dormant > 3 months',
};

const emptyForm = () => ({
  name: '',
  description: '',
  source: 'b2b',
  rule: {
    tier: '',
    dormancy: 'all',
    salespersons: [] as string[],
    brands: [] as string[],
    min_billing_current_fy: '' as any,
    max_billing_current_fy: '' as any,
    only_non_b2b: false,
    reviewed_only: false,
  },
});

const SegmentsPage = () => {
  const [segments, setSegments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState<any>({ brands: [], tiers: [], salespeople: [], dormancy_options: [] });

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  // Preview state
  const [previewLoading, setPreviewLoading] = useState(false);
  const [preview, setPreview] = useState<{ count: number; sample: any[] } | null>(null);

  const fetchSegments = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/admin/segments', { params: { limit: 200 } });
      setSegments(res.data.data);
      setTotal(res.data.total);
    } catch {
      toast.error('Failed to fetch segments.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const res = await axiosInstance.get('/admin/segments/options');
      setOptions(res.data);
    } catch {
      /* non-fatal */
    }
  };

  useEffect(() => {
    fetchSegments();
    fetchOptions();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setPreview(null);
    setEditorOpen(true);
  };

  const openEdit = (s: any) => {
    setEditing(s);
    const base = emptyForm();
    setForm({
      name: s.name || '',
      description: s.description || '',
      source: s.source || 'b2b',
      rule: { ...base.rule, ...(s.rule || {}) },
    });
    setPreview(null);
    setEditorOpen(true);
  };

  const setRule = (changes: any) => setForm((f) => ({ ...f, rule: { ...f.rule, ...changes } }));

  const buildPayload = () => {
    const r: any = { ...form.rule };
    // Strip empty values so the backend rule stays clean.
    if (!r.tier) delete r.tier;
    r.min_billing_current_fy = r.min_billing_current_fy === '' ? null : Number(r.min_billing_current_fy);
    r.max_billing_current_fy = r.max_billing_current_fy === '' ? null : Number(r.max_billing_current_fy);
    if (form.source === 'b2b') {
      delete r.only_non_b2b;
      delete r.reviewed_only;
    } else {
      delete r.tier; delete r.dormancy; delete r.salespersons; delete r.brands;
      delete r.min_billing_current_fy; delete r.max_billing_current_fy;
    }
    return { name: form.name.trim(), description: form.description, source: form.source, rule: r };
  };

  const runPreview = async () => {
    setPreviewLoading(true);
    setPreview(null);
    try {
      const { source, rule } = buildPayload();
      const res = await axiosInstance.post('/admin/segments/resolve', { source, rule });
      setPreview(res.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Preview failed.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const saveSegment = async () => {
    if (!form.name.trim()) return toast.error('Name is required.');
    setSaving(true);
    try {
      const payload = buildPayload();
      if (editing) {
        await axiosInstance.put(`/admin/segments/${editing._id}`, payload);
        toast.success('Segment updated.');
      } else {
        await axiosInstance.post('/admin/segments', payload);
        toast.success('Segment created.');
      }
      setEditorOpen(false);
      fetchSegments();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to save segment.');
    } finally {
      setSaving(false);
    }
  };

  const deleteSegment = async (s: any) => {
    if (!window.confirm(`Delete segment "${s.name}"?`)) return;
    try {
      await axiosInstance.delete(`/admin/segments/${s._id}`);
      toast.success('Segment deleted.');
      fetchSegments();
    } catch {
      toast.error('Failed to delete segment.');
    }
  };

  const resolveSaved = async (s: any) => {
    try {
      const res = await axiosInstance.post(`/admin/segments/${s._id}/resolve`);
      toast.success(`${s.name}: ${res.data.count} recipients.`);
      fetchSegments();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Resolve failed.');
    }
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Paper elevation={3} sx={{ padding: 4, borderRadius: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant='h4' gutterBottom sx={{ fontWeight: 'bold' }}>
            Customer Segments
          </Typography>
          <Button variant='contained' startIcon={<AddOutlined />} onClick={openCreate}>
            New Segment
          </Button>
        </Box>
        <Typography variant='body1' sx={{ mb: 3 }} color='text.secondary'>
          Define reusable audience rules (by tier, dormancy, brand, salesperson, or B2C contacts).
          Preview the count, save it, then target it from a campaign.
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : segments.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant='h6' color='text.secondary'>No segments yet.</Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Source</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Rule summary</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Last count</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align='right'>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {segments.map((s) => (
                  <TableRow key={s._id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>
                      {s.name}
                      {s.description && (
                        <Typography variant='caption' display='block' color='text.secondary'>{s.description}</Typography>
                      )}
                    </TableCell>
                    <TableCell><Chip size='small' label={(s.source || 'b2b').toUpperCase()} color={s.source === 'b2c' ? 'success' : 'primary'} /></TableCell>
                    <TableCell><RuleSummary source={s.source} rule={s.rule} /></TableCell>
                    <TableCell>
                      {typeof s.last_resolved_count === 'number'
                        ? <Chip size='small' icon={<PeopleAltOutlined />} label={s.last_resolved_count} />
                        : <Typography variant='caption' color='text.secondary'>—</Typography>}
                    </TableCell>
                    <TableCell align='right' sx={{ whiteSpace: 'nowrap' }}>
                      <Tooltip title='Resolve now (recount)'>
                        <IconButton size='small' onClick={() => resolveSaved(s)}><PeopleAltOutlined fontSize='small' /></IconButton>
                      </Tooltip>
                      <Tooltip title='Edit'>
                        <IconButton size='small' onClick={() => openEdit(s)}><EditOutlined fontSize='small' /></IconButton>
                      </Tooltip>
                      <Tooltip title='Delete'>
                        <IconButton size='small' color='error' onClick={() => deleteSegment(s)}><DeleteOutline fontSize='small' /></IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <Typography variant='subtitle2' color='text.secondary' sx={{ mt: 2 }}>Total: {total}</Typography>
      </Paper>

      {/* Editor dialog */}
      <Dialog open={editorOpen} onClose={() => setEditorOpen(false)} fullWidth maxWidth='md'>
        <DialogTitle>{editing ? `Edit: ${editing.name}` : 'New Segment'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label='Name' value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} fullWidth />
              <FormControl sx={{ minWidth: 160 }}>
                <InputLabel>Source</InputLabel>
                <Select label='Source' value={form.source} onChange={(e) => { setForm((f) => ({ ...f, source: e.target.value })); setPreview(null); }}>
                  <MenuItem value='b2b'>B2B (customers)</MenuItem>
                  <MenuItem value='b2c'>B2C (chatbot contacts)</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <TextField label='Description (optional)' value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} fullWidth />

            <Divider textAlign='left'><Typography variant='caption' color='text.secondary'>Rule</Typography></Divider>

            {form.source === 'b2b' ? (
              <>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <FormControl size='small' sx={{ minWidth: 140 }}>
                    <InputLabel>Tier</InputLabel>
                    <Select label='Tier' value={form.rule.tier} onChange={(e) => setRule({ tier: e.target.value })}>
                      <MenuItem value=''>Any</MenuItem>
                      {options.tiers.map((t: string) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <FormControl size='small' sx={{ minWidth: 240 }}>
                    <InputLabel>Recency / Dormancy</InputLabel>
                    <Select label='Recency / Dormancy' value={form.rule.dormancy} onChange={(e) => setRule({ dormancy: e.target.value })}>
                      {(options.dormancy_options || Object.keys(DORMANCY_LABELS)).map((d: string) => (
                        <MenuItem key={d} value={d}>{DORMANCY_LABELS[d] || d}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <MultiSelect
                  label='Brands purchased'
                  options={options.brands}
                  value={form.rule.brands}
                  onChange={(v: string[]) => setRule({ brands: v })}
                />
                <MultiSelect
                  label='Salespeople'
                  options={options.salespeople}
                  value={form.rule.salespersons}
                  onChange={(v: string[]) => setRule({ salespersons: v })}
                />

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    size='small' type='number' label='Min billing (current FY)'
                    value={form.rule.min_billing_current_fy}
                    onChange={(e) => setRule({ min_billing_current_fy: e.target.value })}
                    fullWidth
                  />
                  <TextField
                    size='small' type='number' label='Max billing (current FY)'
                    value={form.rule.max_billing_current_fy}
                    onChange={(e) => setRule({ max_billing_current_fy: e.target.value })}
                    fullWidth
                  />
                </Box>
              </>
            ) : (
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Checkbox checked={!!form.rule.only_non_b2b} onChange={(e) => setRule({ only_non_b2b: e.target.checked })} />
                  <Typography variant='body2'>Only pure B2C (exclude numbers matched to a B2B customer)</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Checkbox checked={!!form.rule.reviewed_only} onChange={(e) => setRule({ reviewed_only: e.target.checked })} />
                  <Typography variant='body2'>Only reviewed contacts</Typography>
                </Box>
              </Stack>
            )}

            <Divider />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button variant='outlined' startIcon={<VisibilityOutlined />} onClick={runPreview} disabled={previewLoading}>
                {previewLoading ? 'Resolving…' : 'Preview audience'}
              </Button>
              {preview && (
                <Alert severity='info' sx={{ py: 0 }}>
                  <strong>{preview.count}</strong> recipient(s) match this rule.
                </Alert>
              )}
            </Box>
            {previewLoading && <CircularProgress size={22} />}
            {preview && preview.sample.length > 0 && (
              <TableContainer component={Paper} variant='outlined' sx={{ maxHeight: 240 }}>
                <Table size='small' stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Phone</TableCell>
                      {form.source === 'b2b' && <TableCell>Tier</TableCell>}
                      {form.source === 'b2b' && <TableCell>Last bill</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {preview.sample.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>{r.name || '-'}</TableCell>
                        <TableCell>{r.phone || '-'}</TableCell>
                        {form.source === 'b2b' && <TableCell>{r.tier || '-'}</TableCell>}
                        {form.source === 'b2b' && <TableCell>{r.lastBillDate || '-'}</TableCell>}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditorOpen(false)}>Cancel</Button>
          <Button variant='contained' onClick={saveSegment} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : editing ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const MultiSelect = ({ label, options, value, onChange }: any) => (
  <FormControl size='small' fullWidth>
    <InputLabel>{label}</InputLabel>
    <Select
      multiple
      label={label}
      value={value}
      onChange={(e) => onChange(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
      input={<OutlinedInput label={label} />}
      renderValue={(selected: any) => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {(selected as string[]).map((v: string) => <Chip key={v} label={v} size='small' />)}
        </Box>
      )}
    >
      {(options || []).map((o: string) => (
        <MenuItem key={o} value={o}>
          <Checkbox checked={value.indexOf(o) > -1} />
          <ListItemText primary={o} />
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

const RuleSummary = ({ source, rule }: any) => {
  if (!rule) return <>—</>;
  const parts: string[] = [];
  if (source === 'b2c') {
    if (rule.only_non_b2b) parts.push('pure B2C');
    if (rule.reviewed_only) parts.push('reviewed');
    if (!parts.length) parts.push('all B2C contacts');
  } else {
    if (rule.tier) parts.push(`Tier ${rule.tier}`);
    if (rule.dormancy && rule.dormancy !== 'all') parts.push(DORMANCY_LABELS[rule.dormancy] || rule.dormancy);
    if (rule.brands?.length) parts.push(`${rule.brands.length} brand(s)`);
    if (rule.salespersons?.length) parts.push(`${rule.salespersons.length} SP`);
    if (rule.min_billing_current_fy != null) parts.push(`≥₹${rule.min_billing_current_fy}`);
    if (rule.max_billing_current_fy != null) parts.push(`≤₹${rule.max_billing_current_fy}`);
    if (!parts.length) parts.push('all B2B customers');
  }
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {parts.map((p, i) => <Chip key={i} size='small' variant='outlined' label={p} />)}
    </Box>
  );
};

export default SegmentsPage;
