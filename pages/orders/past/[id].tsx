import React, { useContext, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Button,
  Skeleton,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useRouter } from 'next/router';
import axios from 'axios';
import { AddToPhotos, AssignmentReturn, ContentCopy, Download, Edit } from '@mui/icons-material';
import AuthContext from '../../../src/components/Auth';
import { toast } from 'react-toastify';
import Header from '../../../src/components/common/Header';
import OrderReturnDialog from '../../../src/components/common/OrderReturnDialog';
import { parseMarginPct, getEffectiveMarginPct } from '../../../src/util/margin';

const STATUS_COLOR: Record<string, 'warning' | 'info' | 'success' | 'error' | 'default'> = {
  draft: 'warning',
  sent: 'info',
  accepted: 'success',
  invoiced: 'success',
  declined: 'error',
};

const AddressBlock = ({ label, addr }: { label: string; addr: any }) => {
  if (!addr) return null;
  const lines = [addr.attention, addr.address, addr.city, addr.state, addr.zip].filter(Boolean);
  return (
    <Box>
      <Typography variant='overline' fontWeight={700} color='text.secondary' sx={{ lineHeight: 1.4, fontSize: '0.7rem' }}>
        {label}
      </Typography>
      <Typography variant='body1' color='text.primary' sx={{ whiteSpace: 'pre-line', lineHeight: 1.75, mt: 0.25 }}>
        {lines.join('\n')}
      </Typography>
    </Box>
  );
};

const OrderDetails = () => {
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [eligibility, setEligibility] = useState<any>(null);
  const [returnOpen, setReturnOpen] = useState(false);
  const router = useRouter();
  const { id } = router.query;
  const { user }: any = useContext(AuthContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.api_url}/orders/${id}`);
      setOrderData(response.data);
    } catch (err) {
      setError('Failed to load order details. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      setInvoicesLoading(true);
      const resp = await axios.get(`${process.env.api_url}/orders/${id}/invoices`);
      setInvoices(resp.data || []);
    } catch (err) {
      console.error('Failed to fetch invoices', err);
    } finally {
      setInvoicesLoading(false);
    }
  };

  const handleCopyEstimate = () => {
    if (orderData?.estimate_number) {
      navigator.clipboard.writeText(orderData.estimate_number);
      toast.success('Copied to clipboard');
    }
  };

  const handleDownloadEstimate = async (order: any, type: 'stock' | 'pre_order' = 'stock') => {
    try {
      const apiUrl = type === 'pre_order'
        ? `${process.env.api_url}/orders/download_pdf/${order._id}?type=pre_order`
        : `${process.env.api_url}/orders/download_pdf/${order._id}`;
      const resp = await axios.get(apiUrl, { responseType: 'blob' });
      if (resp.data.type !== 'application/pdf') {
        toast.error('Estimate Not Created');
        return;
      }
      const contentDisposition = resp.headers['content-disposition'];
      let fileName = type === 'pre_order'
        ? `${order.pre_order_estimate_number}.pdf`
        : `${order.estimate_number}.pdf`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match?.[1]) fileName = match[1];
      }
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
      toast.error(error.message || 'Failed to download PDF');
    }
  };

  const handleDownloadInvoice = async (invoice: any) => {
    try {
      const resp = await axios.get(
        `${process.env.api_url}/invoices/download_pdf/zoho/${invoice.zoho_invoice_id}`,
        { responseType: 'blob' }
      );
      const blob = new Blob([resp.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${invoice.invoice_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error(error.message || 'Failed to download invoice PDF');
    }
  };

  const handleDuplicateOrder = async () => {
    try {
      const resp = await axios.post(`${process.env.api_url}/orders/duplicate_order`, {
        order_id: id,
      });
      router.push(`/orders/new/${resp.data}`);
    } catch (error) {
      console.error('Error duplicating order:', error);
      toast.error('Failed to duplicate order');
    }
  };

  useEffect(() => {
    if (id) fetchOrderDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Returns need the order to be invoiced and its shipment created — ask the
  // backend, which also reports an already-existing return for this order.
  const fetchEligibility = async () => {
    try {
      const resp = await axios.get(`${process.env.api_url}/orders/${id}/return_eligibility`);
      setEligibility(resp.data);
    } catch (err) {
      console.error('Failed to check return eligibility', err);
    }
  };

  useEffect(() => {
    if (id && orderData?.status?.toLowerCase() === 'invoiced') {
      fetchInvoices();
      fetchEligibility();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, orderData?.status]);

  if (loading) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', px: { xs: 2, sm: 3 }, py: 3 }}>
        <Skeleton variant='rectangular' height={48} sx={{ mb: 2, borderRadius: 1 }} />
        <Skeleton variant='rectangular' height={220} sx={{ mb: 2, borderRadius: 2 }} />
        <Skeleton variant='rectangular' height={180} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  if (error || !orderData) {
    return (
      <Box sx={{ px: 3, py: 6, textAlign: 'center' }}>
        <Typography variant='h6' color='error' gutterBottom>
          {error || 'No order details available.'}
        </Typography>
        <Button variant='contained' color='primary' onClick={() => router.push('/orders/past')}>
          Back to Orders
        </Button>
      </Box>
    );
  }

  const statusKey = orderData.status?.toLowerCase() ?? '';
  const statusColor = STATUS_COLOR[statusKey] ?? 'default';
  // Payment (Razorpay) info stored on the order once the customer pays online.
  const payment = orderData.payment || null;
  const isPaid = (payment?.status || '').toLowerCase() === 'paid';
  // A paid order is locked — it can no longer be edited.
  const isEditable = !['declined', 'accepted', 'invoiced'].includes(statusKey) && !isPaid;
  const title = orderData.estimate_created
    ? orderData.estimate_number
    : `Order #${orderData._id.slice(-6)}`;

  const estimateCreated = Boolean(
    orderData.estimate_created || orderData.pre_order_estimate_created
  );

  // Margin shown per item:
  //  • If an estimate exists, show the live per-line discount embedded from the
  //    Zoho estimate (`estimate_margin`). That value already bakes in any
  //    clearance bonus, so it's used as-is.
  //  • Otherwise derive it from the customer's special margin for that product
  //    (then their default margin) and add the clearance bonus on top.
  const getItemMarginPct = (item: any): number => {
    const pid = item.product_id;
    const special = orderData.special_margins?.[pid];
    if (estimateCreated && item.estimate_margin != null && item.estimate_margin !== '') {
      return parseMarginPct(item.estimate_margin);
    }
    const base = special || orderData.customer_margin || item.margin || '40%';
    return getEffectiveMarginPct(base, item);
  };

  return (
    <Box
      sx={{
        maxWidth: { xs: '100%', sm: 720, md: 860 },
        mx: 'auto',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 2, sm: 3 },
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Header title='Order Details' showBackButton useBack />

      {/* Main card */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        {/* Header strip */}
        <Box
          sx={{
            px: { xs: 2, sm: 3 },
            pt: { xs: 2, sm: 2.5 },
            pb: { xs: 1.5, sm: 2 },
            bgcolor: 'background.default',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          {/* Title row */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
              <Typography variant='h5' fontWeight={700} color='text.primary' sx={{ lineHeight: 1.2 }}>
                {title}
              </Typography>
              {orderData.estimate_created && (
                <Tooltip title='Copy estimate number'>
                  <IconButton size='small' onClick={handleCopyEstimate}>
                    <ContentCopy fontSize='small' />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>

          {/* Chips */}
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1.5 }}>
            <Chip
              label={statusKey.charAt(0).toUpperCase() + statusKey.slice(1)}
              color={statusColor}
              size='small'
              sx={{ fontWeight: 700 }}
            />
            {orderData.estimate_created && (
              <Chip label='Estimate Created' color='success' size='small' variant='outlined' />
            )}
            {orderData.spreadsheet_created && (
              <Chip label='XLSX Created' color='primary' size='small' variant='outlined' />
            )}
          </Box>

          {/* Action buttons — labeled on mobile, icon-only on desktop */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              size='small'
              variant='outlined'
              startIcon={<AddToPhotos fontSize='small' />}
              onClick={handleDuplicateOrder}
              sx={{ borderRadius: 2 }}
            >
              Duplicate Order
            </Button>
            {!isPaid && (
              <Button
                size='small'
                variant='outlined'
                color='primary'
                startIcon={<Edit fontSize='small' />}
                disabled={!isEditable}
                onClick={() => router.push(`/orders/new/${orderData._id || id}`)}
                sx={{ borderRadius: 2 }}
              >
                Edit
              </Button>
            )}
            {orderData.estimate_created && (
              <Button
                size='small'
                variant='outlined'
                startIcon={<Download fontSize='small' />}
                onClick={() => handleDownloadEstimate(orderData, 'stock')}
                sx={{ borderRadius: 2 }}
              >
                Download PDF
              </Button>
            )}
            {orderData.pre_order_estimate_created && (
              <Button
                size='small'
                variant='outlined'
                color='warning'
                startIcon={<Download fontSize='small' />}
                onClick={() => handleDownloadEstimate(orderData, 'pre_order')}
                sx={{ borderRadius: 2 }}
              >
                Download Pre-Order PDF
              </Button>
            )}
            {statusKey === 'invoiced' && invoices.map((inv: any) => (
              <Button
                key={inv._id}
                size='small'
                variant='outlined'
                color='success'
                startIcon={<Download fontSize='small' />}
                onClick={() => handleDownloadInvoice(inv)}
                sx={{ borderRadius: 2 }}
              >
                Download Invoice
              </Button>
            ))}
            {eligibility?.eligible && (
              <Button
                size='small'
                variant='contained'
                color='success'
                startIcon={<AssignmentReturn fontSize='small' />}
                onClick={() => setReturnOpen(true)}
                sx={{ borderRadius: 2 }}
              >
                Return Order
              </Button>
            )}
            {eligibility?.existing_return_order && (
              <Chip
                icon={<AssignmentReturn />}
                label={`Return ${eligibility.existing_return_order.status}`}
                color='success'
                variant='outlined'
                size='small'
                sx={{ fontWeight: 600, textTransform: 'capitalize', alignSelf: 'center' }}
              />
            )}
          </Box>
        </Box>

        {/* Order info */}
        <Box sx={{ px: { xs: 2, sm: 3 }, py: 2.5 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Box>
              <Typography variant='overline' color='text.secondary' fontWeight={700} sx={{ lineHeight: 1.4, fontSize: '0.7rem' }}>
                Date
              </Typography>
              <Typography variant='body1' fontWeight={500}>
                {orderData.created_at
                  ? new Date(orderData.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'N/A'}
              </Typography>
            </Box>
            <Box>
              <Typography variant='overline' color='text.secondary' fontWeight={700} sx={{ lineHeight: 1.4, fontSize: '0.7rem' }}>
                Customer
              </Typography>
              <Typography variant='body1' fontWeight={500}>{orderData.customer_name || 'N/A'}</Typography>
            </Box>
            <Box>
              <Typography variant='overline' color='text.secondary' fontWeight={700} sx={{ lineHeight: 1.4, fontSize: '0.7rem' }}>
                Amount
              </Typography>
              <Typography variant='body1' fontWeight={700} color='text.primary'>
                ₹{(orderData.total_amount ?? 0).toLocaleString('en-IN')}
              </Typography>
            </Box>
            <Box>
              <Typography variant='overline' color='text.secondary' fontWeight={700} sx={{ lineHeight: 1.4, fontSize: '0.7rem' }}>
                GST ({orderData.gst_type})
              </Typography>
              <Typography variant='body1' fontWeight={500}>
                ₹{(orderData.total_gst ?? 0).toLocaleString('en-IN')}
              </Typography>
            </Box>
            {payment && (
              <Box sx={{ gridColumn: 'span 2' }}>
                <Typography variant='overline' color='text.secondary' fontWeight={700} sx={{ lineHeight: 1.4, fontSize: '0.7rem' }}>
                  Payment
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', mt: 0.25 }}>
                  <Chip
                    label={isPaid ? 'Paid' : (payment.status || 'Pending').charAt(0).toUpperCase() + (payment.status || 'pending').slice(1)}
                    color={isPaid ? 'success' : payment.status === 'failed' ? 'error' : 'warning'}
                    size='small'
                    sx={{ fontWeight: 700 }}
                  />
                  {payment.amount != null && (
                    <Typography variant='body1' fontWeight={600} color='text.primary'>
                      ₹{(payment.amount / 100).toLocaleString('en-IN')}
                    </Typography>
                  )}
                  {payment.provider && (
                    <Typography variant='body2' color='text.secondary' sx={{ textTransform: 'capitalize' }}>
                      via {payment.provider}
                    </Typography>
                  )}
                </Box>
                {payment.razorpay_payment_id && (
                  <Typography variant='body2' color='text.secondary' sx={{ mt: 0.25 }}>
                    Payment ID: {payment.razorpay_payment_id}
                  </Typography>
                )}
                {payment.updated_at && (
                  <Typography variant='body2' color='text.secondary'>
                    {isPaid ? 'Paid on ' : 'Updated '}
                    {new Date(payment.updated_at).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Typography>
                )}
              </Box>
            )}
            {orderData.estimate_created && (
              <Box sx={{ gridColumn: 'span 2' }}>
                <Typography variant='overline' color='text.secondary' fontWeight={700} sx={{ lineHeight: 1.4, fontSize: '0.7rem' }}>
                  Estimate Number
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                  <Typography variant='body1' fontWeight={500}>{orderData.estimate_number || 'N/A'}</Typography>
                  {orderData.estimate_url && (
                    <Typography
                      component='a'
                      href={orderData.estimate_url}
                      target='_blank'
                      rel='noopener noreferrer'
                      variant='body2'
                      sx={{ color: 'primary.main', textDecoration: 'none' }}
                    >
                      View ↗
                    </Typography>
                  )}
                </Box>
              </Box>
            )}
            {orderData.pre_order_estimate_created && (
              <Box sx={{ gridColumn: 'span 2' }}>
                <Typography variant='overline' color='text.secondary' fontWeight={700} sx={{ lineHeight: 1.4, fontSize: '0.7rem' }}>
                  Pre-Order Estimate Number
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                  <Typography variant='body1' fontWeight={500}>{orderData.pre_order_estimate_number || 'N/A'}</Typography>
                  {orderData.pre_order_estimate_url && (
                    <Typography
                      component='a'
                      href={orderData.pre_order_estimate_url}
                      target='_blank'
                      rel='noopener noreferrer'
                      variant='body2'
                      sx={{ color: 'warning.main', textDecoration: 'none' }}
                    >
                      View ↗
                    </Typography>
                  )}
                </Box>
              </Box>
            )}
            {orderData.spreadsheet_created && (
              <Box sx={{ gridColumn: 'span 2' }}>
                <Typography variant='overline' color='text.secondary' fontWeight={700} sx={{ lineHeight: 1.4, fontSize: '0.7rem' }}>
                  Spreadsheet
                </Typography>
                <Typography
                  component='a'
                  href={orderData.spreadsheet_url}
                  target='_blank'
                  rel='noopener noreferrer'
                  variant='body1'
                  sx={{ display: 'block', color: 'primary.main', textDecoration: 'none' }}
                >
                  Open Spreadsheet ↗
                </Typography>
              </Box>
            )}
            {statusKey === 'invoiced' && (invoicesLoading || invoices.length > 0) && (
              <Box sx={{ gridColumn: 'span 2' }}>
                <Typography variant='overline' color='text.secondary' fontWeight={700} sx={{ lineHeight: 1.4, fontSize: '0.7rem' }}>
                  Invoices
                </Typography>
                {invoicesLoading ? (
                  <Typography variant='body2' color='text.secondary'>Loading…</Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.25 }}>
                    {invoices.map((inv: any) => (
                      <Box key={inv.zoho_invoice_id} sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        {inv.invoice_number && inv.invoice_number !== inv.zoho_invoice_id && (
                          <Typography variant='body1' fontWeight={500}>{inv.invoice_number}</Typography>
                        )}
                        {inv.invoice_url && (
                          <Typography
                            component='a'
                            href={inv.invoice_url}
                            target='_blank'
                            rel='noopener noreferrer'
                            variant='body2'
                            sx={{ color: 'primary.main', textDecoration: 'none' }}
                          >
                            View ↗
                          </Typography>
                        )}
                        <Typography
                          component='span'
                          variant='body2'
                          sx={{ color: 'success.main', cursor: 'pointer', textDecoration: 'underline' }}
                          onClick={() => handleDownloadInvoice(inv)}
                        >
                          Download PDF
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Box>

        <Divider />

        {/* Addresses */}
        <Box sx={{ px: { xs: 2, sm: 3 }, py: 2.5 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
            <AddressBlock label='Shipping Address' addr={orderData.shipping_address} />
            <AddressBlock label='Billing Address' addr={orderData.billing_address} />
          </Box>
        </Box>

        <Divider />

        {/* Products */}
        <Box sx={{ px: { xs: 2, sm: 3 }, py: 2.5 }}>
          <Typography variant='h6' fontWeight={700} gutterBottom>
            Ordered Items
            {estimateCreated && (
              <Typography
                component='span'
                variant='body2'
                color='text.secondary'
                sx={{ fontWeight: 500, ml: 1 }}
              >
                (margins from estimate)
              </Typography>
            )}
          </Typography>
          {(orderData.products?.filter(
            (p: any) => Number(p.quantity) > 0
          ).length ?? 0) === 0 ? (
            <Typography variant='body1' color='text.secondary'>
              No products found in this order.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {/* Column headers */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr auto' : '1fr auto auto',
                  gap: 1,
                  px: 1,
                  py: 1,
                  bgcolor: 'action.hover',
                  borderRadius: 1,
                  mb: 0.5,
                }}
              >
                <Typography variant='overline' color='text.secondary' fontWeight={700} sx={{ fontSize: '0.7rem' }}>
                  Item
                </Typography>
                {!isMobile && (
                  <Typography
                    variant='overline'
                    color='text.secondary'
                    fontWeight={700}
                    sx={{ textAlign: 'right', minWidth: 80, fontSize: '0.7rem' }}
                  >
                    Unit Price
                  </Typography>
                )}
                <Typography
                  variant='overline'
                  color='text.secondary'
                  fontWeight={700}
                  sx={{ textAlign: 'right', minWidth: 80, fontSize: '0.7rem' }}
                >
                  Subtotal
                </Typography>
              </Box>
              {orderData.products
                ?.filter((item: any) => Number(item.quantity) > 0)
                .map((item: any, index: number, arr: any[]) => {
                const subtotal = (item.price ?? 0) * (item.quantity ?? 1);
                return (
                  <Box
                    key={index}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr auto' : '1fr auto auto',
                      gap: 1,
                      px: 1,
                      py: { xs: 1.5, sm: 1.25 },
                      borderBottom: index < arr.length - 1 ? '1px solid' : 'none',
                      borderColor: 'divider',
                      alignItems: 'center',
                    }}
                  >
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                        <Typography variant='body1' fontWeight={500} color='text.primary'>
                          {item.name}
                        </Typography>
                        {item.pre_order && (
                          <Chip
                            label='Pre-Order'
                            color='warning'
                            size='small'
                            variant='outlined'
                            sx={{ fontWeight: 600, height: 20, fontSize: '0.65rem' }}
                          />
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', mt: 0.25 }}>
                        <Typography variant='body2' color='text.secondary'>
                          Qty: {item.quantity}
                          {isMobile && ` × ₹${(item.price ?? 0).toLocaleString('en-IN')}`}
                        </Typography>
                        <Chip
                          label={`${getItemMarginPct(item)}% margin`}
                          size='small'
                          color='success'
                          sx={{ fontWeight: 700, height: 20, fontSize: '0.65rem' }}
                        />
                      </Box>
                    </Box>
                    {!isMobile && (
                      <Typography
                        variant='body1'
                        color='text.secondary'
                        sx={{ textAlign: 'right', minWidth: 80 }}
                      >
                        ₹{(item.price ?? 0).toLocaleString('en-IN')}
                      </Typography>
                    )}
                    <Typography
                      variant='body1'
                      fontWeight={600}
                      color='text.primary'
                      sx={{ textAlign: 'right', minWidth: 80 }}
                    >
                      ₹{subtotal.toLocaleString('en-IN')}
                    </Typography>
                  </Box>
                );
              })}
              {/* Total row */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 2,
                  px: 1,
                  pt: 1.5,
                  mt: 0.5,
                  borderTop: '2px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant='subtitle2' color='text.secondary'>
                  Total
                </Typography>
                <Typography variant='subtitle2' fontWeight={700} color='text.primary'>
                  ₹{(orderData.total_amount ?? 0).toLocaleString('en-IN')}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Back button */}
      <Box sx={{ display: 'flex', justifyContent: 'center', pb: 2 }}>
        <Button variant='outlined' color='primary' onClick={() => router.push('/orders/past')}>
          Back to Orders
        </Button>
      </Box>

      {/* Return order flow for this order */}
      <OrderReturnDialog
        open={returnOpen}
        onClose={() => setReturnOpen(false)}
        order={orderData}
        onSaved={() => fetchEligibility()}
      />
    </Box>
  );
};

export default OrderDetails;
