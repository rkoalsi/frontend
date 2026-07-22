// ProductGroupCard.tsx - Component to display a group of product variants
import React, { memo, useMemo, useState } from "react";
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
import {
  AddShoppingCart,
  RemoveShoppingCart,
  ExpandMore,
} from "@mui/icons-material";
import QuantitySelector from "../QuantitySelector";
import ImageCarousel from "./ImageCarousel";
import { extractSize, extractWeight, getPackStep } from "../../../util/groupProducts";
import { getEffectiveMarginPct } from "../../../util/margin";
import { getTaxPercentage } from "../../../util/tax";

interface SearchResult {
  _id: string;
  name: string;
  images?: string[];
  category?: string;
  sub_category?: string;
  series?: string;
  cf_sku_code?: string;
  rate: number;
  stock: number;
  pre_order?: boolean;
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

interface ProductGroupCardProps {
  baseName: string;
  products: SearchResult[];
  primaryProduct: SearchResult;
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
  isOutOfStock?: boolean;
  handleNotifyMe?: (productId: string, productName: string) => void;
  outOfStockQuantities?: Record<string, number>;
  onOutOfStockQuantityChange?: (productId: string, qty: number) => void;
}


// Group variant: compare only this group's products' state slices.
const groupCardPropsAreEqual = (prev: ProductGroupCardProps, next: ProductGroupCardProps) => {
  if (
    prev.products !== next.products ||
    prev.primaryProduct !== next.primaryProduct ||
    prev.orderStatus !== next.orderStatus ||
    prev.customerMargin !== next.customerMargin ||
    prev.isShared !== next.isShared ||
    prev.isPreOrderTab !== next.isPreOrderTab ||
    prev.isOutOfStock !== next.isOutOfStock ||
    prev.getSellingPrice !== next.getSellingPrice ||
    prev.handleImageClick !== next.handleImageClick ||
    prev.handleQuantityChange !== next.handleQuantityChange ||
    prev.handleAddOrRemove !== next.handleAddOrRemove ||
    prev.handleNotifyMe !== next.handleNotifyMe ||
    prev.onOutOfStockQuantityChange !== next.onOutOfStockQuantityChange
  ) return false;
  for (const pr of next.products) {
    const id = pr._id;
    const preKey = `${id}-pre`;
    if (prev.temporaryQuantities[id] !== next.temporaryQuantities[id]) return false;
    if (prev.temporaryQuantities[preKey] !== next.temporaryQuantities[preKey]) return false;
    if (prev.specialMargins[id] !== next.specialMargins[id]) return false;
    if (prev.outOfStockQuantities?.[id] !== next.outOfStockQuantities?.[id]) return false;
    const a: any = prev.selectedProducts.find((p) => p._id === id);
    const b: any = next.selectedProducts.find((p) => p._id === id);
    if (a?.quantity !== b?.quantity || a?.pre_order_quantity !== b?.pre_order_quantity) return false;
  }
  return true;
};

const ProductGroupCard: React.FC<ProductGroupCardProps> = memo(
  ({
    baseName,
    products,
    primaryProduct,
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
    isOutOfStock = false,
    handleNotifyMe,
    outOfStockQuantities = {},
    onOutOfStockQuantityChange,
  }) => {
    const [selectedVariantId, setSelectedVariantId] = useState<string>(
      primaryProduct._id
    );

    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const isTablet = useMediaQuery(theme.breakpoints.down("md"));

    const isDisabled =
      orderStatus?.toLowerCase().includes("accepted") ||
      orderStatus?.toLowerCase().includes("declined");

    // Get the currently displayed variant
    const currentVariant = useMemo(
      () => products.find((p) => p._id === selectedVariantId) || primaryProduct,
      [products, selectedVariantId, primaryProduct]
    );

    const productId = currentVariant._id;
    const packStep = getPackStep(currentVariant.name);
    const selectedProduct: any = selectedProducts.find(
      (p) => p._id === productId
    );
    const isSplitVariant = currentVariant.pre_order === true && (currentVariant.stock ?? 0) > 0;
    const isPreOrderCartGroup = isPreOrderTab && isSplitVariant;
    const showAsPreOrderLabelGroup = isPreOrderTab && currentVariant.pre_order === true;
    // Admin/internal-only logistics dates for pre-order variants
    const fmtDate = (v?: string) => {
      if (!v) return '';
      const d = new Date(v);
      return isNaN(d.getTime()) ? v : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };
    const preOrderDates = (!isShared && currentVariant.pre_order && currentVariant.inward_date) ? (
      <Box sx={{ mt: 0.5 }}>
        <Typography variant="caption" color="warning.main" sx={{ display: 'block', fontSize: '0.6rem', fontWeight: 700 }}>
          Inward: {fmtDate(currentVariant.inward_date)}
        </Typography>
      </Box>
    ) : null;
    const quantity = isPreOrderCartGroup
      ? (selectedProduct?.pre_order_quantity || temporaryQuantities[`${productId}-pre`] || "")
      : (selectedProduct?.quantity || temporaryQuantities[productId] || "");
    const isInCartGroup = isPreOrderCartGroup
      ? (selectedProduct?.pre_order_quantity ?? 0) > 0
      : !!selectedProduct && (selectedProduct?.quantity ?? 0) > 0;
    const sellingPrice = getSellingPrice(currentVariant);
    const itemTotal = parseFloat((sellingPrice * (quantity || 0)).toFixed(2));
    const isQuantityExceedingStock = !isPreOrderCartGroup && !currentVariant.pre_order && quantity > currentVariant.stock;

    // Memoize expensive variant size extraction so it only reruns when products change
    const sortedVariants = useMemo(() => {
      const variantMap = new Map<string, typeof products[0]>();
      let parentProd: typeof products[0] | null = null;
      let parentSizeLabel = '';

      products.forEach((product) => {
        let sizeLabel = '';

        const sizeMeasurementMatch = product.name.match(/[（(]\s*(XXXXL|XXXL|XXL|XL|XXXXS|XXXS|XXS|XS|S|M|L)\s*\/\s*\d+\s*[Cc]?[Mm]\s*[)）]/i);
        if (sizeMeasurementMatch) {
          sizeLabel = sizeMeasurementMatch[1].toUpperCase();
        } else if (product.name.match(/#(\d+)/)) {
          const numberSizeMatch = product.name.match(/#(\d+)/);
          sizeLabel = `#${numberSizeMatch![1]}`;
        } else {
          const measurementMatch = product.name.match(/(\d+\.?\d*mm)/i);
          if (measurementMatch) {
            sizeLabel = measurementMatch[1];
          } else {
            const fullWordPatterns = [
              /-\s*(XXX-Large|XX-Large|X-Large|X-Small|Extra Large|Extra Small|Large|Medium|Small)$/i,
              /\s+(XXX-Large|XX-Large|X-Large|X-Small|Extra Large|Extra Small|Large|Medium|Small)$/i,
              /-(XXX-Large|XX-Large|X-Large|X-Small|Extra Large|Extra Small|Large|Medium|Small)$/i,
            ];
            for (const pattern of fullWordPatterns) {
              const match = product.name.match(pattern);
              if (match) {
                const size = match[1];
                if (size.toLowerCase() === 'x-large') sizeLabel = 'XL';
                else if (size.toLowerCase() === 'xx-large') sizeLabel = 'XXL';
                else if (size.toLowerCase() === 'xxx-large') sizeLabel = 'XXXL';
                else if (size.toLowerCase() === 'x-small') sizeLabel = 'XS';
                else if (size.toLowerCase() === 'extra large') sizeLabel = 'XL';
                else if (size.toLowerCase() === 'extra small') sizeLabel = 'XS';
                else if (size.toLowerCase() === 'large') sizeLabel = 'L';
                else if (size.toLowerCase() === 'medium') sizeLabel = 'M';
                else if (size.toLowerCase() === 'small') sizeLabel = 'S';
                break;
              }
            }
            if (!sizeLabel) {
              const patterns = [
                /-\s*(XXXXL|XXXL|XXL|XL|XXXXS|XXXS|XXS|XS|L|M|S)$/i,
                /\s+(XXXXL|XXXL|XXL|XL|XXXXS|XXXS|XXS|XS|L|M|S)$/i,
                /\s+(XXXXL|XXXL|XXL|XL|XXXXS|XXXS|XXS|XS|L|M|S)-[A-Za-z]/i,
                /\s+(XXXXL|XXXL|XXL|XL|XXXXS|XXXS|XXS|XS|L|M|S)\s+-/i,
                /-\s*(XXXXL|XXXL|XXL|XL|XXXXS|XXXS|XXS|XS|L|M|S)\s+-/i,
                /-\s*(XXXXL|XXXL|XXL|XL|XXXXS|XXXS|XXS|XS|L|M|S)\s+/i,
                /-(XXXXL|XXXL|XXL|XL|XXXXS|XXXS|XXS|XS|L|M|S)-/i,
                /-(XXXXL|XXXL|XXL|XL|XXXXS|XXXS|XXS|XS|L|M|S)\s/i,
                /\(([SMLX]{1,4})\)$/i,
              ];
              for (const pattern of patterns) {
                const match = product.name.match(pattern);
                if (match) { sizeLabel = match[1].toUpperCase(); break; }
              }
            }
          }
        }

        if (!sizeLabel) {
          parentProd = product;
          parentSizeLabel = 'Standard';
        } else if (!variantMap.has(sizeLabel)) {
          variantMap.set(sizeLabel, product);
        }
      });

      if (parentProd && parentSizeLabel && !variantMap.has(parentSizeLabel)) {
        variantMap.set(parentSizeLabel, parentProd);
      }

      const sizeOrder = ['XXXXS', 'XXXS', 'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL'];
      return Array.from(variantMap.entries())
        .map(([sizeLabel, product]) => ({ product, sizeLabel, parentProduct: parentProd }))
        .sort((a, b) => {
          if (a.sizeLabel === 'Standard') return -1;
          if (b.sizeLabel === 'Standard') return 1;
          const isNumberA = a.sizeLabel.startsWith('#');
          const isNumberB = b.sizeLabel.startsWith('#');
          const isMeasurementA = a.sizeLabel.endsWith('mm');
          const isMeasurementB = b.sizeLabel.endsWith('mm');
          if (isNumberA && isNumberB) return parseInt(a.sizeLabel.substring(1)) - parseInt(b.sizeLabel.substring(1));
          if (isMeasurementA && isMeasurementB) return parseFloat(a.sizeLabel.replace('mm', '')) - parseFloat(b.sizeLabel.replace('mm', ''));
          if (isNumberA || isMeasurementA) return 1;
          if (isNumberB || isMeasurementB) return -1;
          return sizeOrder.indexOf(a.sizeLabel) - sizeOrder.indexOf(b.sizeLabel);
        });
    }, [products]);

    return (
      <Card
        sx={{
          display: "flex",
          flexDirection: "column",
          height: '100%',
          minHeight: '100%',
          borderRadius: '16px',
          boxShadow: selectedProduct ? 4 : 2,
          overflow: "visible",
          backgroundColor: "background.paper",
          border: selectedProduct ? '2px solid' : '1px solid',
          borderColor: selectedProduct ? 'primary.main' : 'divider',
          contain: 'layout style paint',
          transition: isMobile || isTablet ? 'none' : 'box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease',
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
            {isInCartGroup && (
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
          {isOutOfStock ? (
            <Chip
              label="OUT OF STOCK"
              size="small"
              color="error"
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                zIndex: 10,
                fontWeight: 'bold',
                fontSize: "0.65rem",
                borderRadius: '12px',
                padding: "6px 8px",
                boxShadow: 2,
              }}
            />
          ) : (
            currentVariant.new && !(currentVariant as any).clearance && (
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
            )
          )}

          {/* Hide the Sale / Special Offer chip inside the Pre Orders tab only. */}
          {(currentVariant as any).clearance && !isPreOrderTab && (
            <Chip
              label={((currentVariant as any).clearance_margin ?? 0) > 0 ? `Sale +${(currentVariant as any).clearance_margin}%` : 'Sale'}
              size="small"
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                zIndex: 11,
                fontWeight: 700,
                fontSize: "0.65rem",
                textTransform: 'uppercase',
                borderRadius: '12px',
                padding: "6px 8px",
                backgroundColor: isDark ? '#4A2A3D' : '#F9E2EF',
                color: isDark ? '#F2A9D2' : '#A22F68',
                boxShadow: 1,
              }}
            />
          )}

          {/* Pre Order chip — shown for every item in the Pre Orders tab.
              Placed top-right (the Sale chip is hidden in this tab). */}
          {showAsPreOrderLabelGroup && (
            <Chip
              label="Pre Order"
              size="small"
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                zIndex: 11,
                fontWeight: 700,
                fontSize: "0.65rem",
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                borderRadius: '12px',
                padding: "6px 8px",
                color: isDark ? '#F2DE64' : '#6B5D00',
                backgroundColor: isDark ? '#3F3A15' : '#F6EEBC',
              }}
            />
          )}

          {!isShared && !isOutOfStock && (
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
              {isSplitVariant && !isPreOrderTab ? (
                <>
                  {/* Split variant: stock now + arriving soon, on separate lines */}
                  <Chip
                    size="small"
                    label={`Stock ${currentVariant.stock.toLocaleString('en-IN')}`}
                    sx={{
                      height: 22,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      letterSpacing: '0.02em',
                      boxShadow: 1,
                      ...(currentVariant.stock > 10
                        ? { bgcolor: isDark ? '#26402F' : '#DFF2E5', color: isDark ? '#9FDDB2' : '#1F5A33' }
                        : { bgcolor: isDark ? '#442527' : '#FBE3E3', color: isDark ? '#F49B9B' : '#A93232' }),
                    }}
                  />
                  <Chip
                    size="small"
                    label={`Soon ${currentVariant.upcoming_stock ?? 0}`}
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
                    (isPreOrderTab || (currentVariant.pre_order && (currentVariant.stock ?? 0) <= 0))
                      ? `Soon: ${currentVariant.upcoming_stock ?? '—'}`
                      : `Stock ${currentVariant.stock.toLocaleString('en-IN')}`
                  }
                  sx={{
                    height: 22,
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '0.02em',
                    boxShadow: 1,
                    ...((isPreOrderTab || (currentVariant.pre_order && (currentVariant.stock ?? 0) <= 0))
                      ? { bgcolor: isDark ? '#EFD84A' : '#E4CD2E', color: '#1C1A33' }
                      : currentVariant.stock > 10
                        ? { bgcolor: isDark ? '#26402F' : '#DFF2E5', color: isDark ? '#9FDDB2' : '#1F5A33' }
                        : { bgcolor: isDark ? '#442527' : '#FBE3E3', color: isDark ? '#F49B9B' : '#A93232' }),
                  }}
                />
              )}
            </Box>
          )}
          <ImageCarousel
            product={currentVariant}
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
            {currentVariant.name}
          </Typography>

          {/* Variant Selector - Compact */}
          <Box sx={{ mb: 1 }}>
            <Box sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 0.75,
            }}>
              {sortedVariants.map(({ product, sizeLabel, parentProduct: parentProd }) => {
                const isSelected = selectedVariantId === product._id;
                const isInCart = selectedProducts.some((p) => p._id === product._id);
                return (
                  <Chip
                    key={product._id}
                    label={sizeLabel}
                    onClick={() => {
                      if (isSelected && parentProd) {
                        setSelectedVariantId(parentProd._id);
                      } else {
                        setSelectedVariantId(product._id);
                      }
                    }}
                    color={isInCart ? "success" : isSelected ? "primary" : "default"}
                    variant={isSelected ? "filled" : "outlined"}
                    size="small"
                    sx={{
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: isMobile || isTablet ? 'none' : 'transform 0.15s ease, box-shadow 0.15s ease',
                      fontSize: '0.72rem',
                      height: '24px',
                      minWidth: '38px',
                      '& .MuiChip-label': { px: 1.5 },
                      '&:hover': {
                        transform: isMobile || isTablet ? 'none' : 'translate3d(0, -2px, 0)',
                        boxShadow: isMobile || isTablet ? 'none' : 2,
                      },
                    }}
                  />
                );
              })}
            </Box>
          </Box>

          {/* Category */}
          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', gap: 0.75, mb: 0.75, flexWrap: 'wrap', alignItems: 'center' }}>
              {currentVariant.category && (
                <Chip
                  label={currentVariant.category}
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
              {currentVariant.sub_category && (
                <Chip
                  label={currentVariant.sub_category}
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

          {/* Dimensions Accordion - Compact */}
          {currentVariant.dimensions && (currentVariant.dimensions.length || currentVariant.dimensions.breadth || currentVariant.dimensions.height) && (
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
                    {currentVariant.dimensions.length !== undefined && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>L:</Typography>
                        <Typography variant="body2" component="span" sx={{ ml: 0.5, fontSize: '0.75rem' }}>{currentVariant.dimensions.length}cm</Typography>
                      </Box>
                    )}
                    {currentVariant.dimensions.breadth !== undefined && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>B:</Typography>
                        <Typography variant="body2" component="span" sx={{ ml: 0.5, fontSize: '0.75rem' }}>{currentVariant.dimensions.breadth}cm</Typography>
                      </Box>
                    )}
                    {currentVariant.dimensions.height !== undefined && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>H:</Typography>
                        <Typography variant="body2" component="span" sx={{ ml: 0.5, fontSize: '0.75rem' }}>{currentVariant.dimensions.height}cm</Typography>
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
            {isShared || isOutOfStock ? (
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                <Typography sx={{ fontWeight: 800, fontSize: { xs: '0.95rem', sm: '1.05rem' }, color: 'text.primary', fontVariantNumeric: 'tabular-nums' }}>
                  ₹{currentVariant.rate?.toLocaleString('en-IN')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  MRP · GST {getTaxPercentage(currentVariant)}%
                </Typography>
              </Box>
            ) : (
              <Box sx={{ mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                  <Typography sx={{ fontWeight: 800, fontSize: { xs: '0.95rem', sm: '1.05rem' }, color: 'text.primary', fontVariantNumeric: 'tabular-nums' }}>
                    ₹{sellingPrice?.toLocaleString('en-IN')}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textDecoration: 'line-through', fontVariantNumeric: 'tabular-nums' }}>
                    ₹{currentVariant.rate?.toLocaleString('en-IN')}
                  </Typography>
                  {(() => {
                    const baseMarginStr = specialMargins[productId] || customerMargin || '40%';
                    const basePct = parseInt(String(baseMarginStr).replace('%', ''), 10) || 40;
                    const totalPct = getEffectiveMarginPct(baseMarginStr, currentVariant);
                    const hasClearance = (currentVariant as any).clearance && totalPct > basePct;
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
                    GST {getTaxPercentage(currentVariant)}%
                  </Typography>
                </Box>
                {preOrderDates}
              </Box>
            )}

            {!isOutOfStock && selectedProduct && (
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

          {isOutOfStock ? (
            /* Pre-order Section for Out of Stock */
            !isShared && handleNotifyMe && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                >
                  Pre-order Quantity
                </Typography>
                <QuantitySelector
                  quantity={outOfStockQuantities[currentVariant._id] || 1}
                  onChange={(newQty: number) =>
                    onOutOfStockQuantityChange?.(currentVariant._id, newQty)
                  }
                  max={999}
                />
                <Button
                  variant="outlined"
                  color="secondary"
                  fullWidth
                  size="medium"
                  onClick={() => handleNotifyMe(currentVariant._id, currentVariant.name)}
                  sx={{
                    textTransform: "none",
                    borderRadius: 2,
                    fontWeight: 600,
                    py: 0.75,
                    fontSize: { xs: '0.75rem', sm: '0.8rem' },
                    boxShadow: 2,
                    transition: 'box-shadow 0.15s ease, transform 0.15s ease',
                    willChange: 'transform',
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translate3d(0, -1px, 0)',
                    },
                  }}
                >
                  Notify when available
                </Button>
              </Box>
            )
          ) : (
            <>
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
                  max={isPreOrderCartGroup
                    ? (currentVariant.upcoming_stock || Infinity)
                    : (currentVariant.pre_order && (currentVariant.stock ?? 0) <= 0 ? (currentVariant.upcoming_stock || Infinity) : currentVariant.stock)}
                  step={packStep}
                  onChange={(newQuantity) =>
                    handleQuantityChange(productId, newQuantity, isPreOrderCartGroup)
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
              <Tooltip title={isInCartGroup ? (isPreOrderCartGroup ? "Remove pre-order" : "Remove from cart") : (isPreOrderCartGroup ? "Add as pre-order" : "Add to cart")}>
                <span>
                  <Button
                    variant="contained"
                    color={isInCartGroup ? "error" : "primary"}
                    startIcon={
                      isInCartGroup ? <RemoveShoppingCart /> : <AddShoppingCart />
                    }
                    onClick={() => handleAddOrRemove(currentVariant)}
                    disabled={isDisabled}
                    fullWidth
                    size="medium"
                    sx={{
                      textTransform: "none",
                      borderRadius: 2,
                      fontWeight: 600,
                      py: 1,
                      fontSize: '0.85rem',
                      boxShadow: 2,
                      transition: 'box-shadow 0.15s ease, transform 0.15s ease',
                      willChange: 'transform',
                      '&:hover': {
                        boxShadow: 4,
                        transform: 'translate3d(0, -1px, 0)',
                      },
                      '&:disabled': {
                        backgroundColor: 'action.disabledBackground',
                        color: 'action.disabled',
                      },
                    }}
                  >
                    {isInCartGroup
                      ? ((isPreOrderCartGroup || (isPreOrderTab && currentVariant.pre_order)) ? "Remove Pre-Order" : "Remove from Cart")
                      : ((isPreOrderCartGroup || (isPreOrderTab && currentVariant.pre_order)) ? "Add as Pre-Order" : "Add to Cart")}
                  </Button>
                </span>
              </Tooltip>
            </>
          )}
        </CardContent>
      </Card>
    );
  },
  groupCardPropsAreEqual
);

export default ProductGroupCard;
