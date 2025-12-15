// pages/orders/new/[id].tsx
import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
  useContext,
  lazy,
  Suspense,
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
  CircularProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CustomerSearchBar from '../../../src/components/OrderForm/CustomerSearchBar';
import Address from '../../../src/components/OrderForm/SelectAddress';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ContentCopy } from '@mui/icons-material';
import useDebounce from '../../../src/util/useDebounce';
import AuthContext from '../../../src/components/Auth';
import SheetsDisplay from '../../../src/components/OrderForm/SheetDisplay';

// Lazy load heavy components
const Products = lazy(() =>
  import('../../../src/components/OrderForm/Products').then(module => ({ default: module.default }))
);
const Review = lazy(() =>
  import('../../../src/components/OrderForm/Review').then(module => ({ default: module.default }))
);

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
  const { user }: any = useContext(AuthContext);
  const isAdmin = user?.data?.role.includes('admin');
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
  const [sort, setSort] = useState<string>('default');
  const [link, setLink] = useState(
    order?.spreadsheet_created ? order?.spreadsheet_url : ''
  );
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
        console.log('Special margins API response:', res.data);
        const marginMap = (res.data.products || []).reduce(
          (acc: any, item: any) => {
            console.log('Mapping product_id:', item.product_id, 'to margin:', item.margin);
            acc[item.product_id] = item.margin;
            return acc;
          },
          {}
        );
        console.log('Final special margins map:', marginMap);
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
  }, [customer?._id]);
  const handleSortText = () => {
    switch (sort) {
      case 'default':
        return 'Default';
      case 'price_asc':
        return 'Price Ascending';
      case 'price_desc':
        return 'Price Descending';
      case 'catalogue':
        return 'Catalogue Order';
      default:
        console.log(sort);
        break;
    }
  };
  // ------------------ Calculate Totals ---------------------
  const totals = useMemo(() => {
    if (!selectedProducts.length || !customer) {
      return { totalGST: 0, totalAmount: 0 };
    }

    const { totalGST, totalAmount } = selectedProducts.reduce(
      (acc: { totalGST: number; totalAmount: number }, product) => {
        const taxPercentage =
          product?.item_tax_preferences?.[0]?.tax_percentage || 0;
        const rate = parseFloat(product.rate.toString()) || 0;
        const quantity = parseInt(product.quantity?.toString() || '1', 10) || 1;
        // Use special margin if available; fallback to customer's margin (default 40%)
        console.log('Product ID:', product._id, 'Special margin:', specialMargins[product._id], 'Available margins:', Object.keys(specialMargins));
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
  // We use a ref to track the last sent update so we don't update if nothing has changed.
  const lastUpdateDataRef = useRef<any>(null);
  const debouncedData = useDebounce({ selectedProducts, totals }, 500);

  useEffect(() => {
    const newData = {
      selectedProducts: debouncedData.selectedProducts,
      totals: debouncedData.totals,
    };

    // Compare the new data with the last update.
    if (
      JSON.stringify(newData) !== JSON.stringify(lastUpdateDataRef.current) &&
      (debouncedData.selectedProducts.length > 0 ||
        debouncedData.totals.totalAmount > 0)
    ) {
      updateOrderData(id as string, {
        products: debouncedData.selectedProducts,
        total_gst: parseFloat(debouncedData.totals.totalGST.toFixed(2)),
        total_amount: parseFloat(debouncedData.totals.totalAmount.toFixed(2)),
      });
      lastUpdateDataRef.current = newData;
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
      if (resp.data.spreadsheet_created) setLink(resp.data.spreadsheet_url);
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
      } catch (error: any) {
        console.error(error);
        const errorMessage = error?.response?.data?.message ||
                            error?.response?.data?.detail ||
                            'An error occurred while finalizing the order';
        toast.error(errorMessage);
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
            isShared={isShared}
            setSort={setSort}
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
  const updateCart = async () => {
    setLoading(true);
    try {
      await axios.get(`${process.env.api_url}/orders/update_cart`, {
        params: { order_id: order._id },
      });
      await getOrder();
      toast.success('Cart Successfully Updated');
    } catch (error) {
      console.error(error);
      toast.error('Error updating cart. Try again Later');
    } finally {
      setLoading(false);
    }
  };
  const handleDownload = async () => {
    setLoading(true);
    try {
      const { data = {} } = await axios.get(
        `${process.env.api_url}/orders/download_order_form`,
        {
          params: {
            customer_id: customer._id,
            order_id: order._id,
            sort,
          },
        }
      );
      const { google_sheet_url = '', cart_products_added = 0 } = data;
      setLink(google_sheet_url);

      // Display success message based on whether cart products were added
      if (cart_products_added > 0) {
        toast.success(
          `Sheet Successfully Created with ${cart_products_added} product${cart_products_added > 1 ? 's' : ''} from cart`
        );
      } else {
        toast.success('Sheet Successfully Created');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error setting report. Try again Later');
    } finally {
      setLoading(false);
    }
  };
  const handleRecreateSheet = async () => {
    setLoading(true);
    try {
      // First, clear the existing sheet
      await axios.delete(`${process.env.api_url}/orders/clear_sheet/${order._id}`);

      // Then create a new sheet
      const { data = {} } = await axios.get(
        `${process.env.api_url}/orders/download_order_form`,
        {
          params: {
            customer_id: customer._id,
            order_id: order._id,
            sort,
          },
        }
      );
      const { google_sheet_url = '' } = data;
      setLink(google_sheet_url);
      await getOrder();
      toast.success('Sheet Recreated Successfully');
    } catch (error) {
      console.error(error);
      toast.error('Error recreating sheet. Try again Later');
    } finally {
      setLoading(false);
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
        padding: { xs: 1, sm: 2, md: 3 },
        gap: { xs: 1.5, sm: 2, md: 3 },
        width: '100%',
        maxWidth: '100%',
      }}
    >
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: { xs: '100%', sm: '700px', md: '900px' },
          padding: { xs: 2.5, sm: 3, md: 4 },
          marginBottom: 0,
          borderRadius: 3,
          alignSelf: 'center',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        }}
      >
        {customer ? (
          <Box>
            {/* Customer Info Section */}
            <Box
              display='flex'
              flexDirection={{ xs: 'column', sm: 'column', md: 'row' }}
              justifyContent='space-between'
              alignItems={{ xs: 'stretch', md: 'center' }}
              gap={{ xs: 2, sm: 2.5, md: 2 }}
            >
              <Box flex={1}>
                <Typography
                  variant='overline'
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                  }}
                >
                  Customer
                </Typography>
                <Typography
                  variant={isMobile ? 'h6' : 'h5'}
                  fontWeight={700}
                  sx={{
                    background: 'linear-gradient(135deg, #2B4864 0%, #172335 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    mb: 0.5,
                    fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' },
                    lineHeight: 1.2,
                  }}
                >
                  {customer.company_name || customer.contact_name}
                </Typography>
                {order?.created_at && (
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    fontWeight={400}
                    sx={{
                      fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' },
                      display: 'block',
                    }}
                  >
                    Created: {new Date(order.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Typography>
                )}
              </Box>

              <Box
                display='flex'
                flexDirection={{ xs: 'row', sm: 'row', md: 'column' }}
                gap={{ xs: 1, sm: 1.5 }}
                flexWrap='wrap'
                justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
              >
                <Box
                  sx={{
                    backgroundColor: getStatusColor(order?.status) + '15',
                    px: { xs: 1.5, sm: 2 },
                    py: { xs: 0.75, sm: 1 },
                    borderRadius: 2,
                    border: `1.5px solid ${getStatusColor(order?.status)}40`,
                    minWidth: { xs: '100px', sm: '120px', md: '150px' },
                    textAlign: 'center',
                    flex: { xs: '1 1 auto', md: '0 0 auto' },
                  }}
                >
                  <Typography
                    variant='caption'
                    color='text.secondary'
                    fontWeight={600}
                    sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' } }}
                  >
                    STATUS
                  </Typography>
                  <Typography
                    variant='subtitle2'
                    fontWeight={700}
                    color={getStatusColor(order?.status)}
                    sx={{ fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.9rem' } }}
                  >
                    {order?.status?.toUpperCase()}
                  </Typography>
                </Box>

                {order?.estimate_created && (
                  <Box
                    sx={{
                      backgroundColor: '#f1f5f9',
                      px: { xs: 1.5, sm: 2 },
                      py: { xs: 0.75, sm: 1 },
                      borderRadius: 2,
                      border: '1px solid #cbd5e1',
                      minWidth: { xs: '100px', sm: '120px', md: '150px' },
                      textAlign: 'center',
                      flex: { xs: '1 1 auto', md: '0 0 auto' },
                    }}
                  >
                    <Typography
                      variant='caption'
                      color='text.secondary'
                      fontWeight={600}
                      sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' } }}
                    >
                      ESTIMATE
                    </Typography>
                    <Box display='flex' alignItems='center' justifyContent='center' gap={0.5}>
                      <Typography
                        variant='subtitle2'
                        fontWeight={700}
                        color='text.primary'
                        sx={{ fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.9rem' } }}
                      >
                        {order?.estimate_number}
                      </Typography>
                      <IconButton
                        size='small'
                        onClick={handleCopyEstimate}
                        sx={{
                          padding: { xs: '1px', sm: '2px' },
                          '&:hover': {
                            backgroundColor: '#e2e8f0',
                          },
                        }}
                      >
                        <ContentCopy sx={{ fontSize: { xs: 12, sm: 13, md: 14 } }} />
                      </IconButton>
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        ) : (
          <Box display='flex' flexDirection='column' alignItems='center' gap='12px'>
            <Typography
              variant={isMobile ? 'h5' : 'h4'}
              fontWeight={700}
              sx={{
                background: 'linear-gradient(135deg, #2B4864 0%, #172335 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Create New Order
            </Typography>
            <Typography
              variant='body2'
              fontWeight={500}
              color='text.secondary'
              sx={{
                backgroundColor: '#f8fafc',
                px: 2,
                py: 1,
                borderRadius: 1,
              }}
            >
              Select a customer to begin
            </Typography>
          </Box>
        )}
      </Paper>
      {/* Google Sheet Content if in draft */}
      {!isShared &&
        customer &&
        billingAddress &&
        shippingAddress &&
        !['accepted', 'declined'].includes(order?.status?.toLowerCase()) &&
        (link ? (
          <SheetsDisplay
            googleSheetsLink={link}
            updateCart={updateCart}
            recreateSheet={handleRecreateSheet}
            loading={loading}
            sort={handleSortText()}
          />
        ) : (
          <Button
            variant='contained'
            color='secondary'
            disabled={loading}
            onClick={handleDownload}
            sx={{
              textTransform: 'none',
              fontWeight: 'bold',
              borderRadius: '24px',
              marginBottom: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              },
            }}
          >
            {loading ? <CircularProgress /> : 'Download Order Form'}
          </Button>
        ))}
      {/* Main content */}
      <Box
        sx={{
          flexGrow: 1,
          width: '100%',
          maxWidth: { xs: '100%', lg: '90%', xl: '95%' },
          alignSelf: 'center',
          paddingX: { xs: 0, md: 2 },
        }}
      >
        <Card
          sx={{
            width: '100%',
            borderRadius: 3,
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            background: '#ffffff',
          }}
        >
          <CardContent sx={{ padding: { xs: 1.5, sm: 2.5, md: 3.5 }, overflow: 'visible' }}>
            <Stepper
              activeStep={activeStep}
              alternativeLabel
              sx={{
                marginTop: { xs: 1, md: 0 },
                marginBottom: { xs: 3, md: 4 },
                '& .MuiStepLabel-label': {
                  fontSize: { xs: '0.7rem', sm: '0.875rem', md: '1rem' },
                  marginTop: { xs: '4px', md: '8px' },
                  fontWeight: 600,
                  '&.Mui-active': {
                    color: 'primary.main',
                    fontWeight: 700,
                  },
                  '&.Mui-completed': {
                    fontWeight: 600,
                  },
                },
                '& .MuiStepConnector-root': {
                  top: { xs: 10, md: 12 },
                },
                '& .MuiStepConnector-line': {
                  borderColor: '#cbd5e1',
                  borderTopWidth: 2,
                },
                '& .MuiStepIcon-root': {
                  fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.75rem' },
                  '&.Mui-active': {
                    color: 'primary.main',
                  },
                  '&.Mui-completed': {
                    color: 'success.main',
                  },
                },
              }}
            >
              {steps.map((step, index) => (
                <Step key={index} onClick={() => handleStepClick(index)}>
                  <StepLabel sx={{ cursor: 'pointer' }}>{step.name}</StepLabel>
                </Step>
              ))}
            </Stepper>
            <Box sx={{ padding: activeStep === 3 ? 0 : { xs: 1.5, sm: 2, md: 3 }, minHeight: '100px' }}>
              <Suspense fallback={
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                  <CircularProgress />
                </Box>
              }>
                {steps[activeStep]?.component}
              </Suspense>
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
                      // !totals.totalAmount ||
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
                {activeStep === steps.length - 1 && !isShared && isAdmin && (
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
                {activeStep === steps.length - 1 && !isShared && isAdmin ? (
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
