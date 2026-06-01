import React, { useRef, useState, useCallback } from 'react';
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
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import QuantitySelector from './QuantitySelector';
import { toast } from 'react-toastify';
import axios from 'axios';
import ImagePopupDialog from '../common/ImagePopUp';
import ImageCarousel from './products/ImageCarousel';

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
  order: any;
  referenceNumber: any;
}

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
    order,
    referenceNumber,
  } = props;

  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const primaryColor = theme.palette.primary.main;
  const secondaryColor = theme.palette.secondary.main;

  const [openImagePopup, setOpenImagePopup] = useState(false);
  const [popupImageSrc, setPopupImageSrc]: any = useState([]);
  const [popupImageIndex, setPopupImageIndex] = useState(0);
  const pageTopRef = useRef<HTMLDivElement>(null);
  const pageBottomRef = useRef<HTMLDivElement>(null);

  // ── PDF Download ────────────────────────────────────────────────
  const downloadAsPDF = async () => {
    try {
      const resp = await axios.get(
        `${process.env.api_url}/orders/download_pdf/${order._id}`,
        { responseType: 'blob' }
      );
      if (resp.data.type !== 'application/pdf') {
        toast.error('Draft Estimate Not Created');
        return;
      }
      const contentDisposition = resp.headers['content-disposition'];
      let fileName = `${order.estimate_number}.pdf`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match && match[1]) fileName = match[1];
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
      console.error('Error downloading PDF:', error);
      toast.error(error.message || 'Failed to download PDF');
    }
  };

  // ── Handlers ───────────────────────────────────────────────────
  const handleQuantityChange = useCallback(
    (id: string, newQuantity: number) => {
      setSelectedProducts(
        products.map((p) =>
          p._id === id
            ? { ...p, quantity: Math.max(1, Math.min(newQuantity, p.stock)) }
            : p
        )
      );
    },
    [products, setSelectedProducts]
  );

  const handleRemoveProduct = useCallback(
    (id: string) => {
      setSelectedProducts(products.filter((p) => p._id !== id));
    },
    [products, setSelectedProducts]
  );

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
      const marginPercent = specialMargins[productId]
        ? parseInt(specialMargins[productId].replace('%', ''))
        : parseInt(customer?.cf_margin?.replace('%', '') || '40');
      const margin = marginPercent / 100;
      const sellingPrice = parseFloat(
        (product.rate - product.rate * margin).toFixed(2)
      );
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
    return <Typography>This is content for Review</Typography>;
  }

  const isOrderLocked =
    order?.status?.toLowerCase()?.includes('accepted') ||
    order?.status?.toLowerCase()?.includes('declined');

  return (
    <Box sx={{ p: { xs: 0, sm: 1 }, width: '100%', position: 'relative' }}>
      <div ref={pageTopRef} />

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
        {!isShared && (
          <Button
            variant='contained'
            color='primary'
            onClick={downloadAsPDF}
            disabled={!order?.estimate_created}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 24,
              whiteSpace: 'nowrap',
              fontSize: { xs: '0.8rem', sm: '0.875rem' },
              alignSelf: { xs: 'stretch', sm: 'auto' },
            }}
          >
            {!order?.estimate_created ? 'Save as Draft to Create Estimate' : 'Download PDF'}
          </Button>
        )}
      </Box>

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

      {/* ── Products ── */}
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
          title='Products'
          color={primaryColor}
          badge={products.length}
          onEdit={!isShared ? () => setActiveStep(3) : undefined}
        />

        <Box display='flex' flexDirection='column' gap={1.5}>
          {products.length === 0 ? (
            <Typography
              variant='body2'
              color='text.disabled'
              textAlign='center'
              py={4}
            >
              No products added
            </Typography>
          ) : (
            products.map((product, index) => {
              const { sellingPrice, itemTotal, marginPercent } =
                calculatePrices(product);
              const isActive = product.status !== 'inactive';
              const productId = product._id;
              const _prefs = product?.item_tax_preferences;
              const taxPct = _prefs?.length
                ? (_prefs[_prefs.length - 1]?.tax_percentage ?? 0)
                : 0;

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
                      boxShadow: isDark
                        ? '0 4px 24px rgba(0,0,0,0.45)'
                        : '0 4px 24px rgba(0,0,0,0.1)',
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
                    <ImageCarousel
                      product={product}
                      handleImageClick={handleImageClick}
                      small
                    />

                    {/* Index badge */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        bgcolor: isDark ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.92)',
                        backdropFilter: 'blur(6px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 1px 6px rgba(0,0,0,0.25)',
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          lineHeight: 1,
                          color: 'text.primary',
                        }}
                      >
                        {index + 1}
                      </Typography>
                    </Box>

                    {/* Remove button — overlaid on image on mobile */}
                    {!isShared && (
                      <Tooltip title='Remove product'>
                        <span
                          style={{
                            position: 'absolute',
                            top: 6,
                            right: 6,
                            display: 'block',
                          }}
                        >
                          <IconButton
                            size='small'
                            disabled={isOrderLocked}
                            onClick={() => handleRemoveProduct(productId)}
                            sx={{
                              width: 28,
                              height: 28,
                              bgcolor: isDark
                                ? 'rgba(0,0,0,0.65)'
                                : 'rgba(255,255,255,0.88)',
                              backdropFilter: 'blur(6px)',
                              color: 'error.main',
                              boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                              '&:hover': {
                                bgcolor: 'error.main',
                                color: 'white',
                              },
                              display: { xs: 'flex', sm: 'none' },
                            }}
                          >
                            <Close sx={{ fontSize: 14 }} />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                  </Box>

                  {/* ── Content ── */}
                  <Box
                    flex={1}
                    minWidth={0}
                    display='flex'
                    flexDirection='column'
                  >
                    {/* Top: chips + name + remove (desktop) */}
                    <Box sx={{ px: { xs: 1.75, sm: 2 }, pt: { xs: 1.5, sm: 1.75 }, pb: 0 }}>
                      <Box
                        display='flex'
                        justifyContent='space-between'
                        alignItems='flex-start'
                        gap={1}
                      >
                        <Box flex={1} minWidth={0}>
                          {/* Taxonomy chips */}
                          {(product.brand || product.cf_sku_code || product.sub_category) && (
                            <Box display='flex' flexWrap='wrap' gap={0.5} mb={0.75}>
                              {product.brand && (
                                <Chip
                                  label={product.brand}
                                  size='small'
                                  sx={{ height: 20, fontSize: '0.62rem', fontWeight: 700 }}
                                />
                              )}
                              {product.cf_sku_code && (
                                <Chip
                                  label={product.cf_sku_code}
                                  size='small'
                                  variant='outlined'
                                  sx={{ height: 20, fontSize: '0.62rem' }}
                                />
                              )}
                              {product.sub_category && (
                                <Chip
                                  label={product.sub_category}
                                  size='small'
                                  variant='outlined'
                                  sx={{ height: 20, fontSize: '0.62rem' }}
                                />
                              )}
                            </Box>
                          )}
                          <Typography
                            variant='subtitle2'
                            fontWeight={700}
                            color='text.primary'
                            sx={{ fontSize: { xs: '0.92rem', sm: '0.9rem' }, lineHeight: 1.35 }}
                          >
                            {product.name}
                          </Typography>
                        </Box>

                        {/* Remove button — desktop only */}
                        {!isShared && (
                          <Tooltip title='Remove product'>
                            <span>
                              <IconButton
                                size='small'
                                color='error'
                                disabled={isOrderLocked}
                                onClick={() => handleRemoveProduct(productId)}
                                sx={{
                                  flexShrink: 0,
                                  mt: -0.5,
                                  mr: -0.5,
                                  display: { xs: 'none', sm: 'flex' },
                                }}
                              >
                                <Close sx={{ fontSize: 18 }} />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                      </Box>
                    </Box>

                    {/* Price section */}
                    <Box sx={{ px: { xs: 1.75, sm: 2 }, pt: 1.25, pb: 0.5 }}>
                      {/* Selling price + discount badge */}
                      <Box display='flex' alignItems='baseline' gap={1} flexWrap='wrap' mb={0.5}>
                        <Box display='flex' alignItems='center' gap={0.75}>
                          <LocalOffer
                            sx={{ fontSize: 13, color: 'primary.main', mb: '-1px' }}
                          />
                          <Typography
                            fontWeight={800}
                            color='primary.main'
                            sx={{ fontSize: { xs: '1.05rem', sm: '1rem' }, letterSpacing: '-0.01em' }}
                          >
                            ₹{sellingPrice.toLocaleString('en-IN')}
                          </Typography>
                          <Typography variant='caption' color='text.secondary' fontWeight={500}>
                            / unit
                          </Typography>
                        </Box>
                        {!isShared && (
                          <Chip
                            label={`${marginPercent}% off`}
                            size='small'
                            sx={{
                              height: 20,
                              fontSize: '0.62rem',
                              fontWeight: 700,
                              bgcolor: isDark
                                ? 'rgba(76,175,80,0.18)'
                                : 'rgba(76,175,80,0.12)',
                              color: 'success.main',
                            }}
                          />
                        )}
                      </Box>

                      {/* MRP strikethrough + GST */}
                      <Box display='flex' flexWrap='wrap' alignItems='center' gap={0.75}>
                        <Typography
                          variant='caption'
                          color='text.disabled'
                        >
                          MRP ₹{product.rate?.toLocaleString('en-IN')}
                        </Typography>
                        <Typography variant='caption' color='text.disabled'>·</Typography>
                        <Typography variant='caption' color='text.secondary'>
                          GST {taxPct}%
                        </Typography>
                      </Box>
                    </Box>

                    <Box flex={1} />

                    {/* ── Footer: qty + total ── */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        px: { xs: 1.75, sm: 2 },
                        py: { xs: 1.25, sm: 1.5 },
                        mt: 1,
                        borderTop: `1px solid ${theme.palette.divider}`,
                        bgcolor: isDark
                          ? 'rgba(255,255,255,0.025)'
                          : 'rgba(0,0,0,0.018)',
                      }}
                    >
                      <QuantitySelector
                        quantity={product.quantity || 1}
                        max={product.stock}
                        onChange={(newQty) =>
                          handleQuantityChange(productId, newQty)
                        }
                        disabled={!isActive || isOrderLocked}
                      />

                      <Box textAlign='right'>
                        <Typography
                          sx={{
                            display: 'block',
                            fontSize: '0.6rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.07em',
                            color: 'text.disabled',
                            mb: 0.25,
                          }}
                        >
                          Total
                        </Typography>
                        <Typography
                          fontWeight={800}
                          color='primary.main'
                          sx={{
                            fontSize: { xs: '1.1rem', sm: '1rem' },
                            letterSpacing: '-0.01em',
                          }}
                        >
                          ₹{parseFloat(itemTotal).toLocaleString('en-IN')}
                        </Typography>
                      </Box>
                    </Box>

                    {product.quantity > product.stock && (
                      <Typography
                        variant='caption'
                        color='error.main'
                        sx={{
                          display: 'block',
                          px: { xs: 1.75, sm: 2 },
                          pb: 1,
                          mt: -0.5,
                        }}
                      >
                        ⚠ Exceeds stock ({product.stock} available)
                      </Typography>
                    )}
                  </Box>
                </Box>
              );
            })
          )}
        </Box>
      </Paper>

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
                ({customer?.cf_in_ex || 'Exclusive'})
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
        </Paper>
      )}

      <div ref={pageBottomRef} />

      <ImagePopupDialog
        open={openImagePopup}
        onClose={handleClosePopup}
        imageSources={popupImageSrc}
        initialSlide={popupImageIndex}
        setIndex={(newIndex: number) => setPopupImageIndex(newIndex)}
      />

      {/* ── Scroll navigation ── */}
      <Box
        sx={{
          position: 'fixed',
          bottom: { xs: theme.spacing(14), sm: theme.spacing(10), md: theme.spacing(5) },
          right: { xs: theme.spacing(1.5), sm: theme.spacing(2.5), md: theme.spacing(2) },
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          zIndex: 1000,
        }}
      >
        <IconButton
          onClick={() =>
            pageTopRef.current?.scrollIntoView({ behavior: 'smooth' })
          }
          size={isMobile ? 'medium' : 'large'}
          sx={{
            bgcolor: isDark
              ? 'rgba(124,111,205,0.85)'
              : 'rgba(42,74,107,0.85)',
            color: 'white',
            width: { xs: 40, sm: 48 },
            height: { xs: 40, sm: 48 },
            boxShadow: 4,
            backdropFilter: 'blur(8px)',
            '&:hover': {
              bgcolor: 'primary.main',
              boxShadow: 6,
              transform: 'scale(1.08)',
            },
            transition: 'all 0.2s ease',
          }}
        >
          <ArrowUpward fontSize='small' />
        </IconButton>
        <IconButton
          onClick={() =>
            pageBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
          }
          size={isMobile ? 'medium' : 'large'}
          sx={{
            bgcolor: isDark
              ? 'rgba(124,111,205,0.85)'
              : 'rgba(42,74,107,0.85)',
            color: 'white',
            width: { xs: 40, sm: 48 },
            height: { xs: 40, sm: 48 },
            boxShadow: 4,
            backdropFilter: 'blur(8px)',
            '&:hover': {
              bgcolor: 'primary.main',
              boxShadow: 6,
              transform: 'scale(1.08)',
            },
            transition: 'all 0.2s ease',
          }}
        >
          <ArrowDownward fontSize='small' />
        </IconButton>
      </Box>
    </Box>
  );
});

export default Review;
