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
  TablePagination,
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
  Divider,
  Stack,
} from '@mui/material';
import {
  AddOutlined,
  EditOutlined,
  DeleteOutline,
  SyncOutlined,
  LockOutlined,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axiosInstance from '../../src/util/axios';

const STATUS_COLORS: Record<string, any> = {
  APPROVED: 'success',
  PENDING: 'warning',
  REJECTED: 'error',
  PAUSED: 'default',
  DISABLED: 'default',
};

const CATEGORIES = ['MARKETING', 'UTILITY', 'AUTHENTICATION'];
const LANGUAGES = ['en_US', 'en', 'en_GB', 'hi'];
const BUTTON_TYPES = ['QUICK_REPLY', 'URL', 'PHONE_NUMBER'];

const emptyForm = () => ({
  name: '',
  category: 'MARKETING',
  language: 'en_US',
  header: '',
  body: '',
  footer: '',
  buttons: [] as any[],
});

const TemplatesPage = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Editor dialog
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null); // existing doc or null (= create)
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const h = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(h);
  }, [search]);

  const buildParams = (overrides: Record<string, unknown> = {}) => {
    const params: Record<string, unknown> = { ...overrides };
    if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
    if (statusFilter) params.status = statusFilter;
    if (categoryFilter) params.category = categoryFilter;
    return params;
  };

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/admin/templates', {
        params: buildParams({ skip: page * rowsPerPage, limit: rowsPerPage }),
      });
      setTemplates(res.data.data);
      setTotal(res.data.total);
    } catch {
      toast.error('Failed to fetch templates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [page, rowsPerPage, debouncedSearch, statusFilter, categoryFilter]); // eslint-disable-line

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await axiosInstance.post('/admin/templates/sync');
      toast.success(`Synced ${res.data.remote_count} templates (${res.data.updated} updated).`);
      fetchTemplates();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Sync failed.');
    } finally {
      setSyncing(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setEditorOpen(true);
  };

  const openEdit = (t: any) => {
    setEditing(t);
    setForm({
      name: t.name || '',
      category: t.category || 'MARKETING',
      language: t.language || 'en_US',
      header: t.header_obj?.text || t.header || '',
      body: t.body || '',
      footer: t.footer || '',
      buttons: (t.buttons || []).map((b: any) => ({ ...b })),
    });
    setEditorOpen(true);
  };

  const addButton = () =>
    setForm((f) => ({ ...f, buttons: [...f.buttons, { type: 'QUICK_REPLY', text: '' }] }));
  const updateButton = (i: number, changes: any) =>
    setForm((f) => ({
      ...f,
      buttons: f.buttons.map((b, idx) => (idx === i ? { ...b, ...changes } : b)),
    }));
  const removeButton = (i: number) =>
    setForm((f) => ({ ...f, buttons: f.buttons.filter((_, idx) => idx !== i) }));

  const saveTemplate = async () => {
    if (!form.name.trim()) return toast.error('Name is required.');
    if (!form.body.trim()) return toast.error('Body is required.');
    setSaving(true);
    const payload: any = {
      name: form.name.trim(),
      category: form.category,
      language: form.language,
      body: form.body,
      footer: form.footer || undefined,
      header: form.header ? { format: 'TEXT', text: form.header } : undefined,
      buttons: form.buttons.filter((b) => b.text?.trim()),
    };
    try {
      if (editing) {
        await axiosInstance.put(`/admin/templates/${editing._id}`, payload);
        toast.success('Template updated.');
      } else {
        await axiosInstance.post('/admin/templates', payload);
        toast.success('Template submitted for approval.');
      }
      setEditorOpen(false);
      fetchTemplates();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to save template.');
    } finally {
      setSaving(false);
    }
  };

  const deleteTemplate = async (t: any) => {
    if (!window.confirm(`Delete template "${t.name}"? This cannot be undone.`)) return;
    try {
      await axiosInstance.delete(`/admin/templates/${t._id}`);
      toast.success('Template deleted.');
      fetchTemplates();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to delete template.');
    }
  };

  const placeholderCount = (form.body.match(/\{\{\d+\}\}/g) || []).length;

  return (
    <Box sx={{ padding: 3 }}>
      <Paper elevation={3} sx={{ padding: 4, borderRadius: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant='h4' gutterBottom sx={{ fontWeight: 'bold' }}>
            WhatsApp Templates
          </Typography>
          <Stack direction='row' spacing={1}>
            <Button
              variant='outlined'
              startIcon={syncing ? <CircularProgress size={16} /> : <SyncOutlined />}
              onClick={handleSync}
              disabled={syncing}
            >
              Sync status
            </Button>
            <Button variant='contained' startIcon={<AddOutlined />} onClick={openCreate}>
              New Template
            </Button>
          </Stack>
        </Box>
        <Typography variant='body1' sx={{ mb: 3 }} color='text.secondary'>
          Create message templates, submit them to Meta for approval, and reuse approved ones in
          campaigns. Templates created before this feature can be edited but not deleted.
        </Typography>

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <TextField
            label='Search name'
            size='small'
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            sx={{ minWidth: 220 }}
          />
          <FormControl size='small' sx={{ minWidth: 160 }}>
            <InputLabel>Status</InputLabel>
            <Select label='Status' value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
              <MenuItem value=''>All</MenuItem>
              {Object.keys(STATUS_COLORS).map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size='small' sx={{ minWidth: 160 }}>
            <InputLabel>Category</InputLabel>
            <Select label='Category' value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(0); }}>
              <MenuItem value=''>All</MenuItem>
              {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : templates.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant='h6' color='text.secondary'>No templates found.</Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ overflowX: 'auto' }}>
              <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', minWidth: 900 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Lang</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Body</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Source</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align='right'>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {templates.map((t) => {
                      const legacy = !t.created_via_app;
                      return (
                        <TableRow key={t._id} hover>
                          <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 500 }}>{t.name}</TableCell>
                          <TableCell>{t.category || '-'}</TableCell>
                          <TableCell>{t.language || '-'}</TableCell>
                          <TableCell>
                            {t.status ? (
                              <Tooltip title={t.rejected_reason || ''}>
                                <Chip label={t.status} size='small' color={STATUS_COLORS[t.status] || 'default'} />
                              </Tooltip>
                            ) : <Chip label='UNKNOWN' size='small' />}
                          </TableCell>
                          <TableCell sx={{ maxWidth: 360 }}>
                            <Typography variant='body2' sx={{ whiteSpace: 'pre-line', color: 'text.secondary' }}>
                              {(t.body || '').slice(0, 120)}{(t.body || '').length > 120 ? '…' : ''}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={legacy ? 'Legacy' : 'App'}
                              size='small'
                              variant='outlined'
                              color={legacy ? 'default' : 'primary'}
                            />
                          </TableCell>
                          <TableCell align='right' sx={{ whiteSpace: 'nowrap' }}>
                            <Tooltip title='Edit'>
                              <IconButton size='small' onClick={() => openEdit(t)}><EditOutlined fontSize='small' /></IconButton>
                            </Tooltip>
                            {legacy ? (
                              <Tooltip title='Legacy templates cannot be deleted'>
                                <span>
                                  <IconButton size='small' disabled><LockOutlined fontSize='small' /></IconButton>
                                </span>
                              </Tooltip>
                            ) : (
                              <Tooltip title='Delete'>
                                <IconButton size='small' color='error' onClick={() => deleteTemplate(t)}>
                                  <DeleteOutline fontSize='small' />
                                </IconButton>
                              </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
            <Box display='flex' justifyContent='space-between' alignItems='center' mt={2} flexWrap='wrap'>
              <TablePagination
                rowsPerPageOptions={[25, 50, 100, 200]}
                component='div'
                count={total}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(_, p) => setPage(p)}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              />
              <Typography variant='subtitle2' color='text.secondary'>Total: {total}</Typography>
            </Box>
          </>
        )}
      </Paper>

      {/* Editor dialog */}
      <Dialog open={editorOpen} onClose={() => setEditorOpen(false)} fullWidth maxWidth='sm'>
        <DialogTitle>{editing ? `Edit: ${editing.name}` : 'New Template'}</DialogTitle>
        <DialogContent dividers>
          {editing && !editing.created_via_app && (
            <Alert severity='info' sx={{ mb: 2 }}>
              This is a legacy template. Edits are saved locally for preview only and are not
              resubmitted to Meta.
            </Alert>
          )}
          {editing && editing.created_via_app && (
            <Alert severity='warning' sx={{ mb: 2 }}>
              Editing content resubmits the template to Meta — its status will return to PENDING.
            </Alert>
          )}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label='Name (snake_case)'
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              disabled={!!editing}
              helperText={editing ? 'Name cannot be changed' : 'Lowercase, no spaces (auto-formatted)'}
              fullWidth
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select label='Category' value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Language</InputLabel>
                <Select label='Language' value={form.language} onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}>
                  {LANGUAGES.map((l) => <MenuItem key={l} value={l}>{l}</MenuItem>)}
                </Select>
              </FormControl>
            </Box>
            <TextField
              label='Header (optional, text)'
              value={form.header}
              onChange={(e) => setForm((f) => ({ ...f, header: e.target.value }))}
              fullWidth
            />
            <TextField
              label='Body'
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              multiline
              minRows={4}
              fullWidth
              helperText={`Use {{1}}, {{2}}… for variables. ${placeholderCount} placeholder(s) detected.`}
            />
            <TextField
              label='Footer (optional)'
              value={form.footer}
              onChange={(e) => setForm((f) => ({ ...f, footer: e.target.value }))}
              fullWidth
            />

            <Divider textAlign='left'>
              <Typography variant='caption' color='text.secondary'>Buttons (optional)</Typography>
            </Divider>
            {form.buttons.map((b, i) => (
              <Box key={i} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <FormControl size='small' sx={{ minWidth: 140 }}>
                  <InputLabel>Type</InputLabel>
                  <Select label='Type' value={b.type} onChange={(e) => updateButton(i, { type: e.target.value })}>
                    {BUTTON_TYPES.map((bt) => <MenuItem key={bt} value={bt}>{bt}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField size='small' label='Text' value={b.text || ''} onChange={(e) => updateButton(i, { text: e.target.value })} />
                {b.type === 'URL' && (
                  <TextField size='small' label='URL' value={b.url || ''} onChange={(e) => updateButton(i, { url: e.target.value })} fullWidth />
                )}
                {b.type === 'PHONE_NUMBER' && (
                  <TextField size='small' label='Phone' value={b.phone_number || ''} onChange={(e) => updateButton(i, { phone_number: e.target.value })} />
                )}
                <IconButton size='small' color='error' onClick={() => removeButton(i)}><DeleteOutline fontSize='small' /></IconButton>
              </Box>
            ))}
            <Button size='small' startIcon={<AddOutlined />} onClick={addButton} sx={{ alignSelf: 'flex-start' }}>
              Add button
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditorOpen(false)}>Cancel</Button>
          <Button variant='contained' onClick={saveTemplate} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : editing ? 'Save' : 'Submit for approval'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TemplatesPage;
