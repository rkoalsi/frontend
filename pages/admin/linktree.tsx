import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  IconButton,
  Switch,
  FormControlLabel,
  CircularProgress,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Tooltip,
  Collapse,
  alpha,
} from '@mui/material';
import {
  Add,
  Delete,
  ArrowUpward,
  ArrowDownward,
  WhatsApp,
  Image as ImageIcon,
  Save,
  OpenInNew,
  AutoAwesome,
  ExpandMore,
  ExpandLess,
  Storefront,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axiosInstance from '../../src/util/axios';

const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

interface LinkItem {
  id: string;
  text: string;
  image_url: string;
  url: string;
  color: string;
  order: number;
  is_active: boolean;
}

interface Segment {
  id: string;
  label: string;
  reward: string;
  color: string;
  weight: number;
}

const DEFAULT_COLORS = ['#6366F1', '#22C55E', '#F59E0B', '#EF4444', '#06B6D4', '#A855F7'];

const LinkTreeAdmin = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [accentColor, setAccentColor] = useState('#29ABE2');
  const [logoUrl, setLogoUrl] = useState('');
  const [header, setHeader] = useState({
    title: 'HOUSE OF BRANDS FOR PETS',
    description:
      "We filter pet products, so you don't have to. Bringing the world's best pet brands to retailers across India.",
  });
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [whatsapp, setWhatsapp] = useState({
    enabled: false,
    number: '',
    message: '',
    label: 'Chat with us',
  });
  const [spinWheel, setSpinWheel] = useState({
    enabled: false,
    title: '',
    description: '',
    cta_text: 'Spin',
    terms: '',
    start_date: '',
    end_date: '',
    segments: [] as Segment[],
  });
  const [waDialogOpen, setWaDialogOpen] = useState(false);
  const [spinOpen, setSpinOpen] = useState(false);

  // Brand-link picker
  const [brandDialogOpen, setBrandDialogOpen] = useState(false);
  const [brands, setBrands] = useState<{ _id: string; name: string; image_url: string }[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [brandSearch, setBrandSearch] = useState('');

  // Tracks which link row (id) or 'avatar' is currently uploading.
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/admin/linktree');
      const c = res.data || {};
      const accent = c.accent_color || '#29ABE2';
      setAccentColor(accent);
      setLogoUrl(c.logo_url || '');
      setHeader({
        title: c.header?.title || 'HOUSE OF BRANDS FOR PETS',
        description:
          c.header?.description ||
          "We filter pet products, so you don't have to. Bringing the world's best pet brands to retailers across India.",
      });
      setLinks(
        (c.links || []).map((l: any, i: number) => ({
          id: l.id || uid(),
          text: l.text || '',
          image_url: l.image_url || '',
          url: l.url || '',
          color: l.color || accent,
          order: l.order ?? i,
          is_active: l.is_active !== false,
        }))
      );
      setWhatsapp({
        enabled: !!c.whatsapp?.enabled,
        number: c.whatsapp?.number || '',
        message: c.whatsapp?.message || '',
        label: c.whatsapp?.label || 'Chat with us',
      });
      setSpinWheel({
        enabled: !!c.spin_wheel?.enabled,
        title: c.spin_wheel?.title || '',
        description: c.spin_wheel?.description || '',
        cta_text: c.spin_wheel?.cta_text || 'Spin',
        terms: c.spin_wheel?.terms || '',
        start_date: c.spin_wheel?.start_date || '',
        end_date: c.spin_wheel?.end_date || '',
        segments: (c.spin_wheel?.segments || []).map((s: any) => ({
          id: s.id || uid(),
          label: s.label || '',
          reward: s.reward || '',
          color: s.color || DEFAULT_COLORS[0],
          weight: s.weight ?? 1,
        })),
      });
    } catch (e) {
      console.error(e);
      toast.error('Error loading link tree configuration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const uploadImage = async (file: File): Promise<string | null> => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await axiosInstance.post('/admin/linktree/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data?.url || null;
  };

  const handleLinkImageUpload = async (id: string, e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingKey(id);
    try {
      const url = await uploadImage(file);
      if (url) updateLink(id, 'image_url', url);
      toast.success('Image uploaded');
    } catch {
      toast.error('Error uploading image');
    } finally {
      setUploadingKey(null);
      e.target.value = '';
    }
  };

  // ── Link helpers ──────────────────────────────────────────────
  const addLink = () =>
    setLinks((prev) => [
      ...prev,
      { id: uid(), text: '', image_url: '', url: '', color: accentColor, order: prev.length, is_active: true },
    ]);

  // Open the brand picker and lazily load the brand list (with images).
  const openBrandDialog = async () => {
    setBrandDialogOpen(true);
    if (brands.length) return;
    setBrandsLoading(true);
    try {
      const res = await axiosInstance.get('/admin/brands_with_images');
      setBrands(res.data?.brands || []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load brands');
    } finally {
      setBrandsLoading(false);
    }
  };

  // Add a link pre-filled from a brand: brand name + image, URL left empty.
  const addBrandLink = (brand: { name: string; image_url?: string }) => {
    setLinks((prev) => [
      ...prev,
      {
        id: uid(),
        text: brand.name,
        image_url: brand.image_url || '',
        url: '',
        color: accentColor,
        order: prev.length,
        is_active: true,
      },
    ]);
    setBrandDialogOpen(false);
    setBrandSearch('');
    toast.success(`Added “${brand.name}” — fill in its URL`);
  };

  const updateLink = (id: string, field: keyof LinkItem, value: any) =>
    setLinks((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );

  const deleteLink = (id: string) =>
    setLinks((prev) => prev.filter((l) => l.id !== id));

  const moveLink = (index: number, dir: -1 | 1) => {
    setLinks((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((l, i) => ({ ...l, order: i }));
    });
  };

  // ── Segment helpers ───────────────────────────────────────────
  const addSegment = () =>
    setSpinWheel((prev) => ({
      ...prev,
      segments: [
        ...prev.segments,
        {
          id: uid(),
          label: '',
          reward: '',
          color: DEFAULT_COLORS[prev.segments.length % DEFAULT_COLORS.length],
          weight: 1,
        },
      ],
    }));

  const updateSegment = (id: string, field: keyof Segment, value: any) =>
    setSpinWheel((prev) => ({
      ...prev,
      segments: prev.segments.map((s) =>
        s.id === id ? { ...s, [field]: value } : s
      ),
    }));

  const deleteSegment = (id: string) =>
    setSpinWheel((prev) => ({
      ...prev,
      segments: prev.segments.filter((s) => s.id !== id),
    }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        is_active: true,
        accent_color: accentColor,
        header,
        links: links.map((l, i) => ({ ...l, order: i })),
        whatsapp,
        spin_wheel: {
          ...spinWheel,
          start_date: spinWheel.start_date || null,
          end_date: spinWheel.end_date || null,
        },
      };
      await axiosInstance.put('/admin/linktree', payload);
      toast.success('Link tree saved');
      fetchConfig();
    } catch (e) {
      console.error(e);
      toast.error('Error saving link tree');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 960, mx: 'auto' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Link Tree
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage the public links page shown at /linktree
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<OpenInNew />}
            component="a"
            href="https://barkbutler.in/linktree"
            target="_blank"
            rel="noopener noreferrer"
          >
            Preview
          </Button>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save />}
            onClick={handleSave}
            disabled={saving}
          >
            Save changes
          </Button>
        </Box>
      </Box>

      {/* Page header */}
      <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight={700}>
          Page header
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Shown under the BarkButler logo at the top of /linktree.
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar
            variant="rounded"
            src={logoUrl || undefined}
            sx={{ width: 96, height: 48, bgcolor: '#fff', '& img': { objectFit: 'contain' } }}
          >
            <ImageIcon color="disabled" />
          </Avatar>
          <Typography variant="caption" color="text.secondary">
            Logo is pulled automatically from the “BarkButler” brand in the brands collection.
          </Typography>
        </Box>
        <Box sx={{ display: 'grid', gap: 2 }}>
          <TextField
            label="Title"
            size="small"
            fullWidth
            value={header.title}
            onChange={(e) => setHeader((h) => ({ ...h, title: e.target.value }))}
          />
          <TextField
            label="Description"
            size="small"
            fullWidth
            multiline
            minRows={2}
            value={header.description}
            onChange={(e) => setHeader((h) => ({ ...h, description: e.target.value }))}
          />
        </Box>
      </Paper>

      {/* Links */}
      <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3, borderRadius: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
            mb: 2,
          }}
        >
          <Typography variant="h6" fontWeight={700}>
            Links ({links.length})
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Theme color
              </Typography>
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                style={{ width: 40, height: 32, border: 'none', background: 'none', cursor: 'pointer' }}
              />
            </Box>
            <Button variant="outlined" startIcon={<Storefront />} onClick={openBrandDialog}>
              Add brand link
            </Button>
            <Button variant="outlined" startIcon={<Add />} onClick={addLink}>
              Add link
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {links.map((link, index) => (
            <Box
              key={link.id}
              sx={{
                p: 2,
                pl: 2.5,
                borderRadius: 2,
                border: (t) => `1px solid ${t.palette.divider}`,
                borderLeft: `5px solid ${link.color || accentColor}`,
                bgcolor: alpha(link.color || accentColor, 0.08),
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'auto 1fr auto' },
                gap: 2,
                alignItems: 'center',
                opacity: link.is_active ? 1 : 0.6,
              }}
            >
              {/* image */}
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                <Avatar variant="rounded" src={link.image_url || undefined} sx={{ width: 56, height: 56, bgcolor: '#fff' }}>
                  <ImageIcon color="disabled" />
                </Avatar>
                <Button component="label" size="small" disabled={uploadingKey === link.id}>
                  {uploadingKey === link.id ? '…' : link.image_url ? 'Replace' : 'Image'}
                  <input hidden type="file" accept="image/*" onChange={(e) => handleLinkImageUpload(link.id, e)} />
                </Button>
                {link.image_url && (
                  <Button
                    size="small"
                    color="error"
                    onClick={() => updateLink(link.id, 'image_url', '')}
                  >
                    Remove
                  </Button>
                )}
              </Box>

              {/* fields */}
              <Box sx={{ display: 'grid', gap: 1.5 }}>
                <TextField
                  label="Text"
                  size="small"
                  fullWidth
                  value={link.text}
                  onChange={(e) => updateLink(link.id, 'text', e.target.value)}
                />
                <TextField
                  label="URL"
                  size="small"
                  fullWidth
                  placeholder="https://…"
                  value={link.url}
                  onChange={(e) => updateLink(link.id, 'url', e.target.value)}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Highlight color
                  </Typography>
                  <input
                    type="color"
                    value={link.color || accentColor}
                    onChange={(e) => updateLink(link.id, 'color', e.target.value)}
                    style={{ width: 34, height: 26, border: 'none', background: 'none', cursor: 'pointer' }}
                  />
                  <Button size="small" onClick={() => updateLink(link.id, 'color', accentColor)}>
                    Use theme
                  </Button>
                </Box>
              </Box>

              {/* controls */}
              <Box sx={{ display: 'flex', flexDirection: { xs: 'row', md: 'column' }, alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
                <FormControlLabel
                  sx={{ m: 0 }}
                  control={
                    <Switch
                      size="small"
                      checked={link.is_active}
                      onChange={(e) => updateLink(link.id, 'is_active', e.target.checked)}
                    />
                  }
                  label={<Typography variant="caption">Active</Typography>}
                />
                <Box>
                  <Tooltip title="Move up">
                    <span>
                      <IconButton size="small" onClick={() => moveLink(index, -1)} disabled={index === 0}>
                        <ArrowUpward fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Move down">
                    <span>
                      <IconButton size="small" onClick={() => moveLink(index, 1)} disabled={index === links.length - 1}>
                        <ArrowDownward fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" color="error" onClick={() => deleteLink(link.id)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Box>
          ))}

          {links.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
              No links yet. Click “Add link” to create one.
            </Typography>
          )}
        </Box>
      </Paper>

      {/* WhatsApp */}
      <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              WhatsApp
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {whatsapp.enabled && whatsapp.number
                ? `Enabled · ${whatsapp.number}`
                : 'Not connected'}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<WhatsApp />}
            onClick={() => setWaDialogOpen(true)}
            sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#1ebe5d' } }}
          >
            {whatsapp.number ? 'Edit WhatsApp' : 'Connect WhatsApp'}
          </Button>
        </Box>
      </Paper>

      {/* Spin the wheel */}
      {/* <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3, borderRadius: 3 }}>
        <Box
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => setSpinOpen((o) => !o)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesome color="primary" />
            <Typography variant="h6" fontWeight={700}>
              Spin the Wheel
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FormControlLabel
              onClick={(e) => e.stopPropagation()}
              control={
                <Switch
                  checked={spinWheel.enabled}
                  onChange={(e) => setSpinWheel((s) => ({ ...s, enabled: e.target.checked }))}
                />
              }
              label="Enabled"
            />
            <IconButton size="small">{spinOpen ? <ExpandLess /> : <ExpandMore />}</IconButton>
          </Box>
        </Box>

        <Collapse in={spinOpen}>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'grid', gap: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Title"
                value={spinWheel.title}
                onChange={(e) => setSpinWheel((s) => ({ ...s, title: e.target.value }))}
              />
              <TextField
                label="CTA text"
                value={spinWheel.cta_text}
                onChange={(e) => setSpinWheel((s) => ({ ...s, cta_text: e.target.value }))}
              />
            </Box>
            <TextField
              label="Description"
              multiline
              minRows={2}
              value={spinWheel.description}
              onChange={(e) => setSpinWheel((s) => ({ ...s, description: e.target.value }))}
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Start date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={spinWheel.start_date ? String(spinWheel.start_date).slice(0, 10) : ''}
                onChange={(e) => setSpinWheel((s) => ({ ...s, start_date: e.target.value }))}
              />
              <TextField
                label="End date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={spinWheel.end_date ? String(spinWheel.end_date).slice(0, 10) : ''}
                onChange={(e) => setSpinWheel((s) => ({ ...s, end_date: e.target.value }))}
              />
            </Box>
            <TextField
              label="Terms & conditions"
              multiline
              minRows={2}
              value={spinWheel.terms}
              onChange={(e) => setSpinWheel((s) => ({ ...s, terms: e.target.value }))}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" fontWeight={700}>
                Segments / Rewards ({spinWheel.segments.length})
              </Typography>
              <Button size="small" startIcon={<Add />} onClick={addSegment}>
                Add segment
              </Button>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {spinWheel.segments.map((seg) => (
                <Box
                  key={seg.id}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'auto 1fr 1fr 90px auto' },
                    gap: 1.5,
                    alignItems: 'center',
                    p: 1.5,
                    borderRadius: 2,
                    border: (t) => `1px solid ${t.palette.divider}`,
                  }}
                >
                  <input
                    type="color"
                    value={seg.color}
                    onChange={(e) => updateSegment(seg.id, 'color', e.target.value)}
                    style={{ width: 36, height: 36, border: 'none', background: 'none', cursor: 'pointer' }}
                  />
                  <TextField
                    label="Label"
                    size="small"
                    value={seg.label}
                    onChange={(e) => updateSegment(seg.id, 'label', e.target.value)}
                  />
                  <TextField
                    label="Reward"
                    size="small"
                    value={seg.reward}
                    onChange={(e) => updateSegment(seg.id, 'reward', e.target.value)}
                  />
                  <TextField
                    label="Weight"
                    size="small"
                    type="number"
                    inputProps={{ min: 0, step: 1 }}
                    value={seg.weight}
                    onChange={(e) => updateSegment(seg.id, 'weight', Number(e.target.value))}
                  />
                  <IconButton color="error" onClick={() => deleteSegment(seg.id)}>
                    <Delete />
                  </IconButton>
                </Box>
              ))}
              {spinWheel.segments.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  No segments yet.
                </Typography>
              )}
            </Box>
          </Box>
        </Collapse>
      </Paper> */}

      {/* Bottom save */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mb: 4 }}>
        <Button
          variant="outlined"
          startIcon={<OpenInNew />}
          component="a"
          href="https://barkbutler.in/linktree"
          target="_blank"
          rel="noopener noreferrer"
        >
          Preview
        </Button>
        <Button
          variant="contained"
          size="large"
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save />}
          onClick={handleSave}
          disabled={saving}
        >
          Save changes
        </Button>
      </Box>

      {/* WhatsApp dialog */}
      <Dialog open={waDialogOpen} onClose={() => setWaDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WhatsApp sx={{ color: '#25D366' }} /> Connect WhatsApp
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={whatsapp.enabled}
                  onChange={(e) => setWhatsapp((w) => ({ ...w, enabled: e.target.checked }))}
                />
              }
              label="Show WhatsApp button on public page"
            />
            <TextField
              label="WhatsApp number (with country code)"
              placeholder="e.g. 919876543210"
              fullWidth
              value={whatsapp.number}
              onChange={(e) => setWhatsapp((w) => ({ ...w, number: e.target.value }))}
              helperText="Digits only, including country code. No + or spaces."
            />
            <TextField
              label="Button label"
              fullWidth
              value={whatsapp.label}
              onChange={(e) => setWhatsapp((w) => ({ ...w, label: e.target.value }))}
            />
            <TextField
              label="Pre-filled message"
              fullWidth
              multiline
              minRows={2}
              value={whatsapp.message}
              onChange={(e) => setWhatsapp((w) => ({ ...w, message: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWaDialogOpen(false)}>Done</Button>
        </DialogActions>
      </Dialog>

      {/* Brand link picker */}
      <Dialog
        open={brandDialogOpen}
        onClose={() => setBrandDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Add a brand link</DialogTitle>
        <DialogContent dividers>
          <TextField
            autoFocus
            fullWidth
            size="small"
            placeholder="Search brands…"
            value={brandSearch}
            onChange={(e) => setBrandSearch(e.target.value)}
            sx={{ mb: 2 }}
          />
          {brandsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 420, overflowY: 'auto' }}>
              {brands
                .filter((b) =>
                  b.name.toLowerCase().includes(brandSearch.trim().toLowerCase())
                )
                .map((b) => (
                  <Box
                    key={b._id}
                    onClick={() => addBrandLink(b)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 1,
                      borderRadius: 2,
                      cursor: 'pointer',
                      border: (t) => `1px solid ${t.palette.divider}`,
                      '&:hover': { bgcolor: (t) => alpha(t.palette.primary.main, 0.08) },
                    }}
                  >
                    <Avatar variant="rounded" src={b.image_url || undefined} sx={{ width: 48, height: 48, bgcolor: '#fff' }}>
                      <ImageIcon color="disabled" />
                    </Avatar>
                    <Typography fontWeight={600}>{b.name}</Typography>
                  </Box>
                ))}
              {brands.length > 0 &&
                brands.filter((b) =>
                  b.name.toLowerCase().includes(brandSearch.trim().toLowerCase())
                ).length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                    No brands match “{brandSearch}”.
                  </Typography>
                )}
              {!brandsLoading && brands.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                  No brands found.
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBrandDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LinkTreeAdmin;
