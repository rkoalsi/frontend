import React, { useState, useMemo, useContext, useEffect, useRef } from 'react';
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
import CustomerSearchBar from '../../../src/CustomerSearchBar';
import Address from '../../../src/OrderForm/SelectAddress';
import CompanyForm from '../../../src/OrderForm/CustomerForm';
import Products from '../../../src/OrderForm/Products';
import Review from '../../../src/OrderForm/Review';
import { useRouter } from 'next/router';
import axios from 'axios';

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
  const [selectedProducts, setSelectedProducts] = useState<[]>([]);
  const [activeStep, setActiveStep] = useState(isShared ? 3 : 0);
  const [open, setOpen] = React.useState(false);
  const [error, setError]: any = React.useState(null);
  const [sharedLink, setSharedLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const totals = useMemo(() => {
    return selectedProducts.reduce(
      (acc, product: any) => {
        const taxPercentage =
          product?.item_tax_preferences?.[0]?.tax_percentage || 0;
        const rate = product?.rate || 0;
        const quantity = product?.quantity || 1;
        const margin = parseInt(customer?.cf_margin || '40') / 100; // Default to 40% if not defined

        // Calculate Selling Price
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
        totalAmount =
          totalAmount % 1 === 0.5
            ? Math.ceil(totalAmount)
            : Math.floor(totalAmount);
        acc.totalGST += gstAmount;
        acc.totalAmount += totalAmount;

        return acc;
      },
      { totalGST: 0, totalAmount: 0 }
    );
  }, [selectedProducts, customer]);

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
          // case 3:
          //   if (selectedProducts.length === 0)
          //     message = 'No products selected.\nPlease Select Product(s)';
          //   body = {
          //     products: selectedProducts,
          //     total_gst: parseFloat(totals.totalGST.toFixed(2)),
          //     total_amount: parseFloat(totals.totalAmount.toFixed(2)),
          //   };
          //   break;
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
      if (resp.status == 200) {
        setError({ message: resp.data.message, status: resp.data.status });
        handleClick();
        setTimeout(() => router.push(`/orders/past/${id}`), 5000);
      }
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  };
  const customerRef = useRef(null);

  const getOrder = async () => {
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
  };

  const generateSharedLink = () => {
    const baseURL = window.location.origin;
    const sharedLink = `${baseURL}/orders/new/${id}?shared=true`; // Assuming `id` is the current order ID
    setSharedLink(sharedLink);
    navigator.clipboard.writeText(sharedLink);
    setLinkCopied(true);
  };

  useEffect(() => {
    if (id) getOrder();
  }, [id]);
  const updateOrder = async (data: any) => {
    try {
      await axios.put(`${process.env.api_url}/orders/${id}`, {
        ...data,
      });
    } catch (error) {
      console.log(error);
    }
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
              updateOrder({ customer_id: value._id.$oid });
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
          updateOrder={updateOrder}
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
          updateOrder={updateOrder} // Add this
          setActiveStep={setActiveStep}
          isShared={isShared}
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
              disabled={isShared && activeStep == 3}
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
                  loading
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
                  loading
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
                    loading
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
