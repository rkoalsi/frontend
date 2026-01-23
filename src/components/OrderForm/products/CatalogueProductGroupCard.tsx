// CatalogueProductGroupCard.tsx - Simplified product group card for catalogue browsing
import React, { memo, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Button,
} from "@mui/material";
import { ZoomIn } from "@mui/icons-material";
import ImageCarousel from "./ImageCarousel";

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
    const [selectedVariantId, setSelectedVariantId] = useState<string>(primaryProduct._id);
    const isCompact = viewDensity === '5x5';
    const isCozy = viewDensity === '4x4';

    const currentVariant = products.find((p) => p._id === selectedVariantId) || primaryProduct;

    // Extract variants (matching ProductGroupCard logic)
    const variants = (() => {
      const variantMap = new Map<string, Product>();
      let parentProduct: Product | null = null;

      products.forEach((product) => {
        // Try to extract size from product name
        let sizeLabel = '';

        // Check for (SIZE/measurement) format
        const sizeMeasurementMatch = product.name.match(/[（(]\s*(XXXXL|XXXL|XXL|XL|XXS|XS|S|M|L)\s*\/\s*\d+\s*[Cc]?[Mm]\s*[)）]/i);
        if (sizeMeasurementMatch) {
          sizeLabel = sizeMeasurementMatch[1].toUpperCase();
        }
        // Check for number-based sizes (#1, #2, etc.)
        else if (product.name.match(/#(\d+)/)) {
          const numberSizeMatch = product.name.match(/#(\d+)/);
          sizeLabel = `#${numberSizeMatch![1]}`;
        }
        // Check for measurement sizes (4.5mm, etc.)
        else if (product.name.match(/(\d+\.?\d*mm)/i)) {
          const measurementMatch = product.name.match(/(\d+\.?\d*mm)/i);
          sizeLabel = measurementMatch![1];
        }
        // Check for abbreviated sizes at the end
        else {
          const sizeMatch = product.name.match(/-\s*(XXXXL|XXXL|XXL|XL|XXS|XS|L|M|S)$/i) ||
                           product.name.match(/\s+(XXXXL|XXXL|XXL|XL|XXS|XS|L|M|S)$/i) ||
                           product.name.match(/-\s*(Small|Medium|Large)$/i) ||
                           product.name.match(/\s+(Small|Medium|Large)$/i);
          if (sizeMatch) {
            const size = sizeMatch[1];
            // Normalize full word sizes to abbreviations
            if (size.toLowerCase() === 'small') sizeLabel = 'S';
            else if (size.toLowerCase() === 'medium') sizeLabel = 'M';
            else if (size.toLowerCase() === 'large') sizeLabel = 'L';
            else sizeLabel = size.toUpperCase();
          }
        }

        if (sizeLabel) {
          if (!variantMap.has(sizeLabel)) {
            variantMap.set(sizeLabel, product);
          }
        } else {
          // No size found - this is the parent/standard product
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

        // Then sort by size order
        const sizeOrder = ['XXXXS', 'XXXS', 'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL'];
        const indexA = sizeOrder.indexOf(a[0]);
        const indexB = sizeOrder.indexOf(b[0]);

        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }

        // If not in size order, sort alphabetically
        return a[0].localeCompare(b[0]);
      });
    })();

    return (
      <Card
        sx={{
          display: "flex",
          flexDirection: "column",
          height: '100%',
          borderRadius: { xs: 2, md: 3 },
          boxShadow: 2,
          overflow: "hidden",
          backgroundColor: "background.paper",
          border: '1px solid',
          borderColor: currentVariant.new ? 'primary.light' : 'divider',
          borderLeft: currentVariant.new ? '4px solid' : '1px solid',
          borderLeftColor: currentVariant.new ? 'primary.main' : 'divider',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          '&:hover': {
            boxShadow: 8,
            transform: 'translateY(-6px)',
            borderColor: 'primary.light',
          },
        }}
      >
        {/* Image Section with Overlay */}
        <Box
          onClick={() => onQuickView(currentVariant, products)}
          sx={{
            position: "relative",
            backgroundColor: 'grey.50',
            height: isCompact ? 200 : isCozy ? 280 : 320,
            width: '100%',
            overflow: 'hidden',
            cursor: 'pointer',
          }}
        >
          {/* Badge & Variants Count */}
          <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 3, display: 'flex', gap: 1 }}>
            {isOutOfStock ? (
              <Chip
                label="OUT OF STOCK"
                size="small"
                color="error"
                sx={{
                  fontWeight: 800,
                  fontSize: '0.65rem',
                  letterSpacing: '0.8px',
                  boxShadow: '0 3px 8px rgba(244, 67, 54, 0.4)',
                  border: '2px solid white',
                }}
              />
            ) : (
              currentVariant.new && (
                <Chip
                  label="NEW"
                  size="small"
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.65rem',
                    background: 'linear-gradient(135deg, #3F51B5 0%, #2196F3 100%)',
                    color: 'white',
                    letterSpacing: '0.8px',
                    boxShadow: '0 3px 8px rgba(63, 81, 181, 0.4)',
                    border: '2px solid white',
                  }}
                />
              )
            )}
            {variants.length > 0 && (
              <Chip
                label={`${variants.length} variants`}
                size="small"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.65rem',
                  bgcolor: 'white',
                  color: 'text.secondary',
                  boxShadow: 1,
                }}
              />
            )}
          </Box>

          {/* Image */}
          <Box sx={{ width: '100%', height: '100%', zIndex: 1 }}>
            <ImageCarousel
              product={currentVariant}
              handleImageClick={() => {}}
            />
          </Box>
        </Box>

        <CardContent
          sx={{
            p: isCompact ? 1.5 : isCozy ? 2 : 2.5,
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Product Name */}
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              mb: isCompact ? 1 : 1.5,
              color: currentVariant.new ? 'primary.dark' : 'text.primary',
              lineHeight: 1.3,
              wordBreak: 'break-word',
              fontSize: isCompact ? '0.9rem' : isCozy ? '1rem' : '1.1rem',
            }}
          >
            {currentVariant.name}
          </Typography>

          {/* Variant Selector - Compact */}
          {!isCompact && variants.length > 0 && (
            <Box sx={{ mb: 1.5 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  fontWeight: 600,
                  mb: 0.5,
                  display: 'block',
                  fontSize: '0.65rem',
                }}
              >
                Available Sizes
              </Typography>
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
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 1,
                      },
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
                      bgcolor: 'grey.200',
                      cursor: 'pointer',
                    }}
                    onClick={() => onQuickView(currentVariant, products)}
                  />
                )}
              </Box>
            </Box>
          )}

          {/* Brand & Category Tags */}
          <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
            {currentVariant.brand && (
              <Chip
                label={currentVariant.brand}
                size="small"
                sx={{
                  height: 24,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  bgcolor: 'grey.100',
                  color: 'text.secondary',
                  '& .MuiChip-label': { px: 1.5 },
                }}
              />
            )}
            {currentVariant.category && (
              <Chip
                label={currentVariant.category}
                size="small"
                sx={{
                  height: 24,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  bgcolor: 'primary.50',
                  color: 'primary.dark',
                  '& .MuiChip-label': { px: 1.5 },
                }}
              />
            )}
            {!isCompact && currentVariant.sub_category && (
              <Chip
                label={currentVariant.sub_category}
                size="small"
                sx={{
                  height: 24,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  bgcolor: 'info.50',
                  color: 'info.dark',
                  '& .MuiChip-label': { px: 1.5 },
                }}
              />
            )}
            {!isCompact && currentVariant.series && (
              <Chip
                label={currentVariant.series}
                size="small"
                sx={{
                  height: 24,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  bgcolor: 'secondary.50',
                  color: 'secondary.dark',
                  '& .MuiChip-label': { px: 1.5 },
                }}
              />
            )}
          </Box>

          {/* Price Section */}
          <Box sx={{ mt: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                MRP
              </Typography>
              {currentVariant.cf_sku_code && !isCompact && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    fontSize: '0.65rem',
                    fontFamily: 'monospace',
                  }}
                >
                  SKU: {currentVariant.cf_sku_code}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  fontSize: isCompact ? '1.25rem' : '1.5rem',
                  fontFamily: 'system-ui',
                  color: 'primary.main',
                  letterSpacing: '-0.5px',
                }}
              >
                ₹{currentVariant.rate?.toLocaleString('en-IN')}
              </Typography>
              {!isCompact && (
                <Tooltip title="View All Variants">
                  <IconButton
                    size="small"
                    onClick={() => onQuickView(currentVariant, products)}
                    sx={{
                      color: 'primary.main',
                      '&:hover': {
                        bgcolor: 'primary.50',
                      },
                    }}
                  >
                    <ZoomIn />
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            {/* GST Info - Only in comfortable/cozy view */}
            {!isCompact && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  fontSize: '0.65rem',
                  mt: 0.5,
                  display: 'block',
                }}
              >
                GST: {currentVariant?.item_tax_preferences[currentVariant?.item_tax_preferences.length - 1].tax_percentage}%
              </Typography>
            )}

            {/* Notify Me Button for Out of Stock */}
            {isOutOfStock && onNotifyMe && (
              <Button
                variant="outlined"
                color="secondary"
                fullWidth
                size="medium"
                onClick={() => onNotifyMe(currentVariant._id, currentVariant.name)}
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  fontWeight: 600,
                  py: 1,
                  mt: 2,
                  fontSize: '0.85rem',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 2,
                  },
                }}
              >
                Notify Me When Available
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  }
);

export default CatalogueProductGroupCard;
