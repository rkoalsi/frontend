import React, { useEffect, useMemo, useState } from 'react';
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
  Grid,
  Chip,
  InputAdornment,
} from '@mui/material';
import {
  Add,
  Delete,
  Edit as EditIcon,
  Image as ImageIcon,
  Save,
  OpenInNew,
  ContentCopy,
  QrCode2,
  QrCodeScanner,
  Search,
} from '@mui/icons-material';
import { QRCodeCanvas } from 'qrcode.react';
import { toast } from 'react-toastify';
import axiosInstance from '../../src/util/axios';

const BLOG_URL = (process.env.blog_url || 'https://barkbutler.in').replace(/\/$/, '');

const SOCIAL_OPTIONS = ['instagram', 'linkedin', 'facebook', 'youtube'] as const;

interface Card {
  _id?: string;
  slug?: string;
  name: string;
  title: string;
  company: string;
  city: string;
  country: string;
  photo_url: string;
  cover_url: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  booking_url: string;
  bio: string;
  socials: Record<string, string>;
  is_active: boolean;
  scan_count?: number;
}

interface Scan {
  _id: string;
  ts: string;
  ip?: string;
  user_agent?: string;
  referer?: string;
}

const emptyCard = (): Card => ({
  name: '',
  title: '',
  company: 'Pupscribe Enterprises Pvt. Ltd.',
  city: 'Mumbai',
  country: 'India',
  photo_url: '',
  cover_url: '',
  phone: '',
  whatsapp: '',
  email: '',
  website: '',
  booking_url: '',
  bio: '',
  socials: {},
  is_active: true,
});

const publicUrl = (slug?: string) => (slug ? `${BLOG_URL}/card/${slug}` : '');

const BusinessCardsAdmin: React.FC = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState<Card>(emptyCard());
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  // QR dialog state
  const [qrCard, setQrCard] = useState<Card | null>(null);

  // Scan-log dialog state
  const [scanCard, setScanCard] = useState<Card | null>(null);
  const [scans, setScans] = useState<Scan[]>([]);
  const [scansTotal, setScansTotal] = useState(0);
  const [scansLoading, setScansLoading] = useState(false);

  const openScans = async (card: Card) => {
    setScanCard(card);
    setScansLoading(true);
    try {
      const res = await axiosInstance.get(`/admin/cards/${card._id}/scans`);
      setScans(res.data?.scans || []);
      setScansTotal(res.data?.total || 0);
    } catch {
      toast.error('Error loading scan history.');
      setScans([]);
      setScansTotal(0);
    } finally {
      setScansLoading(false);
    }
  };

  // Coarse device summary from the user agent — enough for an at-a-glance log.
  const deviceOf = (ua?: string) => {
    if (!ua) return 'Unknown device';
    if (/iphone|ipad|ipod/i.test(ua)) return 'iPhone / iPad';
    if (/android/i.test(ua)) return 'Android';
    if (/windows/i.test(ua)) return 'Windows';
    if (/macintosh|mac os/i.test(ua)) return 'Mac';
    if (/linux/i.test(ua)) return 'Linux';
    return 'Other';
  };

  const fetchCards = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/admin/cards');
      setCards(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      toast.error('Error loading business cards.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cards;
    return cards.filter((c) =>
      [c.name, c.title, c.company, c.slug]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q))
    );
  }, [cards, search]);

  const uploadImage = async (file: File): Promise<string | null> => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await axiosInstance.post('/admin/cards/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data?.url || null;
  };

  const handleImageUpload = async (field: 'photo_url' | 'cover_url', e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingKey(field);
    try {
      const url = await uploadImage(file);
      if (url) setDraft((d) => ({ ...d, [field]: url }));
      toast.success('Image uploaded');
    } catch {
      toast.error('Error uploading image');
    } finally {
      setUploadingKey(null);
      e.target.value = '';
    }
  };

  const openCreate = () => {
    setDraft(emptyCard());
    setEditOpen(true);
  };

  const openEdit = (card: Card) => {
    setDraft({ ...emptyCard(), ...card, socials: { ...(card.socials || {}) } });
    setEditOpen(true);
  };

  const setField = (field: keyof Card, value: any) =>
    setDraft((d) => ({ ...d, [field]: value }));

  const setSocial = (platform: string, value: string) =>
    setDraft((d) => ({ ...d, socials: { ...d.socials, [platform]: value } }));

  const handleSave = async () => {
    if (!draft.name.trim()) {
      toast.error('Name is required.');
      return;
    }
    setSaving(true);
    try {
      // Drop empty social values so we don't persist blanks.
      const socials = Object.fromEntries(
        Object.entries(draft.socials || {}).filter(([, v]) => v && v.trim())
      );
      const payload = { ...draft, socials };
      if (draft._id) {
        await axiosInstance.put(`/admin/cards/${draft._id}`, payload);
        toast.success('Card updated');
      } else {
        await axiosInstance.post('/admin/cards', payload);
        toast.success('Card created');
      }
      setEditOpen(false);
      fetchCards();
    } catch (e) {
      console.error(e);
      toast.error('Error saving card.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (card: Card) => {
    try {
      await axiosInstance.put(`/admin/cards/${card._id}`, {
        ...card,
        is_active: !card.is_active,
      });
      setCards((cs) =>
        cs.map((c) => (c._id === card._id ? { ...c, is_active: !c.is_active } : c))
      );
    } catch {
      toast.error('Error updating card.');
    }
  };

  const handleDelete = async (card: Card) => {
    if (!window.confirm(`Delete the card for "${card.name}"? This cannot be undone.`)) {
      return;
    }
    try {
      await axiosInstance.delete(`/admin/cards/${card._id}`);
      toast.success('Card deleted');
      setCards((cs) => cs.filter((c) => c._id !== card._id));
    } catch {
      toast.error('Error deleting card.');
    }
  };

  const copyUrl = (slug?: string) => {
    const url = publicUrl(slug);
    if (!url) return;
    navigator.clipboard.writeText(url).then(
      () => toast.success('Public URL copied'),
      () => toast.error('Could not copy URL')
    );
  };

  const downloadQr = (card: Card) => {
    const canvas = document.getElementById('card-qr-canvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${card.slug || 'card'}-qr.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: 'auto' }}>
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
          <Typography variant='h5' fontWeight={700}>
            Digital Business Cards
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Published at {BLOG_URL}/card/&lt;slug&gt;
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <TextField
            size='small'
            placeholder='Search cards…'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <Search fontSize='small' />
                </InputAdornment>
              ),
            }}
          />
          <Button variant='contained' startIcon={<Add />} onClick={openCreate}>
            New Card
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : filtered.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Typography color='text.secondary'>
            {cards.length === 0
              ? 'No business cards yet. Create your first one.'
              : 'No cards match your search.'}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {filtered.map((card) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={card._id}>
              <Paper
                sx={{
                  p: 2,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                  opacity: card.is_active ? 1 : 0.6,
                }}
              >
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                  <Avatar src={card.photo_url} sx={{ width: 52, height: 52 }}>
                    {card.name?.[0]}
                  </Avatar>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography fontWeight={700} noWrap>
                      {card.name}
                    </Typography>
                    <Typography variant='body2' color='text.secondary' noWrap>
                      {[card.title, card.company].filter(Boolean).join(' · ')}
                    </Typography>
                  </Box>
                  {!card.is_active && <Chip size='small' label='Hidden' />}
                </Box>

                <Typography
                  variant='caption'
                  color='text.secondary'
                  sx={{ wordBreak: 'break-all' }}
                >
                  /card/{card.slug}
                </Typography>

                <Box>
                  <Tooltip title='View scan history'>
                    <Chip
                      size='small'
                      icon={<QrCodeScanner fontSize='small' />}
                      label={`${card.scan_count ?? 0} scan${(card.scan_count ?? 0) === 1 ? '' : 's'}`}
                      onClick={() => openScans(card)}
                      variant='outlined'
                    />
                  </Tooltip>
                </Box>

                <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <FormControlLabel
                    sx={{ mr: 'auto' }}
                    control={
                      <Switch
                        size='small'
                        checked={card.is_active}
                        onChange={() => toggleActive(card)}
                      />
                    }
                    label={<Typography variant='caption'>Active</Typography>}
                  />
                  <Tooltip title='Copy public URL'>
                    <IconButton size='small' onClick={() => copyUrl(card.slug)}>
                      <ContentCopy fontSize='small' />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title='Show QR code'>
                    <IconButton size='small' onClick={() => setQrCard(card)}>
                      <QrCode2 fontSize='small' />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title='Open card'>
                    <IconButton
                      size='small'
                      component='a'
                      href={publicUrl(card.slug)}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      <OpenInNew fontSize='small' />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title='Edit'>
                    <IconButton size='small' onClick={() => openEdit(card)}>
                      <EditIcon fontSize='small' />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title='Delete'>
                    <IconButton
                      size='small'
                      color='error'
                      onClick={() => handleDelete(card)}
                    >
                      <Delete fontSize='small' />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>{draft._id ? 'Edit Card' : 'New Card'}</DialogTitle>
        <DialogContent dividers>
          {/* Profile photo (optional — falls back to initials on the card) */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar src={draft.photo_url} sx={{ width: 72, height: 72 }}>
              {draft.name?.[0]}
            </Avatar>
            <Box>
              <Button
                component='label'
                size='small'
                variant='outlined'
                startIcon={
                  uploadingKey === 'photo_url' ? (
                    <CircularProgress size={14} />
                  ) : (
                    <ImageIcon />
                  )
                }
                disabled={uploadingKey === 'photo_url'}
              >
                {draft.photo_url ? 'Change photo' : 'Upload photo'}
                <input
                  hidden
                  type='file'
                  accept='image/*'
                  onChange={(e) => handleImageUpload('photo_url', e)}
                />
              </Button>
              <Typography variant='caption' display='block' color='text.secondary' sx={{ mt: 0.5 }}>
                Optional — shows initials if left blank
              </Typography>
            </Box>
          </Box>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                required
                label='Full name'
                value={draft.name}
                onChange={(e) => setField('name', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label='Job title'
                value={draft.title}
                onChange={(e) => setField('title', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label='Company'
                value={draft.company}
                onChange={(e) => setField('company', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label='City'
                value={draft.city}
                onChange={(e) => setField('city', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label='Country'
                value={draft.country}
                onChange={(e) => setField('country', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label='Phone'
                value={draft.phone}
                onChange={(e) => setField('phone', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label='WhatsApp number'
                value={draft.whatsapp}
                onChange={(e) => setField('whatsapp', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label='Email'
                value={draft.email}
                onChange={(e) => setField('email', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label='Website'
                value={draft.website}
                onChange={(e) => setField('website', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label='Booking / availability URL'
                value={draft.booking_url}
                onChange={(e) => setField('booking_url', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                minRows={2}
                label='Short bio'
                value={draft.bio}
                onChange={(e) => setField('bio', e.target.value)}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }}>
            <Typography variant='caption' color='text.secondary'>
              Social links
            </Typography>
          </Divider>
          <Grid container spacing={2}>
            {SOCIAL_OPTIONS.map((platform) => (
              <Grid size={{ xs: 12, sm: 6 }} key={platform}>
                <TextField
                  fullWidth
                  label={platform.charAt(0).toUpperCase() + platform.slice(1)}
                  value={draft.socials?.[platform] || ''}
                  onChange={(e) => setSocial(platform, e.target.value)}
                />
              </Grid>
            ))}
          </Grid>

          <FormControlLabel
            sx={{ mt: 2 }}
            control={
              <Switch
                checked={draft.is_active}
                onChange={(e) => setField('is_active', e.target.checked)}
              />
            }
            label='Active (visible publicly)'
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button
            variant='contained'
            startIcon={saving ? <CircularProgress size={16} /> : <Save />}
            onClick={handleSave}
            disabled={saving}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* QR dialog */}
      <Dialog open={!!qrCard} onClose={() => setQrCard(null)} maxWidth='xs'>
        <DialogTitle>{qrCard?.name}</DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          {qrCard && (
            <>
              <Box sx={{ p: 2, display: 'inline-block', bgcolor: '#fff', borderRadius: 2 }}>
                <QRCodeCanvas
                  id='card-qr-canvas'
                  value={`${publicUrl(qrCard.slug)}?src=qr`}
                  size={220}
                  level='M'
                />
              </Box>
              <Typography
                variant='caption'
                display='block'
                color='text.secondary'
                sx={{ mt: 1, wordBreak: 'break-all' }}
              >
                {publicUrl(qrCard.slug)}
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => qrCard && copyUrl(qrCard.slug)} startIcon={<ContentCopy />}>
            Copy URL
          </Button>
          <Button
            variant='contained'
            onClick={() => qrCard && downloadQr(qrCard)}
            startIcon={<QrCode2 />}
          >
            Download PNG
          </Button>
        </DialogActions>
      </Dialog>

      {/* Scan history dialog */}
      <Dialog
        open={!!scanCard}
        onClose={() => setScanCard(null)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>
          QR Scans — {scanCard?.name}
          <Typography variant='body2' color='text.secondary'>
            {scansTotal} total scan{scansTotal === 1 ? '' : 's'}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {scansLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : scans.length === 0 ? (
            <Typography color='text.secondary' sx={{ py: 3, textAlign: 'center' }}>
              No scans recorded yet. Scans are counted when someone opens the
              card through its QR code.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {scans.map((s) => (
                <Paper key={s._id} variant='outlined' sx={{ p: 1.5 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 1,
                    }}
                  >
                    <Typography variant='body2' fontWeight={600}>
                      {new Date(s.ts).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </Typography>
                    <Chip size='small' label={deviceOf(s.user_agent)} />
                  </Box>
                  {s.ip && (
                    <Typography variant='caption' color='text.secondary'>
                      IP: {s.ip}
                    </Typography>
                  )}
                </Paper>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScanCard(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BusinessCardsAdmin;
