import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Divider,
  Typography,
  Paper,
  Stack,
  Chip,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Edit,
  Person,
  LocationOn,
  ShoppingCart,
  ArrowUpward,
  ArrowDownward,
  Close,
  LocalOffer,
  ArrowDropDown,
  Download,
  Inventory2,
  ShoppingCartCheckout,
  Payment,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import QuantitySelector from './QuantitySelector';
import { toast } from 'react-toastify';
import axiosInstance from '../../util/axios';
import { getEffectiveMarginPct } from '../../util/margin';
import ImagePopupDialog from '../common/ImagePopUp';
import ImageCarousel from './products/ImageCarousel';
import PaymentResultDialog, { PaymentResult } from './PaymentResultDialog';

// ── Helper sub-components ──────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <Box display='flex' gap={1.5} alignItems='baseline'>
      <Typography
        variant='caption'
        color='text.disabled'
        fontWeight={600}
        sx={{
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          fontSize: '0.62rem',
          width: { xs: 80, sm: 92 },
          flexShrink: 0,
        }}
      >
        {label}
      </Typography>
      <Typography
        variant='body2'
        color='text.primary'
        fontWeight={500}
        sx={{ fontSize: { xs: '0.875rem', sm: '0.9rem' } }}
      >
        {value || '—'}
      </Typography>
    </Box>
  );
}

function SectionHeader({
  icon,
  title,
  color,
  badge,
  onEdit,
}: {
  icon: React.ReactNode;
  title: string;
  color: string;
  badge?: number;
  onEdit?: () => void;
}) {
  return (
    <>
      <Box display='flex' alignItems='center' justifyContent='space-between' mb={1.5}>
        <Box display='flex' alignItems='center' gap={1}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              bgcolor: `${color}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
          <Typography variant='subtitle1' fontWeight={700} color='text.primary'>
            {title}
          </Typography>
          {badge !== undefined && (
            <Chip
              label={badge}
              size='small'
              sx={{
                height: 20,
                fontSize: '0.7rem',
                fontWeight: 700,
                bgcolor: `${color}20`,
                color,
              }}
            />
          )}
        </Box>
        {onEdit && (
          <IconButton
            size='small'
            onClick={onEdit}
            sx={{
              color: 'text.secondary',
              '&:hover': { color: 'text.primary', bgcolor: 'action.hover' },
            }}
          >
            <Edit sx={{ fontSize: 18 }} />
          </IconButton>
        )}
      </Box>
      <Divider sx={{ mb: { xs: 1.5, sm: 2 } }} />
    </>
  );
}

// ── Props ──────────────────────────────────────────────────────────

interface Props {
  customer: any;
  shippingAddress: any;
  billingAddress: any;
  products: any[];
  setSelectedProducts: any;
  totals: { totalGST: number; totalAmount: number };
  specialMargins: { [key: string]: string };
  setActiveStep: (step: number) => void;
  isShared: boolean;
  isCustomerRole?: boolean;
  order: any;
  referenceNumber: any;
  onPaymentSuccess?: () => void | Promise<void>;
  isSelfRegistered?: boolean;
  minOrderValue?: number;
}

// Format a brand_orders date string (e.g. "2026-05-21") as "21 May 2026".
// Falls back to the raw value if it isn't a parseable date.
const formatPreOrderDate = (value?: string): string => {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

// ── Main component ─────────────────────────────────────────────────

const Review: React.FC<Props> = React.memo((props) => {
  const {
    customer,
    shippingAddress,
    billingAddress,
    products,
    setSelectedProducts,
    totals,
    specialMargins,
    setActiveStep,
    isShared,
    isCustomerRole,
    order,
    referenceNumber,
    isSelfRegistered = false,
    minOrderValue = 0,
  } = props;

  // Self-registered customers must reach a minimum cart value before they can pay.
  const belowMinOrder = isSelfRegistered && minOrderValue > 0 && totals.totalAmount < minOrderValue;

  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const primaryColor = theme.palette.primary.main;
  const secondaryColor = theme.palette.secondary.main;

  const [openImagePopup, setOpenImagePopup] = useState(false);
  const [popupImageSrc, setPopupImageSrc]: any = useState([]);
  const [popupImageIndex, setPopupImageIndex] = useState(0);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [paymentResultMsg, setPaymentResultMsg] = useState<string>('');
  const [paidLocally, setPaidLocally] = useState(false);
  const [isScrollButtonDisabled, setIsScrollButtonDisabled] = useState(false);
  const [downloadMenuAnchor, setDownloadMenuAnchor] = useState<null | HTMLElement>(null);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const scrollToBottom = useCallback(() => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  }, []);

  // ── PDF Download ────────────────────────────────────────────────
  const downloadAsPDF = async (type: 'stock' | 'pre_order' = 'stock') => {
    setPdfLoading(true);
    try {
      const url = type === 'pre_order'
        ? `/orders/download_pdf/${order._id}?type=pre_order`
        : `/orders/download_pdf/${order._id}`;
      const resp = await axiosInstance.get(url, { responseType: 'blob' });
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
        if (match && match[1]) fileName = match[1];
      }
      const blob = new Blob([resp.data], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      toast.error(error.message || 'Failed to download PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  // ── Razorpay Checkout ───────────────────────────────────────────
  // Lazy-load the Razorpay Checkout script once.
  const loadRazorpayScript = (): Promise<boolean> =>
    new Promise((resolve) => {
      if ((window as any).Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  // Poll the order's payment/estimate status until it resolves (or times out).
  // The estimate is created in the background after /verify, so we wait for it
  // here to show the result the moment it's ready instead of a blank screen.
  const pollOrderStatus = async (
    orderId: string,
    { tries = 45, interval = 2000 }: { tries?: number; interval?: number } = {}
  ): Promise<any | null> => {
    for (let i = 0; i < tries; i += 1) {
      try {
        const { data } = await axiosInstance.get(`/payments/order/${orderId}/status`);
        if (data?.done || data?.payment_status === 'failed') return data;
      } catch (_e) {
        /* transient — keep polling */
      }
      await new Promise((r) => setTimeout(r, interval));
    }
    return null; // timed out — payment is captured, estimate still finalising
  };

  const verifyPayment = async (response: any) => {
    // Show the loader immediately while we confirm with the server.
    setPaymentResultMsg('');
    setPaymentResult('processing');
    try {
      const verifyResp = await axiosInstance.post('/payments/verify', {
        order_id: order._id,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      });

      if (!verifyResp.data?.success) {
        setPaymentResultMsg(verifyResp.data?.detail || 'Payment verification failed.');
        setPaymentResult('failure');
        return;
      }

      setPaidLocally(true);

      // Wait for the backgrounded Zoho estimate to be created.
      let estimateStatus = '';
      if (verifyResp.data?.estimate_pending) {
        const status = await pollOrderStatus(order._id);
        if (status?.payment_status === 'failed') {
          setPaymentResultMsg(
            'We received your payment but could not confirm it. Please contact support.'
          );
          setPaymentResult('failure');
          return;
        }
        estimateStatus = status?.estimate_status || '';
      }

      const statusSuffix = estimateStatus
        ? ` Estimate status: ${estimateStatus.replace(/_/g, ' ')}.`
        : '';
      setPaymentResultMsg(
        `Your payment was received and your order has been confirmed.${statusSuffix}`
      );
      setPaymentResult('success');
    } catch (error: any) {
      setPaymentResultMsg(
        error?.response?.data?.detail || 'Could not verify the payment.'
      );
      setPaymentResult('failure');
    }
  };

  const handlePayNow = async () => {
    if (!order?._id) {
      toast.error('Save the order before paying');
      return;
    }
    setPayLoading(true);
    try {
      const ok = await loadRazorpayScript();
      if (!ok || !(window as any).Razorpay) {
        toast.error('Failed to load Razorpay. Check your connection.');
        return;
      }

      // Create a Razorpay order on the backend.
      const { data } = await axiosInstance.post(
        `/payments/order/${order._id}/checkout`
      );

      // Track whether the attempt was settled (verified) so the modal's
      // ondismiss doesn't show a false failure after a successful payment.
      // Razorpay keeps the modal open and allows retry after a failed attempt,
      // so we must NOT treat 'payment.failed' as final.
      let settled = false;
      let lastErrorMsg = '';

      const rzp = new (window as any).Razorpay({
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: data.name,
        description: data.description,
        order_id: data.razorpay_order_id,
        prefill: data.prefill || {},
        notes: data.notes || {},
        theme: { color: primaryColor },
        handler: async (response: any) => {
          // Payment captured — verify on the server.
          settled = true;
          await verifyPayment(response);
        },
        modal: {
          ondismiss: () => {
            // Only a real failure if the user closed without a verified success.
            if (!settled) {
              settled = true;
              setPaymentResultMsg(
                lastErrorMsg || 'Payment was not completed. Please try again.'
              );
              setPaymentResult('failure');
            }
          },
        },
      });

      // Capture the latest error so the dismiss message is informative —
      // but don't surface a popup yet; the user can still retry in-modal.
      rzp.on('payment.failed', (resp: any) => {
        lastErrorMsg = resp?.error?.description || '';
      });

      rzp.open();
    } catch (error: any) {
      console.error('Error starting payment:', error);
      toast.error(
        error?.response?.data?.detail || error.message || 'Failed to start payment'
      );
    } finally {
      setPayLoading(false);
    }
  };

  const handlePaymentResultClose = () => {
    const wasSuccess = paymentResult === 'success';
    setPaymentResult(null);
    // Refetch the order so its status (now "accepted") propagates to the whole
    // page and locks the Submit / edit buttons.
    if (wasSuccess && typeof props.onPaymentSuccess === 'function') {
      props.onPaymentSuccess();
    }
  };

  // ── Handlers ───────────────────────────────────────────────────
  const handleQuantityChange = useCallback(
    (id: string, newQuantity: number) => {
      setSelectedProducts((prev: any[]) =>
        prev.map((p) =>
          p._id === id
            ? { ...p, quantity: Math.max(1, (p.pre_order && (p.stock ?? 0) <= 0) ? Math.min(newQuantity, p.upcoming_stock || Infinity) : Math.min(newQuantity, p.stock ?? Infinity)) }
            : p
        )
      );
    },
    [setSelectedProducts]
  );

  const handlePreOrderQuantityChange = useCallback(
    (id: string, newQuantity: number) => {
      setSelectedProducts((prev: any[]) =>
        prev.map((p) =>
          p._id === id
            ? { ...p, pre_order_quantity: Math.max(1, Math.min(newQuantity, p.upcoming_stock || Infinity)) }
            : p
        )
      );
    },
    [setSelectedProducts]
  );

  const handleRemoveProduct = useCallback(
    (id: string) => {
      setSelectedProducts((prev: any[]) => prev.filter((p) => p._id !== id));
    },
    [setSelectedProducts]
  );

  // On mount: remove any pre-order product whose pre_order flag was turned off by admin
  useEffect(() => {
    const checkIds = products
      .filter((p) => p.pre_order || (p.pre_order !== false && p.stock === 0))
      .map((p) => p._id);
    if (!checkIds.length) return;
    axiosInstance
      .get(`/products/batch?ids=${checkIds.join(',')}`)
      .then((res) => {
        const fetched: Record<string, any> = {};
        const data = res.data?.products ?? res.data;
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          Object.values(data).forEach((p: any) => { if (p?._id) fetched[p._id] = p; });
        } else if (Array.isArray(data)) {
          data.forEach((p: any) => { if (p?._id) fetched[p._id] = p; });
        }
        const removedNames: string[] = [];
        setSelectedProducts((prev: any[]) =>
          prev.filter((p) => {
            const current = fetched[p._id];
            if (!current) return true;
            const wasPreOrder = p.pre_order || (p.pre_order !== false && p.stock === 0);
            if (wasPreOrder && current.pre_order === false && current.stock === 0) {
              removedNames.push(p.name);
              return false;
            }
            return true;
          })
        );
        if (removedNames.length) {
          toast.info(
            `Removed ${removedNames.length} item${removedNames.length !== 1 ? 's' : ''} no longer available for pre-order: ${removedNames.join(', ')}`
          );
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleImageClick = useCallback((srcList: any, index: number) => {
    const formattedImages =
      srcList[0]?.src && typeof srcList[0].src === 'string'
        ? srcList
        : srcList.map((src: string) => ({ src }));
    setPopupImageSrc(formattedImages);
    setPopupImageIndex(index);
    setOpenImagePopup(true);
  }, []);

  const handleClosePopup = useCallback(() => setOpenImagePopup(false), []);

  const calculatePrices = useCallback(
    (product: any) => {
      const productId = product._id;
      // Same precedence as the page totals: live margins first, then the
      // customer margin embedded on the order (shared links), then the margin
      // stored on the order line
      const marginStr =
        specialMargins[productId] ||
        customer?.cf_margin ||
        order?.customer_margin ||
        product.margin ||
        '40%';
      // Clearance items add their bonus margin on top of the base margin.
      const marginPercent = getEffectiveMarginPct(marginStr, product);
      const margin = marginPercent / 100;
      const rate = parseFloat(product.rate) || 0;
      const sellingPrice = parseFloat((rate - rate * margin).toFixed(2));
      const quantity = product.quantity || 1;
      const itemTotal = (quantity * sellingPrice).toFixed(2);
      return { sellingPrice, itemTotal, marginPercent };
    },
    [specialMargins, customer?.cf_margin]
  );

  // For shared-link visitors the customer fetch is unauthenticated and may fail,
  // so customer can be null. The component already uses optional chaining throughout
  // so it renders gracefully with null customer — only block non-shared flows.
  if (!customer && !isShared) {
    return (
      <Box
        sx={{
          py: 6,
          px: 3,
          textAlign: 'center',
          borderRadius: 3,
          border: `2px dashed ${theme.palette.divider}`,
        }}
      >
        <Person sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
        <Typography variant='h6' color='text.secondary' mb={0.5}>
          No customer selected
        </Typography>
        <Typography variant='body2' color='text.disabled' mb={2}>
          Select a customer before reviewing the order.
        </Typography>
        <Button
          variant='outlined'
          onClick={() => setActiveStep(0)}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 24 }}
        >
          Select Customer
        </Button>
      </Box>
    );
  }

  // A paid order is accepted on the backend; treat paidLocally as locked too so
  // the buttons disable immediately without waiting for a refetch.
  const isOrderLocked =
    paidLocally ||
    ['accepted', 'declined', 'invoiced'].includes(order?.status?.toLowerCase());

  // Aggregate everything blocking submission so it's visible as a banner
  // (the disabled submit button's tooltip is easy to miss on touch devices)
  const reviewIssues: string[] = [];
  if (!isShared) {
    if (!billingAddress) reviewIssues.push('No billing address selected');
    if (!shippingAddress) reviewIssues.push('No shipping address selected');
  }
  // Split products (pre_order=true && stock>0) can have both a stock quantity and a pre-order quantity.
  const inStockProducts = products.flatMap((p) => {
    const isSplit = p.pre_order === true && (p.stock ?? 0) > 0;
    if (isSplit) return (p.quantity ?? 0) > 0 ? [p] : [];
    return !p.pre_order ? [p] : [];
  });
  const preOrderProducts = products.flatMap((p) => {
    const isSplit = p.pre_order === true && (p.stock ?? 0) > 0;
    if (isSplit) return (p.pre_order_quantity ?? 0) > 0 ? [{ ...p, quantity: p.pre_order_quantity, _isPreOrderRow: true }] : [];
    return p.pre_order ? [p] : [];
  });
  products.forEach((p) => {
    if ((p.quantity || 1) > (p.stock ?? Infinity) && !((p.pre_order === true) && (p.stock ?? 0) <= 0)) {
      reviewIssues.push(`${p.name} exceeds available stock (${p.stock} available)`);
    }
  });

  return (
    <Box sx={{ p: { xs: 0, sm: 1 }, width: '100%', position: 'relative' }}>
      {/* ── Header ── */}
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        flexDirection={{ xs: 'column', sm: 'row' }}
        gap={2}
        mb={3}
      >
        <Box>
          <Typography
            variant='h5'
            fontWeight={700}
            color='text.primary'
            sx={{ fontSize: { xs: '1.15rem', sm: '1.4rem' } }}
          >
            Order Review
          </Typography>
          <Typography variant='body2' color='text.secondary' mt={0.25}>
            {products.length} product{products.length !== 1 ? 's' : ''} ·{' '}
            ₹{totals.totalAmount.toLocaleString('en-IN')} total
          </Typography>
        </Box>
        {!isShared && (() => {
          const hasStock = !!order?.estimate_created;
          const hasPreOrder = !!order?.pre_order_estimate_created;
          const hasAny = hasStock || hasPreOrder;
          return (
            <Box alignSelf={{ xs: 'stretch', sm: 'auto' }}>
              <Button
                variant='contained'
                color='primary'
                disabled={!hasAny || pdfLoading}
                onClick={(e) => hasAny && setDownloadMenuAnchor(e.currentTarget)}
                endIcon={hasAny ? (pdfLoading ? <CircularProgress size={14} color='inherit' /> : <ArrowDropDown />) : undefined}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: 24,
                  whiteSpace: 'nowrap',
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  width: { xs: '100%', sm: 'auto' },
                }}
              >
                {!hasAny ? 'Submit Order to Create Estimate' : pdfLoading ? 'Preparing PDF…' : 'Download Estimate'}
              </Button>
              <Menu
                anchorEl={downloadMenuAnchor}
                open={Boolean(downloadMenuAnchor)}
                onClose={() => setDownloadMenuAnchor(null)}
                slotProps={{ paper: { sx: { borderRadius: 2, minWidth: 240 } } }}
              >
                {hasStock && (
                  <MenuItem onClick={() => { setDownloadMenuAnchor(null); downloadAsPDF('stock'); }}>
                    <ListItemIcon><Inventory2 fontSize='small' /></ListItemIcon>
                    <ListItemText
                      primary={<Typography fontWeight={700} fontSize='0.85rem'>{order.estimate_number}</Typography>}
                      secondary={<Typography fontSize='0.72rem' color='text.secondary'>In-Stock Estimate</Typography>}
                    />
                  </MenuItem>
                )}
                {hasPreOrder && (
                  <MenuItem onClick={() => { setDownloadMenuAnchor(null); downloadAsPDF('pre_order'); }}>
                    <ListItemIcon><ShoppingCartCheckout fontSize='small' sx={{ color: '#d97706' }} /></ListItemIcon>
                    <ListItemText
                      primary={<Typography fontWeight={700} fontSize='0.85rem' color='#d97706'>{order.pre_order_estimate_number} (Pre Order)</Typography>}
                      secondary={<Typography fontSize='0.72rem' color='text.secondary'>Pre-Order Estimate</Typography>}
                    />
                  </MenuItem>
                )}
              </Menu>
            </Box>
          );
        })()}
      </Box>

      {/* ── Locked-order banner ── */}
      {isOrderLocked && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2, fontWeight: 500 }}>
          This order is <strong>{order.status.toLowerCase()}</strong> and cannot be modified.
        </Alert>
      )}

      {/* ── Submission blockers ── */}
      {reviewIssues.length > 0 && (
        <Alert severity='warning' sx={{ mb: 2, borderRadius: 2 }}>
          <Typography variant='body2' fontWeight={700} mb={0.5}>
            Resolve before submitting:
          </Typography>
          <Box component='ul' sx={{ m: 0, pl: 2.5 }}>
            {reviewIssues.map((issue) => (
              <Typography key={issue} component='li' variant='body2'>
                {issue}
              </Typography>
            ))}
          </Box>
        </Alert>
      )}

      {/* ── Separate estimates notice ── */}
      {inStockProducts.length > 0 && preOrderProducts.length > 0 && (
        <Alert severity='info' sx={{ mb: 2, borderRadius: 2 }}>
          <Typography variant='body2' fontWeight={700} mb={0.25}>
            Two separate estimates will be created for this order:
          </Typography>
          <Box component='ul' sx={{ m: 0, pl: 2.5 }}>
            <Typography component='li' variant='body2'>
              <strong>In-Stock Estimate</strong>{order?.estimate_number ? ` — ${order.estimate_number}` : ''} · {inStockProducts.length} item{inStockProducts.length !== 1 ? 's' : ''}
            </Typography>
            <Typography component='li' variant='body2'>
              <strong>Pre-Order Estimate</strong>{order?.pre_order_estimate_number ? ` — ${order.pre_order_estimate_number}` : ''} · {preOrderProducts.length} item{preOrderProducts.length !== 1 ? 's' : ''} · fulfilled when stock arrives
            </Typography>
          </Box>
        </Alert>
      )}

      {/* ── Pre-order only notice (no in-stock items) ── */}
      {preOrderProducts.length > 0 && inStockProducts.length === 0 && (
        <Alert severity='info' sx={{ mb: 2, borderRadius: 2 }}>
          <Typography variant='body2' fontWeight={700} mb={0.25}>
            This order contains only pre-order items{order?.pre_order_estimate_number ? ` — Estimate ${order.pre_order_estimate_number}` : ''}:
          </Typography>
          <Typography variant='body2'>
            A separate pre-order estimate will be created. Items will be fulfilled when stock arrives.
          </Typography>
        </Alert>
      )}

      {/* ── Compact summary (mobile only — grand total above the fold) ── */}
      {products.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            display: { xs: 'flex', sm: 'none' },
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 1.5,
            mb: 2,
            borderRadius: 2,
            border: `1.5px solid ${primaryColor}30`,
            bgcolor: isDark ? `${primaryColor}10` : `${primaryColor}06`,
          }}
        >
          <Box>
            <Typography variant='caption' color='text.secondary' display='block'>
              {products.length} item{products.length !== 1 ? 's' : ''} · GST ₹
              {totals.totalGST.toFixed(2)}
            </Typography>
            <Typography variant='caption' color='text.disabled'>
              Grand Total
            </Typography>
          </Box>
          <Typography fontWeight={800} color='primary.main' sx={{ fontSize: '1.25rem' }}>
            ₹{totals.totalAmount.toLocaleString('en-IN')}
          </Typography>
        </Paper>
      )}

      {/* ── Customer Information ── */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 2.5 },
          mb: 2,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: 'background.paper',
        }}
      >
        <SectionHeader
          icon={<Person sx={{ color: primaryColor, fontSize: 18 }} />}
          title='Customer Information'
          color={primaryColor}
          onEdit={!isShared ? () => setActiveStep(0) : undefined}
        />
        <Box display='flex' flexDirection='column' gap={0.75}>
          {/* For shared-link visitors customer is null — fall back to the name
              stored directly on the order document and the billing address phone. */}
          <InfoRow
            label='Shop Name'
            value={customer?.contact_name || order?.customer_name}
          />
          <InfoRow
            label='Contact'
            value={
              customer
                ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || undefined
                : undefined
            }
          />
          <InfoRow
            label='Phone'
            value={
              customer?.mobile ||
              customer?.phone ||
              billingAddress?.phone ||
              undefined
            }
          />
          {referenceNumber && <InfoRow label='Reference' value={referenceNumber} />}
        </Box>
      </Paper>

      {/* ── Addresses ── */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
        {/* Billing */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            p: { xs: 2, sm: 2.5 },
            borderRadius: 2,
            border: `1.5px solid ${primaryColor}30`,
            bgcolor: isDark ? `${primaryColor}08` : `${primaryColor}04`,
          }}
        >
          <SectionHeader
            icon={<LocationOn sx={{ color: primaryColor, fontSize: 18 }} />}
            title='Billing Address'
            color={primaryColor}
            onEdit={!isShared ? () => setActiveStep(1) : undefined}
          />
          {billingAddress ? (
            <Box display='flex' flexDirection='column' gap={0.4}>
              {billingAddress.attention && (
                <Typography variant='body2' fontWeight={600} color='text.primary'>
                  {billingAddress.attention}
                </Typography>
              )}
              <Typography variant='body2' color='text.secondary'>
                {billingAddress.address}
              </Typography>
              {billingAddress.street2 && (
                <Typography variant='body2' color='text.secondary'>
                  {billingAddress.street2}
                </Typography>
              )}
              <Typography variant='body2' color='text.secondary'>
                {[billingAddress.city, billingAddress.state, billingAddress.zip]
                  .filter(Boolean)
                  .join(', ')}
              </Typography>
            </Box>
          ) : (
            <Typography variant='body2' color='text.disabled'>
              No address selected
            </Typography>
          )}
        </Paper>

        {/* Shipping */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            p: { xs: 2, sm: 2.5 },
            borderRadius: 2,
            border: `1.5px solid ${secondaryColor}30`,
            bgcolor: isDark ? `${secondaryColor}08` : `${secondaryColor}04`,
          }}
        >
          <SectionHeader
            icon={<LocationOn sx={{ color: secondaryColor, fontSize: 18 }} />}
            title='Shipping Address'
            color={secondaryColor}
            onEdit={!isShared ? () => setActiveStep(2) : undefined}
          />
          {shippingAddress ? (
            <Box display='flex' flexDirection='column' gap={0.4}>
              {shippingAddress.attention && (
                <Typography variant='body2' fontWeight={600} color='text.primary'>
                  {shippingAddress.attention}
                </Typography>
              )}
              <Typography variant='body2' color='text.secondary'>
                {shippingAddress.address}
              </Typography>
              {shippingAddress.street2 && (
                <Typography variant='body2' color='text.secondary'>
                  {shippingAddress.street2}
                </Typography>
              )}
              <Typography variant='body2' color='text.secondary'>
                {[shippingAddress.city, shippingAddress.state, shippingAddress.zip]
                  .filter(Boolean)
                  .join(', ')}
              </Typography>
            </Box>
          ) : (
            <Typography variant='body2' color='text.disabled'>
              No address selected
            </Typography>
          )}
        </Paper>
      </Stack>

      {/* ── In-Stock Products ── */}
      {(inStockProducts.length > 0 || products.length === 0) && (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 2.5 },
            mb: 2,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: 'background.paper',
          }}
        >
          <SectionHeader
            icon={<ShoppingCart sx={{ color: primaryColor, fontSize: 18 }} />}
            title='In Stock Items'
            color={primaryColor}
            badge={inStockProducts.length}
            onEdit={!isShared ? () => setActiveStep(3) : undefined}
          />

          {preOrderProducts.length > 0 && (
            <Box display='flex' alignItems='center' gap={1} mb={1.5} mt={-1}>
              <Chip
                size='small'
                label={order?.estimate_number ? `Separate Estimate — ${order.estimate_number}` : 'Separate estimate will be created'}
                color='primary'
                variant='outlined'
                icon={<Inventory2 sx={{ fontSize: '14px !important' }} />}
                sx={{ fontSize: '0.7rem', height: 22 }}
              />
            </Box>
          )}

          <Box display='flex' flexDirection='column' gap={1.5}>
            {inStockProducts.length === 0 ? (
              <Typography variant='body2' color='text.disabled' textAlign='center' py={4}>
                No in-stock products added
              </Typography>
            ) : (
              inStockProducts.map((product, index) => {
                const { sellingPrice, itemTotal, marginPercent } = calculatePrices(product);
                const isActive = product.status !== 'inactive';
                const productId = product._id;
                const _prefs = product?.item_tax_preferences;
                const taxPct = _prefs?.length ? (_prefs[_prefs.length - 1]?.tax_percentage ?? 0) : 0;

                return (
                  <Box
                    key={productId}
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      borderRadius: 2.5,
                      border: `1px solid ${theme.palette.divider}`,
                      overflow: 'hidden',
                      bgcolor: 'background.paper',
                      opacity: !isActive ? 0.7 : 1,
                      transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
                      '&:hover': {
                        boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.45)' : '0 4px 24px rgba(0,0,0,0.1)',
                        borderColor: `${primaryColor}50`,
                      },
                    }}
                  >
                    {/* ── Image with overlaid badges ── */}
                    <Box
                      sx={{
                        width: { xs: '100%', sm: 120 },
                        height: { xs: 200, sm: 'auto' },
                        minHeight: { sm: 120 },
                        flexShrink: 0,
                        position: 'relative',
                        borderRight: { sm: `1px solid ${theme.palette.divider}` },
                        borderBottom: { xs: `1px solid ${theme.palette.divider}`, sm: 'none' },
                      }}
                    >
                      <ImageCarousel product={product} handleImageClick={handleImageClick} small />
                      <Box
                        sx={{
                          position: 'absolute', top: 8, left: 8,
                          width: 26, height: 26, borderRadius: '50%',
                          bgcolor: isDark ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.92)',
                          backdropFilter: 'blur(6px)', display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          boxShadow: '0 1px 6px rgba(0,0,0,0.25)',
                        }}
                      >
                        <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, lineHeight: 1, color: 'text.primary' }}>
                          {index + 1}
                        </Typography>
                      </Box>
                      <Tooltip title='Remove product'>
                          <span style={{ position: 'absolute', top: 6, right: 6, display: 'block' }}>
                            <IconButton
                              size='small' disabled={isOrderLocked}
                              onClick={() => handleRemoveProduct(productId)}
                              sx={{
                                width: 28, height: 28,
                                bgcolor: isDark ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.88)',
                                backdropFilter: 'blur(6px)', color: 'error.main',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                                '&:hover': { bgcolor: 'error.main', color: 'white' },
                                display: { xs: 'flex', sm: 'none' },
                              }}
                            >
                              <Close sx={{ fontSize: 14 }} />
                            </IconButton>
                          </span>
                        </Tooltip>
                    </Box>

                    {/* ── Content ── */}
                    <Box flex={1} minWidth={0} display='flex' flexDirection='column'>
                      <Box sx={{ px: { xs: 1.75, sm: 2 }, pt: { xs: 1.5, sm: 1.75 }, pb: 0 }}>
                        <Box display='flex' justifyContent='space-between' alignItems='flex-start' gap={1}>
                          <Box flex={1} minWidth={0}>
                            {(product.brand || product.cf_sku_code || product.sub_category) && (
                              <Box display='flex' flexWrap='wrap' gap={0.5} mb={0.75}>
                                {product.brand && <Chip label={product.brand} size='small' sx={{ height: 20, fontSize: '0.62rem', fontWeight: 700 }} />}
                                {product.cf_sku_code && <Chip label={product.cf_sku_code} size='small' variant='outlined' sx={{ height: 20, fontSize: '0.62rem' }} />}
                                {product.sub_category && <Chip label={product.sub_category} size='small' variant='outlined' sx={{ height: 20, fontSize: '0.62rem' }} />}
                              </Box>
                            )}
                            <Typography variant='subtitle2' fontWeight={700} color='text.primary' sx={{ fontSize: { xs: '0.92rem', sm: '0.9rem' }, lineHeight: 1.35 }}>
                              {product.name}
                            </Typography>
                          </Box>
                          <Tooltip title='Remove product'>
                              <span>
                                <IconButton size='small' color='error' disabled={isOrderLocked} onClick={() => handleRemoveProduct(productId)}
                                  sx={{ flexShrink: 0, mt: -0.5, mr: -0.5, display: { xs: 'none', sm: 'flex' } }}>
                                  <Close sx={{ fontSize: 18 }} />
                                </IconButton>
                              </span>
                            </Tooltip>
                        </Box>
                      </Box>
                      <Box sx={{ px: { xs: 1.75, sm: 2 }, pt: 1.25, pb: 0.5 }}>
                        <Box display='flex' alignItems='baseline' gap={1} flexWrap='wrap' mb={0.5}>
                          <Box display='flex' alignItems='center' gap={0.75}>
                            <LocalOffer sx={{ fontSize: 13, color: 'primary.main', mb: '-1px' }} />
                            <Typography fontWeight={800} color='primary.main' sx={{ fontSize: { xs: '1.05rem', sm: '1rem' }, letterSpacing: '-0.01em' }}>
                              ₹{sellingPrice.toLocaleString('en-IN')}
                            </Typography>
                            <Typography variant='caption' color='text.secondary' fontWeight={500}>/ unit</Typography>
                          </Box>
                          {!isShared && (
                            <Chip label={`${marginPercent}% off`} size='small'
                              sx={{ height: 20, fontSize: '0.62rem', fontWeight: 700, bgcolor: isDark ? 'rgba(76,175,80,0.18)' : 'rgba(76,175,80,0.12)', color: 'success.main' }} />
                          )}
                        </Box>
                        <Box display='flex' flexWrap='wrap' alignItems='center' gap={0.75}>
                          <Typography variant='caption' color='text.disabled'>MRP ₹{product.rate?.toLocaleString('en-IN')}</Typography>
                          <Typography variant='caption' color='text.disabled'>·</Typography>
                          <Typography variant='caption' color='text.secondary'>GST {taxPct}%</Typography>
                        </Box>
                      </Box>
                      <Box flex={1} />
                      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: { sm: 'space-between' }, px: { xs: 1.75, sm: 2 }, py: { xs: 1.25, sm: 1.5 }, gap: { xs: 1, sm: 0 }, mt: 1, borderTop: `1px solid ${theme.palette.divider}`, bgcolor: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.018)' }}>
                        <QuantitySelector quantity={product.quantity || 1} max={product.stock ?? Infinity} onChange={(newQty) => handleQuantityChange(productId, newQty)} disabled={!isActive || isOrderLocked} />
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'space-between', sm: 'flex-end' }, gap: 1 }}>
                          <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'text.disabled' }}>Total</Typography>
                          <Typography fontWeight={800} color='primary.main' sx={{ fontSize: { xs: '1.1rem', sm: '1rem' }, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
                            ₹{parseFloat(itemTotal).toLocaleString('en-IN')}
                          </Typography>
                        </Box>
                      </Box>
                      {!product.pre_order && product.quantity > product.stock && (
                        <Typography variant='caption' color='error.main' sx={{ display: 'block', px: { xs: 1.75, sm: 2 }, pb: 1, mt: -0.5 }}>
                          ⚠ Exceeds stock ({product.stock} available)
                        </Typography>
                      )}
                    </Box>
                  </Box>
                );
              })
            )}
          </Box>

          {/* Section footer */}
          {inStockProducts.length > 0 && (
            <Box display='flex' justifyContent='space-between' alignItems='center' mt={2} pt={1.5} borderTop={`1px solid ${theme.palette.divider}`}>
              <Box display='flex' alignItems='center' gap={1}>
                {order?.estimate_number && (
                  <Chip label={`Estimate: ${order.estimate_number}`} size='small' color='success' variant='outlined' sx={{ fontSize: '0.7rem' }} />
                )}
              </Box>
              <Typography variant='body2' fontWeight={700} color='text.primary'>
                Subtotal: ₹{inStockProducts.reduce((acc, p) => { const { sellingPrice } = calculatePrices(p); return acc + sellingPrice * (p.quantity || 1); }, 0).toLocaleString('en-IN')}
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* ── Pre-Order Products ── */}
      {preOrderProducts.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 2.5 },
            mb: 2,
            borderRadius: 2,
            border: `1px solid ${theme.palette.warning.main}40`,
            bgcolor: 'background.paper',
          }}
        >
          <SectionHeader
            icon={<ShoppingCart sx={{ color: theme.palette.warning.main, fontSize: 18 }} />}
            title='Pre-Order Items'
            color={theme.palette.warning.main}
            badge={preOrderProducts.length}
            onEdit={!isShared ? () => setActiveStep(3) : undefined}
          />

          <Box display='flex' alignItems='center' gap={1} mb={1.5} mt={-1}>
            <Chip
              size='small'
              label={order?.pre_order_estimate_number ? `Separate Estimate — ${order.pre_order_estimate_number} (Pre Order)` : 'Separate pre-order estimate will be created'}
              color='warning'
              variant='outlined'
              icon={<ShoppingCartCheckout sx={{ fontSize: '14px !important' }} />}
              sx={{ fontSize: '0.7rem', height: 22 }}
            />
          </Box>

          <Box display='flex' flexDirection='column' gap={1.5}>
            {preOrderProducts.map((product, index) => {
              const { sellingPrice, itemTotal, marginPercent } = calculatePrices(product);
              const isActive = product.status !== 'inactive';
              const productId = product._id;
              const _prefs = product?.item_tax_preferences;
              const taxPct = _prefs?.length ? (_prefs[_prefs.length - 1]?.tax_percentage ?? 0) : 0;
              const warningColor = theme.palette.warning.main;

              return (
                <Box
                  key={productId}
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    borderRadius: 2.5,
                    border: `1px solid ${theme.palette.divider}`,
                    overflow: 'hidden',
                    bgcolor: 'background.paper',
                    opacity: !isActive ? 0.7 : 1,
                    transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
                    '&:hover': {
                      boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.45)' : '0 4px 24px rgba(0,0,0,0.1)',
                      borderColor: `${warningColor}50`,
                    },
                  }}
                >
                  {/* ── Image with overlaid badges ── */}
                  <Box
                    sx={{
                      width: { xs: '100%', sm: 120 },
                      height: { xs: 200, sm: 'auto' },
                      minHeight: { sm: 120 },
                      flexShrink: 0,
                      position: 'relative',
                      borderRight: { sm: `1px solid ${theme.palette.divider}` },
                      borderBottom: { xs: `1px solid ${theme.palette.divider}`, sm: 'none' },
                    }}
                  >
                    <ImageCarousel product={product} handleImageClick={handleImageClick} small />
                    <Box
                      sx={{
                        position: 'absolute', top: 8, left: 8,
                        width: 26, height: 26, borderRadius: '50%',
                        bgcolor: isDark ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.92)',
                        backdropFilter: 'blur(6px)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 1px 6px rgba(0,0,0,0.25)',
                      }}
                    >
                      <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, lineHeight: 1, color: 'text.primary' }}>
                        {index + 1}
                      </Typography>
                    </Box>
                    <Tooltip title='Remove product'>
                        <span style={{ position: 'absolute', top: 6, right: 6, display: 'block' }}>
                          <IconButton
                            size='small' disabled={isOrderLocked}
                            onClick={() => handleRemoveProduct(productId)}
                            sx={{
                              width: 28, height: 28,
                              bgcolor: isDark ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.88)',
                              backdropFilter: 'blur(6px)', color: 'error.main',
                              boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                              '&:hover': { bgcolor: 'error.main', color: 'white' },
                              display: { xs: 'flex', sm: 'none' },
                            }}
                          >
                            <Close sx={{ fontSize: 14 }} />
                          </IconButton>
                        </span>
                      </Tooltip>
                  </Box>

                  {/* ── Content ── */}
                  <Box flex={1} minWidth={0} display='flex' flexDirection='column'>
                    <Box sx={{ px: { xs: 1.75, sm: 2 }, pt: { xs: 1.5, sm: 1.75 }, pb: 0 }}>
                      <Box display='flex' justifyContent='space-between' alignItems='flex-start' gap={1}>
                        <Box flex={1} minWidth={0}>
                          {(product.brand || product.cf_sku_code || product.sub_category) && (
                            <Box display='flex' flexWrap='wrap' gap={0.5} mb={0.75}>
                              {product.brand && <Chip label={product.brand} size='small' sx={{ height: 20, fontSize: '0.62rem', fontWeight: 700 }} />}
                              {product.cf_sku_code && <Chip label={product.cf_sku_code} size='small' variant='outlined' sx={{ height: 20, fontSize: '0.62rem' }} />}
                              {product.sub_category && <Chip label={product.sub_category} size='small' variant='outlined' sx={{ height: 20, fontSize: '0.62rem' }} />}
                            </Box>
                          )}
                          <Typography variant='subtitle2' fontWeight={700} color='text.primary' sx={{ fontSize: { xs: '0.92rem', sm: '0.9rem' }, lineHeight: 1.35 }}>
                            {product.name}
                          </Typography>
                        </Box>
                        <Tooltip title='Remove product'>
                            <span>
                              <IconButton size='small' color='error' disabled={isOrderLocked} onClick={() => handleRemoveProduct(productId)}
                                sx={{ flexShrink: 0, mt: -0.5, mr: -0.5, display: { xs: 'none', sm: 'flex' } }}>
                                <Close sx={{ fontSize: 18 }} />
                              </IconButton>
                            </span>
                          </Tooltip>
                      </Box>
                    </Box>
                    <Box sx={{ px: { xs: 1.75, sm: 2 }, pt: 1.25, pb: 0.5 }}>
                      <Box display='flex' alignItems='baseline' gap={1} flexWrap='wrap' mb={0.5}>
                        <Box display='flex' alignItems='center' gap={0.75}>
                          <LocalOffer sx={{ fontSize: 13, color: 'primary.main', mb: '-1px' }} />
                          <Typography fontWeight={800} color='primary.main' sx={{ fontSize: { xs: '1.05rem', sm: '1rem' }, letterSpacing: '-0.01em' }}>
                            ₹{sellingPrice.toLocaleString('en-IN')}
                          </Typography>
                          <Typography variant='caption' color='text.secondary' fontWeight={500}>/ unit</Typography>
                        </Box>
                        {!isShared && (
                          <Chip label={`${marginPercent}% off`} size='small'
                            sx={{ height: 20, fontSize: '0.62rem', fontWeight: 700, bgcolor: isDark ? 'rgba(76,175,80,0.18)' : 'rgba(76,175,80,0.12)', color: 'success.main' }} />
                        )}
                      </Box>
                      <Box display='flex' flexWrap='wrap' alignItems='center' gap={0.75}>
                        <Typography variant='caption' color='text.disabled'>MRP ₹{product.rate?.toLocaleString('en-IN')}</Typography>
                        <Typography variant='caption' color='text.disabled'>·</Typography>
                        <Typography variant='caption' color='text.secondary'>GST {taxPct}%</Typography>
                      </Box>
                    </Box>
                    <Box flex={1} />
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: { sm: 'space-between' }, px: { xs: 1.75, sm: 2 }, py: { xs: 1.25, sm: 1.5 }, gap: { xs: 1, sm: 0 }, mt: 1, borderTop: `1px solid ${theme.palette.divider}`, bgcolor: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.018)' }}>
                      <QuantitySelector quantity={product.quantity || 1} max={product.upcoming_stock || Infinity} onChange={(newQty) => product._isPreOrderRow ? handlePreOrderQuantityChange(productId, newQty) : handleQuantityChange(productId, newQty)} disabled={!isActive || isOrderLocked} />
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'space-between', sm: 'flex-end' }, gap: 1 }}>
                        <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'text.disabled' }}>Total</Typography>
                        <Typography fontWeight={800} color='primary.main' sx={{ fontSize: { xs: '1.1rem', sm: '1rem' }, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
                          ₹{parseFloat(itemTotal).toLocaleString('en-IN')}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant='caption' color='info.main' sx={{ display: 'block', px: { xs: 1.75, sm: 2 }, pb: 1, mt: -0.5, fontWeight: 600 }}>
                      {product.inward_date
                        ? `📦 Pre Order — will be fulfilled by ${formatPreOrderDate(product.inward_date)}`
                        : '📦 Pre Order — will be fulfilled when stock arrives'}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>

          {/* Section footer */}
          <Box display='flex' justifyContent='space-between' alignItems='center' mt={2} pt={1.5} borderTop={`1px solid ${theme.palette.divider}`}>
            <Box display='flex' alignItems='center' gap={1}>
              {order?.pre_order_estimate_number && (
                <Chip label={`Pre-Order Estimate: ${order.pre_order_estimate_number}`} size='small' color='warning' variant='outlined' sx={{ fontSize: '0.7rem' }} />
              )}
            </Box>
            <Typography variant='body2' fontWeight={700} color='text.primary'>
              Subtotal: ₹{preOrderProducts.reduce((acc, p) => { const { sellingPrice } = calculatePrices(p); return acc + sellingPrice * (p.quantity || 1); }, 0).toLocaleString('en-IN')}
            </Typography>
          </Box>
        </Paper>
      )}

      {/* ── Order Summary ── */}
      {products.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 2.5 },
            mb: 2,
            borderRadius: 2,
            border: `2px solid ${primaryColor}30`,
            background: isDark
              ? `linear-gradient(135deg, ${primaryColor}14, ${primaryColor}06)`
              : `linear-gradient(135deg, ${primaryColor}08, ${primaryColor}02)`,
          }}
        >
          <Typography
            variant='subtitle1'
            fontWeight={700}
            color='text.primary'
            mb={1.5}
          >
            Order Summary
          </Typography>
          <Box display='flex' justifyContent='space-between' mb={0.75}>
            <Typography variant='body2' color='text.secondary'>
              Total GST{' '}
              <Typography
                component='span'
                variant='caption'
                color='text.disabled'
              >
                ({customer?.cf_in_ex || order?.gst_type || 'Exclusive'})
              </Typography>
            </Typography>
            <Typography variant='body2' fontWeight={600} color='text.primary'>
              ₹{totals.totalGST.toFixed(2)}
            </Typography>
          </Box>
          <Divider sx={{ my: 1 }} />
          <Box display='flex' justifyContent='space-between' alignItems='center'>
            <Typography variant='subtitle1' fontWeight={700} color='text.primary'>
              Grand Total
            </Typography>
            <Typography
              variant='h6'
              fontWeight={800}
              color='primary.main'
              sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
            >
              ₹{totals.totalAmount.toLocaleString('en-IN')}
            </Typography>
          </Box>
          {order?.payment?.status === 'paid' || paidLocally ? (
            <Box display='flex' justifyContent='center' mt={2}>
              <Chip
                icon={<Payment />}
                label='Payment Received'
                color='success'
                sx={{ fontWeight: 700, px: 1, py: 2.2, borderRadius: 24 }}
              />
            </Box>
          ) : isSelfRegistered ? (
            <>
              <Button
                fullWidth
                variant='contained'
                color='success'
                startIcon={payLoading ? <CircularProgress size={16} color='inherit' /> : <Payment />}
                disabled={payLoading || isOrderLocked || totals.totalAmount <= 0 || belowMinOrder}
                onClick={handlePayNow}
                sx={{ mt: 2, textTransform: 'none', fontWeight: 700, borderRadius: 24, py: 1.1 }}
              >
                {payLoading ? 'Generating payment link…' : `Pay Now ₹${totals.totalAmount.toLocaleString('en-IN')}`}
              </Button>
              {belowMinOrder && (
                <Typography variant='caption' color='error' sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
                  Add ₹{(minOrderValue - totals.totalAmount).toLocaleString('en-IN')} more — a minimum order of
                  ₹{minOrderValue.toLocaleString('en-IN')} is required to pay.
                </Typography>
              )}
            </>
          ) : null}
        </Paper>
      )}

      <ImagePopupDialog
        open={openImagePopup}
        onClose={handleClosePopup}
        imageSources={popupImageSrc}
        initialSlide={popupImageIndex}
        setIndex={(newIndex: number) => setPopupImageIndex(newIndex)}
      />

      <PaymentResultDialog
        open={!!paymentResult}
        result={paymentResult}
        message={paymentResultMsg}
        onClose={handlePaymentResultClose}
      />

      {/* ── Scroll buttons — fixed bottom-right ── */}
      <Box
        sx={{
          position: 'fixed',
          bottom: { xs: theme.spacing(14), sm: theme.spacing(10), md: theme.spacing(5) },
          right: { xs: theme.spacing(1), sm: theme.spacing(3), md: theme.spacing(2) },
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          zIndex: 1000,
          pointerEvents: 'none',
        }}
      >
        <IconButton
          color='primary'
          onClick={scrollToTop}
          disabled={isScrollButtonDisabled}
          sx={{
            backgroundColor: 'primary.main',
            color: 'white',
            width: { xs: 48, sm: 56 },
            height: { xs: 48, sm: 56 },
            boxShadow: 6,
            '&:disabled': {
              backgroundColor: 'action.disabledBackground',
              color: 'action.disabled',
              opacity: 0.5,
            },
            '&:hover:not(:disabled)': {
              backgroundColor: 'primary.dark',
              boxShadow: 8,
              transform: isMobile ? 'none' : 'scale3d(1.1, 1.1, 1) translate3d(0, -2px, 0)',
            },
            '&:active:not(:disabled)': {
              transform: isMobile ? 'none' : 'scale3d(0.95, 0.95, 1)',
            },
            transition: 'background-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease',
            pointerEvents: 'auto',
          }}
        >
          <ArrowUpward fontSize={isMobile ? 'medium' : 'large'} />
        </IconButton>

        <IconButton
          color='primary'
          onClick={scrollToBottom}
          disabled={isScrollButtonDisabled}
          sx={{
            backgroundColor: 'primary.main',
            color: 'white',
            width: { xs: 48, sm: 56 },
            height: { xs: 48, sm: 56 },
            boxShadow: 6,
            '&:disabled': {
              backgroundColor: 'action.disabledBackground',
              color: 'action.disabled',
              opacity: 0.5,
            },
            '&:hover:not(:disabled)': {
              backgroundColor: 'primary.dark',
              boxShadow: 8,
              transform: isMobile ? 'none' : 'scale3d(1.1, 1.1, 1) translate3d(0, 2px, 0)',
            },
            '&:active:not(:disabled)': {
              transform: isMobile ? 'none' : 'scale3d(0.95, 0.95, 1)',
            },
            transition: 'background-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease',
            pointerEvents: 'auto',
          }}
        >
          <ArrowDownward fontSize={isMobile ? 'medium' : 'large'} />
        </IconButton>
      </Box>
    </Box>
  );
});

export default Review;
