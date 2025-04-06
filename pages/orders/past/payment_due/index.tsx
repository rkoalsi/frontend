import { useContext, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Skeleton,
  Chip,
  useMediaQuery,
  Grid,
  Card,
  CardContent,
  TextField,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useRouter } from 'next/router';
import axios from 'axios';
import AuthContext from '../../../../src/components/Auth';
import axiosInstance from '../../../../src/util/axios';
import { toast } from 'react-toastify';
import CustomButton from '../../../../src/components/common/Button';
import { Visibility } from '@mui/icons-material';
import Header from '../../../../src/components/common/Header';
const PaymentDue = () => {
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
    } finally {
      setLoading(false);
    }
  };

  /**
   * Navigate to invoice details page
   */
  const handleOrderClick = (id: number) => {
    router.push(`/orders/past/payment_due/${id}`);
  };

  useEffect(() => {
    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const handleDownloadCSV = async () => {
    try {
      let url = '/admin/payments_due/download_csv';
      console.log(user);
      url += `?sales_person=${encodeURIComponent(
        user?.data?.role?.includes('admin') ? '' : user?.data?.code
      )}`;
      const response = await axiosInstance.get(url, {
        responseType: 'blob', // important for binary responses
      });
      // Create a URL for the blob and simulate a link click to download
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', 'payments_due.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error(error);
      toast.error('Error downloading CSV');
    }
  };
  return (
    <Box
      display='flex'
      flexDirection='column'
      alignItems='center'
      justifyContent='flex-start'
      sx={{
        width: '100%',
        gap: '16px',
        padding: isMobile ? '16px' : '16px',
      }}
    >
      {/* Header */}
      <Header title={'Payments Due'} showBackButton />
      <TextField
        label='Search by Customer Name'
        variant='outlined'
        fullWidth
        sx={{
          width: '100%',
          maxWidth: 400,
          // Style for the input text
          '& .MuiInputBase-input': {
            color: 'white',
          },
          // Style for the label
          '& .MuiInputLabel-root': {
            color: 'white',
          },
          // Style for the outline
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'white',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'white',
          },
          '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline':
            {
              borderColor: 'white',
            },
        }}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <Button variant='contained' color='primary' onClick={handleDownloadCSV}>
        Download CSV
      </Button>
      {/* Loading State */}
      {loading ? (
        <Box sx={{ width: '100%', maxWidth: '1200px', mt: 4 }}>
          <Skeleton variant='rectangular' height={100} sx={{ mb: 2 }} />
          <Skeleton variant='rectangular' height={100} sx={{ mb: 2 }} />
          <Skeleton variant='rectangular' height={100} />
        </Box>
      ) : (
        /* Orders Grid */
        <Box
          sx={{
            width: '100%',
            maxWidth: '1200px',
          }}
        >
          {invoices.length > 0 ? (
            <Grid container spacing={3}>
              {invoices
                .filter((invoice) =>
                  invoice.customer_name
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase())
                )
                .map((invoice: any) => {
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
                  } = invoice;
                  const { images = [] } = invoice_notes;
                  // Determine whether the invoice is past due
                  const invoiceDueDate = new Date(due_date);
                  // You can adjust this logic if you want to account for time, or
                  // if you only care about the date, you can normalize both to midnight:
                  const today = new Date();
                  // Set hours to 0 to compare just dates (optional).
                  today.setHours(0, 0, 0, 0);
                  invoiceDueDate.setHours(0, 0, 0, 0);

                  const isPastDue = invoiceDueDate < today;
                  // Format the status label with first letter uppercase
                  const formattedStatus =
                    status.charAt(0).toUpperCase() +
                    status.slice(1).toLowerCase();

                  return (
                    <Grid
                      // item
                      // xs={12}
                      // sm={6}
                      // md={4}
                      // lg={3}
                      // key={_id}
                      onClick={() => handleOrderClick(_id)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <Card
                        sx={{
                          height: '100%',
                          '&:hover': {
                            boxShadow: 6, // Increase the shadow on hover
                          },
                        }}
                      >
                        <CardContent
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1,
                          }}
                        >
                          <Box
                            display={'flex'}
                            flexDirection={'row'}
                            width={'100%'}
                            justifyContent={'space-between'}
                          >
                            {/* Invoice Title */}
                            <Typography variant='h6' fontWeight='bold'>
                              {invoice_number}
                            </Typography>
                            {images.length > 0 && <Visibility />}
                          </Box>
                          {/* Customer & Dates */}
                          <Typography variant='body2' color='text.secondary'>
                            Customer: {customer_name}
                          </Typography>
                          <Typography variant='body2' color='text.secondary'>
                            Date: {new Date(created_at).toLocaleDateString()}
                          </Typography>

                          <Typography
                            variant='body2'
                            sx={{ color: 'rebeccapurple' }}
                          >
                            Overdue by: {overdue_by_days}{' '}
                            {parseInt(overdue_by_days) === 1 ? 'day' : 'days'}
                          </Typography>

                          <Typography
                            variant='body2'
                            sx={{ color: isPastDue ? 'red' : 'text.secondary' }}
                          >
                            Due Date: {invoiceDueDate.toLocaleDateString()}
                          </Typography>

                          {/* Status, Total & Balance */}
                          <Box
                            sx={{
                              mt: 1,
                              display: 'flex',
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <Chip
                              label={formattedStatus}
                              color={
                                status.toLowerCase() === 'overdue'
                                  ? 'warning'
                                  : 'info'
                              }
                              sx={{ fontWeight: 'bold' }}
                            />
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography variant='body1' fontWeight='bold'>
                                ₹{total || 0} Total
                              </Typography>
                              <Typography variant='body2'>
                                Balance: ₹{balance || 0}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
            </Grid>
          ) : (
            <Typography
              variant='body1'
              align='center'
              sx={{ padding: '16px', color: 'white' }}
            >
              No past invoices available.
            </Typography>
          )}
        </Box>
      )}

      {/* Navigation Buttons */}
      <Box display='flex' justifyContent='center' gap='8px' sx={{ mt: 2 }}>
        <CustomButton
          color='secondary'
          onClick={() => router.push('/')}
          text={'Go Back'}
        />
        {user.data.role.includes('admin') && (
          <CustomButton
            color='primary'
            onClick={() => router.push('/admin/payments_due')}
            text={'View More'}
          />
        )}
      </Box>
    </Box>
  );
};

export default PaymentDue;
