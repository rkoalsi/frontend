import React, { useContext, useEffect, useState } from 'react';
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
import { AddToPhotos, ContentCopy, Download, Edit } from '@mui/icons-material';
import Link from 'next/link';
import AuthContext from '../../../src/components/Auth';
import { toast } from 'react-toastify';

const OrderDetails = () => {
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const { id } = router.query;
  const { user }: any = useContext(AuthContext);
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

  const handleCopyEstimate = () => {
    if (orderData?.estimate_number) {
      navigator.clipboard.writeText(orderData.estimate_number);
    }
  };
  const handleDownloadEstimate = async (order: any) => {
    try {
      const resp = await axios.get(
        `${process.env.api_url}/orders/download_pdf/${order._id}`,
        {
          responseType: 'blob', // Receive the response as binary data
        }
      );

      // Check if the blob is an actual PDF or an error message
      if (resp.data.type !== 'application/pdf') {
        // Convert to text to read the error response
        toast.error('Draft Estimate Not Created');
        return;
      }

      // Extract filename from headers or set default
      const contentDisposition = resp.headers['content-disposition'];
      let fileName = `${order.estimate_number}.pdf`;

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match && match[1]) {
          fileName = match[1];
        }
      }

      // Create and trigger download
      const blob = new Blob([resp.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      toast.error(error.message || 'Failed to download PDF');
    }
  };
  const handleDuplicateOrder = async () => {
    try {
      const resp = await axios.post(
        `${process.env.api_url}/orders/duplicate_order`,
        {
          order_id: id,
        }
      );
      router.push(`/orders/new/${resp.data}`);
    } catch (error) {
      console.error('Error creating new order:', error);
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
          color='primary'
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
        <Box display={'flex'} flexDirection={'column'}>
          <Box
            display={'flex'}
            flexDirection={'column'}
            alignItems={'flex-start'}
            justifyContent={'space-between'}
          >
            <Typography variant='h5' fontWeight='bold' gutterBottom>
              {orderData?.estimate_created
                ? ` ${orderData?.estimate_number}`
                : `Order ${orderData._id.slice(-6)}`}
              {orderData?.estimate_created && (
                <IconButton size='small' onClick={handleCopyEstimate}>
                  <ContentCopy fontSize='small' />
                </IconButton>
              )}
            </Typography>
          </Box>
          <Box
            display={'flex'}
            alignItems={'flex-end'}
            justifyContent={'flex-end'}
          >
            <IconButton onClick={handleDuplicateOrder}>
              <AddToPhotos fontSize='medium' />
            </IconButton>
            <IconButton
              onClick={() => router.push(`/orders/new/${orderData._id || id}`)}
            >
              <Edit fontSize='medium' />
            </IconButton>
            {orderData?.estimate_created && (
              <IconButton
                size='small'
                onClick={() => handleDownloadEstimate(orderData)}
              >
                <Download fontSize='medium' />
              </IconButton>
            )}
          </Box>
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
        <Typography variant='h5' sx={{ mb: 2 }}>
          <strong>Shipping Address:</strong>
        </Typography>
        <Typography variant='body1' sx={{ mb: 1 }}>
          {orderData.shipping_address.attention}
        </Typography>
        <Typography variant='body1' sx={{ mb: 1 }}>
          {orderData.shipping_address.address}
        </Typography>
        <Typography variant='body1' sx={{ mb: 1 }}>
          {orderData.shipping_address.city}
        </Typography>
        <Typography variant='body1' sx={{ mb: 1 }}>
          {orderData.shipping_address.state}
        </Typography>
        <Typography variant='body1' sx={{ mb: 1 }}>
          {orderData.shipping_address.zip}
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Typography variant='h5' sx={{ mb: 2 }}>
          <strong>Billing Address:</strong>
        </Typography>
        <Typography variant='body1' sx={{ mb: 1 }}>
          {orderData.billing_address.attention}
        </Typography>
        <Typography variant='body1' sx={{ mb: 1 }}>
          {orderData.billing_address.address}
        </Typography>
        <Typography variant='body1' sx={{ mb: 1 }}>
          {orderData.billing_address.city}
        </Typography>
        <Typography variant='body1' sx={{ mb: 1 }}>
          {orderData.billing_address.state}
        </Typography>
        <Typography variant='body1' sx={{ mb: 1 }}>
          {orderData.billing_address.zip}
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
            variant='contained'
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
