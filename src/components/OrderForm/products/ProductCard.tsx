// ProductCard.tsx
import React, { memo, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  Alert,
  Divider,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { AddShoppingCart, RemoveShoppingCart, ExpandMore } from "@mui/icons-material";
import QuantitySelector from "../QuantitySelector";
import ImageCarousel from "./ImageCarousel";
import { getPackStep } from "../../../util/groupProducts";
import { getEffectiveMarginPct } from "../../../util/margin";
import { getTaxPercentage } from "../../../util/tax";

interface SearchResult {
  _id: string;
  name: string;
  images?: string[]; // Changed from image_url to image_urls array
  category?: string;
  sub_category?: string;
  series?: string;
  cf_sku_code?: string;
  rate: number;
  stock: number;
  pre_order?: boolean;
  clearance?: boolean;
  clearance_margin?: number;
  upcoming_stock?: number;
  inward_date?: string;
  eta_port_date?: string;
  new?: boolean;
  item_tax_preferences: any;
  upc_code?: string;
  dimensions?: {
    length?: number;
    breadth?: number;
    height?: number;
  };
}

interface ProductCardProps {
  product: SearchResult;
  selectedProducts: SearchResult[];
  temporaryQuantities: { [key: string]: number };
  specialMargins: { [key: string]: string };
  customerMargin: string;
  orderStatus?: string;
  getSellingPrice: any;
  handleImageClick: any;
  handleQuantityChange: (id: string, newQuantity: number, isPreOrder?: boolean) => void;
  handleAddOrRemove: (product: SearchResult) => void;
  index: number;
  isShared: boolean;
  isPreOrderTab?: boolean;
}


// Re-render only when this card's own slice of state changes — selectedProducts
// and temporaryQuantities are new objects on every parent render, so the default
// shallow compare would re-render every visible card on each keystroke.
const productCardPropsAreEqual = (prev: ProductCardProps, next: ProductCardProps) => {
  const id = next.product._id;
  const preKey = `${id}-pre`;
  const ps: any = prev.selectedProducts.find((p) => p._id === id);
  const ns: any = next.selectedProducts.find((p) => p._id === id);
  return (
    prev.product === next.product &&
    prev.orderStatus === next.orderStatus &&
    prev.customerMargin === next.customerMargin &&
    prev.isShared === next.isShared &&
    prev.isPreOrderTab === next.isPreOrderTab &&
    prev.specialMargins[id] === next.specialMargins[id] &&
    prev.temporaryQuantities[id] === next.temporaryQuantities[id] &&
    prev.temporaryQuantities[preKey] === next.temporaryQuantities[preKey] &&
    ps?.quantity === ns?.quantity &&
    ps?.pre_order_quantity === ns?.pre_order_quantity &&
    prev.getSellingPrice === next.getSellingPrice &&
    prev.handleImageClick === next.handleImageClick &&
    prev.handleQuantityChange === next.handleQuantityChange &&
    prev.handleAddOrRemove === next.handleAddOrRemove
  );
};

const ProductCard: React.FC<ProductCardProps> = memo(
  ({
    product,
    selectedProducts,
    temporaryQuantities,
    specialMargins,
    customerMargin,
    orderStatus,
    getSellingPrice,
    handleImageClick,
    handleQuantityChange,
    handleAddOrRemove,
    index,
    isShared = false,
    isPreOrderTab = false,
  }) => {
    const productId = product._id;
    const packStep = getPackStep(product.name);
    const selectedProduct: any = selectedProducts.find(
      (p) => p._id === productId
    );
    const isSplitProd = product.pre_order === true && (product.stock ?? 0) > 0;
    const isPreOrderCart = isPreOrderTab && isSplitProd;
    // Admin/internal-only logistics dates for pre-order products
    const fmtDate = (v?: string) => {
      if (!v) return '';
      const d = new Date(v);
      return isNaN(d.getTime()) ? v : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };
    const preOrderDates = (!isShared && product.pre_order && product.inward_date) ? (
      <Box sx={{ mt: 0.5 }}>
        <Typography variant="caption" color="warning.main" sx={{ display: 'block', fontSize: '0.6rem', fontWeight: 700 }}>
          Inward: {fmtDate(product.inward_date)}
        </Typography>
      </Box>
    ) : null;
    // All pre-order products on the Pre Orders tab show pre-order labels
    const showAsPreOrderLabel = isPreOrderTab && product.pre_order === true;
    const quantity = isPreOrderCart
      ? (selectedProduct?.pre_order_quantity || temporaryQuantities[`${productId}-pre`] || "")
      : (selectedProduct?.quantity || temporaryQuantities[productId] || "");
    const isInCart = isPreOrderCart
      ? (selectedProduct?.pre_order_quantity ?? 0) > 0
      : !!selectedProduct && (selectedProduct?.quantity ?? 0) > 0;
    const sellingPrice = getSellingPrice(product);
    const itemTotal = parseFloat((sellingPrice * quantity).toFixed(2));
    const isQuantityExceedingStock = !isPreOrderCart && (product.stock ?? 0) > 0 && quantity > product.stock;
    const isDisabled =
      orderStatus?.toLowerCase().includes("accepted") ||
      orderStatus?.toLowerCase().includes("declined");

    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const isTablet = useMediaQuery(theme.breakpoints.down("md"));

    return (
      <Card
        sx={{
          display: "flex",
          flexDirection: "column",
          height: '100%',
          minHeight: '100%',
          borderRadius: '16px',
          boxShadow: isInCart ? 4 : 2,
          overflow: "visible",
          backgroundColor: "background.paper",
          border: isInCart ? '2px solid' : '1px solid',
          borderColor: isInCart ? 'primary.main' : 'divider',
          transition: isMobile || isTablet ? 'none' : 'box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease',
          contain: 'layout style paint',
          '&:hover': {
            boxShadow: 6,
            transform: isMobile || isTablet ? 'none' : 'translate3d(0, -4px, 0)',
            borderColor: 'primary.light',
          },
        }}
      >
          {/* Image Section */}
          <Box
            sx={{
              position: "relative",
              bgcolor: 'background.paper',
              height: { xs: 150, sm: 210, md: 230, xl: 210 },
              width: '100%',
            }}
          >
            {isInCart && (
              <Box
                aria-hidden
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  right: 8,
                  zIndex: 10,
                  width: 12,
                  height: 12,
                  bgcolor: 'primary.main',
                  borderRadius: '50%',
                  border: '2px solid',
                  borderColor: 'background.paper',
                  boxShadow: 1,
                }}
              />
            )}
            {product.new && !product.pre_order && !product.clearance && (
              <Chip
                size="small"
                label="New"
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  zIndex: 10,
                  height: 22,
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  bgcolor: isDark ? '#322B5F' : '#E7E2F9',
                  color: isDark ? '#BCAFFF' : '#37279C',
                  boxShadow: 1,
                  '& .MuiChip-label': { px: 1 },
                }}
              />
            )}

            {/* Hide the Sale / Special Offer chip inside the Pre Orders tab only. */}
            {product.clearance && !isPreOrderTab && (
              <Chip
                label={(product.clearance_margin ?? 0) > 0 ? `Sale +${product.clearance_margin}%` : 'Sale'}
                size="small"
                sx={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  zIndex: 11,
                  fontWeight: 700,
                  fontSize: '0.65rem',
                  textTransform: 'uppercase',
                  backgroundColor: isDark ? '#4A2A3D' : '#F9E2EF',
                  color: isDark ? '#F2A9D2' : '#A22F68',
                  boxShadow: 1,
                }}
              />
            )}

            {/* Pre Order chip — shown for every item in the Pre Orders tab.
                Placed top-right (the Sale chip is hidden in this tab). */}
            {showAsPreOrderLabel && (
              <Chip
                label="Pre Order"
                size="small"
                sx={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  zIndex: 11,
                  fontWeight: 700,
                  fontSize: '0.65rem',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  color: isDark ? '#F2DE64' : '#6B5D00',
                  backgroundColor: isDark ? '#3F3A15' : '#F6EEBC',
                }}
              />
            )}

            {!isShared && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  left: 8,
                  zIndex: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 0.5,
                }}
              >
                {isSplitProd && !isPreOrderTab ? (
                  <>
                    {/* Split product: stock now + arriving soon, on separate lines */}
                    <Chip
                      size="small"
                      label={`Stock ${product.stock.toLocaleString('en-IN')}`}
                      sx={{
                        height: 22,
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        letterSpacing: '0.02em',
                        boxShadow: 1,
                        ...(product.stock > 10
                          ? { bgcolor: isDark ? '#26402F' : '#DFF2E5', color: isDark ? '#9FDDB2' : '#1F5A33' }
                          : { bgcolor: isDark ? '#442527' : '#FBE3E3', color: isDark ? '#F49B9B' : '#A93232' }),
                      }}
                    />
                    <Chip
                      size="small"
                      label={`Soon ${product.upcoming_stock ?? 0}`}
                      sx={{
                        height: 22,
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        letterSpacing: '0.02em',
                        boxShadow: 1,
                        bgcolor: isDark ? '#3F3A15' : '#F6EEBC',
                        color: isDark ? '#F2DE64' : '#6B5D00',
                      }}
                    />
                  </>
                ) : (
                  <Chip
                    size="small"
                    label={
                      (isPreOrderTab || (product.pre_order && !product.stock))
                        ? `Soon: ${product.upcoming_stock ?? '—'}`
                        : `Stock ${product.stock.toLocaleString('en-IN')}`
                    }
                    sx={{
                      height: 22,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      letterSpacing: '0.02em',
                      boxShadow: 1,
                      ...((isPreOrderTab || (product.pre_order && !product.stock))
                        ? { bgcolor: isDark ? '#EFD84A' : '#E4CD2E', color: '#1C1A33' }
                        : product.stock > 10
                          ? { bgcolor: isDark ? '#26402F' : '#DFF2E5', color: isDark ? '#9FDDB2' : '#1F5A33' }
                          : { bgcolor: isDark ? '#442527' : '#FBE3E3', color: isDark ? '#F49B9B' : '#A93232' }),
                    }}
                  />
                )}
              </Box>
            )}
            <ImageCarousel
              product={product}
              handleImageClick={handleImageClick}
            />
          </Box>


          <CardContent sx={{ p: { xs: 1.25, sm: 2 }, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Product Name */}
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                mb: 1,
                color: 'text.primary',
                lineHeight: 1.3,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                wordBreak: 'break-word',
                fontSize: { xs: '0.85rem', sm: '0.95rem' },
              }}
            >
              {product.name}
            </Typography>

            {/* Category */}
            <Box sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', gap: 0.75, mb: 0.75, flexWrap: 'wrap', alignItems: 'center' }}>
                {product.category && (
                  <Chip
                    label={product.category}
                    size="small"
                    sx={{
                      borderRadius: 1.5,
                      fontSize: '0.62rem',
                      height: '20px',
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      backgroundColor: isDark ? '#322B5F' : '#E7E2F9',
                      color: isDark ? '#BCAFFF' : '#37279C',
                      '& .MuiChip-label': { px: 1 },
                    }}
                  />
                )}
                {product.sub_category && (
                  <Chip
                    label={product.sub_category}
                    variant="filled"
                    size="small"
                    sx={{
                      borderRadius: 1.5,
                      fontSize: '0.7rem',
                      height: '24px',
                      fontWeight: 600,
                      bgcolor: 'secondary.50',
                      color: 'secondary.dark',
                      '& .MuiChip-label': { px: 1.5 },
                    }}
                  />
                )}
              </Box>
            </Box>

            {/* Dimensions Accordion - More Compact */}
            {product.dimensions && (product.dimensions.length || product.dimensions.breadth || product.dimensions.height) && (
              <Box sx={{ mb: 1, display: { xs: 'none', sm: 'block' } }}>
                <Accordion
                  elevation={0}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '6px !important',
                    '&:before': { display: 'none' },
                    '& .MuiAccordionSummary-root': {
                      minHeight: '36px',
                      '&.Mui-expanded': { minHeight: '36px' },
                    },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMore sx={{ fontSize: '1.2rem' }} />}
                    sx={{ '& .MuiAccordionSummary-content': { margin: '6px 0' } }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        color: 'text.secondary',
                      }}
                    >
                      Dimensions
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ pt: 0, pb: 1 }}>
                    <Box sx={{ display: 'flex', gap: 2, fontSize: '0.75rem' }}>
                      {product.dimensions.length !== undefined && (
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>L:</Typography>
                          <Typography variant="body2" component="span" sx={{ ml: 0.5, fontSize: '0.75rem' }}>{product.dimensions.length}cm</Typography>
                        </Box>
                      )}
                      {product.dimensions.breadth !== undefined && (
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>B:</Typography>
                          <Typography variant="body2" component="span" sx={{ ml: 0.5, fontSize: '0.75rem' }}>{product.dimensions.breadth}cm</Typography>
                        </Box>
                      )}
                      {product.dimensions.height !== undefined && (
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>H:</Typography>
                          <Typography variant="body2" component="span" sx={{ ml: 0.5, fontSize: '0.75rem' }}>{product.dimensions.height}cm</Typography>
                        </Box>
                      )}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              </Box>
            )}

            <Divider sx={{ my: 1 }} />

            {/* Pricing — compact */}
            <Box sx={{ mb: 1 }}>
              {isShared ? (
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: { xs: '0.95rem', sm: '1.05rem' }, color: 'text.primary', fontVariantNumeric: 'tabular-nums' }}>
                    ₹{product.rate?.toLocaleString('en-IN')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    MRP · GST {getTaxPercentage(product)}%
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                    <Typography sx={{ fontWeight: 800, fontSize: { xs: '0.95rem', sm: '1.05rem' }, color: 'text.primary', fontVariantNumeric: 'tabular-nums' }}>
                      ₹{sellingPrice?.toLocaleString('en-IN')}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textDecoration: 'line-through', fontVariantNumeric: 'tabular-nums' }}>
                      ₹{product.rate?.toLocaleString('en-IN')}
                    </Typography>
                    {(() => {
                      const baseMarginStr = specialMargins[productId] || customerMargin || '40%';
                      const basePct = parseInt(String(baseMarginStr).replace('%', ''), 10) || 40;
                      const totalPct = getEffectiveMarginPct(baseMarginStr, product);
                      const hasClearance = product.clearance && totalPct > basePct;
                      return (
                        <Typography
                          component="span"
                          title={hasClearance ? `${basePct}% + ${totalPct - basePct}% sale = ${totalPct}% margin` : undefined}
                          sx={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            lineHeight: 1,
                            px: 0.75,
                            py: 0.4,
                            borderRadius: '999px',
                            bgcolor: hasClearance
                              ? (isDark ? '#442527' : '#FBE3E3')
                              : (isDark ? '#1E3D3A' : '#DCEFED'),
                            color: hasClearance
                              ? (isDark ? '#F49B9B' : '#A93232')
                              : (isDark ? '#8FD9CF' : '#0B5E57'),
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {totalPct}% margin
                        </Typography>
                      );
                    })()}
                    <Box sx={{ flex: 1 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                      GST {getTaxPercentage(product)}%
                    </Typography>
                  </Box>
                  {preOrderDates}
                </Box>
              )}

              {isInCart && (
                <Box
                  sx={{
                    py: 0.5,
                    px: 1.25,
                    bgcolor: isDark ? 'rgba(143,211,166,0.12)' : '#E4F2E9',
                    borderRadius: 1.5,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: '1px solid',
                    borderColor: 'success.main',
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'success.dark', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    Total
                  </Typography>
                  <Typography sx={{ fontWeight: 800, color: 'success.dark', fontSize: '0.95rem', fontVariantNumeric: 'tabular-nums' }}>
                    ₹{itemTotal?.toLocaleString('en-IN')}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Spacer to push content to bottom */}
            <Box sx={{ flexGrow: 1 }} />

            {/* Quantity Selector */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                mb: 1,
              }}
            >
              <QuantitySelector
                quantity={quantity}
                max={isPreOrderCart ? (product.upcoming_stock || Infinity) : (product.pre_order && (product.stock ?? 0) <= 0 ? (product.upcoming_stock || Infinity) : product.stock)}
                step={packStep}
                onChange={(newQuantity) =>
                  handleQuantityChange(productId, newQuantity, isPreOrderCart)
                }
                disabled={isDisabled}
              />
              {isQuantityExceedingStock && (
                <Alert
                  severity="error"
                  sx={{
                    mt: 0.75,
                    py: 0,
                    px: 1,
                    fontSize: '0.65rem',
                    '& .MuiAlert-message': { py: 0 }
                  }}
                >
                  Exceeds stock!
                </Alert>
              )}
            </Box>

            {/* Action Button */}
            <Tooltip title={isInCart ? (isPreOrderCart ? "Remove pre-order" : "Remove from cart") : (isPreOrderCart ? "Add as pre-order" : "Add to cart")}>
              <span>
                <Button
                  variant="contained"
                  color={isInCart ? "error" : "primary"}
                  startIcon={
                    isInCart ? <RemoveShoppingCart /> : <AddShoppingCart />
                  }
                  onClick={() => handleAddOrRemove(product)}
                  disabled={isDisabled}
                  fullWidth
                  size="medium"
                  sx={{
                    textTransform: "none",
                    borderRadius: 2,
                    fontWeight: 600,
                    py: 0.75,
                    fontSize: { xs: '0.75rem', sm: '0.8rem' },
                    boxShadow: 2,
                    transition: isMobile || isTablet ? 'none' : 'box-shadow 0.15s ease, transform 0.15s ease',
                    '&:hover': {
                      boxShadow: 4,
                      transform: isMobile || isTablet ? 'none' : 'translate3d(0, -1px, 0)',
                    },
                    '&:disabled': {
                      backgroundColor: 'action.disabledBackground',
                      color: 'action.disabled',
                    },
                  }}
                >
                  {isInCart
                    ? (showAsPreOrderLabel ? "Remove Pre-Order" : "Remove from Cart")
                    : (showAsPreOrderLabel ? "Add as Pre-Order" : "Add to Cart")}
                </Button>
              </span>
            </Tooltip>
          </CardContent>
        </Card>
    );
  },
  productCardPropsAreEqual
);

export default ProductCard;