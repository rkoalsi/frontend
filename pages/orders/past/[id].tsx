import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Button,
  Skeleton,
  List,
  ListItem,
  ListItemText,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useRouter } from 'next/router';
import axios from 'axios';
import { Edit } from '@mui/icons-material';
import Link from 'next/link';

const OrderDetails = () => {
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const { id } = router.query;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  /**
   * Fetch order details from the API
   */
  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.api_url}/orders/${id}`);
      setOrderData(response.data);
      console.log(response.data);
    } catch (err) {
      setError('Failed to load order details. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchOrderDetails();
    }
  }, [id]);

  /**
   * Handle Loading State
   */
  if (loading) {
    return (
      <Box
        sx={{
          padding: isMobile ? 0 : 3,
          maxWidth: isMobile ? '100%' : '600px',
          margin: '0 auto',
        }}
      >
        <Skeleton variant='rectangular' height={40} sx={{ mb: 2 }} />
        <Skeleton variant='rectangular' height={200} sx={{ mb: 2 }} />
        <Skeleton variant='rectangular' height={40} />
      </Box>
    );
  }

  /**
   * Handle Error State
   */
  if (error || !orderData) {
    return (
      <Box sx={{ padding: 3, textAlign: 'center' }}>
        <Typography variant='h6' color='error'>
          {error || 'No order details available.'}
        </Typography>
        <Button
          variant='contained'
          color='secondary'
          sx={{ mt: 2 }}
          onClick={() => router.push('/orders/past')}
        >
          Back to Orders
        </Button>
      </Box>
    );
  }

  /**
   * Main UI for Order Details
   */
  if (!orderData) {
    return (
      <Box sx={{ padding: 3 }}>
        <Skeleton variant='rectangular' height={40} sx={{ mb: 2 }} />
        <Skeleton variant='rectangular' height={200} sx={{ mb: 2 }} />
        <Skeleton variant='rectangular' height={40} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        padding: isMobile ? 0 : 3,
        maxWidth: isMobile ? '100%' : '600px',
        margin: isMobile ? '16px 0 0 0' : '0 auto',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: 3,
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          marginX: { xs: 2, sm: 'auto' },
        }}
      >
        {/* Order Header */}
        <Box display={'flex'} alignItems={'baseline'}>
          <Typography variant='h5' fontWeight='bold' gutterBottom>
            Order
            {orderData?.estimate_created
              ? ` ${orderData?.estimate_number}`
              : ` ${orderData._id.slice(-6)}`}
          </Typography>
          <IconButton
            onClick={() => router.push(`/orders/new/${orderData._id || id}`)}
          >
            <Edit fontSize='small' />
          </IconButton>
        </Box>
        <Divider sx={{ mb: 2 }} />
        {/* Order Details */}
        <Typography variant='body1' sx={{ mb: 1 }}>
          <strong>Date:</strong>{' '}
          {orderData?.created_at
            ? new Date(orderData.created_at).toLocaleDateString()
            : 'N/A'}
        </Typography>
        <Typography variant='body1' sx={{ mb: 1 }}>
          <strong>Customer:</strong> {orderData?.customer_name || 'N/A'}
        </Typography>
        <Typography variant='body1' sx={{ mb: 1 }}>
          <strong>Status:</strong>{' '}
          {orderData?.status.split('_').join(' ') || 'N/A'}
        </Typography>
        {orderData?.estimate_created && (
          <Typography variant='body1' sx={{ mb: 1 }}>
            <strong>Estimate Number:</strong>{' '}
            {orderData?.estimate_number || 'N/A'} {'\t\t\t\t\t'}(
            <Link href={orderData?.estimate_url}>Estimate Url</Link>)
          </Typography>
        )}
        <Typography variant='body1' sx={{ mb: 2 }}>
          <strong>Amount:</strong> ₹{orderData?.total_amount || '0'} {'\t'}
          <strong>({orderData?.gst_type} </strong>
          of GST ₹{orderData?.total_gst || '0'})
        </Typography>
        <Divider sx={{ my: 2 }} />

        {/* Product List */}
        <Typography variant='h6' fontWeight='bold' gutterBottom>
          Ordered Items
        </Typography>
        <List
          sx={{
            maxHeight: isMobile ? 'none' : '300px',
            overflowY: isMobile ? 'visible' : 'auto',
          }}
        >
          {orderData.products?.map((item: any, index: number) => (
            <ListItem key={index} sx={{ padding: '8px 0' }}>
              <ListItemText
                primary={
                  <Typography variant='body1'>
                    {item.name} (x{item.quantity})
                  </Typography>
                }
                secondary={
                  <Typography variant='body2' color='textSecondary'>
                    Price: ₹{item.price}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>

        {orderData.products?.length === 0 && (
          <Typography variant='body2' color='textSecondary'>
            No products found in this order.
          </Typography>
        )}
        <Divider sx={{ my: 2 }} />

        {/* Footer Navigation */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
          <Button
            variant='outlined'
            color='primary'
            onClick={() => router.push('/orders/past')}
          >
            Back to Orders
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default OrderDetails;
