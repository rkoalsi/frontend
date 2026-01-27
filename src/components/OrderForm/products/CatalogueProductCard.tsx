// CatalogueProductCard.tsx - Simplified product card for catalogue browsing
import React, { memo } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
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

interface CatalogueProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
  viewDensity?: '3x3' | '4x4' | '5x5';
}

const CatalogueProductCard: React.FC<CatalogueProductCardProps> = memo(
  ({ product, onQuickView, viewDensity = '4x4' }) => {
    const isCompact = viewDensity === '5x5';
    const isCozy = viewDensity === '4x4';

    return (
      <Card
        onClick={() => onQuickView(product)}
        sx={{
          display: "flex",
          flexDirection: "column",
          height: '100%',
          borderRadius: { xs: 2, md: 3 },
          boxShadow: 2,
          overflow: "hidden",
          backgroundColor: "background.paper",
          border: '1px solid',
          borderColor: product.new ? 'primary.light' : 'divider',
          borderLeft: product.new ? '4px solid' : '1px solid',
          borderLeftColor: product.new ? 'primary.main' : 'divider',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          cursor: 'pointer',
          '&:hover': {
            boxShadow: 8,
            transform: 'translateY(-6px)',
            borderColor: 'primary.light',
          },
        }}
      >
        {/* Image Section with Overlay */}
        <Box
          sx={{
            position: "relative",
            backgroundColor: 'grey.50',
            height: isCompact ? 200 : isCozy ? 280 : 320,
            width: '100%',
            overflow: 'hidden',
          }}
        >
          {/* New Badge */}
          {product.new && (
            <Chip
              label="NEW"
              size="small"
              sx={{
                position: "absolute",
                top: 12,
                right: 12,
                zIndex: 3,
                fontWeight: 800,
                fontSize: '0.65rem',
                background: 'linear-gradient(135deg, #3F51B5 0%, #2196F3 100%)',
                color: 'white',
                letterSpacing: '0.8px',
                boxShadow: '0 3px 8px rgba(63, 81, 181, 0.4)',
                border: '2px solid white',
              }}
            />
          )}

          {/* Image */}
          <Box sx={{ width: '100%', height: '100%', zIndex: 1 }}>
            <ImageCarousel
              product={product}
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
              color: product.new ? 'primary.dark' : 'text.primary',
              lineHeight: 1.3,
              wordBreak: 'break-word',
              fontSize: isCompact ? '0.9rem' : isCozy ? '1rem' : '1.1rem',
            }}
          >
            {product.name}
          </Typography>

          {/* Brand & Category Tags */}
          <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
            {product.brand && (
              <Chip
                label={product.brand}
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
            {product.category && (
              <Chip
                label={product.category}
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
            {!isCompact && product.sub_category && (
              <Chip
                label={product.sub_category}
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
            {!isCompact && product.series && (
              <Chip
                label={product.series}
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
              {product.cf_sku_code && !isCompact && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    fontSize: '0.65rem',
                    fontFamily: 'monospace',
                  }}
                >
                  SKU: {product.cf_sku_code}
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
                ₹{product.rate?.toLocaleString('en-IN')}
              </Typography>
              {!isCompact && (
                <Tooltip title="View Details">
                  <IconButton
                    size="small"
                    onClick={() => onQuickView(product)}
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
                GST: {product?.item_tax_preferences[product?.item_tax_preferences.length - 1].tax_percentage}%
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  }
);

export default CatalogueProductCard;
