'use client';
import { useCallback, useEffect, useState } from 'react';
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
  CircularProgress,
  Chip,
  TablePagination,
  Collapse,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  Download,
  PictureAsPdf,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import axiosInstance from '../../src/util/axios';

const fmtDate = (d: any) => {
  if (!d) return '—';
  try {
    return format(new Date(d), 'dd MMM yyyy');
  } catch {
    return '—';
  }
};

const STATUS_COLOR: Record<
  string,
  'default' | 'info' | 'success' | 'error' | 'warning' | 'primary'
> = {
  draft: 'default',
  sent: 'info',
  accepted: 'success',
  invoiced: 'primary',
  declined: 'error',
  deleted: 'error',
};

// An order with no estimate yet has no customer-facing number, so fall back to
// the tail of the order id — enough to quote in a support message without
// printing a 24-char ObjectId in a table cell.
const OrderRef = ({ order }: any) =>
  order.estimate_number ? (
    <Typography variant='body2' sx={{ fontWeight: 500 }}>
      {order.estimate_number}
    </Typography>
  ) : (
    <Box>
      <Typography variant='body2' sx={{ fontWeight: 500, fontFamily: 'monospace' }}>
        #{String(order._id).slice(-8)}
      </Typography>
      <Typography variant='caption' color='text.secondary'>
        No estimate yet
      </Typography>
    </Box>
  );

// Fetched as a blob rather than a plain link so the request carries the auth
// cookie/header — a bare href would hit the endpoint unauthenticated.
const useOrderPdf = () => {
  const [busyId, setBusyId] = useState<string | null>(null);
  const download = async (order: any) => {
    setBusyId(order._id);
    try {
      const res = await axiosInstance.get(
        `/distributor_portal/orders/${order._id}/pdf`,
        { responseType: 'blob' }
      );
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      const ref = (order.estimate_number || String(order._id).slice(-8)).replace(/\//g, '-');
      a.download = `order_${ref}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Could not generate the PDF.');
    } finally {
      setBusyId(null);
    }
  };
  return { busyId, download };
};

const OrderRow = ({ order, onDownload, busy }: any) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TableRow hover>
        <TableCell sx={{ width: 48 }}>
          <IconButton size='small' onClick={() => setOpen(!open)} aria-label='Toggle line items'>
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell>
          <OrderRef order={order} />
        </TableCell>
        <TableCell>{order.customer_name || '—'}</TableCell>
        <TableCell>{order.state || '—'}</TableCell>
        <TableCell align='right'>{order.line_count}</TableCell>
        <TableCell align='right'>{order.units}</TableCell>
        <TableCell>{fmtDate(order.created_at)}</TableCell>
        <TableCell>
          <Chip
            label={order.status || '—'}
            size='small'
            color={STATUS_COLOR[order.status] ?? 'default'}
            sx={{ textTransform: 'capitalize' }}
          />
        </TableCell>
        <TableCell align='center' sx={{ width: 60 }}>
          <Tooltip title='Download order sheet (PDF)' arrow>
            <span>
              <IconButton
                size='small'
                disabled={busy}
                onClick={() => onDownload(order)}
                aria-label='Download order PDF'
              >
                {busy ? <CircularProgress size={16} /> : <PictureAsPdf fontSize='small' />}
              </IconButton>
            </span>
          </Tooltip>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell sx={{ py: 0, borderBottom: open ? undefined : 'none' }} colSpan={9}>
          <Collapse in={open} timeout='auto' unmountOnExit>
            <Box sx={{ py: 1.5, pl: 2 }}>
              <Typography variant='caption' color='text.secondary'>
                Your line items on this order
              </Typography>
              <Table size='small' sx={{ mt: 1 }}>
                <TableBody>
                  {order.products.map((p: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell sx={{ border: 'none' }}>{p.name}</TableCell>
                      <TableCell sx={{ border: 'none' }}>{p.product_code || '—'}</TableCell>
                      <TableCell sx={{ border: 'none' }} align='right'>
                        {p.quantity}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const DistributorOrders = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [state, setState] = useState('');
  const [estimate, setEstimate] = useState('');
  const [options, setOptions] = useState<{ statuses: string[]; states: string[] }>({
    statuses: [],
    states: [],
  });
  const [downloading, setDownloading] = useState(false);
  const { busyId, download } = useOrderPdf();

  // Exports the whole filtered set, not just the page on screen.
  const handleDownloadXlsx = async () => {
    setDownloading(true);
    try {
      const res = await axiosInstance.get('/distributor_portal/orders/export', {
        params: {
          search: search || undefined,
          status: status || undefined,
          state: state || undefined,
          estimate: estimate || undefined,
        },
      });
      const orders = res.data.orders || [];
      if (!orders.length) {
        toast.info('No orders to export.');
        return;
      }
      const rows = orders.map((o: any) => ({
        Reference: o.reference,
        'Estimate No.': o.estimate_number || '',
        'Estimate Raised': o.estimate_raised,
        'Order ID': o.order_id,
        Retailer: o.customer_name,
        State: o.state,
        Status: o.status,
        Date: fmtDate(o.created_at),
        Lines: o.line_count,
        Units: o.units,
        Items: o.items,
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Orders');
      XLSX.writeFile(wb, `orders_${new Date().toISOString().slice(0, 10)}.xlsx`);
      if (res.data.truncated) {
        toast.warn(
          `Exported the most recent ${orders.length} of ${res.data.total_count} orders. Narrow the filters for a complete set.`
        );
      }
    } catch {
      toast.error('Could not export the orders.');
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    axiosInstance
      .get('/distributor_portal/orders/filter-options')
      .then((r) => setOptions(r.data))
      .catch(() => {});
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/distributor_portal/orders', {
        params: {
          page,
          limit: rowsPerPage,
          search: search || undefined,
          status: status || undefined,
          state: state || undefined,
          estimate: estimate || undefined,
        },
      });
      setRows(res.data.orders || []);
      setTotalCount(res.data.total_count || 0);
    } catch {
      toast.error('Could not load orders.');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, status, state, estimate]);

  useEffect(() => {
    // Debounced so typing in search doesn't fire a request per keystroke.
    const t = setTimeout(fetchOrders, 300);
    return () => clearTimeout(t);
  }, [fetchOrders]);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Typography variant='h5' sx={{ fontWeight: 700, mb: 0.5 }}>
        Orders
      </Typography>
      <Typography variant='body2' color='text.secondary' sx={{ mb: 2.5 }}>
        Retailer orders that include your products. Only your line items are shown.
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexWrap: 'wrap' }}>
        <TextField
          label='Search estimate or retailer'
          size='small'
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          sx={{ flex: '1 1 260px' }}
        />
        <FormControl size='small' sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={status}
            label='Status'
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value=''>All</MenuItem>
            {options.statuses.map((s) => (
              <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>
                {s}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size='small' sx={{ minWidth: 160 }}>
          <InputLabel>State</InputLabel>
          <Select
            value={state}
            label='State'
            onChange={(e) => {
              setState(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value=''>All</MenuItem>
            {options.states.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size='small' sx={{ minWidth: 160 }}>
          <InputLabel>Estimate</InputLabel>
          <Select
            value={estimate}
            label='Estimate'
            onChange={(e) => {
              setEstimate(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value=''>All</MenuItem>
            <MenuItem value='created'>Created</MenuItem>
            <MenuItem value='not_created'>Not created</MenuItem>
          </Select>
        </FormControl>
        {(search || status || state || estimate) && (
          <Button
            onClick={() => {
              setSearch('');
              setStatus('');
              setState('');
              setEstimate('');
              setPage(0);
            }}
          >
            Clear
          </Button>
        )}
        <Button
          variant='outlined'
          startIcon={downloading ? <CircularProgress size={16} /> : <Download />}
          disabled={downloading || totalCount === 0}
          onClick={handleDownloadXlsx}
          sx={{ ml: { md: 'auto' } }}
        >
          {downloading ? 'Preparing…' : 'Download XLSX'}
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : rows.length === 0 ? (
        <Paper
          elevation={0}
          sx={{ p: 6, textAlign: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
        >
          <Typography color='text.secondary'>No orders yet.</Typography>
        </Paper>
      ) : isMobile ? (
        <Box sx={{ display: 'grid', gap: 1.5 }}>
          {rows.map((o) => (
            <Paper
              key={o._id}
              elevation={0}
              sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                <OrderRef order={o} />
                <Chip
                  label={o.status || '—'}
                  size='small'
                  color={STATUS_COLOR[o.status] ?? 'default'}
                  sx={{ textTransform: 'capitalize', flexShrink: 0 }}
                />
              </Box>
              <Typography variant='body2' sx={{ mt: 0.5 }}>
                {o.customer_name || '—'}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                {o.state || '—'} · {fmtDate(o.created_at)}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 1.5, alignItems: 'center' }}>
                <Box>
                  <Typography variant='caption' color='text.secondary'>Items</Typography>
                  <Typography variant='body2'>{o.line_count}</Typography>
                </Box>
                <Box>
                  <Typography variant='caption' color='text.secondary'>Units</Typography>
                  <Typography variant='body2'>{o.units}</Typography>
                </Box>
                <Button
                  size='small'
                  startIcon={
                    busyId === o._id ? <CircularProgress size={14} /> : <PictureAsPdf />
                  }
                  disabled={busyId === o._id}
                  onClick={() => download(o)}
                  sx={{ ml: 'auto' }}
                >
                  PDF
                </Button>
              </Box>
            </Paper>
          ))}
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell />
                <TableCell sx={{ fontWeight: 600 }}>Estimate</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Retailer</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>State</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align='right'>Items</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align='right'>Units</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align='center'>PDF</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((o) => (
                <OrderRow
                  key={o._id}
                  order={o}
                  onDownload={download}
                  busy={busyId === o._id}
                />
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
          rowsPerPageOptions={[10, 20, 50]}
        />
      )}
    </Box>
  );
};

export default DistributorOrders;
