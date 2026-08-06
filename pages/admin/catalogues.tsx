import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Button,
  TablePagination,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Switch,
  Autocomplete,
  Avatar,
  Chip,
  Tooltip,
  InputAdornment,
  MenuItem,
  FormControlLabel,
  Divider,
  useMediaQuery,
  useTheme,
  DialogActions,
  DialogContentText,
  Tabs,
  Tab,
} from '@mui/material';
import { toast } from 'react-toastify';
import {
  Campaign,
  Edit,
  Delete,
  Search,
  ContentCopy,
  OpenInNew,
  PictureAsPdf,
  Add,
  Storefront,
  History as HistoryIcon,
} from '@mui/icons-material';
import axiosInstance from '../../src/util/axios';
import { formatHumanDateTime } from '../../src/util/date';

/* Timestamps land in Mongo as naive UTC (the backend anchors every write to
   UTC so a dev machine on IST and the server agree). Admins want IST, so every
   render goes through the same conversion. */
const IST_OPTS = { assumeUTC: true, tz: 'Asia/Kolkata' } as const;
const formatStamp = (value?: string | null) =>
  value ? formatHumanDateTime(value, IST_OPTS) : '—';

interface CatalogueEvent {
  catalogue_id: string;
  catalogue_name: string;
  action: string;
  at: string;
  by?: string | null;
  fields?: string[];
}

const ACTION_META: Record<
  string,
  { label: string; color: 'success' | 'info' | 'warning' | 'error' | 'default' }
> = {
  created: { label: 'Created', color: 'success' },
  updated: { label: 'Updated', color: 'info' },
  activated: { label: 'Activated', color: 'success' },
  deactivated: { label: 'Deactivated', color: 'warning' },
  deleted: { label: 'Deleted', color: 'error' },
};

/* `brand_ids` etc. are storage names — spell them the way the form does. */
const FIELD_LABELS: Record<string, string> = {
  name: 'name',
  image_url: 'PDF file',
  brand_ids: 'brands',
  brands: 'brands',
  is_active: 'status',
};

interface Brand {
  _id: string;
  name: string;
  image_url?: string;
}

const EMPTY_FORM = {
  name: '',
  image_url: '',
  is_active: true,
  brand_ids: [] as string[],
};

/* Brand logos are supplied as dark-on-transparent SVGs, so they always sit on
   a light chip regardless of the app theme. */
const BrandLogo = ({ brand, size = 28 }: { brand: Brand; size?: number }) => (
  <Tooltip title={brand.name} arrow>
    <Avatar
      src={brand.image_url || undefined}
      alt={brand.name}
      variant='rounded'
      sx={{
        width: size,
        height: size,
        bgcolor: '#fff',
        border: '1px solid',
        borderColor: 'divider',
        '& img': { objectFit: 'contain', p: '2px' },
        fontSize: size / 2.4,
        color: 'text.primary',
      }}
    >
      {brand.name?.[0]?.toUpperCase()}
    </Avatar>
  </Tooltip>
);

const BrandCell = ({ brands }: { brands: Brand[] }) => {
  if (!brands || brands.length === 0) {
    return (
      <Chip
        size='small'
        icon={<Storefront sx={{ fontSize: 16 }} />}
        label='Not linked'
        variant='outlined'
        color='warning'
      />
    );
  }
  return (
    <Box display='flex' alignItems='center' gap={1} flexWrap='wrap'>
      {brands.map((b) => (
        <Chip
          key={b._id}
          size='small'
          avatar={<BrandLogo brand={b} size={26} />}
          label={b.name}
          variant='outlined'
        />
      ))}
    </Box>
  );
};

const Catalogues = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [tab, setTab] = useState<'list' | 'history'>('list');
  const [catalogues, setCatalogues] = useState<any[]>([]);
  const [events, setEvents] = useState<CatalogueEvent[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [page, setPage] = useState(0); // 0-based index
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('all');

  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Add/edit dialog
  const [selectedCatalogue, setSelectedCatalogue] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  // Confirmation dialogs
  const [catalogueToDelete, setCatalogueToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifying, setNotifying] = useState(false);

  const brandsById = useMemo(() => {
    const map: Record<string, Brand> = {};
    brands.forEach((b) => (map[b._id] = b));
    return map;
  }, [brands]);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchCatalogues = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: rowsPerPage };
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (status !== 'all') params.status = status;
      const response = await axiosInstance.get(`/admin/catalogues`, { params });
      const { catalogues, total_count } = response.data;
      setCatalogues(catalogues || []);
      setTotalCount(total_count || 0);
    } catch (error) {
      console.error(error);
      toast.error('Error fetching catalogues.');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedSearch, status]);

  useEffect(() => {
    fetchCatalogues();
  }, [fetchCatalogues]);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const response = await axiosInstance.get('/admin/catalogues/history');
      setEvents(response.data?.events || []);
    } catch (error) {
      console.error(error);
      toast.error('Error fetching catalogue history.');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // Refetched on every visit to the tab so an edit made moments ago is there.
  useEffect(() => {
    if (tab === 'history') fetchHistory();
  }, [tab, fetchHistory]);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const resp = await axiosInstance.get('/admin/brands_with_images');
        setBrands(resp.data?.brands || []);
      } catch (error) {
        console.error(error);
        toast.error('Error fetching brands.');
      }
    };
    fetchBrands();
  }, []);

  const handleChangePage = (_event: any, newPage: number) => setPage(newPage);

  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleAddCatalogue = () => {
    setSelectedCatalogue(null);
    setFormData(EMPTY_FORM);
    setDialogOpen(true);
  };

  const handleEditClick = (catalog: any) => {
    setSelectedCatalogue(catalog);
    setFormData({
      name: catalog.name || '',
      image_url: catalog.image_url || '',
      is_active: catalog.is_active !== undefined ? catalog.is_active : true,
      brand_ids: (catalog.brand_details || []).map((b: Brand) => b._id),
    });
    setDialogOpen(true);
  };

  const handleNotify = async () => {
    setNotifying(true);
    try {
      await axiosInstance.post(`/admin/catalogues/notify_salespeople`);
      toast.success('Notification sent to salespeople and customers');
      setNotifyOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Error sending notification');
    } finally {
      setNotifying(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.image_url) {
      toast.error('Please provide a name and upload a PDF.');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...formData, name: formData.name.trim() };
      if (selectedCatalogue) {
        await axiosInstance.put(
          `/admin/catalogues/${selectedCatalogue._id}`,
          payload
        );
        toast.success('Catalogue updated successfully');
      } else {
        await axiosInstance.post(`/admin/catalogues`, payload);
        toast.success('Catalogue added successfully');
      }
      setDialogOpen(false);
      fetchCatalogues();
    } catch (error) {
      console.error(error);
      toast.error('Error saving catalogue');
    } finally {
      setSaving(false);
    }
  };

  // Toggles active/inactive status
  const handleToggleActive = async (catalog: any) => {
    // Optimistic flip so the switch responds immediately.
    setCatalogues((prev) =>
      prev.map((c) =>
        c._id === catalog._id ? { ...c, is_active: !c.is_active } : c
      )
    );
    try {
      await axiosInstance.delete(`/admin/catalogues/${catalog._id}`);
      toast.success(
        `Catalogue marked as ${!catalog.is_active ? 'Active' : 'Inactive'}`
      );
      fetchCatalogues();
    } catch (error: any) {
      console.error(error);
      toast.error(
        error.response?.data?.detail || 'Error updating catalogue status'
      );
      fetchCatalogues();
    }
  };

  const handleConfirmDelete = async () => {
    if (!catalogueToDelete) return;
    setDeleting(true);
    try {
      await axiosInstance.delete(
        `/admin/catalogues/${catalogueToDelete._id}/soft_delete`
      );
      toast.success('Catalogue deleted successfully');
      setCatalogueToDelete(null);
      fetchCatalogues();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.detail || 'Error deleting catalogue');
    } finally {
      setDeleting(false);
    }
  };

  const handleCopyLink = (url: string, name: string) => {
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success(`${name} link copied`))
      .catch(() => toast.error('Failed to copy link'));
  };

  const handleFileChange = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      const response = await axiosInstance.post(
        '/admin/catalogues/upload',
        uploadFormData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      setFormData((prev) => ({ ...prev, image_url: response.data.file_url }));
      toast.success('File uploaded successfully');
    } catch (error) {
      console.error(error);
      toast.error('Error uploading file');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const unlinkedCount = useMemo(
    () => catalogues.filter((c) => !(c.brand_details || []).length).length,
    [catalogues]
  );

  const renderActions = (catalog: any) => (
    <Box display='flex' flexDirection='row' gap={0.5}>
      <Tooltip title='Edit' arrow>
        <IconButton onClick={() => handleEditClick(catalog)}>
          <Edit />
        </IconButton>
      </Tooltip>
      <Tooltip title='Copy PDF link' arrow>
        <span>
          <IconButton
            disabled={!catalog.image_url}
            onClick={() => handleCopyLink(catalog.image_url, catalog.name)}
          >
            <ContentCopy />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title='Delete' arrow>
        <IconButton color='error' onClick={() => setCatalogueToDelete(catalog)}>
          <Delete />
        </IconButton>
      </Tooltip>
    </Box>
  );

  return (
    <Box sx={{ padding: { xs: 2, sm: 3 } }}>
      <Paper
        elevation={3}
        sx={{ padding: { xs: 2, sm: 3, md: 4 }, borderRadius: 4 }}
      >
        <Box
          display='flex'
          flexDirection={{ xs: 'column', sm: 'row' }}
          justifyContent='space-between'
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          gap={{ xs: 2, sm: 0 }}
        >
          <Box>
            <Typography
              variant='h4'
              sx={{
                fontWeight: 'bold',
                fontSize: { xs: '1.5rem', sm: '2rem' },
              }}
            >
              All Catalogues
            </Typography>
            <Typography variant='body1' color='text.secondary'>
              Manage catalogue PDFs and link each one to its brand(s).
            </Typography>
          </Box>
          <Box display='flex' gap={1} flexWrap='wrap'>
            <Button
              variant='outlined'
              startIcon={<Campaign />}
              onClick={() => setNotifyOpen(true)}
            >
              Notify
            </Button>
            <Button
              variant='contained'
              startIcon={<Add />}
              onClick={handleAddCatalogue}
            >
              Add Catalogue
            </Button>
          </Box>
        </Box>

        <Tabs
          value={tab}
          onChange={(_e, v) => setTab(v)}
          sx={{ mt: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab value='list' label='Catalogues' />
          <Tab
            value='history'
            label='History'
            icon={<HistoryIcon fontSize='small' />}
            iconPosition='start'
          />
        </Tabs>

        {tab === 'list' && (
        <>
        {/* Filters */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            mt: 3,
            mb: 2,
          }}
        >
          <TextField
            size='small'
            placeholder='Search catalogues…'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1, maxWidth: { sm: 360 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <Search fontSize='small' />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            size='small'
            select
            label='Status'
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(0);
            }}
            sx={{ width: { xs: '100%', sm: 180 } }}
          >
            <MenuItem value='all'>All</MenuItem>
            <MenuItem value='active'>Active</MenuItem>
            <MenuItem value='inactive'>Inactive</MenuItem>
          </TextField>
        </Box>

        {!loading && unlinkedCount > 0 && (
          <Typography variant='body2' color='warning.main' sx={{ mb: 2 }}>
            {unlinkedCount} catalogue{unlinkedCount === 1 ? '' : 's'} on this
            page {unlinkedCount === 1 ? 'is' : 'are'} not linked to a brand —
            their cards will fall back to a text monogram.
          </Typography>
        )}

        {loading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '200px',
            }}
          >
            <CircularProgress />
          </Box>
        ) : catalogues.length === 0 ? (
          <Box display='flex' justifyContent='center' alignItems='center' py={6}>
            <Typography variant='h6' fontWeight='bold' color='text.secondary'>
              No catalogues found
            </Typography>
          </Box>
        ) : isMobile ? (
          /* ------------------------- Mobile cards ------------------------- */
          <Box sx={{ display: 'grid', gap: 2 }}>
            {catalogues.map((catalog: any) => (
              <Paper
                key={catalog._id}
                variant='outlined'
                sx={{ p: 2, borderRadius: 3 }}
              >
                <Box
                  display='flex'
                  justifyContent='space-between'
                  alignItems='flex-start'
                  gap={1}
                >
                  <Box display='flex' gap={1.5} minWidth={0}>
                    {catalog.brand_details?.[0] ? (
                      <BrandLogo brand={catalog.brand_details[0]} size={52} />
                    ) : (
                      <Avatar variant='rounded' sx={{ width: 52, height: 52 }}>
                        <PictureAsPdf fontSize='small' />
                      </Avatar>
                    )}
                    <Box minWidth={0}>
                      <Typography fontWeight={700} noWrap>
                        {catalog.name}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {catalog.is_active ? 'Active' : 'Inactive'}
                      </Typography>
                    </Box>
                  </Box>
                  <Switch
                    checked={Boolean(catalog.is_active)}
                    onChange={() => handleToggleActive(catalog)}
                  />
                </Box>
                <Box mt={1.5}>
                  <BrandCell brands={catalog.brand_details || []} />
                </Box>
                <Box
                  mt={1.5}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 1,
                  }}
                >
                  <Box>
                    <Typography variant='caption' color='text.disabled'>
                      Added
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {formatStamp(catalog.created_at)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant='caption' color='text.disabled'>
                      Last updated
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {formatStamp(catalog.updated_at)}
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ my: 1.5 }} />
                <Box
                  display='flex'
                  justifyContent='space-between'
                  alignItems='center'
                >
                  <Button
                    size='small'
                    startIcon={<OpenInNew />}
                    href={catalog.image_url}
                    target='_blank'
                    rel='noopener noreferrer'
                    disabled={!catalog.image_url}
                  >
                    Open PDF
                  </Button>
                  {renderActions(catalog)}
                </Box>
              </Paper>
            ))}
          </Box>
        ) : (
          /* -------------------------- Desktop table ----------------------- */
          <TableContainer component={Paper} variant='outlined'>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Brand(s)</TableCell>
                  <TableCell>Catalogue File</TableCell>
                  <TableCell>Added</TableCell>
                  <TableCell>Last updated</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align='right'>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {catalogues.map((catalog: any) => (
                  <TableRow key={catalog._id} hover>
                    <TableCell>
                      <Box display='flex' alignItems='center' gap={1.5}>
                        {catalog.brand_details?.[0] ? (
                          <BrandLogo brand={catalog.brand_details[0]} size={48} />
                        ) : (
                          <Avatar
                            variant='rounded'
                            sx={{ width: 48, height: 48 }}
                          >
                            <PictureAsPdf fontSize='small' />
                          </Avatar>
                        )}
                        <Typography fontWeight={600}>{catalog.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <BrandCell brands={catalog.brand_details || []} />
                    </TableCell>
                    <TableCell>
                      <Button
                        size='small'
                        startIcon={<OpenInNew />}
                        href={catalog.image_url}
                        target='_blank'
                        rel='noopener noreferrer'
                        disabled={!catalog.image_url}
                      >
                        Open PDF
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2' color='text.secondary' noWrap>
                        {formatStamp(catalog.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2' color='text.secondary' noWrap>
                        {formatStamp(catalog.updated_at)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={Boolean(catalog.is_active)}
                        onChange={() => handleToggleActive(catalog)}
                      />
                    </TableCell>
                    <TableCell align='right'>{renderActions(catalog)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {!loading && catalogues.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[25, 50, 100, 200]}
            component='div'
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        )}
        </>
        )}

        {tab === 'history' && (
          <Box sx={{ mt: 3 }}>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
              Every catalogue change, newest first — times shown in IST.
            </Typography>

            {historyLoading ? (
              <Box display='flex' justifyContent='center' py={6}>
                <CircularProgress />
              </Box>
            ) : events.length === 0 ? (
              <Box display='flex' justifyContent='center' py={6}>
                <Typography color='text.secondary'>
                  No catalogue activity recorded yet.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'grid', gap: 1.5 }}>
                {events.map((event, i) => {
                  // Falls back to `info` rather than `default` — a default Chip
                  // is near-invisible against the dark theme's surface.
                  const meta = ACTION_META[event.action] || {
                    label: event.action,
                    color: 'info' as const,
                  };
                  const fields = (event.fields || [])
                    .map((f) => FIELD_LABELS[f] || f)
                    .filter((f) => f !== 'updated_at');
                  return (
                    <Paper
                      key={`${event.catalogue_id}-${event.at}-${i}`}
                      variant='outlined'
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        gap: { xs: 1, sm: 2 },
                      }}
                    >
                      <Chip
                        size='small'
                        label={meta.label}
                        color={meta.color}
                        variant='outlined'
                        sx={{ minWidth: 96 }}
                      />
                      <Box flex={1} minWidth={0}>
                        <Typography fontWeight={600} noWrap>
                          {event.catalogue_name}
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                          {event.by ? `by ${event.by}` : 'author not recorded'}
                          {fields.length > 0 && ` · changed ${fields.join(', ')}`}
                        </Typography>
                      </Box>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        sx={{ whiteSpace: 'nowrap' }}
                      >
                        {formatStamp(event.at)}
                      </Typography>
                    </Paper>
                  );
                })}
              </Box>
            )}
          </Box>
        )}
      </Paper>

      {/* Dialog for Add/Edit Catalogue */}
      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        fullWidth
        maxWidth='sm'
        fullScreen={isMobile}
      >
        <DialogTitle>
          {selectedCatalogue ? 'Edit Catalogue' : 'Add Catalogue'}
        </DialogTitle>
        <DialogContent dividers>
          <Box
            component='form'
            noValidate
            autoComplete='off'
            sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}
          >
            <TextField
              label='Name'
              variant='outlined'
              fullWidth
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />

            <Autocomplete
              multiple
              options={brands}
              value={formData.brand_ids
                .map((id) => brandsById[id])
                .filter(Boolean)}
              onChange={(_e, value) =>
                setFormData({
                  ...formData,
                  brand_ids: value.map((b: Brand) => b._id),
                })
              }
              getOptionLabel={(option: Brand) => option.name}
              isOptionEqualToValue={(a, b) => a._id === b._id}
              renderOption={(props, option: Brand) => {
                const { key, ...rest } = props as any;
                return (
                  <Box
                    component='li'
                    key={key}
                    {...rest}
                    sx={{ display: 'flex', gap: 1.5 }}
                  >
                    <BrandLogo brand={option} size={34} />
                    {option.name}
                  </Box>
                );
              }}
              renderTags={(value: Brand[], getTagProps) =>
                value.map((option, index) => {
                  const { key, ...rest } = getTagProps({ index }) as any;
                  return (
                    <Chip
                      key={key}
                      {...rest}
                      avatar={<BrandLogo brand={option} size={26} />}
                      label={option.name}
                      variant='outlined'
                    />
                  );
                })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label='Brands'
                  placeholder='Link brand(s)'
                  helperText='Pick every brand this catalogue covers — e.g. Petfest = Dogfest + Catfest, FOFOS X Barkbutler = FOFOS + Barkbutler. Their logos show on the catalogue card.'
                />
              )}
            />

            {/* Catalogue file */}
            <Box
              sx={{
                border: '1px dashed',
                borderColor: 'divider',
                borderRadius: 2,
                p: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                flexWrap: 'wrap',
              }}
            >
              <PictureAsPdf color={formData.image_url ? 'error' : 'disabled'} />
              <Box flex={1} minWidth={160}>
                <Typography variant='body2' fontWeight={600}>
                  {formData.image_url ? 'PDF uploaded' : 'No PDF uploaded yet'}
                </Typography>
                {formData.image_url && (
                  <Typography
                    variant='caption'
                    component='a'
                    href={formData.image_url}
                    target='_blank'
                    rel='noopener noreferrer'
                    sx={{ color: 'primary.main', wordBreak: 'break-all' }}
                  >
                    {formData.image_url.split('/').pop()}
                  </Typography>
                )}
              </Box>
              <Button variant='contained' component='label' disabled={uploading}>
                {uploading ? (
                  <CircularProgress size={20} color='inherit' />
                ) : formData.image_url ? (
                  'Replace PDF'
                ) : (
                  'Upload PDF'
                )}
                <input
                  type='file'
                  hidden
                  accept='application/pdf'
                  onChange={handleFileChange}
                />
              </Button>
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                />
              }
              label='Active (visible to salespeople and customers)'
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant='contained'
            onClick={handleSave}
            disabled={saving || uploading}
            startIcon={
              saving ? <CircularProgress size={16} color='inherit' /> : null
            }
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notify Confirmation Dialog */}
      <Dialog
        open={notifyOpen}
        onClose={() => !notifying && setNotifyOpen(false)}
        maxWidth='xs'
        fullWidth
      >
        <DialogTitle>Notify about new catalogue</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This sends an in-app notification to <strong>all</strong>{' '}
            salespeople, sales admins and customers. Continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setNotifyOpen(false)} disabled={notifying}>
            Cancel
          </Button>
          <Button
            variant='contained'
            onClick={handleNotify}
            disabled={notifying}
            startIcon={
              notifying ? <CircularProgress size={16} color='inherit' /> : null
            }
          >
            Send
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(catalogueToDelete)}
        onClose={() => !deleting && setCatalogueToDelete(null)}
        maxWidth='xs'
        fullWidth
      >
        <DialogTitle>Delete Catalogue</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete{' '}
            <strong>{catalogueToDelete?.name}</strong>? This action will remove
            it from the list.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setCatalogueToDelete(null)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            variant='contained'
            color='error'
            onClick={handleConfirmDelete}
            disabled={deleting}
            startIcon={
              deleting ? <CircularProgress size={16} color='inherit' /> : null
            }
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Catalogues;
