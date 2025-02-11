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
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const { id } = router.query;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  /**
   * Fetch invoice details from the API
   */
  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.api_url}/invoices/${id}`);
      setInvoiceData(response.data);
      console.log(response.data);
    } catch (err) {
      setError('Failed to load invoice details. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchInvoiceDetails();
    }
  }, [id]);

  /**
   * Handle Loading State
   */
  if (loading) {
    return (
      <Box sx={{ padding: 3, maxWidth: '600px', margin: '0 auto' }}>
        <Skeleton variant='rectangular' height={40} sx={{ mb: 2 }} />
        <Skeleton variant='rectangular' height={200} sx={{ mb: 2 }} />
        <Skeleton variant='rectangular' height={40} />
      </Box>
    );
  }

  /**
   * Handle Error State
   */
  if (error || !invoiceData) {
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
  if (!invoiceData) {
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
      sx={{ padding: isMobile ? 1 : 3, maxWidth: '600px', margin: '0 auto' }}
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
            {invoiceData?.invoice_number}
          </Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        {/* Order Details */}
        <Typography variant='body1' sx={{ mb: 1 }}>
          <strong>Customer Name:</strong> {invoiceData?.customer_name || 'N/A'}
        </Typography>
        <Typography variant='body1' sx={{ mb: 1 }}>
          <strong>Date:</strong>{' '}
          {new Date(invoiceData.date).toLocaleDateString()}
        </Typography>
        <Typography variant='body1' sx={{ mb: 1 }}>
          <strong>Due Date:</strong>{' '}
          {new Date(invoiceData.due_date).toLocaleDateString()}
        </Typography>
        <Typography variant='body1' sx={{ mb: 1 }}>
          <strong>Status:</strong>{' '}
          {invoiceData?.status.split('_').join(' ') || 'N/A'}
        </Typography>
        <Typography variant='body1' sx={{ mb: 1 }}>
          <strong>Amount:</strong> ₹{invoiceData?.total || '0'} {'\t'}
        </Typography>
        <Typography variant='body1' sx={{ mb: 2 }}>
          <strong>Balance:</strong> ₹{invoiceData?.balance || '0'} {'\t'}
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
            p: 0,
          }}
        >
          {invoiceData.line_items?.map((item: any, index: number) => (
            <ListItem key={index} sx={{ padding: '8px 0' }}>
              <ListItemText
                primary={
                  <Typography variant='body1'>
                    {item.name} (x{item.quantity})
                  </Typography>
                }
                secondary={
                  <Typography variant='body2' color='textSecondary'>
                    Price: ₹{item.rate}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
        {invoiceData.products?.length === 0 && (
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
            onClick={() => router.push('/orders/past/payment_due')}
          >
            Back to Payments Due
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default OrderDetails;
