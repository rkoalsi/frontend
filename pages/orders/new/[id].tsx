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
  FormGroup,
  FormControlLabel,
  Checkbox,
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
import { getEffectiveMarginPct } from '../../../src/util/margin';
import SheetsDisplay from '../../../src/components/OrderForm/SheetDisplay';
import AuthContext from '../../../src/components/Auth';
import CustomerTour, { TourStep } from '../../../src/components/common/CustomerTour';

const ORDERS_TOUR_STEPS: TourStep[] = [
  {
    target: null,
    title: 'Your Order Form',
    content: "This is where you build and submit your order. We'll walk you through each section so you know exactly what to do.",
  },
  {
    target: 'order-header',
    title: 'Order Details',
    content: "This card shows your name, the current order status (Draft → Sent → Accepted), and your estimate number once the order is submitted. You can tap the estimate number to copy it.",
  },
  {
    target: 'order-share',
    title: 'Share This Order',
    content: "Once your addresses are set, a 'Share Link' button appears here. Use it to copy a link you can send to someone else — they can view and even help fill in this order without needing to log in.",
  },
  {
    target: 'order-download',
    title: 'Download Order Form',
    content: "This section lets you open your order as a Google Sheet — handy for offline browsing or sharing a formatted copy. You can also download it as an Excel file.",
  },
  {
    target: 'order-stepper',
    mobileTarget: 'order-stepper-header',
    title: 'Step 2 — Billing Address',
    content: "Choose the address your invoice should be billed to. If you have multiple addresses saved, tap one to select it. To add a new address, get in touch with a sales person.",
  },
  {
    target: 'order-stepper',
    mobileTarget: 'order-stepper-header',
    title: 'Step 3 — Shipping Address',
    content: "Pick where you'd like the order delivered. If it's the same as your billing address, tap 'Use billing address' to copy it across — no need to enter it twice.",
  },
  {
    target: 'order-stepper',
    mobileTarget: 'order-stepper-header',
    title: 'Step 4 — Products',
    content: "Browse and add items to your cart. Grouped cards show a product with multiple variants (e.g. different sizes or flavours) — tap a variant to set its quantity. Individual cards are single-SKU items.",
  },
  {
    target: 'order-stepper',
    mobileTarget: 'order-stepper-header',
    title: 'Step 5 — Review & Submit',
    content: "Check your items, quantities, and totals. Once everything looks good, tap 'Submit Order'. If you saved a draft first, the button becomes 'Update Order' — you can keep editing and resubmit as many times as you need.",
  },
];

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

// Helper to update order data. Returns true on success so callers can avoid
// advancing the wizard when a save silently failed. `silent` suppresses the
// failure toast for background auto-saves.
const updateOrderData = async (
  id: string,
  data: any,
  options: { silent?: boolean } = {}
): Promise<boolean> => {
  try {
    await api.put(`/orders/${id}`, data);
    return true;
  } catch (error) {
    console.error('Error updating order:', error);
    if (!options.silent) {
      toast.error('Failed to save order changes. Please check your connection and try again.');
    }
    return false;
  }
};

// Clipboard write with feedback on failure (clipboard API needs HTTPS / permission)
const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Clipboard write failed:', error);
    toast.error('Could not copy to clipboard.');
    return false;
  }
};

const addressCaption = (addr: any) =>
  addr ? [addr.city, addr.state].filter(Boolean).join(', ') || addr.address || '' : '';

// One max width shared by every section (back button, header, sheet download,
// stepper card) so they all align on large screens.
const PAGE_MAX_WIDTH = { xs: '100%', sm: '700px', md: '900px', lg: '1200px' };

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
  const isAdmin = user?.role?.includes('admin');
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
  // Self-registered B2B customers pay online (Pay Now) instead of submitting an
  // order, and have a minimum cart value before payment is allowed.
  const [payConfig, setPayConfig] = useState<{ is_self_registered: boolean; min_order_value: number }>({
    is_self_registered: false,
    min_order_value: 0,
  });
  const [billingAddress, setBillingAddress] = useState<any>(null);
  const [shippingAddress, setShippingAddress] = useState<any>(null);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [activeStep, setActiveStep] = useState<number>(isShared ? 3 : (isCustomerUser ? 1 : 0));
  const [open, setOpen] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);
  const [sort, setSort] = useState<string>('default');
  const [link, setLink] = useState(''); // populated by getOrder once the order loads
  const [linkCopied, setLinkCopied] = useState<boolean>(false);
  const [specialMargins, setSpecialMargins] = useState<{ [key: string]: string }>({});
  const [specialMarginsList, setSpecialMarginsList] = useState<any[]>([]);
  const [marginDialogOpen, setMarginDialogOpen] = useState(false);

  // Group special margins by brand; derive brand margin (mode) and flag exceptions
  const specialMarginsByBrand = useMemo(() => {
    const grouped: Record<string, { brandMargin: string; allProducts: any[]; exceptions: any[] }> = {};
    const byBrand: Record<string, any[]> = {};
    for (const item of specialMarginsList) {
      const brand = item.brand || 'Unknown';
      if (!byBrand[brand]) byBrand[brand] = [];
      byBrand[brand].push(item);
    }
    for (const [brand, products] of Object.entries(byBrand)) {
      // Mode: pick the most frequent margin in this brand group as the summary chip
      const freq: Record<string, number> = {};
      for (const p of products) freq[p.margin] = (freq[p.margin] || 0) + 1;
      const brandMargin = Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
      const exceptions = products.filter((p) => p.margin !== brandMargin);
      grouped[brand] = { brandMargin, allProducts: products, exceptions };
    }
    return grouped;
  }, [specialMarginsList]);
  const [addressDetails, setAddressDetails] = useState<Record<string, any>>({});

  // Submit confirmation dialog (for shared/customer users)
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [estimateSelectOpen, setEstimateSelectOpen] = useState(false);
  const [estimateTypes, setEstimateTypes] = useState({ stock: true, pre_order: true });
  const [pendingAction, setPendingAction] = useState<'draft' | 'accepted' | 'declined'>('draft');

  // Auto-save indicator — wraps updateOrderData so the UI can show
  // "Saving… / All changes saved / Save failed" near the stepper.
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saveStatusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveOrder = useCallback(
    async (data: any, options: { silent?: boolean } = {}) => {
      if (saveStatusTimer.current) clearTimeout(saveStatusTimer.current);
      setSaveStatus('saving');
      const ok = await updateOrderData(id as string, data, options);
      setSaveStatus(ok ? 'saved' : 'error');
      if (ok) {
        saveStatusTimer.current = setTimeout(() => setSaveStatus('idle'), 2500);
      }
      return ok;
    },
    [id]
  );
  useEffect(() => () => {
    if (saveStatusTimer.current) clearTimeout(saveStatusTimer.current);
  }, []);

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
        const isSplitP = product.pre_order === true && (product.stock ?? 0) > 0;
        const baseQty = parseInt(product.quantity?.toString() || '0', 10) || 0;
        const preQty = isSplitP ? (parseInt(product.pre_order_quantity?.toString() || '0', 10) || 0) : 0;
        const quantity = isSplitP ? (baseQty + preQty) : (baseQty || 1);
        // Margin precedence: live special margin → live customer margin →
        // customer margin embedded on the order (what shared-link visitors
        // rely on) → margin stored on the order line when added → 40% default.
        const marginStr =
          specialMargins[product._id] ||
          customer?.cf_margin ||
          order?.customer_margin ||
          product.margin ||
          '40%';
        // Clearance items add their bonus margin on top of the base margin.
        const marginPct = getEffectiveMarginPct(marginStr, product);
        const margin = marginPct / 100;
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
    const prev = lastUpdateDataRef.current;
    // Skip the very first debounce tick if the cart is empty (order hasn't loaded yet).
    // Once prev is set we allow saving an empty cart so removals are persisted.
    if (!prev && !debProducts.length && !debTotals.totalAmount) return;
    const quantitySig = debProducts.map((p: any) => `${p._id}:${p.quantity}:${p.pre_order_quantity ?? 0}`).join(',');
    const prevSig = prev?.quantitySig;
    if (
      prev &&
      prev.length === debProducts.length &&
      prev.totalAmount === debTotals.totalAmount &&
      prevSig === quantitySig
    ) return;
    // Strip out any products where both quantities are 0 (shouldn't be in cart)
    const validProducts = debProducts.filter(
      (p: any) => (p.quantity ?? 0) > 0 || (p.pre_order_quantity ?? 0) > 0
    );
    saveOrder(
      {
        products: validProducts,
        total_gst: parseFloat(debTotals.totalGST.toFixed(2)),
        total_amount: parseFloat(debTotals.totalAmount.toFixed(2)),
      },
      { silent: true } // background auto-save — don't toast on every retry
    );
    lastUpdateDataRef.current = {
      length: debProducts.length,
      totalAmount: debTotals.totalAmount,
      quantitySig,
    };
  }, [debouncedData, saveOrder]);

  // ------------------ Update Addresses ---------------------
  // Guard: skip the first population that comes from getOrder() to avoid
  // a spurious PUT immediately after the order loads.
  useEffect(() => {
    if (!hasOrderLoaded.current) return;
    if (billingAddress || shippingAddress) {
      saveOrder(
        {
          billing_address: billingAddress,
          shipping_address: shippingAddress,
        },
        { silent: true }
      );
    }
  }, [billingAddress, shippingAddress, saveOrder]);

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
  const hasOrderLoaded = useRef(false);
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

      // Seed special margins from the order itself — this is what shared-link
      // visitors price with; authenticated users get the same data refreshed
      // by the customer effect once the customer loads.
      if (
        orderData.special_margins &&
        Object.keys(orderData.special_margins).length > 0
      ) {
        setSpecialMargins((prev) =>
          Object.keys(prev).length > 0 ? prev : orderData.special_margins
        );
      }

      if (batchRes && orderData.products && orderData.products.length > 0) {
        const productMap: Record<string, any> = batchRes.data.products || {};
        const removedPreOrderNames: string[] = [];
        const detailedProducts = orderData.products.reduce((acc: any[], p: any) => {
          const currentProduct = productMap[p.product_id] || {};
          // Remove if this was a pre-order product (saved with pre_order:true or with stock:0
          // and pre_order not explicitly false) that admin has since turned off
          const wasPreOrder = p.pre_order === true || (p.pre_order !== false && p.stock === 0);
          if (wasPreOrder && currentProduct.pre_order === false && currentProduct.stock === 0) {
            removedPreOrderNames.push(p.name || currentProduct.name || 'Unknown product');
            return acc;
          }
          acc.push({ ...p, ...currentProduct });
          return acc;
        }, []);
        setSelectedProducts(detailedProducts);
        if (removedPreOrderNames.length) {
          setTimeout(() => {
            toast.info(
              `Removed ${removedPreOrderNames.length} item${removedPreOrderNames.length !== 1 ? 's' : ''} no longer available for pre-order: ${removedPreOrderNames.join(', ')}`
            );
          }, 500);
        }
      }

      setOrder(orderData);
      hasOrderLoaded.current = true;
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
              await saveOrder({
                customer_id: customerData._id,
                billing_address: defaultAddress,
                shipping_address: defaultAddress,
              });
            } else {
              await saveOrder({ customer_id: customerData._id });
            }
            setActiveStep(1);
          }
        } catch (error) {
          console.error('Error fetching customer for user:', error);
        }
      }
    };
    fetchCustomerForUser();
  }, [isCustomerUser, userCustomerId, user, customer, id, saveOrder]);

  useEffect(() => {
    if (isCustomerUser && !isShared && activeStep === 0) setActiveStep(1);
  }, [isCustomerUser, isShared, activeStep]);

  // Load payment config (self-registered? minimum order value?) for this order.
  useEffect(() => {
    if (!id) return;
    api
      .get(`/payments/order/${id}/config`)
      .then((r) => setPayConfig(r.data))
      .catch(() => {});
  }, [id]);

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
    const saved = await saveOrder(body);
    if (!saved) return; // don't advance when the save failed
    setActiveStep((prev) => Math.min(prev + 1, STEP_HELP.length - 1));
  }, [activeStep, saveOrder, validateAndCollectData]);

  const handleEnd = useCallback(
    async (status = 'draft', notify_sp = false, createFlags?: { stock: boolean; pre_order: boolean }) => {
      setLoading(true);
      let finalised = false;
      try {
        const resp = await api.post('/orders/finalise', {
          order_id: id,
          status,
          create_stock: createFlags?.stock ?? true,
          create_pre_order: createFlags?.pre_order ?? true,
        });
        if (resp.status === 200) {
          finalised = resp.data.status === 'success';
          await getOrder();
          toast[finalised ? 'success' : 'error'](resp.data.message);
        }
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
      // Notify separately — a notification failure must not read as a failed order
      if (finalised && notify_sp) {
        try {
          await api.post('/orders/notify', { order_id: id });
        } catch (error) {
          console.error('Error notifying sales person:', error);
          toast.warn('Order submitted, but the sales person notification could not be sent.');
        }
      }
    },
    [id, getOrder]
  );

  const generateSharedLink = useCallback(async () => {
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
    if (await copyToClipboard(link)) setLinkCopied(true);
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
      // Validate every step between the current one and the target so a
      // forward jump (e.g. Customer → Review) can't skip required data.
      let mergedBody: any = {};
      for (let step = activeStep; step < index; step++) {
        const { message, body } = validateAndCollectData(step);
        if (message) {
          toast.error(message);
          if (step !== activeStep) setActiveStep(step); // land on the first incomplete step
          return;
        }
        mergedBody = { ...mergedBody, ...body };
      }
      const saved = await saveOrder(mergedBody);
      if (saved) setActiveStep(index);
    },
    [activeStep, isShared, selectedProducts, validateAndCollectData, saveOrder, isCustomerUser]
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

  // A paid order is locked — customers can no longer edit it. Send them to the
  // read-only order details view. (Admins/sales can still open it if needed.)
  useEffect(() => {
    if (!order || !isCustomerUser) return;
    const paid = (order?.payment?.status || '').toLowerCase() === 'paid';
    if (paid) {
      toast.info('This order has been paid and can no longer be edited.');
      router.push(`/orders/past/${order._id}`);
    }
  }, [order, isCustomerUser, router]);

  // Count cart "rows": split products with both quantities set contribute 2 rows
  const cartRowCount = selectedProducts.reduce((n: number, p: any) => {
    const isSplit = p.pre_order === true && (p.stock ?? 0) > 0;
    if (isSplit) return n + ((p.quantity ?? 0) > 0 ? 1 : 0) + ((p.pre_order_quantity ?? 0) > 0 ? 1 : 0);
    return n + 1;
  }, 0);

  // Per-step context shown under the stepper labels once a step has data
  const stepCaptions = useMemo<string[]>(
    () => [
      customer ? customer.company_name || customer.contact_name || '' : '',
      addressCaption(billingAddress),
      addressCaption(shippingAddress),
      cartRowCount
        ? `${cartRowCount} item${cartRowCount !== 1 ? 's' : ''} · ₹${totals.totalAmount.toLocaleString('en-IN')}`
        : '',
      '',
    ],
    [customer, billingAddress, shippingAddress, cartRowCount, totals.totalAmount]
  );

  const handleCopyEstimate = async () => {
    if (order?.estimate_number && (await copyToClipboard(order.estimate_number))) {
      toast.success('Estimate number copied');
    }
  };

  const updateCart = async () => {
    setLoading(true);
    try {
      await api.get('/orders/update_cart', {
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
      const { data = {} } = await api.get('/orders/download_order_form', {
        params: { customer_id: customer._id, order_id: order._id, sort },
      });
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
      const response = await api.get('/orders/download_order_xlsx', {
        params: { customer_id: customer._id, order_id: order._id, sort },
        responseType: 'arraybuffer',
      });
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
      await api.delete(`/orders/clear_sheet/${order._id}`);
      const { data = {} } = await api.get('/orders/download_order_form', {
        params: { customer_id: customer._id, order_id: order._id, sort },
      });
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
  const saveDraftLabel = isRetailerFlow
    ? (order?.estimate_created ? 'Update Order' : 'Submit Order')
    : 'Save As Draft';
  const hasStockExceeded = selectedProducts.some(
    (p) => !p.pre_order && (p.quantity || 1) > (p.stock ?? Infinity)
  );
  const _hasStockItems = selectedProducts.some((p: any) => !p.pre_order || ((p.stock ?? 0) > 0 && (p.quantity ?? 0) > 0));
  const _hasPreOrderItems = selectedProducts.some((p: any) => p.pre_order && ((p.stock ?? 0) > 0 ? (p.pre_order_quantity ?? 0) > 0 : (p.quantity ?? 0) > 0));
  // Collect every reason the submit button is blocked so the tooltip can say
  // exactly what's missing instead of leaving a silently disabled button.
  // For dual-estimate orders, only block when BOTH estimates are finalised.
  // For single-estimate orders, fall back to checking order.status directly.
  const allEstimatesFinalised: boolean = (() => {
    const finalStatuses = ['accepted', 'declined'];
    if (order?.pre_order_estimate_created) {
      const stockDone = finalStatuses.includes((order?.estimate_status || '').toLowerCase());
      const preOrderDone = finalStatuses.includes((order?.pre_order_estimate_status || '').toLowerCase());
      return stockDone && preOrderDone;
    }
    return order?.status ? !['draft', 'sent', 'deleted'].includes(order.status.toLowerCase()) : false;
  })();

  const saveDraftBlockers: string[] = [];
  // For shared-link visitors customer is null (unauthenticated) — don't block them
  if (!customer && !isShared) saveDraftBlockers.push('No customer selected');
  if (!billingAddress) saveDraftBlockers.push('No billing address selected');
  if (!shippingAddress) saveDraftBlockers.push('No shipping address selected');
  if (selectedProducts.length === 0) saveDraftBlockers.push('No products added');
  if (!isShared && allEstimatesFinalised) {
    saveDraftBlockers.push(`Order is already ${order?.status?.toLowerCase()}`);
  }
  if (hasStockExceeded) saveDraftBlockers.push('One or more products exceed available stock');
  const saveDraftDisabled = saveDraftBlockers.length > 0 || loading;

  // Floating cart bar: show on Products step when items are selected
  const showCartBar = activeStep === 3 && selectedProducts.length > 0;

  // On phones the inline nav buttons sit below a long step card, so for the
  // Customer/Billing/Shipping steps show a fixed Previous/Next bar instead.
  // Products (cart bar) and Review (multiple action buttons) keep inline nav.
  const showMobileNavBar = isMobile && activeStep < 3;

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
        // Extra bottom padding when a fixed bottom bar (cart or nav) is visible.
        // env(safe-area-inset-bottom) keeps the bars clear of the iOS home indicator.
        paddingBottom: showCartBar
          ? {
              xs: 'calc(80px + env(safe-area-inset-bottom))',
              sm: 'calc(88px + env(safe-area-inset-bottom))',
              md: 'calc(96px + env(safe-area-inset-bottom))',
            }
          : showMobileNavBar
            ? 'calc(80px + env(safe-area-inset-bottom))'
            : undefined,
      }}
    >
      {/* ── Back navigation (not shown on shared/customer links) ── */}
      {!isShared && !isCustomerUser && (
        <Box
          sx={{
            width: '100%',
            maxWidth: PAGE_MAX_WIDTH,
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
            Back 
          </Button>
        </Box>
      )}

      {/* ── Header card ── */}
      <Paper
        data-tour='order-header'
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: PAGE_MAX_WIDTH,
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
                      label={`${order.estimate_number}${order.estimate_status ? ` · ${order.estimate_status.charAt(0).toUpperCase() + order.estimate_status.slice(1)}` : ''}`}
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

                {/* Pre-order estimate number */}
                {order?.pre_order_estimate_created && (
                  <Tooltip title='Copy pre-order estimate number'>
                    <Chip
                      size='small'
                      label={`${order.pre_order_estimate_number} (Pre Order)${order.pre_order_estimate_status ? ` · ${order.pre_order_estimate_status.charAt(0).toUpperCase() + order.pre_order_estimate_status.slice(1)}` : ''}`}
                      icon={<ContentCopy sx={{ fontSize: '12px !important' }} />}
                      onClick={async () => {
                        if (order?.pre_order_estimate_number && (await copyToClipboard(order.pre_order_estimate_number))) {
                          toast.success('Pre-order estimate number copied');
                        }
                      }}
                      variant='outlined'
                      color='warning'
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
                      data-tour='order-share'
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
        !['accepted', 'declined'].includes(order?.status?.toLowerCase()) && (
          <Box
            data-tour='order-download'
            sx={{
              width: '100%',
              maxWidth: PAGE_MAX_WIDTH,
              alignSelf: 'center',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            {link ? (
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
            )}
          </Box>
        )}

      {/* ── Main stepper card ── */}
      <Box
        sx={{
          flexGrow: 1,
          width: '100%',
          maxWidth: PAGE_MAX_WIDTH,
          alignSelf: 'center',
        }}
      >
        <Card
          data-tour='order-stepper'
          sx={{
            width: '100%',
            borderRadius: 3,
            // 'visible' (not MUI Card's default 'hidden') so the sticky product
            // search bar inside can stick to the viewport while scrolling
            overflow: 'visible',
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: isDark
              ? '0 4px 20px rgba(0,0,0,0.3)'
              : '0 4px 20px rgba(0,0,0,0.08)',
            background: theme.palette.background.paper,
          }}
        >
          <CardContent sx={{ padding: { xs: 1.5, sm: 2.5, md: 3.5 }, overflow: 'visible' }}>
            {/* Auto-save status */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                minHeight: 18,
                mb: 0.5,
                gap: 0.5,
              }}
            >
              {saveStatus === 'saving' && (
                <>
                  <CircularProgress size={11} thickness={5} />
                  <Typography variant='caption' color='text.secondary' sx={{ fontSize: '0.68rem' }}>
                    Saving…
                  </Typography>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <CheckCircle sx={{ fontSize: 13, color: 'success.main' }} />
                  <Typography variant='caption' sx={{ fontSize: '0.68rem', color: 'success.main' }}>
                    All changes saved
                  </Typography>
                </>
              )}
              {saveStatus === 'error' && (
                <Typography variant='caption' sx={{ fontSize: '0.68rem', color: 'error.main', fontWeight: 600 }}>
                  Save failed — changes will retry on your next edit
                </Typography>
              )}
            </Box>

            {/* Stepper */}
            <Stepper
              data-tour='order-stepper-header'
              activeStep={activeStep}
              alternativeLabel
              sx={{
                marginTop: { xs: 1, md: 0 },
                marginBottom: { xs: 1.5, md: 2.5 },
                '& .MuiStepLabel-label': {
                  fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.9rem' },
                  marginTop: { xs: '4px', md: '8px' },
                  fontWeight: 600,
                  color: isDark ? 'rgba(255,255,255,0.45)' : 'text.secondary',
                  // Phones: five labels don't fit legibly, so show only the
                  // active step's label; the icons still convey progress.
                  display: { xs: 'none', sm: 'block' },
                  '&.Mui-active': {
                    color: 'primary.main',
                    fontWeight: 700,
                    display: 'block',
                  },
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
              {STEP_HELP.map((step, index) => {
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
                      optional={
                        stepCaptions[index] ? (
                          <Typography
                            variant='caption'
                            sx={{
                              display: { xs: 'none', sm: 'block' },
                              color: 'text.secondary',
                              fontSize: '0.65rem',
                              textAlign: 'center',
                              maxWidth: 120,
                              mx: 'auto',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {stepCaptions[index]}
                          </Typography>
                        ) : undefined
                      }
                    >
                      {isDisabledForCustomer ? customerStep0Label : displayName}
                    </StepLabel>
                  </Step>
                );
              })}
            </Stepper>

            {/* Per-step contextual help text */}
            {STEP_HELP[activeStep]?.helpText && (
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
                {STEP_HELP[activeStep].helpText}
              </Typography>
            )}

            {/* Step content */}
            <Box sx={{ minHeight: '100px' }}>
              {/* Steps 0-2: lightweight, mount only when active */}
              {activeStep === 0 && !isShared && (
                <Box sx={{ padding: { xs: 1.5, sm: 2, md: 3 } }}>
                  <CustomerSearchBar
                    disabled={isCustomerUser || ['declined', 'accepted'].includes(order?.status?.toLowerCase())}
                    label={isCustomerUser ? 'Your Account' : 'Select Customer'}
                    onChange={async (value: any) => {
                      setCustomer(value);
                      if (value?.addresses && value.addresses.length > 0) {
                        const defaultAddress = value.addresses[0];
                        setBillingAddress(defaultAddress);
                        setShippingAddress(defaultAddress);
                        await saveOrder({
                          customer_id: value._id,
                          billing_address: defaultAddress,
                          shipping_address: defaultAddress,
                        });
                      } else {
                        setBillingAddress(null);
                        setShippingAddress(null);
                        await saveOrder({ customer_id: value?._id });
                      }
                    }}
                    value={customer}
                    initialValue={customer}
                    onChangeReference={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setReferenceNumber(e.target.value)
                    }
                    reference={referenceNumber}
                  />
                </Box>
              )}
              {activeStep === 1 && !isShared && (
                <Box sx={{ padding: { xs: 1.5, sm: 2, md: 3 } }}>
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
                </Box>
              )}
              {activeStep === 2 && !isShared && (
                <Box sx={{ padding: { xs: 1.5, sm: 2, md: 3 } }}>
                  {billingAddress && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                      {(() => {
                        const sameAsBilling =
                          billingAddress.address_id && shippingAddress?.address_id
                            ? billingAddress.address_id === shippingAddress.address_id
                            : JSON.stringify(billingAddress) === JSON.stringify(shippingAddress);
                        return sameAsBilling ? (
                          <Chip
                            icon={<CheckCircle sx={{ fontSize: 16 }} />}
                            label='Same as billing address'
                            color='success'
                            variant='outlined'
                            size='small'
                            sx={{ fontWeight: 600 }}
                          />
                        ) : (
                          <Button
                            size='small'
                            variant='outlined'
                            startIcon={<ContentCopy sx={{ fontSize: 16 }} />}
                            onClick={() => setShippingAddress(billingAddress)}
                            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 24 }}
                          >
                            Use billing address
                          </Button>
                        );
                      })()}
                    </Box>
                  )}
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
                </Box>
              )}

              {/* Steps 3-4: kept mounted at all times — prevents re-fetch of products/brands
                  on every Products↔Review navigation, which was causing the page-unresponsive freeze */}
              <Box display={activeStep === 3 ? 'block' : 'none'}>
                <Suspense
                  fallback={
                    <Box display='flex' justifyContent='center' alignItems='center' minHeight='300px'>
                      <CircularProgress />
                    </Box>
                  }
                >
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
                </Suspense>
              </Box>
              <Box display={activeStep === 4 ? 'block' : 'none'}>
                <Box sx={{ padding: { xs: 1.5, sm: 2, md: 3 } }}>
                  <Suspense
                    fallback={
                      <Box display='flex' justifyContent='center' alignItems='center' minHeight='300px'>
                        <CircularProgress />
                      </Box>
                    }
                  >
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
                      isCustomerRole={isCustomerUser}
                      order={order}
                      referenceNumber={referenceNumber}
                      onPaymentSuccess={getOrder}
                      isSelfRegistered={payConfig.is_self_registered}
                      minOrderValue={payConfig.min_order_value}
                    />
                  </Suspense>
                </Box>
              </Box>
            </Box>

            {/* Navigation buttons (hidden on phones for steps 0-2 — fixed bar instead) */}
            <Box
              sx={{
                display: showMobileNavBar ? { xs: 'none', sm: 'flex' } : 'flex',
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
                {/* Save as Draft / Submit Order — last step only.
                    Self-registered customers pay online instead (Pay Now in Review),
                    so the submit button is hidden for them. */}
                {activeStep === STEP_HELP.length - 1 && !payConfig.is_self_registered && (
                  <Tooltip
                    title={saveDraftBlockers.length > 0 ? saveDraftBlockers.join(' · ') : ''}
                    arrow
                  >
                    <span>
                      <NavButton
                        variant='contained'
                        color='secondary'
                        fullWidth={isMobile}
                        onClick={() => {
                          if (isRetailerFlow) {
                            setSubmitDialogOpen(true);
                          } else {
                            const hasStock = selectedProducts.some((p) => !p.pre_order || ((p.stock ?? 0) > 0 && (p.quantity ?? 0) > 0));
                            const hasPreOrder = selectedProducts.some((p) => p.pre_order && ((p.stock ?? 0) > 0 ? (p.pre_order_quantity ?? 0) > 0 : (p.quantity ?? 0) > 0));
                            if (hasStock && hasPreOrder) {
                              setPendingAction('draft');
                              setEstimateTypes({ stock: !order?.estimate_created, pre_order: !order?.pre_order_estimate_created });
                              setEstimateSelectOpen(true);
                            } else {
                              handleEnd('draft');
                            }
                          }
                        }}
                        disabled={saveDraftDisabled}
                      >
                        {loading ? <CircularProgress size={22} color='inherit' /> : saveDraftLabel}
                      </NavButton>
                    </span>
                  </Tooltip>
                )}

                {/* Decline — admin only, last step */}
                {activeStep === STEP_HELP.length - 1 && !isShared && isAdmin && (
                  <NavButton
                    variant='contained'
                    color='error'
                    fullWidth={isMobile}
                    onClick={() => {
                      const hasStock = selectedProducts.some((p) => !p.pre_order || ((p.stock ?? 0) > 0 && (p.quantity ?? 0) > 0));
                      const hasPreOrder = selectedProducts.some((p) => p.pre_order && ((p.stock ?? 0) > 0 ? (p.pre_order_quantity ?? 0) > 0 : (p.quantity ?? 0) > 0));
                      if (hasStock && hasPreOrder) {
                        setPendingAction('declined');
                        setEstimateTypes({ stock: !order?.estimate_created, pre_order: !order?.pre_order_estimate_created });
                        setEstimateSelectOpen(true);
                      } else {
                        handleEnd('declined');
                      }
                    }}
                    disabled={
                      !customer ||
                      !billingAddress ||
                      !shippingAddress ||
                      selectedProducts.length === 0 ||
                      !totals.totalAmount ||
                      loading ||
                      allEstimatesFinalised
                    }
                  >
                    Decline
                  </NavButton>
                )}

                {/* Accept (admin) OR Next */}
                {activeStep === STEP_HELP.length - 1 && !isShared && isAdmin ? (
                  <NavButton
                    variant='contained'
                    color='primary'
                    fullWidth={isMobile}
                    onClick={() => {
                      const hasStock = selectedProducts.some((p) => !p.pre_order || ((p.stock ?? 0) > 0 && (p.quantity ?? 0) > 0));
                      const hasPreOrder = selectedProducts.some((p) => p.pre_order && ((p.stock ?? 0) > 0 ? (p.pre_order_quantity ?? 0) > 0 : (p.quantity ?? 0) > 0));
                      if (hasStock && hasPreOrder) {
                        setPendingAction('accepted');
                        setEstimateTypes({ stock: !order?.estimate_created, pre_order: !order?.pre_order_estimate_created });
                        setEstimateSelectOpen(true);
                      } else {
                        handleEnd('accepted');
                      }
                    }}
                    disabled={
                      !customer ||
                      !billingAddress ||
                      !shippingAddress ||
                      selectedProducts.length === 0 ||
                      !totals.totalAmount ||
                      loading ||
                      allEstimatesFinalised
                    }
                  >
                    Accept
                  </NavButton>
                ) : activeStep < STEP_HELP.length - 1 ? (
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

      {/* ── Fixed mobile nav bar (Customer/Billing/Shipping steps) ── */}
      <Slide direction='up' in={showMobileNavBar} mountOnEnter unmountOnExit>
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1200,
            px: 2,
            pt: 1.5,
            pb: 'calc(12px + env(safe-area-inset-bottom))',
            display: 'flex',
            gap: 1.5,
            borderTop: `2px solid ${theme.palette.primary.main}40`,
            background: isDark ? 'rgba(18,18,28,0.96)' : 'rgba(255,255,255,0.97)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <NavButton
            variant='outlined'
            color='secondary'
            sx={{ flex: 1 }}
            onClick={() =>
              activeStep === 0 ? router.push('/') : handleStepClick(activeStep - 1)
            }
          >
            {activeStep === 0 ? 'Cancel' : 'Previous'}
          </NavButton>
          <NavButton
            variant='contained'
            color='primary'
            endIcon={<ArrowForward sx={{ fontSize: 18 }} />}
            sx={{ flex: 1 }}
            onClick={handleNext}
          >
            Next
          </NavButton>
        </Paper>
      </Slide>

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
            pt: { xs: 1.5, sm: 2 },
            pb: {
              xs: 'calc(12px + env(safe-area-inset-bottom))',
              sm: 'calc(16px + env(safe-area-inset-bottom))',
            },
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
                {cartRowCount} item{cartRowCount !== 1 ? 's' : ''} selected
              </Typography>
            </Box>
          </Box>

          {/* Go to Review */}
          <NavButton
            variant='contained'
            color='primary'
            endIcon={<ArrowForward />}
            onClick={() => setActiveStep(STEP_HELP.length - 1)}
            sx={{ px: { xs: 2, sm: 3 }, py: { xs: 0.75, sm: 1 } }}
          >
            {isMobile ? 'Review' : 'Review Order'}
          </NavButton>
        </Paper>
      </Slide>

      {/* ── Estimate type selection dialog ── */}
      <Dialog
        open={estimateSelectOpen}
        onClose={() => setEstimateSelectOpen(false)}
        maxWidth='xs'
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          {pendingAction === 'accepted' ? 'Accept Order' : pendingAction === 'declined' ? 'Decline Order' : 'Save as Draft'} — Select Estimates
        </DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary' mb={2}>
            This order has both in-stock and pre-order items. Choose which estimates to create or update.
          </Typography>
          <FormGroup>
            {/* Select All */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={
                    (_hasStockItems ? estimateTypes.stock : true) &&
                    (_hasPreOrderItems ? estimateTypes.pre_order : true)
                  }
                  indeterminate={
                    _hasStockItems && _hasPreOrderItems && estimateTypes.stock !== estimateTypes.pre_order
                  }
                  onChange={(e) => {
                    const val = e.target.checked;
                    setEstimateTypes({
                      stock: _hasStockItems ? val : estimateTypes.stock,
                      pre_order: _hasPreOrderItems ? val : estimateTypes.pre_order,
                    });
                  }}
                />
              }
              label={<Typography variant='body2' fontWeight={700}>Select All</Typography>}
            />
            <Divider sx={{ mb: 1 }} />
            <FormControlLabel
              control={
                <Checkbox
                  checked={estimateTypes.stock}
                  onChange={(e) => setEstimateTypes((prev) => ({ ...prev, stock: e.target.checked }))}
                  disabled={!_hasStockItems}
                />
              }
              label={
                <Box>
                  <Typography variant='body2' fontWeight={700}>
                    In-Stock Estimate
                    {order?.estimate_number && (
                      <Chip label={order.estimate_number} size='small' sx={{ ml: 1, fontSize: '0.65rem', height: 18 }} />
                    )}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {selectedProducts.filter((p: any) => !p.pre_order || ((p.stock ?? 0) > 0 && (p.quantity ?? 0) > 0)).length} item{selectedProducts.filter((p: any) => !p.pre_order || ((p.stock ?? 0) > 0 && (p.quantity ?? 0) > 0)).length !== 1 ? 's' : ''}
                    {order?.estimate_created ? ' · will update existing estimate' : ' · will create new estimate'}
                  </Typography>
                </Box>
              }
            />
            <FormControlLabel
              sx={{ mt: 1 }}
              control={
                <Checkbox
                  checked={estimateTypes.pre_order}
                  onChange={(e) => setEstimateTypes((prev) => ({ ...prev, pre_order: e.target.checked }))}
                  disabled={!_hasPreOrderItems}
                />
              }
              label={
                <Box>
                  <Typography variant='body2' fontWeight={700} color='warning.main'>
                    Pre-Order Estimate
                    {order?.pre_order_estimate_number && (
                      <Chip label={`${order.pre_order_estimate_number} (Pre Order)`} size='small' color='warning' sx={{ ml: 1, fontSize: '0.65rem', height: 18 }} />
                    )}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {selectedProducts.filter((p: any) => p.pre_order && ((p.stock ?? 0) > 0 ? (p.pre_order_quantity ?? 0) > 0 : (p.quantity ?? 0) > 0)).length} item{selectedProducts.filter((p: any) => p.pre_order && ((p.stock ?? 0) > 0 ? (p.pre_order_quantity ?? 0) > 0 : (p.quantity ?? 0) > 0)).length !== 1 ? 's' : ''}
                    {order?.pre_order_estimate_created ? ' · will update existing estimate' : ' · will create new estimate'}
                  </Typography>
                </Box>
              }
            />
          </FormGroup>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button variant='outlined' onClick={() => setEstimateSelectOpen(false)} disabled={loading} sx={{ textTransform: 'none', borderRadius: 24 }}>
            Cancel
          </Button>
          <Button
            variant='contained'
            color={pendingAction === 'declined' ? 'error' : 'primary'}
            disabled={loading || (!estimateTypes.stock && !estimateTypes.pre_order)}
            onClick={async () => {
              setEstimateSelectOpen(false);
              await handleEnd(pendingAction, false, estimateTypes);
            }}
            sx={{ textTransform: 'none', borderRadius: 24, fontWeight: 700 }}
          >
            {loading ? (
              <CircularProgress size={22} color='inherit' />
            ) : pendingAction === 'accepted' ? (
              'Accept Order'
            ) : pendingAction === 'declined' ? (
              'Decline Order'
            ) : (
              'Save as Draft'
            )}
          </Button>
        </DialogActions>
      </Dialog>

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
            {/* Overall margin + GST treatment */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, mb: 2 }}>
              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'action.hover',
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Typography variant='caption' color='text.secondary' fontWeight={600}>
                  DEFAULT MARGIN
                </Typography>
                <Typography variant='body1' fontWeight={700}>
                  {customer?.cf_margin || '40%'}
                </Typography>
                <Typography variant='caption' color='text.secondary' sx={{ mt: 0.5 }}>
                  Applied to products without a special margin
                </Typography>
              </Box>

              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'action.hover',
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Typography variant='caption' color='text.secondary' fontWeight={600}>
                  GST TREATMENT
                </Typography>
                <Typography variant='body1' fontWeight={700}>
                  {customer?.cf_in_ex || 'Exclusive'}
                </Typography>
                <Typography variant='caption' color='text.secondary' sx={{ mt: 0.5 }}>
                  How GST is applied to selling price
                </Typography>
              </Box>
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

                    {/* Products with a margin different from the brand margin */}
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

      {/* ── Order tour (customer users only) ── */}
      {isCustomerUser && (
        <CustomerTour
          tourKey='orders'
          tourSeen={user?.tour_seen?.orders === true}
          steps={ORDERS_TOUR_STEPS}
          onStep={(i) => {
            // Navigate stepper to the relevant step so the user sees it live
            if (i === 4) setActiveStep(1); // Billing Address
            if (i === 5) setActiveStep(2); // Shipping Address
            if (i === 6) setActiveStep(3); // Products
            // Step 5 (Review) — don't navigate; cart is empty during tour so just spotlight the stepper
          }}
        />
      )}

      {/* ── Snackbars ── */}
      <Snackbar
        open={linkCopied}
        autoHideDuration={3000}
        onClose={() => setLinkCopied(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        // Clear the fixed cart/nav bars when one is showing
        sx={{ mb: showCartBar || showMobileNavBar ? 9 : 1 }}
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
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          sx={{ mb: showCartBar || showMobileNavBar ? 9 : 1 }}
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
