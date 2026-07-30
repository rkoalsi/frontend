'use client';
import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Link as MuiLink,
} from '@mui/material';
import {
  CloudUpload,
  Image as ImageIcon,
  PictureAsPdf,
  Delete,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axiosInstance from '../../src/util/axios';

// Public-facing brand content, kept apart from the company/contact details on
// the profile page — this is marketing copy the distributor edits freely.
const ImageSlot = ({ label, hint, url, kind, onUploaded }: any) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const upload = async (file: File) => {
    setBusy(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await axiosInstance.post(
        `/distributor_portal/brand-profile/image?kind=${kind}`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      onUploaded(res.data.url);
      toast.success(`${label} updated.`);
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Upload failed.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <Box>
      <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography variant='caption' color='text.secondary' display='block' sx={{ mb: 1 }}>
        {hint}
      </Typography>
      <Box
        sx={{
          border: '1px dashed',
          borderColor: 'divider',
          borderRadius: 2,
          height: 150,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          // Brand assets are often transparent PNGs designed for white —
          // a fixed light backdrop keeps them legible in dark mode.
          bgcolor: '#fff',
          mb: 1,
        }}
      >
        {url ? (
          <Box
            component='img'
            src={url}
            alt={label}
            sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
          />
        ) : (
          <ImageIcon sx={{ fontSize: 40, color: 'grey.400' }} />
        )}
      </Box>
      <input
        ref={inputRef}
        type='file'
        accept='image/png,image/jpeg,image/webp,image/svg+xml'
        hidden
        onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
      />
      <Button
        size='small'
        variant='outlined'
        startIcon={busy ? <CircularProgress size={14} /> : <CloudUpload />}
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {url ? 'Replace' : 'Upload'}
      </Button>
    </Box>
  );
};

const BrandProfile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axiosInstance
      .get('/distributor_portal/brand-profile')
      .then((r) => setProfile(r.data.brand_profile))
      .catch(() => toast.error('Could not load your brand profile.'))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await axiosInstance.put('/distributor_portal/brand-profile', {
        description: profile.description || '',
        tagline: profile.tagline || '',
        website: profile.website || '',
      });
      toast.success('Brand profile saved.');
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Could not save.');
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
  if (!profile) return null;

  const set = (k: string) => (e: any) => setProfile({ ...profile, [k]: e.target.value });

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Typography variant='h5' sx={{ fontWeight: 700, mb: 0.5 }}>
        Brand Profile
      </Typography>
      <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
        How {profile.brand_name} is presented to retailers on the marketplace.
      </Typography>

      <Paper
        elevation={0}
        sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', mb: 2 }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 3,
          }}
        >
          <ImageSlot
            label='Primary logo'
            hint='Shown on brand listings. A transparent PNG or SVG works best.'
            url={profile.logo_url}
            kind='logo'
            onUploaded={(url: string) => setProfile({ ...profile, logo_url: url })}
          />
          <ImageSlot
            label='Secondary image'
            hint='A banner or lifestyle shot used on your brand page.'
            url={profile.secondary_image_url}
            kind='secondary'
            onUploaded={(url: string) =>
              setProfile({ ...profile, secondary_image_url: url })
            }
          />
        </Box>
      </Paper>

      <Paper
        elevation={0}
        sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}
      >
        <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 2 }}>
          Brand details
        </Typography>
        <Divider sx={{ mb: 2.5 }} />
        <TextField
          label='Tagline'
          fullWidth
          value={profile.tagline || ''}
          onChange={set('tagline')}
          placeholder='A short line that sums up the brand'
          sx={{ mb: 2.5 }}
        />
        <TextField
          label='Website'
          fullWidth
          value={profile.website || ''}
          onChange={set('website')}
          placeholder='https://'
          sx={{ mb: 2.5 }}
        />
        <TextField
          label='Description'
          fullWidth
          multiline
          minRows={5}
          value={profile.description || ''}
          onChange={set('description')}
          placeholder='Tell retailers about your brand, your range and what makes it sell.'
          helperText={`${(profile.description || '').length} / 4000`}
        />
        <Box sx={{ mt: 2.5 }}>
          <Button
            variant='contained'
            onClick={save}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} /> : undefined}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </Box>
      </Paper>

      <CatalogueSection
        catalogues={profile.catalogues || []}
        onChange={(catalogues: any[]) => setProfile({ ...profile, catalogues })}
      />
    </Box>
  );
};

const fmtSize = (bytes: number) => {
  if (!bytes) return '';
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
};

// Sales collateral retailers and our sales team can open. Kept on this page
// rather than a popup — it belongs with the rest of the brand's content.
const CatalogueSection = ({ catalogues, onChange }: any) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await axiosInstance.post(
        '/distributor_portal/brand-profile/catalogue',
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      onChange([...catalogues, res.data.catalogue]);
      toast.success('Catalogue uploaded.');
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Upload failed.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = async (id: string) => {
    try {
      await axiosInstance.delete(`/distributor_portal/brand-profile/catalogue/${id}`);
      onChange(catalogues.filter((c: any) => c._id !== id));
      toast.success('Catalogue removed.');
    } catch {
      toast.error('Could not remove the catalogue.');
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', mt: 2 }}
    >
      <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
        Brand Catalogue
      </Typography>
      <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
        Upload your product catalogue or brand deck for retailers and our sales team.
        PDF, PPTX, PNG or JPG, up to 25 MB.
      </Typography>
      <Divider sx={{ mb: 2 }} />

      {catalogues.length === 0 ? (
        <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
          No catalogue uploaded yet.
        </Typography>
      ) : (
        <List dense sx={{ mb: 1 }}>
          {catalogues.map((c: any) => (
            <ListItem
              key={c._id}
              sx={{ px: 1, borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}
              secondaryAction={
                <Tooltip title='Remove' arrow>
                  <IconButton edge='end' size='small' onClick={() => remove(c._id)}>
                    <Delete fontSize='small' />
                  </IconButton>
                </Tooltip>
              }
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <PictureAsPdf color='action' />
              </ListItemIcon>
              <ListItemText
                primary={
                  <MuiLink href={c.url} target='_blank' rel='noopener noreferrer'>
                    {c.title || c.filename}
                  </MuiLink>
                }
                secondary={[c.filename, fmtSize(c.size_bytes)].filter(Boolean).join(' · ')}
              />
            </ListItem>
          ))}
        </List>
      )}

      <input
        ref={inputRef}
        type='file'
        accept='.pdf,.pptx,image/png,image/jpeg'
        hidden
        onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
      />
      <Button
        variant='outlined'
        startIcon={uploading ? <CircularProgress size={14} /> : <CloudUpload />}
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? 'Uploading…' : 'Upload catalogue'}
      </Button>
    </Paper>
  );
};

export default BrandProfile;
