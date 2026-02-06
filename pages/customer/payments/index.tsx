'use client';
import { useContext, useEffect, useState, useCallback } from 'react';
import {
  Typography,
  Box,
  Alert,
  Container,
  useTheme,
  useMediaQuery,
  Paper,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  alpha,
  IconButton,
  Skeleton,
  Drawer,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import AuthContext from '../../../src/components/Auth';
import {
  Payment,
  Search,
  ArrowBack,
  AccountBalanceWallet,
  MoneyOff,
  FilterList,
  Clear,
  Close,
  Receipt,
  Download,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import axiosInstance from '../../../src/util/axios';
import { format } from 'date-fns';

interface PaymentRecord {
  _id: string;
  payment_id?: string;
  payment_number: string;
  date: string;
  amount: number;
  unused_amount: number;
  payment_mode?: string;
  reference_number?: string;
  description?: string;
  customer_name?: string;
  customer_id?: string;
  invoices?: any[];
  bank_charges?: number;
  account_name?: string;
  tax_amount_withheld?: number;
  created_time?: string;
}

interface PaymentSummary {
  total_payments: number;
  total_amount: number;
  total_unused: number;
}

const CustomerPaymentsPage = () => {
  const { user }: any = useContext(AuthContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();

  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentModeFilter, setPaymentModeFilter] = useState('');
  const [paymentDrawerOpen, setPaymentDrawerOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);

  const fetchPayments = useCallback(async () => {
    if (!user?.data?.customer_id) {
      setLoading(false);
      setError('Customer ID not found. Please contact support.');
      return;
    }

    try {
      setLoading(true);
      const { data } = await axiosInstance.get('/customer_portal/payments', {
        params: {
          customer_id: user.data.customer_id,
          page: page + 1,
          per_page: rowsPerPage,
          payment_mode: paymentModeFilter || undefined,
        },
      });

      setPayments(data.payments || []);
      setTotalItems(data.total || 0);
      setSummary(data.summary || null);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching payments:', err);
      setError('Failed to load payments. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user, page, rowsPerPage, paymentModeFilter]);

  useEffect(() => {
    if (user) {
      fetchPayments();
    }
  }, [user, fetchPayments]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredPayments = payments.filter((p) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      p.payment_number?.toLowerCase().includes(search) ||
      p.reference_number?.toLowerCase().includes(search) ||
      p.description?.toLowerCase().includes(search)
    );
  });

  const handleOpenPaymentDetails = (payment: PaymentRecord) => {
    setSelectedPayment(payment);
    setPaymentDrawerOpen(true);
  };

  const handleDownloadInvoicePdf = async (invoiceId: string) => {
    try {
      const response = await axiosInstance.get(`/invoices/download_pdf/${invoiceId}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_${invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading invoice:', err);
    }
  };

  // Summary Card Component
  const SummaryCard = ({
    icon,
    label,
    value,
    color,
  }: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    color: string;
  }) => (
    <Card
      elevation={0}
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        height: '100%',
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 1.5,
              backgroundColor: alpha(color, 0.1),
              color: color,
              mr: 1.5,
            }}
          >
            {icon}
          </Box>
          <Typography variant='body2' color='text.secondary' sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            {label}
          </Typography>
        </Box>
        <Typography variant='h5' fontWeight={700} sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );

  if (!user?.data?.customer_id) {
    return (
      <Container maxWidth='lg' sx={{ py: 4 }}>
        <Alert severity='warning'>
          Your account is not linked to a customer. Please contact support.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth='lg' sx={{ py: { xs: 2, md: 4 }, px: { xs: 1, sm: 2, md: 3 } }}>
      <Paper
        elevation={0}
        sx={{
          backgroundColor: 'background.paper',
          borderRadius: { xs: 2, md: 4 },
          overflow: 'hidden',
          minHeight: '80vh',
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        {/* Header */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #1a365d 0%, #2d4a6f 100%)',
            color: 'white',
            padding: { xs: 2, sm: 3, md: 4 },
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: { xs: 150, md: 200 },
              height: { xs: 150, md: 200 },
              borderRadius: '50%',
              backgroundColor: 'rgba(56, 161, 105, 0.1)',
            }}
          />

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              position: 'relative',
              zIndex: 1,
              gap: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton
                onClick={() => router.push('/customer')}
                sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)' }}
                size={isMobile ? 'small' : 'medium'}
              >
                <ArrowBack />
              </IconButton>
              <Box>
                <Typography
                  variant={isMobile ? 'h6' : 'h4'}
                  sx={{ fontWeight: 700, mb: 0.5 }}
                >
                  Payments
                </Typography>
                <Typography
                  variant='body2'
                  sx={{ opacity: 0.9, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                  View all your payments
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Main Content */}
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, backgroundColor: theme.palette.background.default }}>
          {error ? (
            <Alert
              severity='error'
              sx={{ borderRadius: 2, mb: 3 }}
              action={
                <Button color='inherit' size='small' onClick={fetchPayments}>
                  Retry
                </Button>
              }
            >
              {error}
            </Alert>
          ) : (
            <>
              {/* Summary Cards */}
              <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <SummaryCard
                    icon={<Payment sx={{ fontSize: 20 }} />}
                    label='Total Payments'
                    value={summary?.total_payments || 0}
                    color={theme.palette.primary.main}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <SummaryCard
                    icon={<AccountBalanceWallet sx={{ fontSize: 20 }} />}
                    label='Total Amount'
                    value={formatCurrency(summary?.total_amount || 0)}
                    color={theme.palette.success.main}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 4 }}>
                  <SummaryCard
                    icon={<MoneyOff sx={{ fontSize: 20 }} />}
                    label='Unused Amount'
                    value={formatCurrency(summary?.total_unused || 0)}
                    color={theme.palette.info.main}
                  />
                </Grid>
              </Grid>

              {/* Filters */}
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2, sm: 3 },
                  mb: 3,
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Grid container spacing={2} alignItems='center'>
                  <Grid size={{ xs: 12, sm: 6, md: 5 }}>
                    <TextField
                      fullWidth
                      size='small'
                      placeholder='Search by payment number or reference...'
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position='start'>
                              <Search color='action' />
                            </InputAdornment>
                          ),
                          endAdornment: searchTerm && (
                            <InputAdornment position='end'>
                              <IconButton size='small' onClick={() => setSearchTerm('')}>
                                <Clear fontSize='small' />
                              </IconButton>
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                    <FormControl fullWidth size='small'>
                      <InputLabel>Filter by Payment Mode</InputLabel>
                      <Select
                        value={paymentModeFilter}
                        label='Filter by Payment Mode'
                        onChange={(e) => {
                          setPaymentModeFilter(e.target.value);
                          setPage(0);
                        }}
                      >
                        <MenuItem value=''>All Modes</MenuItem>
                        <MenuItem value='Bank Transfer'>Bank Transfer</MenuItem>
                        <MenuItem value='Cash'>Cash</MenuItem>
                        <MenuItem value='Check'>Check</MenuItem>
                        <MenuItem value='Credit Card'>Credit Card</MenuItem>
                        <MenuItem value='Bank Remittance'>Bank Remittance</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Button
                      fullWidth
                      variant='outlined'
                      startIcon={<FilterList />}
                      onClick={() => {
                        setSearchTerm('');
                        setPaymentModeFilter('');
                        setPage(0);
                      }}
                      sx={{ height: 40 }}
                    >
                      Clear Filters
                    </Button>
                  </Grid>
                </Grid>
              </Paper>

              {/* Payments Table */}
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  overflow: 'hidden',
                }}
              >
                {loading ? (
                  <Box sx={{ p: 3 }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton
                        key={i}
                        variant='rectangular'
                        height={60}
                        sx={{ mb: 1, borderRadius: 1 }}
                      />
                    ))}
                  </Box>
                ) : (
                  <>
                    {/* Desktop Table */}
                    <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                            <TableCell sx={{ fontWeight: 600 }}>Payment #</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Mode</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Reference</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align='right'>Amount</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align='right'>Unused Amount</TableCell>
                            <TableCell sx={{ fontWeight: 600 }} align='center'>Invoices Applied</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredPayments.length > 0 ? (
                            filteredPayments.map((p) => (
                              <TableRow
                                key={p._id}
                                hover
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                              >
                                <TableCell>
                                  <Typography fontWeight={500}>{p.payment_number}</Typography>
                                </TableCell>
                                <TableCell>
                                  {p.date ? format(new Date(p.date), 'PP') : 'N/A'}
                                </TableCell>
                                <TableCell>
                                  {p.payment_mode || '-'}
                                </TableCell>
                                <TableCell>
                                  {p.reference_number || '-'}
                                </TableCell>
                                <TableCell align='right'>
                                  <Typography fontWeight={500} color='success.main'>
                                    {formatCurrency(p.amount)}
                                  </Typography>
                                </TableCell>
                                <TableCell align='right'>
                                  <Typography fontWeight={500}>
                                    {formatCurrency(p.unused_amount)}
                                  </Typography>
                                </TableCell>
                                <TableCell align='center'>
                                  {p.invoices && p.invoices.length > 0 ? (
                                    <Chip
                                      label={`${p.invoices.length} invoice${p.invoices.length > 1 ? 's' : ''}`}
                                      size='small'
                                      color='primary'
                                      variant='outlined'
                                      onClick={() => handleOpenPaymentDetails(p)}
                                      sx={{ cursor: 'pointer', '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.1) } }}
                                    />
                                  ) : (
                                    <Typography variant='body2' color='text.secondary'>-</Typography>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={7} align='center' sx={{ py: 4 }}>
                                <Payment sx={{ fontSize: 48, color: 'grey.300', mb: 2 }} />
                                <Typography color='text.secondary'>No payments found</Typography>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {/* Mobile Cards */}
                    <Box sx={{ display: { xs: 'block', md: 'none' }, p: 2 }}>
                      {filteredPayments.length > 0 ? (
                        filteredPayments.map((p) => (
                          <Card
                            key={p._id}
                            elevation={0}
                            sx={{
                              mb: 2,
                              border: `1px solid ${theme.palette.divider}`,
                              borderRadius: 2,
                            }}
                          >
                            <CardContent sx={{ p: 2 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                <Box>
                                  <Typography fontWeight={600} sx={{ fontSize: '0.9rem' }}>
                                    {p.payment_number}
                                  </Typography>
                                  <Typography variant='body2' color='text.secondary'>
                                    {p.date ? format(new Date(p.date), 'PP') : 'N/A'}
                                  </Typography>
                                </Box>
                                {p.payment_mode && (
                                  <Chip
                                    label={p.payment_mode}
                                    size='small'
                                    variant='outlined'
                                  />
                                )}
                              </Box>

                              <Grid container spacing={2}>
                                <Grid size={{ xs: 6 }}>
                                  <Typography variant='caption' color='text.secondary'>
                                    Amount
                                  </Typography>
                                  <Typography fontWeight={600} color='success.main'>
                                    {formatCurrency(p.amount)}
                                  </Typography>
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                  <Typography variant='caption' color='text.secondary'>
                                    Unused Amount
                                  </Typography>
                                  <Typography fontWeight={600}>
                                    {formatCurrency(p.unused_amount)}
                                  </Typography>
                                </Grid>
                              </Grid>

                              {p.reference_number && (
                                <Box sx={{ mt: 1.5 }}>
                                  <Typography variant='caption' color='text.secondary'>
                                    Reference: {p.reference_number}
                                  </Typography>
                                </Box>
                              )}

                              {p.invoices && p.invoices.length > 0 && (
                                <Box sx={{ mt: 1.5 }}>
                                  <Chip
                                    label={`${p.invoices.length} invoice${p.invoices.length > 1 ? 's' : ''} applied`}
                                    size='small'
                                    color='primary'
                                    variant='outlined'
                                    onClick={() => handleOpenPaymentDetails(p)}
                                    sx={{ cursor: 'pointer', '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.1) } }}
                                  />
                                </Box>
                              )}
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                          <Payment sx={{ fontSize: 48, color: 'grey.300', mb: 2 }} />
                          <Typography color='text.secondary'>No payments found</Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Pagination */}
                    <TablePagination
                      component='div'
                      count={totalItems}
                      page={page}
                      onPageChange={handleChangePage}
                      rowsPerPage={rowsPerPage}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                      rowsPerPageOptions={[5, 10, 25]}
                      sx={{
                        borderTop: `1px solid ${theme.palette.divider}`,
                        '& .MuiTablePagination-toolbar': {
                          flexWrap: 'wrap',
                          justifyContent: { xs: 'center', sm: 'flex-end' },
                        },
                        '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        },
                      }}
                    />
                  </>
                )}
              </Paper>
            </>
          )}
        </Box>
      </Paper>

      {/* Payment Details Drawer */}
      <Drawer
        anchor={isMobile ? 'bottom' : 'right'}
        open={paymentDrawerOpen}
        onClose={() => setPaymentDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: isMobile ? '100%' : 450,
            maxHeight: isMobile ? '85vh' : 'calc(100vh - 64px)',
            height: isMobile ? 'auto' : 'calc(100vh - 64px)',
            top: isMobile ? 'auto' : '64px',
            borderRadius: isMobile ? '16px 16px 0 0' : 0,
          },
        }}
      >
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}>
          {/* Fixed Header */}
          <Box sx={{
            p: { xs: 2, sm: 3 },
            pb: 2,
            flexShrink: 0,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant='h6' fontWeight={700}>
                  Payment Details
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {selectedPayment?.payment_number}
                </Typography>
              </Box>
              <IconButton onClick={() => setPaymentDrawerOpen(false)} size='small'>
                <Close />
              </IconButton>
            </Box>
          </Box>

          {/* Scrollable Content */}
          <Box sx={{
            p: { xs: 2, sm: 3 },
            flexGrow: 1,
            overflowY: 'auto',
          }}>
            {selectedPayment && (
              <>
                {/* Payment Summary */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    mb: 3,
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.success.main, 0.05),
                    border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                  }}
                >
                  <Typography variant='body2' color='text.secondary' gutterBottom>
                    Payment Amount
                  </Typography>
                  <Typography variant='h4' fontWeight={700} color='success.main'>
                    {formatCurrency(selectedPayment.amount)}
                  </Typography>
                  {selectedPayment.unused_amount > 0 && (
                    <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                      Unused: {formatCurrency(selectedPayment.unused_amount)}
                    </Typography>
                  )}
                </Paper>

                {/* Payment Information */}
                <Typography variant='subtitle2' fontWeight={600} sx={{ mb: 2 }}>
                  Payment Information
                </Typography>
                <Box sx={{ mb: 3 }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant='caption' color='text.secondary'>Date</Typography>
                      <Typography variant='body2' fontWeight={500}>
                        {selectedPayment.date ? format(new Date(selectedPayment.date), 'PPP') : 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant='caption' color='text.secondary'>Payment Mode</Typography>
                      <Typography variant='body2' fontWeight={500}>
                        {selectedPayment.payment_mode || 'N/A'}
                      </Typography>
                    </Grid>
                    {selectedPayment.reference_number && (
                      <Grid size={{ xs: 6 }}>
                        <Typography variant='caption' color='text.secondary'>Reference Number</Typography>
                        <Typography variant='body2' fontWeight={500}>
                          {selectedPayment.reference_number}
                        </Typography>
                      </Grid>
                    )}
                    {selectedPayment.bank_charges !== undefined && selectedPayment.bank_charges > 0 && (
                      <Grid size={{ xs: 6 }}>
                        <Typography variant='caption' color='text.secondary'>Bank Charges</Typography>
                        <Typography variant='body2' fontWeight={500}>
                          {formatCurrency(selectedPayment.bank_charges)}
                        </Typography>
                      </Grid>
                    )}
                    {selectedPayment.account_name && (
                      <Grid size={{ xs: 12 }}>
                        <Typography variant='caption' color='text.secondary'>Account</Typography>
                        <Typography variant='body2' fontWeight={500}>
                          {selectedPayment.account_name}
                        </Typography>
                      </Grid>
                    )}
                    {selectedPayment.description && (
                      <Grid size={{ xs: 12 }}>
                        <Typography variant='caption' color='text.secondary'>Description</Typography>
                        <Typography variant='body2' fontWeight={500}>
                          {selectedPayment.description}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Invoices Applied */}
                <Typography variant='subtitle2' fontWeight={600} sx={{ mb: 2 }}>
                  Invoices Applied ({selectedPayment.invoices?.length || 0})
                </Typography>
                {selectedPayment.invoices && selectedPayment.invoices.length > 0 ? (
                  <List disablePadding>
                    {selectedPayment.invoices.map((inv: any, idx: number) => (
                      <ListItem
                        key={idx}
                        sx={{
                          px: 2,
                          py: 1.5,
                          mb: 1,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 2,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                          <Receipt color='action' sx={{ fontSize: 20 }} />
                        </Box>
                        <ListItemText
                          primary={
                            <Typography variant='body2' fontWeight={600}>
                              {inv.invoice_number || inv.invoice_id || `Invoice ${idx + 1}`}
                            </Typography>
                          }
                          secondary={
                            inv.date && (
                              <Typography variant='caption' color='text.secondary'>
                                {format(new Date(inv.date), 'PP')}
                              </Typography>
                            )
                          }
                          sx={{ flex: 1, minWidth: 0 }}
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant='body2' fontWeight={600} color='success.main'>
                              {formatCurrency(inv.amount_applied || inv.amount || 0)}
                            </Typography>
                          </Box>
                          <IconButton
                            size='small'
                            onClick={() => handleDownloadInvoicePdf(inv.invoice_id)}
                            sx={{
                              color: theme.palette.primary.main,
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.1)
                              }
                            }}
                            title='Download Invoice'
                          >
                            <Download fontSize='small' />
                          </IconButton>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 3, border: `1px dashed ${theme.palette.divider}`, borderRadius: 2 }}>
                    <Receipt sx={{ fontSize: 40, color: 'grey.300', mb: 1 }} />
                    <Typography variant='body2' color='text.secondary'>No invoices applied to this payment</Typography>
                  </Box>
                )}
              </>
            )}
          </Box>
        </Box>
      </Drawer>
    </Container>
  );
};

export default CustomerPaymentsPage;
