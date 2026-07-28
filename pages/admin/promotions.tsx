import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import Drawer from '../../src/components/common/ResponsiveDrawer';
import {
  Add,
  BarChart,
  Close,
  Delete,
  Edit,
  OpenInNew,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import ImageDropzone from '../../src/components/common/ImageDropzone';
import axiosInstance from '../../src/util/axios';

// Kept in sync with PLACEMENTS in routes/admin_promotions.py.
const PLACEMENT_LABELS: Record<string, string> = {
  brand_banner: 'Brand Banner',
  in_scroll: 'In-Scroll Banner',
};

const PLACEMENT_HELP: Record<string, string> = {
  brand_banner:
    'Sits directly above the product grid for the brands you target. One shows at a time — the highest priority wins.',
  in_scroll:
    'A full-width band inside the product grid, repeating after every N products. Several can run at once and they take turns.',
};

const TARGET_LABELS: Record<string, string> = {
  none: 'Nothing — display only',
  brand: 'Open a brand tab',
  category: 'Open a category',
  url: 'Open a link',
};

const emptyForm = {
  name: '',
  placement: 'in_scroll',
  alt_text: '',
  brands: [] as string[],
  after_n_products: 8,
  target_type: 'none',
  target_value: '',
  is_active: true,
  starts_at: '',
  ends_at: '',
  priority: 0,
};

// axiosInstance defaults to `Content-Type: application/json`. Axios v1 sees a
// JSON content type on a FormData body and serialises it to JSON instead of
// sending multipart — FastAPI then receives no form fields at all and 422s with
// every Form() field null. Naming multipart explicitly defeats that path; the
// browser fills in the boundary. Every FormData request here needs this.
const MULTIPART = { headers: { 'Content-Type': 'multipart/form-data' } };

const fmtDate = (value?: string | null) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Backend stores naive UTC; the datetime-local input wants `YYYY-MM-DDTHH:mm`.
const toInputValue = (value?: string | null) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

const Promotions = () => {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [mobileImageFile, setMobileImageFile] = useState<File | null>(null);
  const [clearMobileImage, setClearMobileImage] = useState(false);

  const [eventsFor, setEventsFor] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  const fetchPromotions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/admin/promotions');
      setPromotions(res.data?.promotions || []);
    } catch (e) {
      console.error(e);
      toast.error('Could not load the banners.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPromotions();
    axiosInstance
      .get('/admin/brands')
      .then((res) => setBrands(res.data?.brands || []))
      .catch(() => setBrands([]));
  }, [fetchPromotions]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setImageFile(null);
    setMobileImageFile(null);
    setClearMobileImage(false);
    setDialogOpen(true);
  };

  const openEdit = (promo: any) => {
    setEditing(promo);
    setForm({
      name: promo.name || '',
      placement: promo.placement || 'in_scroll',
      alt_text: promo.alt_text || '',
      brands: promo.brands || [],
      after_n_products: promo.after_n_products ?? 8,
      target_type: promo.target_type || 'none',
      target_value: promo.target_value || '',
      is_active: promo.is_active !== false,
      starts_at: toInputValue(promo.starts_at),
      ends_at: toInputValue(promo.ends_at),
      priority: promo.priority ?? 0,
    });
    setImageFile(null);
    setMobileImageFile(null);
    setClearMobileImage(false);
    setDialogOpen(true);
  };

  const setField = (key: string, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const canSave = useMemo(() => {
    if (!form.name.trim()) return false;
    if (!editing && !imageFile) return false;
    if (form.target_type !== 'none' && !form.target_value.trim()) return false;
    return true;
  }, [form, editing, imageFile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = new FormData();
      body.append('name', form.name.trim());
      body.append('placement', form.placement);
      body.append('alt_text', form.alt_text);
      body.append('brands', JSON.stringify(form.brands));
      body.append('after_n_products', String(form.after_n_products));
      body.append('target_type', form.target_type);
      body.append('target_value', form.target_value.trim());
      body.append('is_active', String(form.is_active));
      body.append('starts_at', form.starts_at);
      body.append('ends_at', form.ends_at);
      body.append('priority', String(form.priority));
      if (imageFile) body.append('image_file', imageFile);
      if (mobileImageFile) body.append('mobile_image_file', mobileImageFile);
      if (editing) body.append('clear_mobile_image', String(clearMobileImage));

      if (editing) {
        await axiosInstance.put(`/admin/promotions/${editing._id}`, body, MULTIPART);
        toast.success('Banner updated.');
      } else {
        await axiosInstance.post('/admin/promotions', body, MULTIPART);
        toast.success('Banner created.');
      }
      setDialogOpen(false);
      fetchPromotions();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.detail || 'Could not save the banner.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (promo: any) => {
    // The active switch is the one control worth having on the row itself —
    // pulling a live banner shouldn't need a trip through the editor.
    const body = new FormData();
    body.append('name', promo.name);
    body.append('placement', promo.placement);
    body.append('alt_text', promo.alt_text || '');
    body.append('brands', JSON.stringify(promo.brands || []));
    body.append('after_n_products', String(promo.after_n_products ?? 8));
    body.append('target_type', promo.target_type || 'none');
    body.append('target_value', promo.target_value || '');
    body.append('is_active', String(!promo.is_active));
    body.append('starts_at', toInputValue(promo.starts_at));
    body.append('ends_at', toInputValue(promo.ends_at));
    body.append('priority', String(promo.priority ?? 0));
    try {
      await axiosInstance.put(`/admin/promotions/${promo._id}`, body, MULTIPART);
      setPromotions((prev) =>
        prev.map((p) => (p._id === promo._id ? { ...p, is_active: !p.is_active } : p))
      );
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Could not change the status.');
    }
  };

  const handleDelete = async (promo: any) => {
    if (!window.confirm(`Delete "${promo.name}"? The click history is kept.`)) return;
    try {
      await axiosInstance.delete(`/admin/promotions/${promo._id}`);
      toast.success('Banner deleted.');
      fetchPromotions();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Could not delete the banner.');
    }
  };

  const openEvents = async (promo: any) => {
    setEventsFor(promo);
    setEventsLoading(true);
    try {
      const res = await axiosInstance.get(`/admin/promotions/${promo._id}/events`, {
        params: { event: 'click' },
      });
      setEvents(res.data?.events || []);
    } catch (e) {
      toast.error('Could not load the click history.');
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  };

  const isInScroll = form.placement === 'in_scroll';

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
          mb: 3,
        }}
      >
        <Box>
          <Typography variant='h5' sx={{ fontWeight: 700 }}>
            Order Form Banners
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5, maxWidth: '68ch' }}>
            Artwork shown to salespeople and customers while they browse products. Every
            banner records who saw it and who clicked it.
          </Typography>
        </Box>
        <Button variant='contained' startIcon={<Add />} onClick={openCreate}>
          New Banner
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : promotions.length === 0 ? (
        <Paper
          variant='outlined'
          sx={{ p: 6, textAlign: 'center', borderStyle: 'dashed', borderRadius: 3 }}
        >
          <Typography variant='h6' sx={{ mb: 1 }}>
            No banners yet
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
            Create one to place artwork above the product grid or inside the scroll.
          </Typography>
          <Button variant='contained' startIcon={<Add />} onClick={openCreate}>
            New Banner
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant='outlined' sx={{ borderRadius: 2 }}>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 92 }}>Artwork</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Placement</TableCell>
                <TableCell>Brands</TableCell>
                <TableCell>Schedule</TableCell>
                <TableCell align='right'>Views</TableCell>
                <TableCell align='right'>Clicks</TableCell>
                <TableCell align='center'>Live</TableCell>
                <TableCell align='right'>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {promotions.map((promo) => {
                const start = fmtDate(promo.starts_at);
                const end = fmtDate(promo.ends_at);
                return (
                  <TableRow key={promo._id} hover>
                    <TableCell>
                      <Box
                        component='img'
                        src={promo.image_url}
                        alt=''
                        sx={{
                          width: 76,
                          height: 44,
                          objectFit: 'cover',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor: '#fff',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2' sx={{ fontWeight: 600 }}>
                        {promo.name}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {TARGET_LABELS[promo.target_type] || promo.target_type}
                        {promo.target_value ? ` → ${promo.target_value}` : ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size='small'
                        label={PLACEMENT_LABELS[promo.placement] || promo.placement}
                        color={promo.placement === 'brand_banner' ? 'primary' : 'secondary'}
                        variant='outlined'
                      />
                      {promo.placement === 'in_scroll' && (
                        <Typography
                          variant='caption'
                          color='text.secondary'
                          sx={{ display: 'block', mt: 0.5 }}
                        >
                          every {promo.after_n_products ?? 8} products
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {promo.brands?.length ? (
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', maxWidth: 220 }}>
                          {promo.brands.map((b: string) => (
                            <Chip key={b} label={b} size='small' />
                          ))}
                        </Box>
                      ) : (
                        <Typography variant='caption' color='text.secondary'>
                          All brands
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant='caption' color='text.secondary'>
                        {start || end ? `${start || 'Now'} → ${end || 'No end'}` : 'Always'}
                      </Typography>
                    </TableCell>
                    <TableCell align='right' sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {promo.impressions ?? 0}
                    </TableCell>
                    <TableCell align='right' sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {promo.clicks ?? 0}
                    </TableCell>
                    <TableCell align='center'>
                      <Switch
                        size='small'
                        checked={promo.is_active !== false}
                        onChange={() => handleToggleActive(promo)}
                        color='success'
                      />
                    </TableCell>
                    <TableCell align='right'>
                      <Tooltip title='Who clicked'>
                        <IconButton size='small' onClick={() => openEvents(promo)}>
                          <BarChart fontSize='small' />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title='Edit'>
                        <IconButton size='small' onClick={() => openEdit(promo)}>
                          <Edit fontSize='small' />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title='Delete'>
                        <IconButton size='small' color='error' onClick={() => handleDelete(promo)}>
                          <Delete fontSize='small' />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ── Editor ─────────────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth='md'>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editing ? 'Edit Banner' : 'New Banner'}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField
              label='Name'
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              fullWidth
              helperText='Internal only — never shown to the customer.'
            />

            <FormControl fullWidth>
              <InputLabel id='placement-label'>Placement</InputLabel>
              <Select
                labelId='placement-label'
                label='Placement'
                value={form.placement}
                onChange={(e) => setField('placement', e.target.value)}
              >
                {Object.entries(PLACEMENT_LABELS).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
              <Typography variant='caption' color='text.secondary' sx={{ mt: 0.75, ml: 1.5 }}>
                {PLACEMENT_HELP[form.placement]}
              </Typography>
            </FormControl>

            {isInScroll && (
              <TextField
                label='Repeat after every N products'
                type='number'
                value={form.after_n_products}
                onChange={(e) => setField('after_n_products', Number(e.target.value))}
                inputProps={{ min: 2, max: 50 }}
                sx={{ maxWidth: 280 }}
                helperText='Between 2 and 50.'
              />
            )}

            <Divider />

            {/* Artwork */}
            <Box sx={{ display: 'flex', gap: 2.5, flexDirection: { xs: 'column', md: 'row' } }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant='subtitle2' sx={{ fontWeight: 700, mb: 1 }}>
                  Artwork {editing ? '' : '(required)'}
                </Typography>
                {(imageFile || editing?.image_url) && (
                  <Box
                    component='img'
                    src={imageFile ? URL.createObjectURL(imageFile) : editing.image_url}
                    alt=''
                    sx={{
                      width: '100%',
                      maxHeight: 130,
                      objectFit: 'contain',
                      mb: 1,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: '#fff',
                    }}
                  />
                )}
                <ImageDropzone onImageUpload={setImageFile} updating={false} />
                <Typography variant='caption' color='text.secondary' sx={{ mt: 0.75, display: 'block' }}>
                  Wide artwork works best — roughly 3:1. Max 5MB.
                </Typography>
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography variant='subtitle2' sx={{ fontWeight: 700, mb: 1 }}>
                  Mobile artwork (optional)
                </Typography>
                {(mobileImageFile || (editing?.mobile_image_url && !clearMobileImage)) && (
                  <Box
                    component='img'
                    src={
                      mobileImageFile
                        ? URL.createObjectURL(mobileImageFile)
                        : editing.mobile_image_url
                    }
                    alt=''
                    sx={{
                      width: '100%',
                      maxHeight: 130,
                      objectFit: 'contain',
                      mb: 1,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: '#fff',
                    }}
                  />
                )}
                <ImageDropzone onImageUpload={setMobileImageFile} updating={false} />
                <Typography variant='caption' color='text.secondary' sx={{ mt: 0.75, display: 'block' }}>
                  A squarer crop for phones. Without one, the wide artwork is used at every size.
                </Typography>
                {editing?.mobile_image_url && (
                  <FormControlLabel
                    sx={{ mt: 0.5 }}
                    control={
                      <Switch
                        size='small'
                        checked={clearMobileImage}
                        onChange={(e) => {
                          setClearMobileImage(e.target.checked);
                          if (e.target.checked) setMobileImageFile(null);
                        }}
                      />
                    }
                    label={<Typography variant='caption'>Remove mobile artwork</Typography>}
                  />
                )}
              </Box>
            </Box>

            <TextField
              label='Alt text'
              value={form.alt_text}
              onChange={(e) => setField('alt_text', e.target.value)}
              fullWidth
              helperText='Read aloud by screen readers and shown if the image fails to load.'
            />

            <Divider />

            {/* Targeting */}
            <FormControl fullWidth>
              <InputLabel id='brands-label'>Show on brands</InputLabel>
              <Select
                labelId='brands-label'
                multiple
                value={form.brands}
                onChange={(e) =>
                  setField(
                    'brands',
                    typeof e.target.value === 'string'
                      ? e.target.value.split(',')
                      : e.target.value
                  )
                }
                input={<OutlinedInput label='Show on brands' />}
                renderValue={(selected: any) =>
                  selected.length === 0 ? (
                    <em>All brands</em>
                  ) : (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {selected.map((b: string) => (
                        <Chip key={b} label={b} size='small' />
                      ))}
                    </Box>
                  )
                }
              >
                {brands.map((b) => (
                  <MenuItem key={b} value={b}>
                    {b}
                  </MenuItem>
                ))}
              </Select>
              <Typography variant='caption' color='text.secondary' sx={{ mt: 0.75, ml: 1.5 }}>
                Leave empty to show on every brand tab.
              </Typography>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <FormControl sx={{ flex: 1 }}>
                <InputLabel id='target-label'>On click</InputLabel>
                <Select
                  labelId='target-label'
                  label='On click'
                  value={form.target_type}
                  onChange={(e) => setField('target_type', e.target.value)}
                >
                  {Object.entries(TARGET_LABELS).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {form.target_type !== 'none' && (
                <TextField
                  sx={{ flex: 1 }}
                  label={
                    form.target_type === 'brand'
                      ? 'Brand name'
                      : form.target_type === 'category'
                      ? 'Category name'
                      : 'URL'
                  }
                  value={form.target_value}
                  onChange={(e) => setField('target_value', e.target.value)}
                  placeholder={
                    form.target_type === 'url' ? 'https://…' : form.target_type === 'brand' ? 'Truelove' : 'Pet Leashes'
                  }
                  helperText={
                    form.target_type === 'brand'
                      ? 'Must match the brand name exactly.'
                      : form.target_type === 'category'
                      ? 'A category within the brand being viewed.'
                      : 'Opens in a new tab.'
                  }
                />
              )}
            </Box>

            <Divider />

            {/* Schedule */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                label='Starts'
                type='datetime-local'
                value={form.starts_at}
                onChange={(e) => setField('starts_at', e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: '1 1 220px' }}
                helperText='Leave empty to start immediately.'
              />
              <TextField
                label='Ends'
                type='datetime-local'
                value={form.ends_at}
                onChange={(e) => setField('ends_at', e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: '1 1 220px' }}
                helperText='Leave empty to run indefinitely.'
              />
              <TextField
                label='Priority'
                type='number'
                value={form.priority}
                onChange={(e) => setField('priority', Number(e.target.value))}
                sx={{ flex: '0 1 160px' }}
                helperText='Higher shows first.'
              />
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={form.is_active}
                  onChange={(e) => setField('is_active', e.target.checked)}
                  color='success'
                />
              }
              label='Live'
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant='contained' onClick={handleSave} disabled={!canSave || saving}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create banner'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Click history ──────────────────────────────────────────────── */}
      <Drawer
        anchor='right'
        open={!!eventsFor}
        onClose={() => setEventsFor(null)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 460 } } }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box
            sx={{
              px: 2.5,
              py: 2,
              borderBottom: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
                Who clicked
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                {eventsFor?.name}
              </Typography>
            </Box>
            <IconButton onClick={() => setEventsFor(null)} size='small'>
              <Close fontSize='small' />
            </IconButton>
          </Box>

          <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
            {eventsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress size={24} />
              </Box>
            ) : events.length === 0 ? (
              <Typography variant='body2' color='text.secondary' sx={{ textAlign: 'center', py: 6 }}>
                No clicks recorded yet.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {events.map((ev) => (
                  <Paper
                    key={ev._id}
                    variant='outlined'
                    sx={{ p: 1.5, borderRadius: 2, display: 'flex', gap: 1, alignItems: 'flex-start' }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant='body2' sx={{ fontWeight: 600 }}>
                        {ev.name || ev.email || 'Unidentified'}
                      </Typography>
                      <Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>
                        {ev.role || '—'}
                        {ev.brand ? ` · on ${ev.brand}` : ''}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {new Date(ev.created_at).toLocaleString('en-IN')}
                      </Typography>
                    </Box>
                    {ev.customer_id && (
                      <Tooltip title='Open customer'>
                        <IconButton
                          size='small'
                          href={`/admin/customers?search=${ev.customer_id}`}
                          target='_blank'
                        >
                          <OpenInNew fontSize='small' />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Paper>
                ))}
              </Box>
            )}
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
};

export default Promotions;
