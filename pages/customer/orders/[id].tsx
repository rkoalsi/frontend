'use client';
import { useContext, useEffect, useState, useCallback } from 'react';
import {
  Typography,
  Box,
  CircularProgress,
  Container,
  useTheme,
  useMediaQuery,
  Paper,
  Button,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stepper,
  Step,
  StepLabel,
  Alert,
} from '@mui/material';
import AuthContext from '../../../src/components/Auth';
import {
  ArrowBack,
  LocalShipping,
  Receipt,
  CheckCircle,
  Schedule,
  Cancel,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import axiosInstance from '../../../src/util/axios';
import { format } from 'date-fns';

interface OrderProduct {
  _id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface Order {
  _id: string;
  order_number?: string;
  status: string;
  total?: number;
  created_at: string;
  updated_at?: string;
  products?: OrderProduct[];
  customer?: any;
  shipping_address?: string;
  notes?: string;
}

const orderSteps = ['Draft', 'Accepted', 'Invoiced', 'Delivered'];

const CustomerOrderDetail = () => {
  const { user }: any = useContext(AuthContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch order details
  const fetchOrder = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const { data } = await axiosInstance.get(`/orders/${id}`);
      setOrder(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching order:', err);
      setError('Failed to load order details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchOrder();
    }
  }, [id, fetchOrder]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'accepted':
        return 'primary';
      case 'invoiced':
        return 'success';
      case 'declined':
        return 'error';
      case 'delivered':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Schedule />;
      case 'accepted':
        return <Receipt />;
      case 'invoiced':
        return <Receipt />;
      case 'declined':
        return <Cancel />;
      case 'delivered':
        return <CheckCircle />;
      default:
        return <Schedule />;
    }
  };

  const getActiveStep = (status: string) => {
    switch (status) {
      case 'draft':
        return 0;
      case 'accepted':
        return 1;
      case 'invoiced':
        return 2;
      case 'delivered':
        return 3;
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <Container maxWidth='lg' sx={{ py: 4 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '50vh',
          }}
        >
          <CircularProgress sx={{ color: '#38a169' }} />
        </Box>
      </Container>
    );
  }

  if (error || !order) {
    return (
      <Container maxWidth='lg' sx={{ py: 4 }}>
        <Alert
          severity='error'
          action={
            <Button color='inherit' size='small' onClick={() => router.back()}>
              Go Back
            </Button>
          }
        >
          {error || 'Order not found'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth='lg' sx={{ py: { xs: 2, md: 4 } }}>
      <Paper
        elevation={0}
        sx={{
          backgroundColor: 'background.paper',
          borderRadius: 4,
          overflow: 'hidden',
          minHeight: '80vh',
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        {/* Header section */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #1a365d 0%, #2d4a6f 100%)',
            color: 'white',
            padding: { xs: 3, md: 4 },
          }}
        >
          <Button
            startIcon={<ArrowBack />}
            onClick={() => router.push('/customer/orders')}
            sx={{
              color: 'white',
              mb: 2,
              textTransform: 'none',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
            }}
          >
            Back to Orders
          </Button>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Box>
              <Typography
                variant={isMobile ? 'h5' : 'h4'}
                sx={{ fontWeight: 700, mb: 1 }}
              >
                Order #{order.order_number || order._id.slice(-6)}
              </Typography>
              <Typography variant='body1' sx={{ opacity: 0.9 }}>
                Placed on{' '}
                {order.created_at
                  ? format(new Date(order.created_at), 'PPPp')
                  : 'N/A'}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {getStatusIcon(order.status)}
              <Chip
                label={order.status}
                color={getStatusColor(order.status) as any}
                sx={{
                  textTransform: 'capitalize',
                  fontWeight: 600,
                  fontSize: '1rem',
                  py: 2,
                  px: 1,
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* Order Progress Stepper */}
        {order.status !== 'declined' && (
          <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Typography variant='h6' fontWeight={600} sx={{ mb: 3 }}>
              Order Progress
            </Typography>
            <Stepper activeStep={getActiveStep(order.status)} alternativeLabel>
              {orderSteps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
        )}

        {/* Declined Notice */}
        {order.status === 'declined' && (
          <Box sx={{ p: 3 }}>
            <Alert severity='error' icon={<Cancel />}>
              This order has been declined. Please contact support for more
              information.
            </Alert>
          </Box>
        )}

        {/* Main content */}
        <Box sx={{ p: 3 }}>
          {/* Order Summary */}
          <Typography variant='h6' fontWeight={600} sx={{ mb: 2 }}>
            Order Details
          </Typography>

          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 3,
              backgroundColor: 'grey.50',
              borderRadius: 2,
            }}
          >
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 2,
              }}
            >
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  Order ID
                </Typography>
                <Typography fontWeight={500}>{order._id}</Typography>
              </Box>
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  Status
                </Typography>
                <Typography fontWeight={500} sx={{ textTransform: 'capitalize' }}>
                  {order.status}
                </Typography>
              </Box>
              <Box>
                <Typography variant='body2' color='text.secondary'>
                  Created
                </Typography>
                <Typography fontWeight={500}>
                  {order.created_at
                    ? format(new Date(order.created_at), 'PPPp')
                    : 'N/A'}
                </Typography>
              </Box>
              {order.updated_at && (
                <Box>
                  <Typography variant='body2' color='text.secondary'>
                    Last Updated
                  </Typography>
                  <Typography fontWeight={500}>
                    {format(new Date(order.updated_at), 'PPPp')}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>

          {/* Products Table */}
          <Typography variant='h6' fontWeight={600} sx={{ mb: 2 }}>
            Products
          </Typography>

          {order.products && order.products.length > 0 ? (
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                mb: 3,
              }}
            >
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>Product</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align='center'>
                      Quantity
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align='right'>
                      Price
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align='right'>
                      Total
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {order.products.map((product, index) => (
                    <TableRow key={product._id || index}>
                      <TableCell>
                        <Typography fontWeight={500}>
                          {product.name || 'Product'}
                        </Typography>
                      </TableCell>
                      <TableCell align='center'>{product.quantity}</TableCell>
                      <TableCell align='right'>
                        ${product.price?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell align='right'>
                        ${product.total?.toFixed(2) || '0.00'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Paper
              elevation={0}
              sx={{
                p: 4,
                textAlign: 'center',
                backgroundColor: 'grey.50',
                borderRadius: 2,
                mb: 3,
              }}
            >
              <Typography color='text.secondary'>
                No products in this order
              </Typography>
            </Paper>
          )}

          {/* Order Total */}
          {order.total && (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                backgroundColor: 'primary.50',
                borderRadius: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant='h6' fontWeight={600}>
                Order Total
              </Typography>
              <Typography variant='h5' fontWeight={700} color='primary'>
                ${order.total?.toFixed(2)}
              </Typography>
            </Paper>
          )}

          {/* Shipping Info */}
          {order.shipping_address && (
            <Box sx={{ mt: 3 }}>
              <Typography variant='h6' fontWeight={600} sx={{ mb: 2 }}>
                <LocalShipping sx={{ mr: 1, verticalAlign: 'middle' }} />
                Shipping Address
              </Typography>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  backgroundColor: 'grey.50',
                  borderRadius: 2,
                }}
              >
                <Typography>{order.shipping_address}</Typography>
              </Paper>
            </Box>
          )}

          {/* Notes */}
          {order.notes && (
            <Box sx={{ mt: 3 }}>
              <Typography variant='h6' fontWeight={600} sx={{ mb: 2 }}>
                Order Notes
              </Typography>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  backgroundColor: 'grey.50',
                  borderRadius: 2,
                }}
              >
                <Typography>{order.notes}</Typography>
              </Paper>
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default CustomerOrderDetail;
