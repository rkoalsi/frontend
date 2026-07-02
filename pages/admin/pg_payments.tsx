import { useCallback, useEffect, useState, ChangeEvent } from 'react';
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
  Drawer,
  capitalize,
  TablePagination,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  useTheme,
} from '@mui/material';
import { Visibility } from '@mui/icons-material';
import { toast } from 'react-toastify';
import axiosInstance from '../../src/util/axios';

// Colour-code the audit action so failures/errors jump out during reconciliation.
const actionColor = (
  action: string
): 'success' | 'error' | 'warning' | 'info' | 'default' => {
  const a = (action || '').toLowerCase();
  if (a.includes('success') || a.includes('accepted')) return 'success';
  if (a.includes('error') || a.includes('failed') || a.includes('invalid'))
    return 'error';
  if (a.includes('skipped')) return 'warning';
  if (a.includes('webhook') || a.includes('verify')) return 'info';
  return 'default';
};

const paymentStatusColor = (
  status?: string
): 'success' | 'error' | 'warning' | 'default' => {
  if (status === 'paid') return 'success';
  if (status === 'failed') return 'error';
  if (status) return 'warning';
  return 'default';
};

const PgPayments = () => {
  const theme: any = useTheme();
  const [rows, setRows] = useState<any[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [page, setPage] = useState(0); // 0-based
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Drawer
  const [selected, setSelected] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: rowsPerPage,
        ...(actionFilter && { action: actionFilter }),
        ...(search && { search }),
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate }),
      };
      const res = await axiosInstance.get('/admin/pg_payments', { params });
      setRows(res.data.payments || []);
      setTotalCount(res.data.total_count || 0);
      if (res.data.actions) setActions(res.data.actions);
    } catch (err) {
      console.error(err);
      toast.error('Error fetching payment-gateway transactions.');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, actionFilter, startDate, endDate, searchTrigger]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleChangePage = (_e: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (e: ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const openDrawer = (row: any) => {
    setSelected(row);
    setDrawerOpen(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant='h4' sx={{ mb: 1 }}>
        PG Payments
      </Typography>
      <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
        Payment-gateway (Razorpay) audit log — every payment-link, checkout
        verification and webhook callback. Use for reconciliation and debugging
        of failed or orphaned payments.
      </Typography>

      {/* Filters */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          mb: 3,
          alignItems: 'center',
        }}
      >
        <FormControl size='small' sx={{ minWidth: 200 }}>
          <InputLabel>Action</InputLabel>
          <Select
            label='Action'
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(0);
            }}
          >
            <MenuItem value=''>All</MenuItem>
            {actions.map((a) => (
              <MenuItem key={a} value={a}>
                {a}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          size='small'
          label='Search (order id / payment id / link id)'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setPage(0);
              setSearchTrigger((t) => t + 1);
            }
          }}
          sx={{ minWidth: 300 }}
        />

        <TextField
          size='small'
          type='date'
          label='Start Date'
          InputLabelProps={{ shrink: true }}
          value={startDate}
          onChange={(e) => {
            setStartDate(e.target.value);
            setPage(0);
          }}
        />
        <TextField
          size='small'
          type='date'
          label='End Date'
          InputLabelProps={{ shrink: true }}
          value={endDate}
          onChange={(e) => {
            setEndDate(e.target.value);
            setPage(0);
          }}
        />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date &amp; Time (IST)</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Estimate #</TableCell>
                <TableCell>Payment ID</TableCell>
                <TableCell>Order Payment</TableCell>
                <TableCell align='right'>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align='center'>
                    No transactions found.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow
                    key={row._id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => openDrawer(row)}
                  >
                    <TableCell>{row.created_at}</TableCell>
                    <TableCell>
                      <Chip
                        size='small'
                        label={row.action}
                        color={actionColor(row.action)}
                      />
                    </TableCell>
                    <TableCell>{row.customer_name || '—'}</TableCell>
                    <TableCell>{row.estimate_number || '—'}</TableCell>
                    <TableCell>{row.razorpay_payment_id || '—'}</TableCell>
                    <TableCell>
                      {row.payment_status ? (
                        <Chip
                          size='small'
                          label={capitalize(row.payment_status)}
                          color={paymentStatusColor(row.payment_status)}
                        />
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell align='right'>
                      <IconButton
                        size='small'
                        onClick={(e) => {
                          e.stopPropagation();
                          openDrawer(row);
                        }}
                      >
                        <Visibility fontSize='small' />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            component='div'
            count={totalCount}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 20, 50, 100]}
          />
        </TableContainer>
      )}

      {/* Detail drawer */}
      <Drawer
        anchor='right'
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 480 }, p: 3 } }}
      >
        <Typography variant='h6' sx={{ mb: 2 }}>
          Transaction Details
        </Typography>
        {selected && (
          <Box sx={{ '& > *': { mb: 1 } }}>
            <Typography>
              <strong>Action:</strong>{' '}
              <Chip
                size='small'
                label={selected.action}
                color={actionColor(selected.action)}
              />
            </Typography>
            <Typography>
              <strong>Date &amp; Time (IST):</strong> {selected.created_at}
            </Typography>
            {selected.order_id && (
              <Typography>
                <strong>Order ID:</strong> {selected.order_id}
              </Typography>
            )}
            {selected.customer_name && (
              <Typography>
                <strong>Customer:</strong> {selected.customer_name}
              </Typography>
            )}
            {selected.estimate_number && (
              <Typography>
                <strong>Estimate #:</strong> {selected.estimate_number}
              </Typography>
            )}
            {selected.order_total != null && (
              <Typography>
                <strong>Order Total:</strong> ₹{selected.order_total}
              </Typography>
            )}
            {selected.payment_status && (
              <Typography>
                <strong>Order Payment Status:</strong>{' '}
                <Chip
                  size='small'
                  label={capitalize(selected.payment_status)}
                  color={paymentStatusColor(selected.payment_status)}
                />
              </Typography>
            )}
            {selected.razorpay_payment_id && (
              <Typography>
                <strong>Razorpay Payment ID:</strong>{' '}
                {selected.razorpay_payment_id}
              </Typography>
            )}
            {selected.razorpay_order_id && (
              <Typography>
                <strong>Razorpay Order ID:</strong> {selected.razorpay_order_id}
              </Typography>
            )}
            {selected.payment_link_id && (
              <Typography>
                <strong>Payment Link ID:</strong> {selected.payment_link_id}
              </Typography>
            )}
            {selected.status && (
              <Typography>
                <strong>Status:</strong> {selected.status}
              </Typography>
            )}
            {selected.status_code != null && (
              <Typography>
                <strong>HTTP Status:</strong> {selected.status_code}
              </Typography>
            )}
            {selected.reason && (
              <Typography>
                <strong>Reason:</strong> {selected.reason}
              </Typography>
            )}
            {selected.error && (
              <Typography sx={{ color: theme.palette.error.main }}>
                <strong>Error:</strong> {selected.error}
              </Typography>
            )}
          </Box>
        )}
      </Drawer>
    </Box>
  );
};

export default PgPayments;
