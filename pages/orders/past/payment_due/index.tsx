import { useContext, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Skeleton,
  Chip,
  useMediaQuery,
  TextField,
  Container,
  Paper,
  Stack,
  Divider,
  InputAdornment,
  Fade,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TablePagination,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useRouter } from 'next/router';
import axios from 'axios';
import AuthContext from '../../../../src/components/Auth';
import axiosInstance from '../../../../src/util/axios';
import { toast } from 'react-toastify';
import {
  Visibility,
  Search,
  GetApp,
  ArrowBack,
  WarningAmber,
  ExpandMore,
  Person,
} from '@mui/icons-material';
import Header from '../../../../src/components/common/Header';

const agingLabel = (days: number) => {
  if (days <= 30) return { label: `${days}d overdue`, color: 'warning' as const };
  if (days <= 60) return { label: `${days}d overdue`, color: 'error' as const };
  return { label: `${days}d overdue`, color: 'error' as const };
};

const agingBucketColor = (maxDays: number) => {
  if (maxDays > 60) return 'error' as const;
  if (maxDays > 30) return 'warning' as const;
  return 'default' as const;
};

const PaymentDue = () => {
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [skipPage, setSkipPage] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();
  const { user }: any = useContext(AuthContext);

  const getData = async () => {
    try {
      setLoading(true);
      let resp;
      if (user.role.includes('admin')) {
        resp = await axiosInstance.get(`/admin/payments_due?limit=500`);
      } else {
        resp = await axios.get(
          `${process.env.api_url}/invoices?created_by=${user?._id}`
        );
      }
      const { data = [] } = resp;
      const { invoices = [] } = data;
      setInvoices(invoices);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDownloadCSV = async () => {
    try {
      let url = '/admin/payments_due/download_csv';
      url += `?sales_person=${encodeURIComponent(
        user?.role?.includes('admin') ? '' : user?.code
      )}`;
      const response = await axiosInstance.get(url, {
        responseType: 'blob',
      });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', 'payments_due.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('CSV downloaded successfully');
    } catch (error) {
      console.error(error);
      toast.error('Error downloading CSV');
    }
  };

  // Filter then group by customer
  const filteredInvoices: any[] = (invoices as any[]).filter((invoice: any) =>
    invoice.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const customerGroups: Record<string, any[]> = {};
  for (const inv of filteredInvoices) {
    const key = inv.customer_name || 'Unknown';
    if (!customerGroups[key]) customerGroups[key] = [];
    customerGroups[key].push(inv);
  }

  // Sort customers by their max overdue_by_days descending
  const sortedCustomers = Object.entries(customerGroups).sort(([, a], [, b]) => {
    const maxA = Math.max(...a.map((i: any) => parseInt(i.overdue_by_days) || 0));
    const maxB = Math.max(...b.map((i: any) => parseInt(i.overdue_by_days) || 0));
    return maxA - maxB;
  });

  const totalCustomers = sortedCustomers.length;
  const totalPages = Math.max(1, Math.ceil(totalCustomers / rowsPerPage));
  const pagedCustomers = sortedCustomers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleChangePage = (_: any, newPage: number) => {
    setPage(newPage);
    setSkipPage('');
  };

  const handleChangeRowsPerPage = (e: any) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
    setSkipPage('');
  };

  const handleSkipPage = () => {
    const requested = parseInt(skipPage, 10);
    if (isNaN(requested) || requested < 1 || requested > totalPages) {
      toast.error('Invalid page number');
      return;
    }
    setPage(requested - 1);
    setSkipPage('');
  };

  return (
    <Box sx={{ minHeight: '100vh', pb: 4 }}>
      <Container maxWidth='lg'>
        <Box sx={{ pt: 3, pb: 4 }}>
          <Header title={'Payments Due'} showBackButton />

          {/* Search and Actions Bar */}
          <Paper
            elevation={3}
            sx={{
              p: 2,
              mt: 2,
              mb: 3,
              borderRadius: '12px',
              background: theme.palette.background.paper,
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
            }}
          >
            <TextField
              variant='outlined'
              placeholder='Search by Customer Name'
              fullWidth={isMobile}
              size='small'
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
              sx={{
                maxWidth: isMobile ? '100%' : '350px',
                '& .MuiOutlinedInput-root': { borderRadius: '8px' },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <Search />
                  </InputAdornment>
                ),
              }}
            />

            <Button
              variant='contained'
              startIcon={<GetApp />}
              onClick={handleDownloadCSV}
              sx={{
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                textTransform: 'none',
                px: 3,
              }}
            >
              Export CSV
            </Button>
          </Paper>

          {/* Loading State */}
          {loading ? (
            <Box sx={{ width: '100%', mt: 2 }}>
              {[1, 2, 3].map((item) => (
                <Skeleton
                  key={item}
                  variant='rectangular'
                  height={80}
                  sx={{ mb: 2, borderRadius: '12px' }}
                />
              ))}
            </Box>
          ) : (
            <Fade in={!loading}>
              <Box sx={{ width: '100%' }}>
                {sortedCustomers.length > 0 ? (
                  <>
                  <Stack spacing={1.5}>
                    {pagedCustomers.map(([customerName, custInvoices]) => {
                      const totalBalance = custInvoices.reduce(
                        (sum: number, inv: any) => sum + (parseFloat(inv.balance) || 0),
                        0
                      );
                      const maxOverdue = Math.max(
                        ...custInvoices.map((i: any) => parseInt(i.overdue_by_days) || 0)
                      );
                      const bucketColor = agingBucketColor(maxOverdue);
                      const hasAttachments = custInvoices.some(
                        (i: any) => i.invoice_notes?.images?.length > 0
                      );

                      return (
                        <Accordion
                          key={customerName}
                          disableGutters
                          elevation={2}
                          sx={{
                            borderRadius: '12px !important',
                            overflow: 'hidden',
                            '&:before': { display: 'none' },
                            border:
                              maxOverdue > 60
                                ? `1px solid ${theme.palette.error.light}`
                                : maxOverdue > 30
                                ? `1px solid ${theme.palette.warning.light}`
                                : `1px solid ${theme.palette.divider}`,
                          }}
                        >
                          <AccordionSummary
                            expandIcon={<ExpandMore />}
                            sx={{
                              px: 2,
                              py: 1,
                              '& .MuiAccordionSummary-content': {
                                alignItems: 'center',
                                gap: 2,
                                flexWrap: 'wrap',
                              },
                            }}
                          >
                            <Person
                              fontSize='small'
                              sx={{ color: theme.palette.text.secondary, flexShrink: 0 }}
                            />

                            <Typography
                              variant='subtitle1'
                              fontWeight={600}
                              sx={{ flex: 1, minWidth: 120, color: theme.palette.text.primary }}
                            >
                              {customerName}
                            </Typography>

                            <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap'>
                              <Chip
                                size='small'
                                label={`${custInvoices.length} invoice${custInvoices.length > 1 ? 's' : ''}`}
                                sx={{ fontWeight: 500, fontSize: '0.72rem' }}
                              />
                              <Typography
                                variant='body2'
                                fontWeight={600}
                                sx={{ color: theme.palette.text.primary }}
                              >
                                ₹{totalBalance.toLocaleString('en-IN', { maximumFractionDigits: 0 })} due
                              </Typography>
                              {maxOverdue > 0 && (
                                <Chip
                                  size='small'
                                  icon={<WarningAmber fontSize='small' />}
                                  label={`Up to ${maxOverdue}d overdue`}
                                  color={bucketColor}
                                  sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                                />
                              )}
                              {hasAttachments && (
                                <Chip
                                  size='small'
                                  icon={<Visibility fontSize='small' />}
                                  label='Attachments'
                                  sx={{ fontSize: '0.72rem' }}
                                />
                              )}
                            </Stack>
                          </AccordionSummary>

                          <AccordionDetails sx={{ px: 2, pt: 0, pb: 2 }}>
                            <Divider sx={{ mb: 1.5 }} />
                            <Stack spacing={1}>
                              {custInvoices
                                .sort(
                                  (a: any, b: any) =>
                                    (parseInt(b.overdue_by_days) || 0) -
                                    (parseInt(a.overdue_by_days) || 0)
                                )
                                .map((invoice: any) => {
                                  const {
                                    _id,
                                    invoice_number,
                                    due_date,
                                    balance,
                                    total,
                                    overdue_by_days,
                                    invoice_notes = {},
                                  } = invoice;
                                  const { images = [] }: any = invoice_notes;
                                  const days = parseInt(overdue_by_days) || 0;
                                  const aging = agingLabel(days);

                                  return (
                                    <Box
                                      key={_id}
                                      onClick={() =>
                                        router.push(`/orders/past/payment_due/${_id}`)
                                      }
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        flexWrap: 'wrap',
                                        gap: 1,
                                        px: 1.5,
                                        py: 1,
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s',
                                        '&:hover': {
                                          background: theme.palette.action.hover,
                                        },
                                      }}
                                    >
                                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                                        <Typography
                                          variant='body2'
                                          fontWeight={600}
                                          sx={{ color: theme.palette.text.primary }}
                                        >
                                          {invoice_number}
                                        </Typography>
                                        <Typography variant='caption' color='text.secondary'>
                                          Due: {new Date(due_date).toLocaleDateString('en-IN')}
                                        </Typography>
                                      </Box>

                                      <Stack direction='row' spacing={1} alignItems='center'>
                                        {days > 0 && (
                                          <Chip
                                            size='small'
                                            label={aging.label}
                                            color={aging.color}
                                            sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                                          />
                                        )}
                                        {images.length > 0 && (
                                          <Chip
                                            size='small'
                                            icon={<Visibility fontSize='small' />}
                                            label='Attachment'
                                            sx={{ fontSize: '0.7rem' }}
                                          />
                                        )}
                                        <Box sx={{ textAlign: 'right' }}>
                                          <Typography
                                            variant='body2'
                                            fontWeight={600}
                                            sx={{ color: theme.palette.text.primary }}
                                          >
                                            ₹{parseFloat(balance || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                          </Typography>
                                          <Typography variant='caption' color='text.secondary'>
                                            of ₹{parseFloat(total || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                          </Typography>
                                        </Box>
                                      </Stack>
                                    </Box>
                                  );
                                })}
                            </Stack>
                          </AccordionDetails>
                        </Accordion>
                      );
                    })}
                  </Stack>

                  {/* Pagination */}
                  <Box
                    sx={{
                      mt: 2,
                      display: 'flex',
                      flexDirection: isMobile ? 'column' : 'row',
                      alignItems: isMobile ? 'flex-start' : 'center',
                      justifyContent: 'space-between',
                      gap: 1,
                    }}
                  >
                    <TablePagination
                      rowsPerPageOptions={[10, 25, 50]}
                      component='div'
                      count={totalCustomers}
                      rowsPerPage={rowsPerPage}
                      page={page}
                      onPageChange={handleChangePage}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                      labelRowsPerPage='Customers per page'
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
                      <TextField
                        label='Go to page'
                        type='number'
                        size='small'
                        variant='outlined'
                        sx={{ width: 110 }}
                        value={skipPage !== '' ? skipPage : page + 1}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          if (v > totalPages) {
                            toast.error('Page out of range');
                          } else {
                            setSkipPage(e.target.value);
                          }
                        }}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSkipPage(); }}
                      />
                      <Button variant='contained' onClick={handleSkipPage} sx={{ textTransform: 'none' }}>
                        Go
                      </Button>
                      <Typography variant='caption' color='text.secondary'>
                        / {totalPages}
                      </Typography>
                    </Box>
                  </Box>
                  </>
                ) : (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 4,
                      textAlign: 'center',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      border: `1px dashed ${theme.palette.divider}`,
                    }}
                  >
                    <Typography variant='body1' color='text.secondary'>
                      No overdue invoices found.
                    </Typography>
                  </Paper>
                )}
              </Box>
            </Fade>
          )}

          {/* Navigation Buttons */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: 2,
              mt: 4,
              flexWrap: 'wrap',
            }}
          >
            <Button
              variant='outlined'
              startIcon={<ArrowBack />}
              onClick={() => router.push('/')}
              sx={{ borderRadius: '8px', textTransform: 'none', px: 3, py: 1 }}
            >
              Back to Dashboard
            </Button>

            {user.role.includes('admin') && (
              <Button
                variant='contained'
                color='primary'
                onClick={() => router.push('/admin/payments_due')}
                sx={{
                  borderRadius: '8px',
                  textTransform: 'none',
                  px: 3,
                  py: 1,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                View All Payments
              </Button>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default PaymentDue;
