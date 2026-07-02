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
  Edit,
  AssignmentReturn,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import axiosInstance from '../../../src/util/axios';
import { format } from 'date-fns';
import { trackActivity } from '../../../src/util/trackActivity';
import OrderReturnDialog from '../../../src/components/common/OrderReturnDialog';

interface OrderProduct {
  _id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  product_id?: string;
  product_code?: string;
  image_url?: string;
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
  customer_id?: string;
  shipping_address?: any;
  notes?: string;
  total_amount?: number;
  estimate_created?: boolean;
  estimate_number?: string;
  pre_order_estimate_created?: boolean;
  pre_order_estimate_number?: string;
  payment?: { status?: string };
}

interface ReturnEligibility {
  eligible: boolean;
  invoiced: boolean;
  shipped: boolean;
  shipped_status: string;
  existing_return_order?: { _id: string; status: string } | null;
}

const orderSteps = ['Draft', 'Sent', 'Accepted', 'Invoiced'];

// Order addresses are stored as objects ({ attention, address, city, state, zip }),
// so render them as text instead of dropping the raw object into JSX.
const formatAddress = (addr: any): string => {
  if (!addr) return '';
  if (typeof addr === 'string') return addr;
  return [addr.attention, addr.address, addr.city, addr.state, addr.zip]
    .filter(Boolean)
    .join(', ');
};

const CustomerOrderDetail = () => {
  const { user }: any = useContext(AuthContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [eligibility, setEligibility] = useState<ReturnEligibility | null>(null);
  const [returnOpen, setReturnOpen] = useState(false);

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
      trackActivity({ action: 'view_order_detail', category: 'orders', metadata: { order_id: String(id) } });
    }
  }, [id, fetchOrder]);

  // Returns are only possible once the order is invoiced and shipped —
  // check eligibility (which also reports an already-created return).
  const fetchEligibility = useCallback(async () => {
    if (!id) return;
    try {
      const { data } = await axiosInstance.get(`/orders/${id}/return_eligibility`);
      setEligibility(data);
    } catch (err) {
      console.error('Error checking return eligibility:', err);
    }
  }, [id]);

  useEffect(() => {
    if (id && (order?.status || '').toLowerCase() === 'invoiced') {
      fetchEligibility();
    }
  }, [id, order?.status, fetchEligibility]);

  // Deep link (?return=1 from the orders list) opens the return flow directly.
  useEffect(() => {
    if (router.query.return === '1' && eligibility?.eligible) {
      setReturnOpen(true);
    }
  }, [router.query.return, eligibility?.eligible]);

  const getStatusColor = (rawStatus: string) => {
    const status = (rawStatus || '').toLowerCase();
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

  const getStatusIcon = (rawStatus: string) => {
    const status = (rawStatus || '').toLowerCase();
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

  const getActiveStep = (rawStatus: string) => {
    const status = (rawStatus || '').toLowerCase();
    switch (status) {
      case 'draft':
        return 0;
      case 'sent':
        return 1;
      case 'accepted':
        return 2;
      case 'invoiced':
      case 'delivered':
        return 3;
      default:
        return 0;
    }
  };

  const isDeclined = (order?.status || '').toLowerCase() === 'declined';
  // Paid or already-processed orders are locked for editing (same rule as the
  // salesperson order detail page).
  const statusKey = (order?.status || '').toLowerCase();
  const isPaid = (order?.payment?.status || '').toLowerCase() === 'paid';
  const isEditable =
    !!order && !['declined', 'accepted', 'invoiced'].includes(statusKey) && !isPaid;

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

          {/* Actions: edit while still editable, return once invoiced + shipped */}
          {(isEditable || eligibility?.eligible || eligibility?.existing_return_order) && (
            <Box sx={{ display: 'flex', gap: 1.5, mt: 2, flexWrap: 'wrap' }}>
              {isEditable && (
                <Button
                  variant='outlined'
                  size='small'
                  startIcon={<Edit />}
                  onClick={() => router.push(`/orders/new/${order._id}`)}
                  sx={{
                    color: 'white',
                    borderColor: 'rgba(255,255,255,0.5)',
                    textTransform: 'none',
                    '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' },
                  }}
                >
                  Edit Order
                </Button>
              )}
              {eligibility?.eligible && (
                <Button
                  variant='contained'
                  size='small'
                  startIcon={<AssignmentReturn />}
                  onClick={() => setReturnOpen(true)}
                  sx={{
                    backgroundColor: '#38a169',
                    '&:hover': { backgroundColor: '#2f855a' },
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                >
                  Return Items
                </Button>
              )}
              {eligibility?.existing_return_order && (
                <Chip
                  icon={<AssignmentReturn sx={{ color: 'white !important' }} />}
                  label={`Return order ${eligibility.existing_return_order.status}`}
                  sx={{
                    color: 'white',
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    textTransform: 'capitalize',
                    fontWeight: 600,
                  }}
                />
              )}
            </Box>
          )}
        </Box>

        {/* Order Progress Stepper */}
        {!isDeclined && (
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
        {isDeclined && (
          <Box sx={{ p: 3 }}>
            <Alert severity='error' icon={<Cancel />}>
              This order has been declined. Please contact support for more
              information.
            </Alert>
          </Box>
        )}

        {/* Main content */}
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          {/* Order Summary */}
          <Typography variant='h6' fontWeight={600} sx={{ mb: 2 }}>
            Order Details
          </Typography>

          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 3,
              backgroundColor: 'action.hover',
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
                <Typography fontWeight={500} sx={{ wordBreak: 'break-all' }}>{order._id}</Typography>
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
              {order.estimate_created && order.estimate_number && (
                <Box>
                  <Typography variant='body2' color='text.secondary'>
                    Estimate Number
                  </Typography>
                  <Typography fontWeight={500}>
                    {order.estimate_number}
                  </Typography>
                </Box>
              )}
              {order.pre_order_estimate_created &&
                order.pre_order_estimate_number && (
                  <Box>
                    <Typography variant='body2' color='text.secondary'>
                      Pre-Order Estimate Number
                    </Typography>
                    <Typography fontWeight={500}>
                      {order.pre_order_estimate_number}
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
            <>
            {/* Mobile: stacked product cards */}
            <Box sx={{ display: { xs: 'flex', sm: 'none' }, flexDirection: 'column', gap: 1.5, mb: 3 }}>
              {order.products.map((product, index) => (
                <Paper
                  key={product._id || index}
                  elevation={0}
                  sx={{
                    p: 1.75,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                  }}
                >
                  <Typography fontWeight={600} sx={{ fontSize: '0.9rem', mb: 0.75 }}>
                    {product.name || 'Product'}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant='body2' color='text.secondary'>
                      {product.quantity} × ₹{product.price?.toFixed(2) || '0.00'}
                    </Typography>
                    <Typography fontWeight={700} sx={{ fontSize: '0.95rem' }}>
                      ₹{(product.total ?? (product.price ?? 0) * (product.quantity ?? 0)).toFixed(2)}
                    </Typography>
                  </Box>
                </Paper>
              ))}
            </Box>

            {/* Tablet/desktop: table */}
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{
                display: { xs: 'none', sm: 'block' },
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                mb: 3,
              }}
            >
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'action.hover' }}>
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
                        ₹{product.price?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell align='right'>
                        ₹{(product.total ?? (product.price ?? 0) * (product.quantity ?? 0)).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            </>
          ) : (
            <Paper
              elevation={0}
              sx={{
                p: 4,
                textAlign: 'center',
                backgroundColor: 'action.hover',
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
          {(order.total ?? order.total_amount) != null && (
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
                ₹{(order.total ?? order.total_amount ?? 0).toLocaleString('en-IN')}
              </Typography>
            </Paper>
          )}

          {/* Shipping Info */}
          {formatAddress(order.shipping_address) && (
            <Box sx={{ mt: 3 }}>
              <Typography variant='h6' fontWeight={600} sx={{ mb: 2 }}>
                <LocalShipping sx={{ mr: 1, verticalAlign: 'middle' }} />
                Shipping Address
              </Typography>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  backgroundColor: 'action.hover',
                  borderRadius: 2,
                }}
              >
                <Typography>{formatAddress(order.shipping_address)}</Typography>
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
                  backgroundColor: 'action.hover',
                  borderRadius: 2,
                }}
              >
                <Typography>{order.notes}</Typography>
              </Paper>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Return order flow for this order */}
      <OrderReturnDialog
        open={returnOpen}
        onClose={() => setReturnOpen(false)}
        order={order}
        onSaved={() => fetchEligibility()}
      />
    </Container>
  );
};

export default CustomerOrderDetail;
