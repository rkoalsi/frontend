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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Tooltip,
  Slide,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import { useTheme, styled } from '@mui/material/styles';
import CustomerSearchBar from '../../../src/components/OrderForm/CustomerSearchBar';
import Address from '../../../src/components/OrderForm/SelectAddress';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  ContentCopy,
  ArrowBack,
  Share,
  ShoppingCart,
  ArrowForward,
  CheckCircle,
  Percent,
  Close,
} from '@mui/icons-material';
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

// Shared styled button — removes repetition across all nav buttons
const NavButton = styled(Button)(() => ({
  textTransform: 'none',
  fontWeight: 700,
  borderRadius: 24,
}));

// Create an Axios instance
const api = axios.create({
  baseURL: process.env.api_url,
  withCredentials: true,
});

// Attach auth token to every request made through this local instance
api.interceptors.request.use((config) => {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token && !config.headers['Authorization']) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
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
  mobileName: string;
  helpText: string;
  component: React.ReactNode;
}

// Per-step contextual help shown below the stepper
const STEP_HELP: { name: string; mobileName: string; helpText: string }[] = [
  {
    name: 'Select Customer',
    mobileName: 'Customer',
    helpText: 'Search and select the customer placing this order.',
  },
  {
    name: 'Billing Address',
    mobileName: 'Billing',
    helpText: 'Choose or add the billing address for this order.',
  },
  {
    name: 'Shipping Address',
    mobileName: 'Shipping',
    helpText: 'Choose or add where the order should be delivered.',
  },
  {
    name: 'Products',
    mobileName: 'Products',
    helpText: 'Browse and add products. Your running total updates live.',
  },
  {
    name: 'Review',
    mobileName: 'Review',
    helpText: 'Confirm everything looks correct before submitting.',
  },
];

const NewOrder: React.FC = () => {
  const router = useRouter();
  const { id, shared } = router.query;
  const isShared = shared === 'true';
  const { user }: any = useContext(AuthContext);
  const isAdmin = user?.role.includes('admin');
  const isCustomerUser = user?.role === 'customer';
  const canViewMargins =
    !isCustomerUser &&
    !isShared &&
    !!user?.role &&
    ['admin', 'sales_admin', 'sales_person'].some((r) => (user.role as string).includes(r));
  const userCustomerId = user?.customer_id; // contact_id linked to this user
  // States
  const [customer, setCustomer] = useState<any>(null);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [loading, setLoading] = useState<boolean>(false);
  const [xlsxLoading, setXlsxLoading] = useState<boolean>(false);
  const [order, setOrder] = useState<any>(null);
  const [billingAddress, setBillingAddress] = useState<any>(null);
  const [shippingAddress, setShippingAddress] = useState<any>(null);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [activeStep, setActiveStep] = useState<number>(isShared ? 3 : (isCustomerUser ? 1 : 0));
  const [open, setOpen] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);
  const [sort, setSort] = useState<string>('default');
  const [link, setLink] = useState(
    order?.spreadsheet_created ? order?.spreadsheet_url : ''
  );
  const [linkCopied, setLinkCopied] = useState<boolean>(false);
  const [specialMargins, setSpecialMargins] = useState<{ [key: string]: string }>({});
  const [specialMarginsList, setSpecialMarginsList] = useState<any[]>([]);
  const [marginDialogOpen, setMarginDialogOpen] = useState(false);

  // Group special margins by brand; derive brand margin (mode) and flag exceptions
  const specialMarginsByBrand = useMemo(() => {
    const grouped: Record<string, { brandMargin: string; exceptions: any[] }> = {};
    const byBrand: Record<string, any[]> = {};
    for (const item of specialMarginsList) {
      const brand = item.brand || 'Unknown';
      if (!byBrand[brand]) byBrand[brand] = [];
      byBrand[brand].push(item);
    }
    for (const [brand, products] of Object.entries(byBrand)) {
      // Mode: pick the most frequent margin in this brand group
      const freq: Record<string, number> = {};
      for (const p of products) freq[p.margin] = (freq[p.margin] || 0) + 1;
      const brandMargin = Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
      const exceptions = products.filter((p) => p.margin !== brandMargin);
      grouped[brand] = { brandMargin, exceptions };
    }
    return grouped;
  }, [specialMarginsList]);
  const [addressDetails, setAddressDetails] = useState<Record<string, any>>({});

  // Submit confirmation dialog (for shared/customer users)
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);

  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // ------------------ Fetch Special Margins + Address Details (parallel) --------
  useEffect(() => {
    if (!customer?._id) return;
    const controller = new AbortController();
    const signal = controller.signal;

    (async () => {
      try {
        const [marginsRes, addressRes] = await Promise.all([
          api.get(`/customers/special_margins/${customer._id}`, { signal }),
          api.get(`/customer_address_details/${customer._id}`, { signal }),
        ]);

        const products = marginsRes.data.products || [];
        const marginMap = products.reduce((acc: any, item: any) => {
          acc[item.product_id] = item.margin;
          return acc;
        }, {});
        setSpecialMargins(marginMap);
        setSpecialMarginsList(products);

        const detailMap = (addressRes.data.address_details || []).reduce(
          (acc: Record<string, any>, item: any) => {
            acc[item.address_id] = item;
            return acc;
          },
          {}
        );
        setAddressDetails(detailMap);
      } catch (error: any) {
        if (error.name !== 'CanceledError') console.error('Error fetching customer data:', error);
      }
    })();

    return () => controller.abort();
  }, [customer?._id]);

  const handleSortText = () => {
    switch (sort) {
      case 'default': return 'Default';
      case 'price_asc': return 'Price Ascending';
      case 'price_desc': return 'Price Descending';
      case 'catalogue': return 'Catalogue Order';
      default: break;
    }
  };

  // ------------------ Calculate Totals ---------------------
  const totals = useMemo(() => {
    // Don't require `customer` here — for shared-link visitors customer may be
    // null (unauthenticated) but we still want to display the running total using
    // the defaults already embedded in the calculation below (margin '40', Exclusive).
    if (!selectedProducts.length) return { totalGST: 0, totalAmount: 0 };
    const { totalGST, totalAmount } = selectedProducts.reduce(
      (acc: { totalGST: number; totalAmount: number }, product) => {
        const taxPercentage = product?.item_tax_preferences?.[0]?.tax_percentage || 0;
        const rate = parseFloat(product.rate.toString()) || 0;
        const quantity = parseInt(product.quantity?.toString() || '1', 10) || 1;
        const margin = specialMargins[product._id]
          ? parseInt(specialMargins[product._id].replace('%', ''), 10) / 100
          : parseInt(customer?.cf_margin?.replace('%', '') || '40', 10) / 100;
        const sellingPrice = rate - rate * margin;
        let gstAmount = 0;
        let total = 0;
        // For shared users customer is null; fall back to gst_type stored on the order
        const gstType = customer?.cf_in_ex || order?.gst_type || 'Exclusive';
        if (gstType === 'Inclusive') {
          const basePrice = sellingPrice / (1 + taxPercentage / 100);
          gstAmount = (sellingPrice - basePrice) * quantity;
          total = sellingPrice * quantity;
        } else {
          gstAmount = sellingPrice * (taxPercentage / 100) * quantity;
          total = (sellingPrice + sellingPrice * (taxPercentage / 100)) * quantity;
        }
        acc.totalGST += gstAmount;
        acc.totalAmount += total;
        return acc;
      },
      { totalGST: 0, totalAmount: 0 }
    );
    return {
      totalGST: Math.round(totalGST * 100) / 100,
      totalAmount: totalAmount % 1 >= 0.5 ? Math.ceil(totalAmount) : Math.floor(totalAmount),
    };
  }, [selectedProducts, customer, specialMargins, order]);

  // ------------------ Debounced Order Updates ---------------------
  const lastUpdateDataRef = useRef<any>(null);
  const debouncedData = useDebounce({ selectedProducts, totals }, 500);

  useEffect(() => {
    const { selectedProducts: debProducts, totals: debTotals } = debouncedData;
    if (!debProducts.length && !debTotals.totalAmount) return;
    const prev = lastUpdateDataRef.current;
    const quantitySig = debProducts.map((p: any) => `${p._id}:${p.quantity}`).join(',');
    const prevSig = prev?.quantitySig;
    if (
      prev &&
      prev.length === debProducts.length &&
      prev.totalAmount === debTotals.totalAmount &&
      prevSig === quantitySig
    ) return;
    updateOrderData(id as string, {
      products: debProducts,
      total_gst: parseFloat(debTotals.totalGST.toFixed(2)),
      total_amount: parseFloat(debTotals.totalAmount.toFixed(2)),
    });
    lastUpdateDataRef.current = {
      length: debProducts.length,
      totalAmount: debTotals.totalAmount,
      quantitySig,
    };
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
          if (referenceNumber !== '') body['reference_number'] = referenceNumber;
          break;
        case 1:
          if (!billingAddress) {
            message = 'Billing address is missing.\nPlease select or add a billing address.';
          } else {
            body = { billing_address: billingAddress };
          }
          break;
        case 2:
          if (!shippingAddress) {
            message = 'Shipping address is missing.\nPlease select or add a shipping address.';
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
    [customer, billingAddress, shippingAddress, selectedProducts, referenceNumber]
  );

  // ------------------ Get Order Data ---------------------
  const customerRef = useRef<any>(null);
  const getOrder = useCallback(async () => {
    try {
      const resp = await api.get(`/orders/${id}`);

      // Kick off customer fetch and product batch fetch in parallel
      const orderData = resp.data;

      const customerPromise =
        orderData.customer_id && customerRef.current !== orderData.customer_id
          ? api.get(`/customers/${orderData.customer_id}`).catch(() => null)
          : Promise.resolve(null);

      const productsPromise =
        orderData.products && orderData.products.length > 0
          ? (() => {
              const ids = orderData.products
                .map((p: any) => p.product_id)
                .filter(Boolean)
                .join(',');
              return api.get(`/products/batch?ids=${ids}`).catch(() => null);
            })()
          : Promise.resolve(null);

      const [customerRes, batchRes] = await Promise.all([customerPromise, productsPromise]);

      if (customerRes && orderData.customer_id && customerRef.current !== orderData.customer_id) {
        customerRef.current = orderData.customer_id;
        setCustomer(customerRes.data.customer);
        setReferenceNumber(orderData?.reference_number);
      }

      if (orderData.billing_address) setBillingAddress(orderData.billing_address);
      if (orderData.shipping_address) setShippingAddress(orderData.shipping_address);
      if (orderData.spreadsheet_created) setLink(orderData.spreadsheet_url);

      if (batchRes && orderData.products && orderData.products.length > 0) {
        const productMap: Record<string, any> = batchRes.data.products || {};
        const detailedProducts = orderData.products.map((p: any) => ({
          ...p,
          ...(productMap[p.product_id] || {}),
        }));
        setSelectedProducts(detailedProducts);
      }

      setOrder(orderData);
    } catch (error) {
      console.error('Error fetching order:', error);
    }
  }, [id]);

  useEffect(() => {
    if (id) getOrder();
  }, [id, getOrder]);

  // Auto-fetch and pre-select customer for customer users
  useEffect(() => {
    const fetchCustomerForUser = async () => {
      if (isCustomerUser && !customer && id && user) {
        try {
          let customerData = null;
          if (userCustomerId) {
            try {
              const response = await api.get(`/customers/by_contact_id/${userCustomerId}`);
              customerData = response.data.customer;
            } catch (e) {
              console.log('Customer not found by contact_id, trying email fallback');
            }
          }

          // Fallback: Try to match by user's email
          if (!customerData && user.email) {
            try {
              const response = await api.get(`/customers/by_user_email/${encodeURIComponent(user.email)}`);
              customerData = response.data.customer;
            } catch (e) {
              console.log('Customer not found by email');
            }
          }
          if (customerData) {
            setCustomer(customerData);
            if (customerData.addresses && customerData.addresses.length > 0) {
              const defaultAddress = customerData.addresses[0];
              setBillingAddress(defaultAddress);
              setShippingAddress(defaultAddress);
              await updateOrderData(id as string, {
                customer_id: customerData._id,
                billing_address: defaultAddress,
                shipping_address: defaultAddress,
              });
            } else {
              await updateOrderData(id as string, { customer_id: customerData._id });
            }
            setActiveStep(1);
          }
        } catch (error) {
          console.error('Error fetching customer for user:', error);
        }
      }
    };
    fetchCustomerForUser();
  }, [isCustomerUser, userCustomerId, user, customer, id]);

  useEffect(() => {
    if (isCustomerUser && !isShared && activeStep === 0) setActiveStep(1);
  }, [isCustomerUser, isShared, activeStep]);

  // router.query is empty on the first SSR render so isShared starts false and
  // activeStep initialises to 0. Once the router hydrates and isShared becomes
  // true, jump straight to the Products step (3) so shared-link visitors land
  // on the right step and can proceed to Review.
  useEffect(() => {
    if (isShared && activeStep < 3) setActiveStep(3);
  }, [isShared]); // eslint-disable-line react-hooks/exhaustive-deps

  // ------------------ Navigation & Finalization ---------------------
  const handleNext = useCallback(async () => {
    const { message, body } = validateAndCollectData(activeStep);
    if (message) {
      setError({ message, status: 'error' });
      setOpen(true);
      return;
    }
    await updateOrderData(id as string, body);
    setActiveStep((prev) => Math.min(prev + 1, STEP_HELP.length - 1));
  }, [activeStep, id, validateAndCollectData]);

  const handleEnd = useCallback(
    async (status = 'draft', notify_sp = false) => {
      setLoading(true);
      try {
        const resp = await api.post('/orders/finalise', { order_id: id, status });
        if (resp.status === 200) {
          await getOrder();
          toast[resp.data.status === 'success' ? 'success' : 'error'](resp.data.message);
        }
        if (notify_sp) await api.post('/orders/notify', { order_id: id });
      } catch (error: any) {
        console.error(error);
        const errorMessage =
          error?.response?.data?.message ||
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
    const params = new URLSearchParams();
    params.set('shared', 'true');
    const currentParams = new URLSearchParams(window.location.search);
    const currentSearch = currentParams.get('search');
    if (currentSearch) {
      params.set('search', currentSearch);
    } else {
      const currentBrand = currentParams.get('brand');
      const currentCategory = currentParams.get('category');
      if (currentBrand) params.set('brand', currentBrand);
      if (currentCategory) params.set('category', currentCategory);
    }
    const link = `${baseURL}/orders/new/${id}?${params.toString()}`;
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
  }, [id]);

  const handleStepClick = useCallback(
    async (index: number) => {
      if (isCustomerUser && index === 0) return;
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
          setError({ message: 'Cannot proceed as no products are selected.', status: 'error' });
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
    [activeStep, isShared, selectedProducts, validateAndCollectData, id, isCustomerUser]
  );

  const handleClose = useCallback((reason: any) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  }, []);

  useEffect(() => {
    if (isShared && order) {
      const status = typeof order.status === 'string' ? order.status.trim().toLowerCase() : '';
      if (!['draft', 'sent'].includes(status)) {
        toast.error(`You cannot view this order as its status is not draft`, { autoClose: 5000 });
        router.push('/login');
      }
    }
  }, [order, isShared, router]);

  // ------------------ Steps Configuration ---------------------
  const steps: StepContent[] = useMemo(() => {
    return STEP_HELP.map((meta, index) => {
      let component: React.ReactNode = null;
      switch (index) {
        case 0:
          component = isShared ? null : (
            <CustomerSearchBar
              disabled={isCustomerUser || ['declined', 'accepted'].includes(order?.status?.toLowerCase())}
              label={isCustomerUser ? 'Your Account' : 'Select Customer'}
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
                  await updateOrderData(id as string, { customer_id: value?._id });
                }
              }}
              value={customer}
              initialValue={customer}
              onChangeReference={(e: React.ChangeEvent<HTMLInputElement>) =>
                setReferenceNumber(e.target.value)
              }
              reference={referenceNumber}
            />
          );
          break;
        case 1:
          component = isShared ? null : (
            <Address
              type='Billing'
              id={id as string}
              address={billingAddress}
              setAddress={setBillingAddress}
              selectedAddress={billingAddress}
              customer={customer}
              setLoading={setLoading}
              addressDetails={addressDetails}
              addNewAddress={false}
            />
          );
          break;
        case 2:
          component = isShared ? null : (
            <Address
              type='Shipping'
              id={id as string}
              address={shippingAddress}
              setAddress={setShippingAddress}
              selectedAddress={shippingAddress}
              customer={customer}
              setLoading={setLoading}
              addressDetails={addressDetails}
              addNewAddress={false}
            />
          );
          break;
        case 3:
          component = (
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
          );
          break;
        case 4:
          component = (
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
          );
          break;
      }
      return { ...meta, component };
    });
  }, [
    isShared,
    isCustomerUser,
    customer,
    billingAddress,
    shippingAddress,
    totals,
    selectedProducts,
    specialMargins,
    order,
    id,
    referenceNumber,
    addressDetails,
  ]);

  const handleCopyEstimate = () => {
    if (order?.estimate_number) navigator.clipboard.writeText(order.estimate_number);
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
        { params: { customer_id: customer._id, order_id: order._id, sort } }
      );
      const { google_sheet_url = '', cart_products_added = 0 } = data;
      setLink(google_sheet_url);
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

  const handleDownloadXlsx = async () => {
    setXlsxLoading(true);
    try {
      const response = await axios.get(
        `${process.env.api_url}/orders/download_order_xlsx`,
        {
          params: { customer_id: customer._id, order_id: order._id, sort },
          responseType: 'arraybuffer',
        }
      );
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Order_Form_${order._id?.slice(0, 8)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 2000);
    } catch (error) {
      console.error(error);
      toast.error('Error downloading XLSX. Try again later.');
    } finally {
      setXlsxLoading(false);
    }
  };

  const handleRecreateSheet = async () => {
    setLoading(true);
    try {
      await axios.delete(`${process.env.api_url}/orders/clear_sheet/${order._id}`);
      const { data = {} } = await axios.get(
        `${process.env.api_url}/orders/download_order_form`,
        { params: { customer_id: customer._id, order_id: order._id, sort } }
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

  // ------------------ Status helpers ---------------------
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'draft': return '#FFA500';
      case 'accepted': return '#2ecc71';
      case 'declined': return '#e74c3c';
      default: return theme.palette.text.primary; // was 'black' — broken in dark mode
    }
  };

  const getStatusLabel = (status: string) => status?.toUpperCase() || '—';

  // Derived: whether the "Submit Order" / "Save As Draft" button is for a retailer
  const isRetailerFlow = isShared || isCustomerUser;
  const saveDraftLabel = isRetailerFlow ? 'Submit Order' : 'Save As Draft';
  const saveDraftDisabled =
    // For shared-link visitors customer is null (unauthenticated) — don't block them
    (!customer && !isShared) ||
    !billingAddress ||
    !shippingAddress ||
    selectedProducts.length === 0 ||
    loading ||
    (!isShared && !['deleted', 'draft', 'sent'].includes(order?.status?.toLowerCase()));

  // Floating cart bar: show on Products step when items are selected
  const showCartBar = activeStep === 3 && selectedProducts.length > 0;

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
        // Extra bottom padding when cart bar is visible so content isn't hidden behind it
        paddingBottom: showCartBar ? { xs: '80px', sm: '88px', md: '96px', lg: '96px' } : undefined,
      }}
    >
      {/* ── Back navigation (not shown on shared/customer links) ── */}
      {!isShared && !isCustomerUser && (
        <Box
          sx={{
            width: '100%',
            maxWidth: { xs: '100%', sm: '700px', md: '900px' },
            alignSelf: 'center',
          }}
        >
          <Button
            startIcon={<ArrowBack sx={{ fontSize: 18 }} />}
            onClick={() => router.push('/')}
            size='small'
            sx={{
              textTransform: 'none',
              color: 'text.secondary',
              fontWeight: 500,
              '&:hover': { color: 'text.primary', backgroundColor: 'action.hover' },
            }}
          >
            Back to Orders
          </Button>
        </Box>
      )}

      {/* ── Header card ── */}
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: { xs: '100%', sm: '700px', md: '900px' },
          padding: { xs: 2.5, sm: 3, md: 4 },
          borderRadius: 3,
          alignSelf: 'center',
          background: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: isDark
            ? '0 4px 20px rgba(0,0,0,0.3)'
            : '0 4px 20px rgba(0,0,0,0.08)',
        }}
      >
        {customer ? (
          <Box>
            <Box
              display='flex'
              flexDirection={{ xs: 'column', md: 'row' }}
              justifyContent='space-between'
              alignItems={{ xs: 'stretch', md: 'flex-start' }}
              gap={{ xs: 2, md: 2 }}
            >
              {/* Left: customer name + order ID + date */}
              <Box flex={1} minWidth={0}>
                <Typography
                  variant='overline'
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    fontSize: { xs: '0.65rem', sm: '0.7rem' },
                  }}
                >
                  New Order
                </Typography>
                <Typography
                  variant={isMobile ? 'h6' : 'h5'}
                  fontWeight={700}
                  noWrap
                  sx={{
                    background: isDark
                      ? 'linear-gradient(135deg, #9c92d8 0%, #7c6fcd 100%)'
                      : 'linear-gradient(135deg, #2a4a6b 0%, #192d45 100%)',
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

                <Box display='flex' alignItems='center' gap={1} flexWrap='wrap' mt={0.5}>
                  {order?.created_at && (
                    <Typography
                      variant='caption'
                      color='text.secondary'
                      sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                    >
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Right: status, estimate, share button */}
              <Box
                display='flex'
                flexDirection={{ xs: 'row', md: 'column' }}
                alignItems={{ xs: 'center', md: 'flex-end' }}
                gap={1}
                flexWrap='wrap'
              >
                {/* Status chip */}
                {order?.status && (
                  <Chip
                    size='small'
                    label={getStatusLabel(order.status)}
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      letterSpacing: '0.05em',
                      backgroundColor: getStatusColor(order.status) + '20',
                      color: getStatusColor(order.status),
                      border: `1.5px solid ${getStatusColor(order.status)}50`,
                    }}
                  />
                )}

                {/* Estimate number */}
                {order?.estimate_created && (
                  <Tooltip title='Copy estimate number'>
                    <Chip
                      size='small'
                      label={order.estimate_number}
                      icon={<ContentCopy sx={{ fontSize: '12px !important' }} />}
                      onClick={handleCopyEstimate}
                      variant='outlined'
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    />
                  </Tooltip>
                )}

                {/* Generate Shared Link — moved here from footer */}
                {!isShared && customer && billingAddress && shippingAddress && (
                  <Tooltip title='Copy a link to share this order with the customer'>
                    <NavButton
                      size='small'
                      variant='outlined'
                      color='info'
                      startIcon={<Share sx={{ fontSize: 16 }} />}
                      onClick={generateSharedLink}
                      sx={{ fontSize: '0.75rem', px: 1.5, py: 0.5 }}
                    >
                      Share Link
                    </NavButton>
                  </Tooltip>
                )}

                {/* View Margins — sales/admin roles only */}
                {canViewMargins && customer && (
                  <Tooltip title='View customer margins'>
                    <NavButton
                      size='small'
                      variant='outlined'
                      color='secondary'
                      startIcon={<Percent sx={{ fontSize: 16 }} />}
                      onClick={() => setMarginDialogOpen(true)}
                      sx={{ fontSize: '0.75rem', px: 1.5, py: 0.5 }}
                    >
                      Margins
                    </NavButton>
                  </Tooltip>
                )}
              </Box>
            </Box>
          </Box>
        ) : (
          /* No customer selected yet */
          <Box display='flex' flexDirection='column' alignItems='center' gap='12px'>
            <Typography
              variant={isMobile ? 'h5' : 'h4'}
              fontWeight={700}
              sx={{
                background: isDark
                  ? 'linear-gradient(135deg, #9c92d8 0%, #7c6fcd 100%)'
                  : 'linear-gradient(135deg, #2a4a6b 0%, #192d45 100%)',
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
                backgroundColor: 'action.hover',
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

      {/* ── Google Sheet section ── */}
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
            downloadXlsx={handleDownloadXlsx}
            loading={loading}
            xlsxLoading={xlsxLoading}
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
              '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
            }}
          >
            {loading ? <CircularProgress size={22} /> : 'Download Order Form'}
          </Button>
        ))}

      {/* ── Main stepper card ── */}
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
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: isDark
              ? '0 4px 20px rgba(0,0,0,0.3)'
              : '0 4px 20px rgba(0,0,0,0.08)',
            background: theme.palette.background.paper,
          }}
        >
          <CardContent sx={{ padding: { xs: 1.5, sm: 2.5, md: 3.5 }, overflow: 'visible' }}>
            {/* Stepper */}
            <Stepper
              activeStep={activeStep}
              alternativeLabel
              sx={{
                marginTop: { xs: 1, md: 0 },
                marginBottom: { xs: 1.5, md: 2.5 },
                '& .MuiStepLabel-label': {
                  fontSize: { xs: '0.65rem', sm: '0.8rem', md: '0.9rem' },
                  marginTop: { xs: '4px', md: '8px' },
                  fontWeight: 600,
                  color: isDark ? 'rgba(255,255,255,0.45)' : 'text.secondary',
                  '&.Mui-active': { color: 'primary.main', fontWeight: 700 },
                  '&.Mui-completed': { color: 'success.main', fontWeight: 600 },
                },
                '& .MuiStepConnector-root': {
                  top: { xs: 10, md: 14 },
                  '&.Mui-completed .MuiStepConnector-line': {
                    borderColor: theme.palette.success.main,
                  },
                  '&.Mui-active .MuiStepConnector-line': {
                    borderColor: theme.palette.primary.main,
                  },
                },
                '& .MuiStepConnector-line': {
                  borderColor: isDark ? 'rgba(255,255,255,0.12)' : theme.palette.divider,
                  borderTopWidth: 2,
                },
                '& .MuiStepIcon-root': {
                  fontSize: { xs: '1.4rem', sm: '1.6rem', md: '1.9rem' },
                  color: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)',
                  transition: 'all 0.25s ease',
                  '&.Mui-active': {
                    color: 'primary.main',
                    filter: `drop-shadow(0 0 6px ${theme.palette.primary.main}80)`,
                  },
                  '&.Mui-completed': { color: 'success.main' },
                },
                '& .MuiStepIcon-text': {
                  fill: isDark ? 'rgba(255,255,255,0.5)' : 'white',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                },
              }}
            >
              {steps.map((step, index) => {
                const isDisabledForCustomer = isCustomerUser && index === 0;
                // Customer users: step 0 is always shown as completed "Your Account"
                const displayName = isMobile ? step.mobileName : step.name;
                const customerStep0Label = isMobile ? 'Account ✓' : 'Your Account';
                return (
                  <Step
                    key={index}
                    onClick={() => handleStepClick(index)}
                    completed={isDisabledForCustomer ? true : undefined}
                  >
                    <StepLabel
                      sx={{
                        cursor: isDisabledForCustomer ? 'default' : 'pointer',
                        opacity: isDisabledForCustomer ? 0.7 : 1,
                      }}
                    >
                      {isDisabledForCustomer ? customerStep0Label : displayName}
                    </StepLabel>
                  </Step>
                );
              })}
            </Stepper>

            {/* Per-step contextual help text */}
            {steps[activeStep]?.helpText && (
              <Typography
                variant='caption'
                color='text.secondary'
                sx={{
                  display: 'block',
                  textAlign: 'center',
                  mb: { xs: 2, md: 3 },
                  fontSize: { xs: '0.72rem', sm: '0.8rem' },
                  bgcolor: 'action.hover',
                  borderRadius: 1.5,
                  px: 2,
                  py: 0.75,
                  maxWidth: 480,
                  mx: 'auto',
                }}
              >
                {steps[activeStep].helpText}
              </Typography>
            )}

            {/* Step content */}
            <Box sx={{ padding: activeStep === 3 ? 0 : { xs: 1.5, sm: 2, md: 3 }, minHeight: '100px' }}>
              <Suspense
                fallback={
                  <Box display='flex' justifyContent='center' alignItems='center' minHeight='300px'>
                    <CircularProgress />
                  </Box>
                }
              >
                {steps[activeStep]?.component}
              </Suspense>
            </Box>

            {/* Navigation buttons */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: isMobile ? 'center' : 'space-between',
                alignItems: isMobile ? 'stretch' : 'center',
                marginTop: '24px',
                paddingTop: '16px',
                borderTop: `1px solid ${theme.palette.divider}`,
                gap: 2,
              }}
            >
              {/* Left group: Previous / Cancel */}
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  width: isMobile ? '100%' : 'auto',
                }}
              >
                <NavButton
                  variant='outlined'
                  color='secondary'
                  fullWidth={isMobile}
                  onClick={() =>
                    activeStep === 0 ? router.push('/') : handleStepClick(activeStep - 1)
                  }
                  disabled={isShared && activeStep === 3}
                >
                  {activeStep === 0 ? 'Cancel' : 'Previous'}
                </NavButton>
              </Box>

              {/* Right group: action buttons */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: 2,
                  width: isMobile ? '100%' : 'auto',
                }}
              >
                {/* Save as Draft / Submit Order — last step only */}
                {activeStep === steps.length - 1 && (
                  <NavButton
                    variant='contained'
                    color='secondary'
                    fullWidth={isMobile}
                    onClick={() => {
                      if (isRetailerFlow) {
                        setSubmitDialogOpen(true);
                      } else {
                        handleEnd('draft');
                      }
                    }}
                    disabled={saveDraftDisabled}
                  >
                    {loading ? <CircularProgress size={22} color='inherit' /> : saveDraftLabel}
                  </NavButton>
                )}

                {/* Decline — admin only, last step */}
                {activeStep === steps.length - 1 && !isShared && isAdmin && (
                  <NavButton
                    variant='contained'
                    color='error'
                    fullWidth={isMobile}
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
                  >
                    Decline
                  </NavButton>
                )}

                {/* Accept (admin) OR Next */}
                {activeStep === steps.length - 1 && !isShared && isAdmin ? (
                  <NavButton
                    variant='contained'
                    color='primary'
                    fullWidth={isMobile}
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
                  >
                    Accept
                  </NavButton>
                ) : activeStep < steps.length - 1 ? (
                  <NavButton
                    variant='contained'
                    color='primary'
                    fullWidth={isMobile}
                    onClick={handleNext}
                  >
                    Next
                  </NavButton>
                ) : null}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* ── Floating cart bar (Products step only) ── */}
      <Slide direction='up' in={showCartBar} mountOnEnter unmountOnExit>
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1200,
            px: { xs: 2, sm: 4, md: 6 },
            py: { xs: 1.5, sm: 2 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: `2px solid ${theme.palette.primary.main}40`,
            background: isDark
              ? 'rgba(18,18,28,0.96)'
              : 'rgba(255,255,255,0.97)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Cart summary */}
          <Box display='flex' alignItems='center' gap={1.5}>
            <ShoppingCart sx={{ color: 'primary.main', fontSize: { xs: 20, sm: 24 } }} />
            <Box>
              <Typography
                variant='subtitle1'
                fontWeight={700}
                sx={{ lineHeight: 1.1, fontSize: { xs: '0.9rem', sm: '1rem' } }}
              >
                ₹{totals.totalAmount.toLocaleString('en-IN')}
              </Typography>
              <Typography
                variant='caption'
                color='text.secondary'
                sx={{ fontSize: { xs: '0.65rem', sm: '0.72rem' } }}
              >
                {selectedProducts.length} item{selectedProducts.length !== 1 ? 's' : ''} selected
              </Typography>
            </Box>
          </Box>

          {/* Go to Review */}
          <NavButton
            variant='contained'
            color='primary'
            endIcon={<ArrowForward />}
            onClick={() => setActiveStep(steps.length - 1)}
            sx={{ px: { xs: 2, sm: 3 }, py: { xs: 0.75, sm: 1 } }}
          >
            {isMobile ? 'Review' : 'Review Order'}
          </NavButton>
        </Paper>
      </Slide>

      {/* ── Submit Order confirmation dialog (shared / customer users) ── */}
      <Dialog
        open={submitDialogOpen}
        onClose={() => setSubmitDialogOpen(false)}
        maxWidth='xs'
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          Submit Order?
        </DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary'>
            Your order will be sent to your sales representative for processing.
            Please confirm all products and quantities are correct before submitting.
          </Typography>
          {totals.totalAmount > 0 && (
            <Box
              sx={{
                mt: 2,
                p: 1.5,
                borderRadius: 2,
                bgcolor: 'action.hover',
                border: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <Typography variant='body2' color='text.secondary' fontWeight={500}>
                Order Total
              </Typography>
              <Typography variant='body2' fontWeight={700} color='primary.main'>
                ₹{totals.totalAmount.toLocaleString('en-IN')}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <NavButton
            variant='outlined'
            color='secondary'
            onClick={() => setSubmitDialogOpen(false)}
            disabled={loading}
          >
            Go Back
          </NavButton>
          <NavButton
            variant='contained'
            color='primary'
            startIcon={loading ? undefined : <CheckCircle />}
            onClick={async () => {
              setSubmitDialogOpen(false);
              await handleEnd('draft', isShared);
            }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={22} color='inherit' /> : 'Confirm & Submit'}
          </NavButton>
        </DialogActions>
      </Dialog>

      {/* ── Margins dialog (sales/admin roles only) ── */}
      {canViewMargins && (
        <Dialog
          open={marginDialogOpen}
          onClose={() => setMarginDialogOpen(false)}
          maxWidth='sm'
          fullWidth
          fullScreen={isMobile}
          PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3 } }}
        >
          <DialogTitle sx={{ fontWeight: 700, pb: 1, pr: 6 }}>
            Customer Margins
            {customer && (
              <Typography variant='body2' color='text.secondary' sx={{ fontWeight: 400, mt: 0.25 }}>
                {customer.company_name || customer.contact_name}
              </Typography>
            )}
            <IconButton
              onClick={() => setMarginDialogOpen(false)}
              size='small'
              sx={{ position: 'absolute', top: 12, right: 12 }}
            >
              <Close fontSize='small' />
            </IconButton>
          </DialogTitle>

          <DialogContent>
            {/* Overall margin */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 2,
                borderRadius: 2,
                bgcolor: 'action.hover',
                border: `1px solid ${theme.palette.divider}`,
                mb: 2,
              }}
            >
              <Box>
                <Typography variant='caption' color='text.secondary' fontWeight={600}>
                  DEFAULT MARGIN
                </Typography>
                <Typography variant='body1' fontWeight={700}>
                  {customer?.cf_margin || '40%'}
                </Typography>
              </Box>
              <Typography variant='caption' color='text.secondary' sx={{ maxWidth: 160, textAlign: 'right' }}>
                Applied to all products without a special margin
              </Typography>
            </Box>

            {/* Special margins — grouped by brand */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Typography variant='subtitle2' fontWeight={700}>
                Special Margins by Brand
              </Typography>
              {Object.keys(specialMarginsByBrand).length > 0 && (
                <Chip
                  size='small'
                  label={`${Object.keys(specialMarginsByBrand).length} brand${Object.keys(specialMarginsByBrand).length !== 1 ? 's' : ''}`}
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              )}
            </Box>

            {specialMarginsList.length === 0 ? (
              <Typography variant='body2' color='text.secondary' sx={{ py: 2, textAlign: 'center' }}>
                No special margins set for this customer.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {Object.entries(specialMarginsByBrand).map(([brand, { brandMargin, exceptions }]) => (
                  <Box
                    key={brand}
                    sx={{
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 2,
                      overflow: 'hidden',
                    }}
                  >
                    {/* Brand header row */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        px: 2,
                        py: 1.25,
                        bgcolor: 'action.hover',
                      }}
                    >
                      <Typography variant='body2' fontWeight={700}>
                        {brand}
                      </Typography>
                      <Chip
                        size='small'
                        label={brandMargin}
                        color='primary'
                        sx={{ fontSize: '0.75rem', height: 22, fontWeight: 700 }}
                      />
                    </Box>

                    {/* Exceptions: products with a margin different from the brand margin */}
                    {exceptions.length > 0 && (
                      <>
                        <Divider />
                        <Table size='small'>
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 600, py: 0.75 }}>
                                Product (different margin)
                              </TableCell>
                              <TableCell align='right' sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 600, py: 0.75 }}>
                                Margin
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {exceptions.map((item: any) => (
                              <TableRow key={item.product_id} hover>
                                <TableCell sx={{ fontSize: '0.8rem', wordBreak: 'break-word' }}>
                                  {item.name}
                                </TableCell>
                                <TableCell align='right'>
                                  <Chip
                                    size='small'
                                    label={item.margin}
                                    color='warning'
                                    variant='outlined'
                                    sx={{ fontSize: '0.75rem', height: 22, fontWeight: 700 }}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </>
                    )}
                  </Box>
                ))}
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <NavButton variant='contained' color='primary' onClick={() => setMarginDialogOpen(false)}>
              Close
            </NavButton>
          </DialogActions>
        </Dialog>
      )}

      {/* ── Snackbars ── */}
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
          <Alert onClose={handleClose} severity={error.status} sx={{ width: '100%' }}>
            {error.message}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
};

export default NewOrder;
