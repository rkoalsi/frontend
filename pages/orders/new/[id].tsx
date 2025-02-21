// pages/orders/new/[id].tsx
import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import {
  Box,
  Button,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Paper,
  Card,
  CardContent,
  useMediaQuery,
  Snackbar,
  Alert,
  IconButton,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CustomerSearchBar from '../../../src/components/OrderForm/CustomerSearchBar';
import Address from '../../../src/components/OrderForm/SelectAddress';
import Products from '../../../src/components/OrderForm/Products';
import Review from '../../../src/components/OrderForm/Review';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ContentCopy } from '@mui/icons-material';
import useDebounce from '../../../src/util/useDebounce';

// Create an Axios instance
const api = axios.create({
  baseURL: process.env.api_url,
});

// Helper to update order data
const updateOrderData = async (id: string, data: any) => {
  try {
    await api.put(`/orders/${id}`, data);
  } catch (error) {
    console.error('Error updating order:', error);
  }
};

interface StepContent {
  name: string;
  component: React.ReactNode;
}

const NewOrder: React.FC = () => {
  const router = useRouter();
  const { id, shared } = router.query;
  const isShared = shared === 'true';

  // States
  const [customer, setCustomer] = useState<any>(null);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [loading, setLoading] = useState<boolean>(false);
  const [order, setOrder] = useState<any>(null);
  const [billingAddress, setBillingAddress] = useState<any>(null);
  const [shippingAddress, setShippingAddress] = useState<any>(null);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [activeStep, setActiveStep] = useState<number>(isShared ? 3 : 0);
  const [open, setOpen] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);
  const [sharedLink, setSharedLink] = useState<string>('');
  const [linkCopied, setLinkCopied] = useState<boolean>(false);
  const [specialMargins, setSpecialMargins] = useState<{
    [key: string]: string;
  }>({});

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // ------------------ Fetch Special Margins -------------------------
  useEffect(() => {
    if (!customer?._id) return;
    const controller = new AbortController();

    const fetchSpecialMargins = async () => {
      try {
        const res = await api.get(
          `/customers/special_margins/${customer._id}`,
          {
            signal: controller.signal,
          }
        );
        const marginMap = (res.data.products || []).reduce(
          (acc: any, item: any) => {
            acc[item.product_id] = item.margin;
            return acc;
          },
          {}
        );
        setSpecialMargins(marginMap);
      } catch (error: any) {
        if (error.name !== 'CanceledError') {
          console.error('Error fetching special margins:', error);
        }
      }
    };

    fetchSpecialMargins();

    return () => {
      controller.abort();
    };
  }, [customer]);

  // ------------------ Calculate Totals ---------------------
  const totals = useMemo(() => {
    const { totalGST, totalAmount } = selectedProducts.reduce(
      (acc: { totalGST: number; totalAmount: number }, product) => {
        const taxPercentage =
          product?.item_tax_preferences?.[0]?.tax_percentage || 0;
        const rate = parseFloat(product.rate.toString()) || 0;
        const quantity = parseInt(product.quantity?.toString() || '1', 10) || 1;
        // Use special margin if available; fallback to customer's margin (default 40%)
        const margin = specialMargins[product._id]
          ? parseInt(specialMargins[product._id].replace('%', ''), 10) / 100
          : parseInt(customer?.cf_margin?.replace('%', '') || '40', 10) / 100;
        const sellingPrice = rate - rate * margin;
        let gstAmount = 0;
        let total = 0;
        if (customer?.cf_in_ex === 'Inclusive') {
          const basePrice = sellingPrice / (1 + taxPercentage / 100);
          gstAmount = (sellingPrice - basePrice) * quantity;
          total = sellingPrice * quantity;
        } else {
          gstAmount = sellingPrice * (taxPercentage / 100) * quantity;
          total =
            (sellingPrice + sellingPrice * (taxPercentage / 100)) * quantity;
        }
        acc.totalGST += gstAmount;
        acc.totalAmount += total;
        return acc;
      },
      { totalGST: 0, totalAmount: 0 }
    );
    return {
      totalGST: Math.round(totalGST * 100) / 100,
      totalAmount:
        totalAmount % 1 >= 0.5
          ? Math.ceil(totalAmount)
          : Math.floor(totalAmount),
    };
  }, [selectedProducts, customer, specialMargins]);

  // ------------------ Debounced Order Updates ---------------------
  const debouncedData = useDebounce({ selectedProducts, totals }, 500);

  useEffect(() => {
    if (
      debouncedData.selectedProducts.length > 0 ||
      debouncedData.totals.totalAmount > 0
    ) {
      updateOrderData(id as string, {
        products: debouncedData.selectedProducts,
        total_gst: parseFloat(debouncedData.totals.totalGST.toFixed(2)),
        total_amount: parseFloat(debouncedData.totals.totalAmount.toFixed(2)),
      });
    }
  }, [debouncedData, id]);

  // ------------------ Update Addresses ---------------------
  useEffect(() => {
    if (billingAddress || shippingAddress) {
      updateOrderData(id as string, {
        billing_address: billingAddress,
        shipping_address: shippingAddress,
      });
    }
  }, [billingAddress, shippingAddress, id]);

  // ------------------ Validate and Collect Data per Step ---------------------
  const validateAndCollectData = useCallback(
    (step: number) => {
      let message = '';
      let body: any = {};

      switch (step) {
        case 0:
          if (!customer) {
            message = 'Customer is missing.\nPlease select a customer.';
          } else {
            body = { customer_id: customer?._id };
          }
          if (referenceNumber !== '') {
            body['reference_number'] = referenceNumber;
          }
          break;
        case 1:
          if (!billingAddress) {
            message =
              'Billing address is missing.\nPlease select or add a billing address.';
          } else {
            body = { billing_address: billingAddress };
          }
          break;
        case 2:
          if (!shippingAddress) {
            message =
              'Shipping address is missing.\nPlease select or add a shipping address.';
          } else {
            body = { shipping_address: shippingAddress };
          }
          break;
        case 3:
          if (selectedProducts.length === 0) {
            message = 'Cannot proceed as no products are selected.';
          }
          break;
        default:
          break;
      }
      return { message, body };
    },
    [
      customer,
      billingAddress,
      shippingAddress,
      selectedProducts,
      referenceNumber,
    ]
  );

  // ------------------ Get Order Data ---------------------
  const customerRef = useRef<any>(null);
  const getOrder = useCallback(async () => {
    try {
      const resp = await api.get(`/orders/${id}`);
      if (
        resp.data.customer_id &&
        customerRef.current !== resp.data.customer_id
      ) {
        customerRef.current = resp.data.customer_id;
        const customerResponse = await api.get(
          `/customers/${resp.data.customer_id}`
        );
        setCustomer(customerResponse.data.customer);
        setReferenceNumber(resp.data?.reference_number);
      }
      if (resp.data.billing_address)
        setBillingAddress(resp.data.billing_address);
      if (resp.data.shipping_address)
        setShippingAddress(resp.data.shipping_address);
      if (resp.data.products && resp.data.products.length > 0) {
        const detailedProducts = await Promise.all(
          resp.data.products.map(async (product: any) => {
            try {
              const res = await api.get(`/products/${product.product_id}`);
              return { ...product, ...res.data };
            } catch (error) {
              console.error(
                `Failed to fetch product ${product.product_id}`,
                error
              );
              return product;
            }
          })
        );
        setSelectedProducts(detailedProducts);
      }
      setOrder(resp.data);
    } catch (error) {
      console.error('Error fetching order:', error);
    }
  }, [id]);

  useEffect(() => {
    if (id) getOrder();
  }, [id, getOrder]);

  // ------------------ Navigation & Finalization ---------------------
  const handleNext = useCallback(async () => {
    const { message, body } = validateAndCollectData(activeStep);
    if (message) {
      setError({ message, status: 'error' });
      setOpen(true);
      return;
    }
    await updateOrderData(id as string, body);
    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  }, [activeStep, id, validateAndCollectData]);

  const handleEnd = useCallback(
    async (status = 'draft', notify_sp = false) => {
      setLoading(true);
      try {
        const resp = await api.post('/orders/finalise', {
          order_id: id,
          status,
        });
        if (resp.status === 200) {
          await getOrder();
          toast[resp.data.status === 'success' ? 'success' : 'error'](
            resp.data.message
          );
        }
        if (notify_sp) {
          await api.post('/orders/notify', { order_id: id });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    },
    [id, getOrder]
  );

  const generateSharedLink = useCallback(() => {
    const baseURL = window.location.origin;
    const link = `${baseURL}/orders/new/${id}?shared=true`;
    setSharedLink(link);
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
  }, [id]);

  const handleStepClick = useCallback(
    async (index: number) => {
      if (isShared) {
        if (index < 3 || index > 4) {
          setError({
            message: 'You can only navigate between Products and Review steps.',
            status: 'error',
          });
          setOpen(true);
          return;
        }
        if (index === 3 && selectedProducts.length === 0) {
          setError({
            message: 'Cannot proceed as no products are selected.',
            status: 'error',
          });
          setOpen(true);
          return;
        }
        setActiveStep(index);
        return;
      }

      if (index < activeStep) {
        setActiveStep(index);
        return;
      }

      const { message, body } = validateAndCollectData(activeStep);
      if (message) {
        toast.error(message);
        return;
      }

      try {
        await updateOrderData(id as string, body);
        setActiveStep(index);
      } catch (error) {
        console.error('Error updating order:', error);
        toast.error('Failed to update order. Please try again.');
      }
    },
    [activeStep, isShared, selectedProducts, validateAndCollectData, id]
  );

  const handleClose = useCallback((reason: any) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  }, []);

  useEffect(() => {
    if (isShared && order) {
      const status =
        typeof order.status === 'string'
          ? order.status.trim().toLowerCase()
          : '';
      if (!['draft', 'sent'].includes(status)) {
        toast.error(`You cannot view this order as its status is not draft`, {
          autoClose: 5000,
        });
        router.push('/login');
      }
    }
  }, [order, isShared, router]);

  // ------------------ Steps Configuration ---------------------
  const steps: StepContent[] = useMemo(() => {
    return [
      {
        name: 'Select Customer',
        component: isShared ? null : (
          <CustomerSearchBar
            disabled={['declined', 'accepted'].includes(
              order?.status?.toLowerCase()
            )}
            label='Select Customer'
            onChange={async (value: any) => {
              setCustomer(value);
              if (value?.addresses && value.addresses.length > 0) {
                const defaultAddress = value.addresses[0];
                setBillingAddress(defaultAddress);
                setShippingAddress(defaultAddress);
                await updateOrderData(id as string, {
                  customer_id: value._id,
                  billing_address: defaultAddress,
                  shipping_address: defaultAddress,
                });
              } else {
                setBillingAddress(null);
                setShippingAddress(null);
                await updateOrderData(id as string, {
                  customer_id: value?._id,
                });
              }
            }}
            value={customer}
            initialValue={customer}
            onChangeReference={(e: React.ChangeEvent<HTMLInputElement>) => {
              setReferenceNumber(e.target.value);
            }}
            reference={referenceNumber}
          />
        ),
      },
      {
        name: 'Billing Address',
        component: isShared ? null : (
          <Address
            type='Billing'
            id={id as string}
            address={billingAddress}
            setAddress={setBillingAddress}
            selectedAddress={billingAddress}
            customer={customer}
            setLoading={setLoading}
          />
        ),
      },
      {
        name: 'Shipping Address',
        component: isShared ? null : (
          <Address
            type='Shipping'
            id={id as string}
            address={shippingAddress}
            setAddress={setShippingAddress}
            selectedAddress={shippingAddress}
            customer={customer}
            setLoading={setLoading}
          />
        ),
      },
      {
        name: 'Products',
        component: (
          <Products
            totals={totals}
            label='Search Products'
            customer={customer}
            selectedProducts={selectedProducts}
            setSelectedProducts={setSelectedProducts}
            specialMargins={specialMargins}
            order={order}
            onCheckout={() => setActiveStep((prev) => prev + 1)}
          />
        ),
      },
      {
        name: 'Review',
        component: (
          <Review
            totals={totals}
            customer={customer}
            products={selectedProducts}
            shippingAddress={shippingAddress}
            billingAddress={billingAddress}
            setSelectedProducts={setSelectedProducts}
            setActiveStep={setActiveStep}
            specialMargins={specialMargins}
            isShared={isShared}
            order={order}
            referenceNumber={referenceNumber}
          />
        ),
      },
    ];
  }, [
    isShared,
    customer,
    billingAddress,
    shippingAddress,
    totals,
    selectedProducts,
    specialMargins,
    order,
    id,
    referenceNumber,
  ]);

  const handleCopyEstimate = () => {
    if (order?.estimate_number) {
      navigator.clipboard.writeText(order.estimate_number);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'draft':
        return '#FFA500';
      case 'accepted':
        return '#2ecc71';
      case 'declined':
        return '#e74c3c';
      default:
        return 'black';
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: isMobile ? '0px' : '8px',
      }}
    >
      {/* Header */}
      <Paper
        elevation={3}
        sx={{
          width: 'max-content',
          maxWidth: isMobile ? '400px' : '100%',
          padding: '16px',
          marginTop: '16px',
          marginBottom: isMobile ? '16px' : '24px',
          textAlign: 'center',
          borderRadius: '8px',
          alignSelf: 'center',
        }}
      >
        <Box
          display='flex'
          flexDirection='column'
          alignItems='center'
          gap='8px'
        >
          <Typography
            variant={isMobile ? 'h5' : 'h4'}
            fontWeight='bold'
            color='black'
          >
            {order?.estimate_created ? 'Update ' : 'Create '}
            {order?.estimate_created ? 'Existing ' : 'New '}Order
          </Typography>
          <Box display='flex' alignItems='center' justifyContent='center'>
            <Typography
              variant={isMobile ? 'h6' : 'h5'}
              fontWeight='bold'
              color='black'
            >
              Order Status:
            </Typography>
            <Typography
              variant={isMobile ? 'h6' : 'h5'}
              fontWeight='bold'
              sx={{ ml: 1 }}
              color={getStatusColor(order?.status)}
            >
              {order?.status}
            </Typography>
          </Box>
          {order?.estimate_created ? (
            <Box display='flex' alignItems='center' justifyContent='center'>
              <Typography
                variant={isMobile ? 'body1' : 'h5'}
                fontWeight='bold'
                color='black'
              >
                Estimate Number: {order?.estimate_number}
              </Typography>
              <IconButton
                size='small'
                onClick={handleCopyEstimate}
                sx={{ ml: 1 }}
              >
                <ContentCopy fontSize='small' />
              </IconButton>
            </Box>
          ) : (
            <Typography variant='body1' fontWeight='bold' color='black'>
              Complete each step to finalize your order.
            </Typography>
          )}
        </Box>
      </Paper>

      {/* Main content */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          width: '100%',
          maxWidth: isMobile ? '400px' : '1400px',
          alignSelf: 'center',
        }}
      >
        <Card
          sx={{
            width: '100%',
            maxWidth: isMobile ? '400px' : undefined,
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
        >
          <CardContent sx={{ padding: isMobile ? '12px' : '24px' }}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((step, index) => (
                <Step key={index} onClick={() => handleStepClick(index)}>
                  <StepLabel>{step.name}</StepLabel>
                </Step>
              ))}
            </Stepper>
            <Box sx={{ padding: '24px', minHeight: '100px' }}>
              {steps[activeStep]?.component}
            </Box>
            <Box
              sx={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: isMobile ? 'center' : 'space-between',
                alignItems: isMobile ? 'stretch' : 'center',
                marginTop: '24px',
                paddingTop: '16px',
                borderTop: '1px solid #e0e0e0',
                gap: 2,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: 2,
                  width: isMobile ? '100%' : 'auto',
                }}
              >
                <Button
                  variant='outlined'
                  color='secondary'
                  onClick={() => {
                    activeStep === 0
                      ? router.push('/')
                      : handleStepClick(activeStep - 1);
                  }}
                  disabled={isShared && activeStep === 3}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 'bold',
                    borderRadius: '24px',
                    width: isMobile ? '100%' : 'auto',
                  }}
                >
                  {activeStep === 0 ? 'Cancel' : 'Previous'}
                </Button>
                {!isShared && customer && billingAddress && shippingAddress && (
                  <Button
                    variant='outlined'
                    color='info'
                    onClick={generateSharedLink}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 'bold',
                      borderRadius: '24px',
                      width: isMobile ? '100%' : 'auto',
                    }}
                  >
                    Generate Shared Link
                  </Button>
                )}
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: 2,
                  width: isMobile ? '100%' : 'auto',
                }}
              >
                {activeStep === steps.length - 1 && (
                  <Button
                    variant='contained'
                    color='secondary'
                    onClick={() =>
                      isShared ? handleEnd('draft', true) : handleEnd()
                    }
                    disabled={
                      !customer ||
                      !billingAddress ||
                      !shippingAddress ||
                      selectedProducts.length === 0 ||
                      !totals.totalAmount ||
                      loading ||
                      (!isShared &&
                        !['deleted', 'draft', 'sent'].includes(
                          order?.status?.toLowerCase()
                        ))
                    }
                    sx={{
                      textTransform: 'none',
                      fontWeight: 'bold',
                      borderRadius: '24px',
                      width: isMobile ? '100%' : 'auto',
                    }}
                  >
                    Save As Draft
                  </Button>
                )}
                {activeStep === steps.length - 1 && !isShared && (
                  <Button
                    variant='contained'
                    color='error'
                    onClick={() => handleEnd('declined')}
                    disabled={
                      !customer ||
                      !billingAddress ||
                      !shippingAddress ||
                      selectedProducts.length === 0 ||
                      !totals.totalAmount ||
                      loading ||
                      !['draft', 'sent'].includes(order?.status?.toLowerCase())
                    }
                    sx={{
                      textTransform: 'none',
                      fontWeight: 'bold',
                      borderRadius: '24px',
                      width: isMobile ? '100%' : 'auto',
                    }}
                  >
                    Decline
                  </Button>
                )}
                {activeStep === steps.length - 1 && !isShared ? (
                  <Button
                    variant='contained'
                    color='primary'
                    onClick={() => handleEnd('accepted')}
                    disabled={
                      !customer ||
                      !billingAddress ||
                      !shippingAddress ||
                      selectedProducts.length === 0 ||
                      !totals.totalAmount ||
                      loading ||
                      !['draft', 'sent'].includes(order?.status?.toLowerCase())
                    }
                    sx={{
                      textTransform: 'none',
                      fontWeight: 'bold',
                      borderRadius: '24px',
                      width: isMobile ? '100%' : 'auto',
                    }}
                  >
                    Accept
                  </Button>
                ) : activeStep < steps.length - 1 ? (
                  <Button
                    variant='contained'
                    color='primary'
                    onClick={handleNext}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 'bold',
                      borderRadius: '24px',
                      width: isMobile ? '100%' : 'auto',
                    }}
                  >
                    Next
                  </Button>
                ) : null}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Snackbar
        open={linkCopied}
        autoHideDuration={3000}
        onClose={() => setLinkCopied(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setLinkCopied(false)} severity='success'>
          Link copied to clipboard!
        </Alert>
      </Snackbar>

      {error && (
        <Snackbar
          open={open}
          autoHideDuration={6000}
          onClose={handleClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            onClose={handleClose}
            severity={error.status}
            sx={{ width: '100%' }}
          >
            {error.message}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
};

export default NewOrder;
