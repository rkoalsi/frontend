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
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CustomerSearchBar from '../../../src/components/CustomerSearchBar';
import Address from '../../../src/components/OrderForm/SelectAddress';
import CompanyForm from '../../../src/components/OrderForm/CustomerForm';
import Products from '../../../src/components/OrderForm/Products';
import Review from '../../../src/components/OrderForm/Review';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'react-toastify';

interface StepContent {
  name: string;
  component: React.ReactNode;
}

const NewOrder: React.FC = () => {
  const router = useRouter();
  const { id, shared }: any = router.query;
  const isShared = shared === 'true';
  const [customer, setCustomer]: any = useState(null);
  const [loading, setLoading]: any = useState(false);
  const [order, setOrder]: any = useState(null);
  const [billingAddress, setBillingAddress]: any = useState(null);
  const [shippingAddress, setShippingAddress]: any = useState(null);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [activeStep, setActiveStep] = useState(isShared ? 3 : 0);
  const [open, setOpen] = useState(false);
  const [error, setError]: any = useState(null);
  const [sharedLink, setSharedLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [specialMargins, setSpecialMargins] = useState<{
    [key: string]: string;
  }>({});

  // ------------------ FETCH SPECIAL MARGINS -------------------------
  useEffect(() => {
    if (!customer?._id) return; // Wait until customer is known

    const fetchSpecialMargins = async () => {
      try {
        const base = process.env.api_url;
        const res = await axios.get(
          `${base}/admin/customer/special_margins/${customer._id}`
        );
        // Suppose it returns: { products: [ { product_id: 'abc123', margin: '45%' }, ... ] }
        const productList = res.data.products || [];

        // Transform the array into a dictionary for easy lookup
        const marginMap: { [key: string]: string } = {};
        productList.forEach((item: any) => {
          marginMap[item.product_id] = item.margin;
        });

        setSpecialMargins(marginMap);
      } catch (error) {
        console.error('Error fetching special margins:', error);
      }
    };

    fetchSpecialMargins();
  }, [customer]);

  // ------------------ Calculate Totals ---------------------
  const totals = useMemo(() => {
    const totals = selectedProducts.reduce(
      (acc: { totalGST: number; totalAmount: number }, product) => {
        const taxPercentage =
          product?.item_tax_preferences?.[0]?.tax_percentage || 0;
        const rate = parseFloat(product.rate.toString()) || 0;
        const quantity = parseInt(product.quantity?.toString() || '1') || 1;

        // 1) Check if there's a special margin for this product
        let margin = 0.4; // default 40%
        const productId =
          typeof product._id === 'string' ? product._id : product._id.$oid;

        if (specialMargins[productId]) {
          margin = parseInt(specialMargins[productId].replace('%', '')) / 100;
        } else {
          // fallback to customer's margin (e.g. "40%")
          margin =
            parseInt(customer?.cf_margin?.replace('%', '') || '40') / 100;
        }

        // 2) Calculate Selling Price based on margin
        const sellingPrice = rate - rate * margin;

        let gstAmount = 0;
        let totalAmount = 0;

        if (customer?.cf_in_ex === 'Inclusive') {
          const basePrice = sellingPrice / (1 + taxPercentage / 100);
          gstAmount = (sellingPrice - basePrice) * quantity;
          totalAmount = sellingPrice * quantity;
        } else {
          gstAmount = sellingPrice * (taxPercentage / 100) * quantity;
          totalAmount =
            (sellingPrice + sellingPrice * (taxPercentage / 100)) * quantity;
        }

        // Accumulate without rounding
        acc.totalGST += gstAmount;
        acc.totalAmount += totalAmount;
        return acc;
      },
      { totalGST: 0, totalAmount: 0 }
    );

    // Apply rounding once at the end
    const roundedTotalGST = Math.round(totals.totalGST * 100) / 100; // Round to 2 decimals
    const roundedTotalAmount =
      totals.totalAmount % 1 >= 0.5
        ? Math.ceil(totals.totalAmount) // Round up if decimal >= 0.5
        : Math.floor(totals.totalAmount); // Round down otherwise

    return { totalGST: roundedTotalGST, totalAmount: roundedTotalAmount };
  }, [selectedProducts, customer, specialMargins]);

  // ------------------ Update Order on Changes ---------------------
  useEffect(() => {
    const updateOrder = async () => {
      try {
        await axios.put(`${process.env.api_url}/orders/${id}`, {
          products: selectedProducts,
          total_gst: parseFloat(totals.totalGST.toFixed(2)),
          total_amount: parseFloat(totals.totalAmount.toFixed(2)),
        });
      } catch (error) {
        console.error('Error updating order:', error);
      }
    };

    if (selectedProducts.length > 0 || totals.totalAmount > 0) {
      updateOrder();
    }
  }, [selectedProducts, totals, id]);

  const handleNext = async () => {
    try {
      let body = {};
      let message = '';

      const validateStepData = () => {
        switch (activeStep) {
          case 0:
            if (!customer)
              message = 'Customer is missing.\nPlease Select Customer';
            body = { customer_id: customer?._id };
            break;
          case 1:
            if (!billingAddress)
              message =
                'Billing address is missing.\nPlease Select Billing address or Add if it does not exist';
            body = { billing_address: billingAddress };
            break;
          case 2:
            if (!shippingAddress)
              message =
                'Shipping address is missing.\nPlease Select Shipping address or Add if it does not exist';
            body = { shipping_address: shippingAddress };
            break;
          default:
            break;
        }
      };

      validateStepData();

      if (message) {
        setError({ message, status: 'error' });
        handleClick();
        return;
      }

      // Move to the next step after API call
      await axios.put(`${process.env.api_url}/orders/${id}`, body);
      setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const handleEnd = async (status = 'draft') => {
    setLoading(true);
    const base = `${process.env.api_url}`;
    try {
      const resp = await axios.post(`${base}/orders/finalise`, {
        order_id: id,
        status,
      });
      if (resp.status === 200) {
        await getOrder();
        if (resp.data.message.toLowerCase().includes('created')) {
          setError({
            message: isShared ? 'Thank you for your Order' : resp.data.message,
            status: resp.data.status,
          });
          handleClick(); // Trigger the toast before navigation

          if (!isShared) {
            await router.push(`/orders/past/${id}`); // Navigate to the orders page
          }
        } else {
          setError({ message: resp.data.message, status: resp.data.status });
          handleClick(); // Show toast for other statuses
        }
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const customerRef = useRef(null);

  const getOrder = useCallback(async () => {
    const base = `${process.env.api_url}`;
    try {
      const resp = await axios.get(`${base}/orders/${id}`);
      console.log(resp.data);

      if (
        resp.data.customer_id &&
        customerRef.current !== resp.data.customer_id
      ) {
        customerRef.current = resp.data.customer_id; // Avoid redundant fetch
        const customerResponse = await axios.get(
          `${base}/customers/${resp.data.customer_id}`
        );
        setCustomer(customerResponse.data.customer);
      }

      if (resp.data.billing_address) {
        setBillingAddress(resp.data.billing_address);
        console.log('billing_address', resp.data.billing_address);
      }
      if (resp.data.shipping_address) {
        setShippingAddress(resp.data.shipping_address);
        console.log('shipping_address', resp.data.shipping_address);
      }
      if (resp.data.products && resp.data.products.length > 0) {
        const detailedProducts: any = await Promise.all(
          resp?.data?.products.map(async (product: any) => {
            if (product) {
              try {
                const res = await axios.get(
                  `${base}/products/${product.product_id}`
                );
                console.log(res?.data);
                return {
                  ...product, // Original product data from the order
                  ...res.data, // Fetched product details
                };
              } catch (error) {
                console.error(
                  `Failed to fetch product ${product.product_id}`,
                  error
                );
                return product; // Fallback to original product data if fetch fails
              }
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

  const generateSharedLink = useCallback(() => {
    const baseURL = window.location.origin;
    const sharedLink = `${baseURL}/orders/new/${id}?shared=true`; // Assuming `id` is the current order ID
    setSharedLink(sharedLink);
    navigator.clipboard.writeText(sharedLink);
    setLinkCopied(true);
  }, [id]);

  useEffect(() => {
    if (id) getOrder();
  }, [id, getOrder]);
  const handleCheckout = () => {
    setActiveStep(activeStep + 1);
  };
  const steps: StepContent[] = [
    {
      name: 'Select Customer',
      component: isShared ? null : (
        <CustomerSearchBar
          label={'Select Customer'}
          onChange={async (value: any) => {
            setCustomer(value);
            setBillingAddress(null);
            setShippingAddress(null);
            if (value?._id?.$oid) {
              await axios.put(`${process.env.api_url}/orders/${id}`, {
                customer_id: value._id.$oid,
              });
            }
          }}
          value={customer}
          initialValue={customer}
        />
      ),
    },
    {
      name: 'Billing Address',
      component: isShared ? null : (
        <Address
          type='Billing'
          id={id}
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
          id={id}
          type='Shipping'
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
          label={'Search Products'}
          customer={customer}
          selectedProducts={selectedProducts}
          setSelectedProducts={setSelectedProducts}
          specialMargins={specialMargins}
          order={order}
          onCheckout={handleCheckout}
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
          setSelectedProducts={setSelectedProducts} // Add this
          // updateOrder={updateO} // Remove if not needed
          setActiveStep={setActiveStep}
          specialMargins={specialMargins}
          isShared={isShared}
          order={order}
        />
      ),
    },
  ];

  const handleStepClick = (index: number) => {
    if (isShared) {
      // Shared link users can only navigate between steps 3 (Products) and 4 (Review)
      if (index < 3 || index > 4) {
        setError({
          message: 'You can only navigate between Products and Review steps.',
          status: 'error',
        });
        handleClick();
        return;
      }
      // Allow navigation between steps 3 and 4
      setActiveStep(index);
      return;
    }

    // For authenticated users, handle navigation normally
    if (index < activeStep) {
      setActiveStep(index);
      return;
    }

    // Check if the current step is completed before moving to the next one
    const validateStepData = () => {
      switch (activeStep) {
        case 0:
          if (!customer) return 'Cannot proceed as Customer is missing.';
          break;
        case 1:
          if (!billingAddress)
            return 'Cannot proceed as Billing address is missing.';
          break;
        case 2:
          if (!shippingAddress)
            return 'Cannot proceed as Shipping address is missing.';
          break;
        case 3:
          if (selectedProducts.length === 0)
            return 'Cannot proceed as no products are selected.';
          break;
        default:
          break;
      }
      return '';
    };

    const message = validateStepData();
    if (message) {
      setError({ message, status: 'error' });
      handleClick();
      return; // Prevent switching to the next step if validation fails
    }

    // If validation passes, allow the step to change
    setActiveStep(index);
  };

  const handleClick = () => {
    setOpen(true);
  };

  const handleClose = (reason: any) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  useEffect(() => {
    if (
      isShared &&
      (order?.status?.toLowerCase()?.includes('declined') ||
        order?.status?.toLowerCase()?.includes('accepted'))
    ) {
      toast.success(`Thank you for your order`);
      router.push('/login');
    }
  }, [isShared, order, router]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: isMobile ? '16px' : '32px',
      }}
    >
      {/* Header */}
      <Paper
        elevation={3}
        sx={{
          width: '100%',
          maxWidth: isMobile ? '400px' : null,
          padding: '16px',
          marginBottom: '24px',
          textAlign: 'center',
          borderRadius: '8px',
        }}
      >
        <Box
          display={'flex'}
          justifyContent={'center'}
          alignContent={'center'}
          flexDirection={'column'}
          gap={'8px'}
        >
          <Typography variant='h4' fontWeight='bold' color='black'>
            {order?.estimate_created ? 'Update ' : 'Create '}
            {order?.estimate_created ? 'Existing ' : 'New '}Order
          </Typography>
          <Typography variant='h5' fontWeight='bold' color='black'>
            Order Status: ({order?.status})
          </Typography>
          {!order?.estimate_created && (
            <Typography variant='body1' fontWeight={'bold'} color='black'>
              Complete each step to finalize your order.
            </Typography>
          )}
        </Box>
      </Paper>

      {/* Stepper Section */}
      <Card
        sx={{
          width: '100%',
          maxWidth: isMobile ? '400px' : null,
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        <CardContent sx={{ padding: '24px' }}>
          {/* Stepper */}

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

          {/* Navigation Buttons */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '24px',
            }}
          >
            <Button
              variant='outlined'
              color='secondary'
              disabled={isShared && activeStep === 3}
              onClick={() => {
                activeStep === 0
                  ? router.push('/')
                  : handleStepClick(activeStep - 1);
              }}
            >
              {activeStep === 0 ? 'Cancel' : 'Previous'}
            </Button>
            {!isShared &&
              customer !== null &&
              billingAddress !== null &&
              shippingAddress !== null && (
                <Button variant='contained' onClick={generateSharedLink}>
                  Generate Shared Link
                </Button>
              )}
            {activeStep === steps.length - 1 && !isShared && (
              <Button
                variant='contained'
                color={'secondary'}
                onClick={() => handleEnd()}
                disabled={
                  !customer ||
                  !billingAddress ||
                  !shippingAddress ||
                  selectedProducts.length === 0 ||
                  !totals.totalAmount ||
                  loading ||
                  order?.status?.toLowerCase()?.includes('declined') ||
                  order?.status?.toLowerCase()?.includes('accepted')
                }
              >
                {'Save As Draft'}
              </Button>
            )}
            {activeStep === steps.length - 1 && (
              <Button
                variant='contained'
                color={'error'}
                onClick={() => handleEnd('declined')}
                disabled={
                  !customer ||
                  !billingAddress ||
                  !shippingAddress ||
                  selectedProducts.length === 0 ||
                  !totals.totalAmount ||
                  loading ||
                  order?.status?.toLowerCase()?.includes('declined') ||
                  order?.status?.toLowerCase()?.includes('accepted')
                }
              >
                {'Decline'}
              </Button>
            )}
            <Button
              variant='contained'
              color='primary'
              onClick={() =>
                activeStep === steps.length - 1
                  ? handleEnd('accepted')
                  : handleNext()
              }
              disabled={
                activeStep === steps.length - 1
                  ? !customer ||
                    !billingAddress ||
                    !shippingAddress ||
                    selectedProducts.length === 0 ||
                    !totals.totalAmount ||
                    loading ||
                    order?.status?.toLowerCase()?.includes('accepted') ||
                    order?.status?.toLowerCase()?.includes('declined')
                  : false
              }
            >
              {activeStep === steps.length - 1 ? 'Accept' : 'Next'}
            </Button>
          </Box>
        </CardContent>
      </Card>

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
            onClose={(e) => handleClose(e)}
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
