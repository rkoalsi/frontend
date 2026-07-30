'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  IconButton,
  CircularProgress,
  TablePagination,
  Tabs,
  Tab,
  Alert,
  Tooltip,
} from '@mui/material';
import { CloudUpload, Download, Check, Close, Edit } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import axiosInstance from '../../src/util/axios';

const fmtDateTime = (d: any) => {
  if (!d) return '—';
  try {
    return format(new Date(d), 'dd MMM yyyy, HH:mm');
  } catch {
    return '—';
  }
};

// Inline editor. Stock is a running number the brand adjusts as it sells down,
// so editing in place beats a modal per product.
const StockCell = ({ product, onSaved }: any) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(product.stock ?? 0));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const n = parseInt(value, 10);
    if (Number.isNaN(n) || n < 0) {
      toast.error('Enter a whole number of zero or more.');
      return;
    }
    setSaving(true);
    try {
      await axiosInstance.put(`/distributor_portal/products/${product._id}/stock`, {
        stock: n,
      });
      toast.success('Stock updated.');
      setEditing(false);
      onSaved();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Could not update stock.');
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
        <Typography
          variant='body2'
          sx={{ fontWeight: 600, color: (product.stock ?? 0) <= 0 ? 'error.main' : 'text.primary' }}
        >
          {product.stock ?? 0}
        </Typography>
        <Tooltip title='Edit stock' arrow>
          <IconButton size='small' onClick={() => { setValue(String(product.stock ?? 0)); setEditing(true); }}>
            <Edit sx={{ fontSize: 15 }} />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
      <TextField
        size='small'
        value={value}
        autoFocus
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save();
          if (e.key === 'Escape') setEditing(false);
        }}
        // 16px prevents iOS zooming the viewport on focus.
        inputProps={{ inputMode: 'numeric', style: { width: 62, fontSize: 16, textAlign: 'right' } }}
      />
      <IconButton size='small' color='primary' onClick={save} disabled={saving}>
        {saving ? <CircularProgress size={14} /> : <Check sx={{ fontSize: 17 }} />}
      </IconButton>
      <IconButton size='small' onClick={() => setEditing(false)} disabled={saving}>
        <Close sx={{ fontSize: 17 }} />
      </IconButton>
    </Box>
  );
};

const DistributorStock = () => {
  const [tab, setTab] = useState(0);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyTotal, setHistoryTotal] = useState(0);

  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/distributor_portal/products', {
        params: { page, limit: rowsPerPage, search: search || undefined },
      });
      setRows(res.data.products || []);
      setTotalCount(res.data.total_count || 0);
    } catch {
      toast.error('Could not load your products.');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search]);

  useEffect(() => {
    if (tab !== 0) return;
    const t = setTimeout(fetchProducts, 300);
    return () => clearTimeout(t);
  }, [fetchProducts, tab]);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await axiosInstance.get('/distributor_portal/stock/history', {
        params: { page: historyPage, limit: 50 },
      });
      setHistory(res.data.entries || []);
      setHistoryTotal(res.data.total_count || 0);
    } catch {
      toast.error('Could not load stock history.');
    } finally {
      setHistoryLoading(false);
    }
  }, [historyPage]);

  useEffect(() => {
    if (tab === 1) fetchHistory();
  }, [tab, fetchHistory]);

  // Ships their own SKUs pre-filled so an upload can't reference a product
  // that isn't theirs.
  const downloadTemplate = async () => {
    try {
      const res = await axiosInstance.get('/distributor_portal/stock/template');
      const data = (res.data.rows || []).map((r: any) => ({
        SKU: r.sku,
        Name: r.name,
        Stock: r.stock ?? 0,
        'Upcoming Stock': r.upcoming_stock ?? 0,
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Stock');
      XLSX.writeFile(wb, `stock_template_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch {
      toast.error('Could not build the template.');
    }
  };

  const uploadSheet = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await axiosInstance.post('/distributor_portal/stock/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const { updated, skipped, skipped_skus } = res.data;
      toast.success(`Updated ${updated} product${updated === 1 ? '' : 's'}.`);
      if (skipped) {
        toast.warn(
          `Skipped ${skipped} unknown SKU${skipped === 1 ? '' : 's'}: ${(skipped_skus || []).join(', ')}`
        );
      }
      fetchProducts();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Upload failed.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
      <Typography variant='h5' sx={{ fontWeight: 700, mb: 0.5 }}>
        Stock
      </Typography>
      <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
        Your products are not stock-synced from our warehouse, so the numbers here are
        the ones you set. Update them as you sell down — every change is recorded.
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label='Current stock' />
        <Tab label='History' />
      </Tabs>

      {tab === 0 ? (
        <>
          <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexWrap: 'wrap' }}>
            <TextField
              label='Search by name or SKU'
              size='small'
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              sx={{ flex: '1 1 260px' }}
            />
            <Button variant='outlined' startIcon={<Download />} onClick={downloadTemplate}>
              Template
            </Button>
            <input
              ref={fileRef}
              type='file'
              accept='.xlsx,.xlsm'
              hidden
              onChange={(e) => e.target.files?.[0] && uploadSheet(e.target.files[0])}
            />
            <Button
              variant='contained'
              startIcon={uploading ? <CircularProgress size={16} /> : <CloudUpload />}
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? 'Uploading…' : 'Upload XLSX'}
            </Button>
          </Box>

          <Alert severity='info' sx={{ mb: 2 }}>
            The sheet needs an <b>SKU</b> column plus <b>Stock</b> and/or{' '}
            <b>Upcoming Stock</b>. SKUs that aren&apos;t yours are skipped, never created.
          </Alert>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}
            >
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>SKU</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} align='right'>
                      Stock
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((p) => (
                    <TableRow key={p._id} hover>
                      <TableCell sx={{ fontWeight: 500 }}>{p.name}</TableCell>
                      <TableCell>{p.cf_sku_code || '—'}</TableCell>
                      <TableCell align='right' sx={{ width: 170 }}>
                        <StockCell product={p} onSaved={fetchProducts} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {!loading && rows.length > 0 && (
            <TablePagination
              component='div'
              count={totalCount}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 20, 50, 100]}
            />
          )}
        </>
      ) : historyLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : history.length === 0 ? (
        <Paper
          elevation={0}
          sx={{ p: 6, textAlign: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
        >
          <Typography color='text.secondary'>No stock changes recorded yet.</Typography>
        </Paper>
      ) : (
        <>
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 600 }}>When</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>SKU</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align='right'>
                    Change
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align='right'>
                    Upcoming
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Source</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map((e) => (
                  <TableRow key={e._id} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {fmtDateTime(e.created_at)}
                    </TableCell>
                    <TableCell>{e.product_name}</TableCell>
                    <TableCell>{e.sku || '—'}</TableCell>
                    <TableCell align='right' sx={{ whiteSpace: 'nowrap' }}>
                      <Typography variant='body2' component='span' color='text.secondary'>
                        {e.previous_stock ?? 0}
                      </Typography>
                      <Typography variant='body2' component='span' sx={{ mx: 0.5 }}>
                        →
                      </Typography>
                      <Typography variant='body2' component='span' sx={{ fontWeight: 600 }}>
                        {e.stock ?? 0}
                      </Typography>
                    </TableCell>
                    <TableCell align='right'>{e.upcoming_stock ?? '—'}</TableCell>
                    <TableCell sx={{ textTransform: 'capitalize' }}>
                      {e.source}
                      {e.filename ? (
                        <Typography variant='caption' color='text.secondary' display='block'>
                          {e.filename}
                        </Typography>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component='div'
            count={historyTotal}
            page={historyPage}
            onPageChange={(_, p) => setHistoryPage(p)}
            rowsPerPage={50}
            rowsPerPageOptions={[50]}
            onRowsPerPageChange={() => {}}
          />
        </>
      )}
    </Box>
  );
};

export default DistributorStock;
