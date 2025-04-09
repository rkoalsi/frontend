import { useContext, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Skeleton,
  Chip,
  useMediaQuery,
  Card,
  CardContent,
  TextField,
  Container,
  Paper,
  Stack,
  Divider,
  IconButton,
  InputAdornment,
  Fade,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useRouter } from 'next/router';
import axios from 'axios';
import AuthContext from '../../../../src/components/Auth';
import axiosInstance from '../../../../src/util/axios';
import { toast } from 'react-toastify';
import CustomButton from '../../../../src/components/common/Button';
import {
  Visibility,
  Search,
  GetApp,
  ArrowBack,
  WarningAmber,
  CheckCircleOutline,
  AccessTime,
} from '@mui/icons-material';
import Header from '../../../../src/components/common/Header';

const PaymentDue = () => {
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isMedium = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();
  const { user }: any = useContext(AuthContext);

  /**
   * Fetch orders from the backend
   */
  const getData = async () => {
    try {
      setLoading(true);
      let resp;
      if (user.data.role.includes('admin')) {
        resp = await axiosInstance.get(`/admin/payments_due`);
      } else {
        resp = await axios.get(
          `${process.env.api_url}/invoices?created_by=${user?.data?._id}`
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

  /**
   * Navigate to invoice details page
   */
  const handleOrderClick = (id: any) => {
    router.push(`/orders/past/payment_due/${id}`);
  };

  useEffect(() => {
    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDownloadCSV = async () => {
    try {
      let url = '/admin/payments_due/download_csv';
      url += `?sales_person=${encodeURIComponent(
        user?.data?.role?.includes('admin') ? '' : user?.data?.code
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

  const getStatusIcon = (status: any) => {
    switch (status.toLowerCase()) {
      case 'overdue':
        return (
          <WarningAmber
            fontSize='small'
            sx={{ color: theme.palette.warning.main }}
          />
        );
      case 'paid':
        return (
          <CheckCircleOutline
            fontSize='small'
            sx={{ color: theme.palette.success.main }}
          />
        );
      default:
        return (
          <AccessTime
            fontSize='small'
            sx={{ color: theme.palette.info.main }}
          />
        );
    }
  };

  const filteredInvoices = invoices.filter((invoice: any) =>
    invoice.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        pb: 4,
      }}
    >
      <Container maxWidth='lg'>
        <Box
          sx={{
            pt: 3,
            pb: 4,
          }}
        >
          {/* Header Section */}
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
              placeholder='Search by Name'
              fullWidth={isMobile}
              size='small'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                maxWidth: isMobile ? '100%' : '350px',
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                },
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
                  height={100}
                  sx={{
                    mb: 2,
                    borderRadius: '12px',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }}
                />
              ))}
            </Box>
          ) : (
            /* Invoices List */
            <Fade in={!loading}>
              <Box sx={{ width: '100%' }}>
                {filteredInvoices.length > 0 ? (
                  <Stack spacing={2}>
                    {filteredInvoices.map((invoice) => {
                      const {
                        _id,
                        invoice_number,
                        customer_name,
                        created_at,
                        due_date,
                        status,
                        total,
                        balance,
                        overdue_by_days,
                        invoice_notes = {},
                      }: any = invoice;
                      const { images = [] }: any = invoice_notes;

                      // Determine whether the invoice is past due
                      const invoiceDueDate = new Date(due_date);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      invoiceDueDate.setHours(0, 0, 0, 0);
                      const isPastDue = invoiceDueDate < today;

                      // Format the status label with first letter uppercase
                      const formattedStatus =
                        status.charAt(0).toUpperCase() +
                        status.slice(1).toLowerCase();

                      return (
                        <Card
                          key={_id}
                          elevation={2}
                          onClick={() => handleOrderClick(_id)}
                          sx={{
                            paddingBottom: '0px !important',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                            },
                            border: isPastDue
                              ? `1px solid ${theme.palette.error.light}`
                              : 'none',
                          }}
                        >
                          <CardContent sx={{ p: 0 }}>
                            <Box
                              sx={{
                                p: 2,
                                display: 'flex',
                                flexDirection: isMedium ? 'column' : 'row',
                                justifyContent: 'space-between',
                                gap: 2,
                              }}
                            >
                              {/* Left section - Invoice Details */}
                              <Box sx={{ flex: 1 }}>
                                <Box
                                  display='flex'
                                  alignItems='center'
                                  justifyContent='space-between'
                                >
                                  <Typography
                                    variant='h6'
                                    fontWeight='600'
                                    sx={{
                                      fontSize: { xs: '1rem', sm: '1.1rem' },
                                      color: theme.palette.text.primary,
                                    }}
                                  >
                                    {invoice_number}
                                  </Typography>

                                  {images.length > 0 && (
                                    <Chip
                                      icon={<Visibility fontSize='small' />}
                                      label='Attachments'
                                      size='small'
                                      sx={{
                                        borderRadius: '6px',
                                        fontSize: '0.75rem',
                                      }}
                                    />
                                  )}
                                </Box>

                                <Typography
                                  variant='body1'
                                  sx={{
                                    mt: 1,
                                    fontWeight: 500,
                                    color: theme.palette.text.primary,
                                  }}
                                >
                                  {customer_name}
                                </Typography>

                                <Box
                                  sx={{
                                    mt: 1,
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 2,
                                  }}
                                >
                                  <Typography
                                    variant='body2'
                                    color='text.secondary'
                                  >
                                    Created:{' '}
                                    {new Date(created_at).toLocaleDateString()}
                                  </Typography>

                                  <Typography
                                    variant='body2'
                                    sx={{
                                      color: isPastDue
                                        ? theme.palette.error.main
                                        : theme.palette.text.secondary,
                                      fontWeight: isPastDue ? 600 : 400,
                                    }}
                                  >
                                    Due: {invoiceDueDate.toLocaleDateString()}
                                  </Typography>
                                </Box>

                                {parseInt(overdue_by_days) > 0 && (
                                  <Typography
                                    variant='body2'
                                    sx={{
                                      mt: 1,
                                      color: theme.palette.error.main,
                                      fontWeight: 600,
                                    }}
                                  >
                                    Overdue by: {overdue_by_days}{' '}
                                    {parseInt(overdue_by_days) === 1
                                      ? 'day'
                                      : 'days'}
                                  </Typography>
                                )}
                              </Box>

                              {/* Right section - Status & Amounts */}
                              <Box
                                sx={{
                                  display: 'flex',
                                  flexDirection: isMobile ? 'row' : 'column',
                                  justifyContent: isMobile
                                    ? 'space-between'
                                    : 'flex-end',
                                  alignItems: isMobile ? 'center' : 'flex-end',
                                  minWidth: isMedium ? 'auto' : '180px',
                                  gap: 1,
                                }}
                              >
                                <Chip
                                  icon={getStatusIcon(status)}
                                  label={formattedStatus}
                                  size='small'
                                  color={
                                    status.toLowerCase() === 'overdue'
                                      ? 'warning'
                                      : 'default'
                                  }
                                  sx={{
                                    fontWeight: 500,
                                    borderRadius: '16px',
                                    px: 0.5,
                                  }}
                                />

                                <Box
                                  sx={{
                                    textAlign: isMobile ? 'right' : 'right',
                                  }}
                                >
                                  <Typography
                                    variant='h6'
                                    sx={{
                                      fontWeight: 600,
                                      color: theme.palette.text.primary,
                                      fontSize: { xs: '1rem', sm: '1.1rem' },
                                    }}
                                  >
                                    ₹{total || 0}
                                  </Typography>

                                  <Typography
                                    variant='body2'
                                    color='text.secondary'
                                    sx={{ fontWeight: 500 }}
                                  >
                                    Balance: ₹{balance || 0}
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Stack>
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
                      No invoices found. Try adjusting your search or create a
                      new invoice.
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
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                px: 3,
                py: 1,
              }}
            >
              Back to Dashboard
            </Button>

            {user.data.role.includes('admin') && (
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
