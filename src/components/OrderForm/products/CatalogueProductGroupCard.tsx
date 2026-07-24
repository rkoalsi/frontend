// CatalogueProductGroupCard.tsx - Simplified product group card for catalogue browsing
import React, { memo, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  useTheme,
} from "@mui/material";
import { ZoomIn } from "@mui/icons-material";
import ImageCarousel from "./ImageCarousel";
import { getTaxPercentage } from "../../../util/tax";

interface Product {
  _id: string;
  name: string;
  images?: string[];
  brand?: string;
  category: string;
  sub_category?: string;
  series?: string;
  cf_sku_code?: string;
  rate: number;
  stock: number;
  new?: boolean;
  item_tax_preferences: any;
  upc_code?: string;
  dimensions?: {
    length?: number;
    breadth?: number;
    height?: number;
  };
}

interface CatalogueProductGroupCardProps {
  baseName: string;
  products: Product[];
  primaryProduct: Product;
  onQuickView: (product: Product, allProducts: Product[]) => void;
  viewDensity?: '3x3' | '4x4' | '5x5';
  isOutOfStock?: boolean;
  onNotifyMe?: (productId: string, productName: string) => void;
}

const CatalogueProductGroupCard: React.FC<CatalogueProductGroupCardProps> = memo(
  ({ baseName, products, primaryProduct, onQuickView, viewDensity = '4x4', isOutOfStock = false, onNotifyMe }) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const [selectedVariantId, setSelectedVariantId] = useState<string>(primaryProduct._id);
    const isCompact = viewDensity === '5x5';
    const isCozy = viewDensity === '4x4';
    const imageHeight = isCompact ? 170 : isCozy ? 200 : 240;

    const currentVariant = products.find((p) => p._id === selectedVariantId) || primaryProduct;

    // Extract variants (matching ProductGroupCard logic)
    const variants = (() => {
      const variantMap = new Map<string, Product>();
      let parentProduct: Product | null = null;

      products.forEach((product) => {
        let sizeLabel = '';

        // First, check for (SIZE/measurement) format like (XXL/62CM), (M/32CM), （XL/48CM）
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
            // First try to extract full word sizes (Large, Medium, Small, etc.)
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

            // If no full word size found, try abbreviated sizes
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
                if (match) {
                  sizeLabel = match[1].toUpperCase();
                  break;
                }
              }
            }
          }
        }

        if (sizeLabel) {
          if (!variantMap.has(sizeLabel)) {
            variantMap.set(sizeLabel, product);
          }
        } else {
          parentProduct = product;
        }
      });

      // Add parent product as "Standard" variant if it exists
      if (parentProduct && !variantMap.has('Standard')) {
        variantMap.set('Standard', parentProduct);
      }

      return Array.from(variantMap.entries()).sort((a, b) => {
        // "Standard" always comes first
        if (a[0] === 'Standard') return -1;
        if (b[0] === 'Standard') return 1;

        // Check if both are number sizes (#1, #2, etc.)
        const isNumberA = a[0].startsWith('#');
        const isNumberB = b[0].startsWith('#');

        // Check if both are measurement sizes (4.5mm, 6mm, etc.)
        const isMeasurementA = a[0].endsWith('mm');
        const isMeasurementB = b[0].endsWith('mm');

        if (isNumberA && isNumberB) {
          return parseInt(a[0].substring(1)) - parseInt(b[0].substring(1));
        } else if (isMeasurementA && isMeasurementB) {
          return parseFloat(a[0].replace('mm', '')) - parseFloat(b[0].replace('mm', ''));
        } else if (isNumberA || isMeasurementA) {
          return 1;
        } else if (isNumberB || isMeasurementB) {
          return -1;
        } else {
          const sizeOrder = ['XXXXS', 'XXXS', 'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL'];
          const indexA = sizeOrder.indexOf(a[0]);
          const indexB = sizeOrder.indexOf(b[0]);
          return indexA - indexB;
        }
      });
    })();

    return (
      <Card
        sx={{
          display: "flex",
          flexDirection: "column",
          height: '100%',
          borderRadius: '16px',
          boxShadow: 2,
          overflow: "hidden",
          backgroundColor: "background.paper",
          border: '1px solid',
          borderColor: 'divider',
          opacity: isOutOfStock ? 0.72 : 1,
          transition: 'box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease',
          '&:hover': {
            boxShadow: 6,
            transform: 'translate3d(0, -4px, 0)',
            borderColor: 'primary.light',
            '& .catalogue-card-overlay': { opacity: 1 },
          },
        }}
      >
        {/* Image Section */}
        <Box
          onClick={() => onQuickView(currentVariant, products)}
          role="button"
          tabIndex={0}
          aria-label={`Quick view ${currentVariant.name}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onQuickView(currentVariant, products);
            }
          }}
          sx={{
            position: "relative",
            bgcolor: '#FFFFFF',
            borderRadius: '14px 14px 0 0',
            overflow: 'hidden',
            borderBottom: '1px solid #F1EEF8',
            height: imageHeight,
            width: '100%',
            cursor: 'pointer',
            '&:focus-visible': {
              outline: '2px solid',
              outlineColor: 'primary.main',
              outlineOffset: '-2px',
            },
          }}
        >
          {/* Variants count chip — top-right, aligned with the image counter (top-left) */}
          {variants.length > 0 && (
            <Chip
              size="small"
              label={`${variants.length} variants`}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 10,
                height: 22,
                fontSize: '0.65rem',
                fontWeight: 700,
                bgcolor: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                boxShadow: 1,
                '& .MuiChip-label': { px: 1 },
              }}
            />
          )}

          {/* New / Out of Stock chip — stacked below the variants chip */}
          {isOutOfStock ? (
            <Chip
              size="small"
              label="Out of Stock"
              color="error"
              sx={{
                position: 'absolute',
                top: variants.length > 0 ? 38 : 8,
                right: 8,
                zIndex: 10,
                height: 22,
                fontSize: '0.65rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                boxShadow: 1,
              }}
            />
          ) : (
            currentVariant.new && (
              <Chip
                size="small"
                label="New"
                sx={{
                  position: 'absolute',
                  top: variants.length > 0 ? 38 : 8,
                  right: 8,
                  zIndex: 10,
                  height: 22,
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  bgcolor: '#E7E2F9',
                  color: '#37279C',
                  boxShadow: 1,
                  '& .MuiChip-label': { px: 1 },
                }}
              />
            )
          )}

          <ImageCarousel product={currentVariant} handleImageClick={() => {}} />

          {/* Quick View hover overlay */}
          <Box
            className="catalogue-card-overlay"
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.04) 55%, transparent 100%)',
              opacity: 0,
              transition: 'opacity 0.3s ease',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              pb: 1.5,
              pointerEvents: 'none',
              zIndex: 9,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <ZoomIn sx={{ color: 'white', fontSize: '1.1rem' }} />
              <Typography
                sx={{
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  letterSpacing: '0.8px',
                  textTransform: 'uppercase',
                }}
              >
                Quick View
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Product name */}
        <Box sx={{ bgcolor: isDark ? 'background.paper' : '#FFFFFF', px: { xs: 1.25, sm: 2 }, pt: 0.75, pb: 1 }}>
          <Typography
            variant="h6"
            title={currentVariant.name}
            sx={{
              fontWeight: 600,
              color: isDark ? '#FFFFFF' : '#1C1A33',
              lineHeight: 1.3,
              wordBreak: 'break-word',
              fontSize: { xs: '0.85rem', sm: '0.95rem' },
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: '2.6em',
            }}
          >
            {currentVariant.name}
          </Typography>
        </Box>

        <CardContent sx={{ p: { xs: 1.25, sm: 2 }, pt: { xs: 1, sm: 1.25 }, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
          {/* Category */}
          {currentVariant.category && (
            <Box sx={{ mb: 1 }}>
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
            </Box>
          )}

          {/* Variant Selector */}
          {!isCompact && variants.length > 0 && (
            <Box sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {variants.slice(0, 6).map(([sizeLabel, product]) => (
                  <Chip
                    key={product._id}
                    label={sizeLabel}
                    onClick={() => setSelectedVariantId(product._id)}
                    color={selectedVariantId === product._id ? "primary" : "default"}
                    variant={selectedVariantId === product._id ? "filled" : "outlined"}
                    size="small"
                    sx={{
                      height: 24,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': { transform: 'translateY(-2px)', boxShadow: 1 },
                    }}
                  />
                ))}
                {variants.length > 6 && (
                  <Chip
                    label={`+${variants.length - 6}`}
                    size="small"
                    sx={{
                      height: 24,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      bgcolor: 'action.selected',
                      cursor: 'pointer',
                    }}
                    onClick={() => onQuickView(currentVariant, products)}
                  />
                )}
              </Box>
            </Box>
          )}

          <Box sx={{ flexGrow: 1 }} />

          {/* Price — MRP + GST */}
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
            <Typography sx={{ fontWeight: 800, fontSize: { xs: '0.95rem', sm: '1.05rem' }, color: 'text.primary', fontVariantNumeric: 'tabular-nums' }}>
              ₹{currentVariant.rate?.toLocaleString('en-IN')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              MRP{currentVariant?.item_tax_preferences?.length > 0 ? ` · GST ${getTaxPercentage(currentVariant)}%` : ''}
            </Typography>
          </Box>

          {/* Notify Me Button for Out of Stock */}
          {isOutOfStock && onNotifyMe && (
            <Button
              variant="outlined"
              color="secondary"
              fullWidth
              size="medium"
              onClick={() => onNotifyMe(currentVariant._id, currentVariant.name)}
              sx={{
                textTransform: 'none',
                borderRadius: 2,
                fontWeight: 600,
                py: 0.75,
                mt: 1.5,
                fontSize: '0.8rem',
                transition: 'all 0.2s ease',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: 2 },
              }}
            >
              Notify Me When Available
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }
);

export default CatalogueProductGroupCard;
