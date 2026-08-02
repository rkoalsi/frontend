import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  OpenInNew,
  Restore,
  Save,
  Science,
  Storefront,
  UploadFile,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axiosInstance from '../../src/util/axios';

/**
 * Brand site links — the marketing links behind thegoodtreatcompany.com.
 *
 * The range itself is synced from Zoho and is not editable here; what this page
 * owns is the signed lab report PDF and the buy-now destination for each
 * recipe, plus the site-wide "Shop now" link. The brand site reads all of it
 * from GET /api/products/brand-site, so a save here goes live without a deploy.
 */

const BRANDS = ['Jolly Pawps'];

interface ProductRow {
  sku: string;
  name: string;
  display_name: string;
  series: string | null;
  image: string | null;
  lab_report_url: string;
  shop_url: string;
}

interface Settings {
  shop_url: string;
  lab_report_url: string;
  updated_at?: string | null;
  updated_by?: string | null;
}

const isBlankOrUrl = (value: string) =>
  !value.trim() || /^https?:\/\/\S+$/i.test(value.trim());

/**
 * Defined at module scope, not inside the page: a component declared during
 * render is a new type on every keystroke, which remounts the input and loses
 * the caret.
 */
const LinkField = ({
  label,
  value,
  placeholder,
  onChange,
  icon,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  icon: React.ReactNode;
}) => (
  <TextField
    label={label}
    value={value}
    placeholder={placeholder}
    onChange={e => onChange(e.target.value)}
    size="small"
    fullWidth
    error={!isBlankOrUrl(value)}
    helperText={!isBlankOrUrl(value) ? 'Must be a full http(s) URL' : ' '}
    InputProps={{
      startAdornment: (
        <Box sx={{ mr: 1, display: 'flex', color: 'text.disabled' }}>{icon}</Box>
      ),
      endAdornment: value.trim() ? (
        <Tooltip title="Open in a new tab">
          <IconButton
            size="small"
            component="a"
            href={value.trim()}
            target="_blank"
            rel="noopener noreferrer"
          >
            <OpenInNew fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : null,
    }}
  />
);

const BrandSiteAdmin = () => {
  const [brand, setBrand] = useState(BRANDS[0]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [settings, setSettings] = useState<Settings>({
    shop_url: '',
    lab_report_url: '',
  });

  /** Edits live here until saved, so a row can be reverted to what the API has. */
  const [drafts, setDrafts] = useState<
    Record<string, { lab_report_url: string; shop_url: string }>
  >({});
  const [settingsDraft, setSettingsDraft] = useState<Settings>({
    shop_url: '',
    lab_report_url: '',
  });
  const [savingSku, setSavingSku] = useState<string | null>(null);
  const [uploadingSku, setUploadingSku] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchBrandSite = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get('/admin/brand-site', {
        params: { brand },
      });
      setProducts(data.products || []);
      setSettings(data.settings || { shop_url: '', lab_report_url: '' });
      setSettingsDraft({
        shop_url: data.settings?.shop_url || '',
        lab_report_url: data.settings?.lab_report_url || '',
      });
      setDrafts(
        Object.fromEntries(
          (data.products || []).map((p: ProductRow) => [
            p.sku,
            { lab_report_url: p.lab_report_url, shop_url: p.shop_url },
          ])
        )
      );
    } catch (error) {
      console.error(error);
      toast.error('Error fetching brand site links.');
    } finally {
      setLoading(false);
    }
  }, [brand]);

  useEffect(() => {
    fetchBrandSite();
  }, [fetchBrandSite]);

  const setDraft = (sku: string, field: 'lab_report_url' | 'shop_url', value: string) =>
    setDrafts(prev => ({ ...prev, [sku]: { ...prev[sku], [field]: value } }));

  const isDirty = (row: ProductRow) => {
    const draft = drafts[row.sku];
    if (!draft) return false;
    return (
      draft.lab_report_url !== row.lab_report_url || draft.shop_url !== row.shop_url
    );
  };

  const settingsDirty =
    settingsDraft.shop_url !== settings.shop_url ||
    settingsDraft.lab_report_url !== settings.lab_report_url;

  const dirtyCount = useMemo(
    () => products.filter(isDirty).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [products, drafts]
  );

  const saveProduct = async (row: ProductRow) => {
    const draft = drafts[row.sku];
    if (!isBlankOrUrl(draft.lab_report_url) || !isBlankOrUrl(draft.shop_url)) {
      toast.error('Links must be full http(s) URLs (or left empty).');
      return;
    }
    setSavingSku(row.sku);
    try {
      const { data } = await axiosInstance.put(
        `/admin/brand-site/products/${encodeURIComponent(row.sku)}`,
        {
          brand,
          lab_report_url: draft.lab_report_url.trim(),
          shop_url: draft.shop_url.trim(),
        }
      );
      setProducts(prev =>
        prev.map(p =>
          p.sku === row.sku
            ? { ...p, lab_report_url: data.lab_report_url, shop_url: data.shop_url }
            : p
        )
      );
      setDraft(row.sku, 'lab_report_url', data.lab_report_url);
      setDraft(row.sku, 'shop_url', data.shop_url);
      toast.success(`${row.display_name} updated.`);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.detail || 'Could not save the links.');
    } finally {
      setSavingSku(null);
    }
  };

  const saveSettings = async () => {
    if (
      !isBlankOrUrl(settingsDraft.shop_url) ||
      !isBlankOrUrl(settingsDraft.lab_report_url)
    ) {
      toast.error('Links must be full http(s) URLs (or left empty).');
      return;
    }
    setSavingSettings(true);
    try {
      const { data } = await axiosInstance.put('/admin/brand-site/settings', {
        brand,
        shop_url: settingsDraft.shop_url.trim(),
        lab_report_url: settingsDraft.lab_report_url.trim(),
      });
      setSettings({
        shop_url: data.shop_url,
        lab_report_url: data.lab_report_url,
        updated_at: data.updated_at,
        updated_by: data.updated_by,
      });
      setSettingsDraft({
        shop_url: data.shop_url,
        lab_report_url: data.lab_report_url,
      });
      toast.success('Site-wide links updated.');
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.detail || 'Could not save the settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  /**
   * Uploads straight to the brand site's own bucket (assets.thegoodtreatcompany.com)
   * — the backend handles S3 — and saves the returned CDN link immediately, so
   * there is no half-state where the file is up but the row is unsaved.
   */
  const uploadReport = async (row: ProductRow, file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Lab reports must be PDFs.');
      return;
    }
    setUploadingSku(row.sku);
    try {
      const body = new FormData();
      body.append('file', file);
      const { data } = await axiosInstance.post('/admin/brand-site/upload', body, {
        params: { brand, sku: row.sku },
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProducts(prev =>
        prev.map(p =>
          p.sku === row.sku ? { ...p, lab_report_url: data.lab_report_url } : p
        )
      );
      setDraft(row.sku, 'lab_report_url', data.lab_report_url);
      toast.success(`Lab report uploaded for ${row.display_name}.`);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.detail || 'Could not upload the report.');
    } finally {
      setUploadingSku(null);
    }
  };

  const revertProduct = (row: ProductRow) =>
    setDrafts(prev => ({
      ...prev,
      [row.sku]: { lab_report_url: row.lab_report_url, shop_url: row.shop_url },
    }));

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        sx={{ mb: 1 }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Jolly Pawps Website Links
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Lab report PDFs and buy-now links published on the brand&apos;s own website.
            The range itself syncs from Zoho and is not edited here.
          </Typography>
        </Box>
        <TextField
          select
          size="small"
          label="Brand"
          value={brand}
          onChange={e => setBrand(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          {BRANDS.map(b => (
            <MenuItem key={b} value={b}>
              {b}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {/* Site-wide links */}
      <Paper sx={{ p: 2.5, mt: 2 }} variant="outlined">
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <Storefront fontSize="small" color="action" />
          <Typography variant="subtitle1" fontWeight={700}>
            Site-wide
          </Typography>
          {settings.updated_by && (
            <Typography variant="caption" color="text.secondary">
              last edited by {settings.updated_by}
            </Typography>
          )}
        </Stack>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="flex-start">
          <LinkField
            label="Shop now link"
            value={settingsDraft.shop_url}
            placeholder="https://www.amazon.in/s?k=jolly+pawps"
            icon={<Storefront fontSize="small" />}
            onChange={value => setSettingsDraft(prev => ({ ...prev, shop_url: value }))}
          />
          <LinkField
            label="Fallback lab report (optional)"
            value={settingsDraft.lab_report_url}
            placeholder="https://assets.thegoodtreatcompany.com/reports/…"
            icon={<Science fontSize="small" />}
            onChange={value =>
              setSettingsDraft(prev => ({ ...prev, lab_report_url: value }))
            }
          />
          <Button
            variant="contained"
            startIcon={savingSettings ? <CircularProgress size={16} /> : <Save />}
            disabled={!settingsDirty || savingSettings}
            onClick={saveSettings}
            sx={{ minWidth: 120, mt: 0.25 }}
          >
            Save
          </Button>
        </Stack>
      </Paper>

      {/* Per-recipe links */}
      <Paper sx={{ mt: 3 }} variant="outlined">
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 2.5, py: 2 }}
        >
          <Typography variant="subtitle1" fontWeight={700}>
            Recipes ({products.length})
          </Typography>
          {dirtyCount > 0 && (
            <Chip
              size="small"
              color="warning"
              label={`${dirtyCount} unsaved ${dirtyCount === 1 ? 'row' : 'rows'}`}
            />
          )}
        </Stack>
        <Divider />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : products.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 4, textAlign: 'center' }}>
            No active {brand} products found.
          </Typography>
        ) : (
          products.map((row, index) => {
            const draft = drafts[row.sku] || { lab_report_url: '', shop_url: '' };
            const dirty = isDirty(row);
            return (
              <Box key={row.sku}>
                {index > 0 && <Divider />}
                <Stack
                  direction={{ xs: 'column', lg: 'row' }}
                  spacing={2}
                  alignItems={{ xs: 'stretch', lg: 'flex-start' }}
                  sx={{ p: 2.5, bgcolor: dirty ? 'action.hover' : 'transparent' }}
                >
                  <Stack
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                    sx={{ minWidth: { lg: 280 } }}
                  >
                    <Avatar
                      variant="rounded"
                      src={row.image || undefined}
                      alt={row.display_name}
                      sx={{ width: 48, height: 48, bgcolor: 'grey.100' }}
                    />
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {row.display_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.sku}
                      </Typography>
                    </Box>
                  </Stack>

                  <Box sx={{ width: '100%' }}>
                    <LinkField
                      label="Lab report PDF"
                      value={draft.lab_report_url}
                      placeholder={`https://assets.thegoodtreatcompany.com/reports/${row.sku}.pdf`}
                      icon={<Science fontSize="small" />}
                      onChange={value => setDraft(row.sku, 'lab_report_url', value)}
                    />
                    <Button
                      component="label"
                      size="small"
                      startIcon={
                        uploadingSku === row.sku ? (
                          <CircularProgress size={14} />
                        ) : (
                          <UploadFile fontSize="small" />
                        )
                      }
                      disabled={uploadingSku === row.sku}
                      sx={{ mt: -1.5, textTransform: 'none' }}
                    >
                      {uploadingSku === row.sku ? 'Uploading…' : 'Upload PDF'}
                      <input
                        hidden
                        type="file"
                        accept="application/pdf,.pdf"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          // Reset so re-picking the same file fires onChange again.
                          e.target.value = '';
                          if (file) uploadReport(row, file);
                        }}
                      />
                    </Button>
                  </Box>
                  <LinkField
                    label="Shopping link"
                    value={draft.shop_url}
                    placeholder="https://www.amazon.in/dp/…"
                    icon={<Storefront fontSize="small" />}
                    onChange={value => setDraft(row.sku, 'shop_url', value)}
                  />

                  <Stack direction="row" spacing={1} sx={{ mt: 0.25 }}>
                    <Button
                      variant="contained"
                      size="medium"
                      startIcon={
                        savingSku === row.sku ? <CircularProgress size={16} /> : <Save />
                      }
                      disabled={!dirty || savingSku === row.sku}
                      onClick={() => saveProduct(row)}
                      sx={{ minWidth: 110 }}
                    >
                      Save
                    </Button>
                    <Tooltip title="Discard changes to this row">
                      <span>
                        <IconButton
                          disabled={!dirty}
                          onClick={() => revertProduct(row)}
                          size="small"
                        >
                          <Restore fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                </Stack>
              </Box>
            );
          })
        )}
      </Paper>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
        Uploaded PDFs go to the brand site&apos;s own storage
        (assets.thegoodtreatcompany.com) and the link is saved straight away. Leaving a
        field empty removes the link — the brand site then falls back to its built-in
        default. Changes are picked up by the site within the hour.
      </Typography>
    </Box>
  );
};

export default BrandSiteAdmin;
