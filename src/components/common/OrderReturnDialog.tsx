import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Dialog, useMediaQuery, useTheme } from '@mui/material';
import axios from 'axios';
import { toast } from 'react-toastify';
import ReturnOrderStepper from './ReturnOrderStepper';

/**
 * Return flow for a specific order (customer or salesperson).
 * The customer is fixed to the order's customer, only that order's products
 * can be returned, and a Zoho credit note is created on submit (the return
 * order itself stays in draft until admin approves it).
 */
const OrderReturnDialog = ({ open, onClose, order, onSaved }: any) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !order?.customer_id || customer) return;
    (async () => {
      try {
        setLoading(true);
        const resp = await axios.get(
          `${process.env.api_url}/customers/${order.customer_id}`
        );
        setCustomer(resp.data.customer || resp.data);
      } catch (err) {
        console.error('Error fetching customer for return:', err);
        toast.error('Failed to load customer details');
        onClose?.();
      } finally {
        setLoading(false);
      }
    })();
  }, [open, order?.customer_id]); // eslint-disable-line react-hooks/exhaustive-deps

  const orderProducts = (order?.products || [])
    .filter((p: any) => Number(p.quantity) > 0)
    .map((p: any) => ({
      _id: p.product_id,
      name: p.name,
      sku: p.product_code || p.sku,
      image_url: p.image_url,
      price: p.price,
      max_quantity: Number(p.quantity),
    }));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth='md'
      fullWidth
      sx={{ '& .MuiDialog-paper': { bgcolor: 'background.default' } }}
    >
      {loading || !customer ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <ReturnOrderStepper
          lockCustomer
          customer={customer}
          setCustomer={setCustomer}
          orderProducts={orderProducts}
          orderId={order._id}
          createCreditNote
          initialData={{ contactNo: customer.mobile || customer.phone || '' }}
          onClose={onClose}
          onSave={() => {
            onSaved?.();
            onClose?.();
          }}
        />
      )}
    </Dialog>
  );
};

export default OrderReturnDialog;
