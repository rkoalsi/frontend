import React, { memo } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  useTheme,
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
  isOutOfStock?: boolean;
}

const CatalogueProductCard: React.FC<CatalogueProductCardProps> = memo(
  ({ product, onQuickView, viewDensity = '4x4', isOutOfStock = false }) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const isCompact = viewDensity === '5x5';
    const isCozy = viewDensity === '4x4';

    return (
      <Card
        onClick={() => !isOutOfStock && onQuickView(product)}
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
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          cursor: isOutOfStock ? 'default' : 'pointer',
          opacity: isOutOfStock ? 0.72 : 1,
          '&:hover': isOutOfStock ? {} : {
            boxShadow: 8,
            transform: 'translateY(-6px)',
            borderColor: 'primary.light',
            '& .catalogue-card-overlay': {
              opacity: 1,
            },
          },
        }}
      >
        {/* Image Section */}
        <Box
          sx={{
            position: "relative",
            bgcolor: 'background.paper',
            height: isCompact ? 200 : isCozy ? 280 : 320,
            width: '100%',
            overflow: 'hidden',
          }}
        >
          {/* NEW badge */}
          {product.new && !isOutOfStock && (
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
                background: 'linear-gradient(135deg, #5e52b5 0%, #7c6fcd 100%)',
                color: 'white',
                letterSpacing: '0.8px',
                boxShadow: '0 3px 8px rgba(61, 133, 200, 0.5)',
                border: '2px solid rgba(255,255,255,0.8)',
              }}
            />
          )}

          {/* OUT OF STOCK badge */}
          {isOutOfStock && (
            <Chip
              label="OUT OF STOCK"
              size="small"
              color="error"
              sx={{
                position: "absolute",
                top: 12,
                right: 12,
                zIndex: 3,
                fontWeight: 700,
                fontSize: '0.62rem',
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

          {/* Hover overlay — only for in-stock products */}
          {!isOutOfStock && (
            <Box
              className="catalogue-card-overlay"
              sx={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.06) 60%, transparent 100%)',
                opacity: 0,
                transition: 'opacity 0.3s ease',
                zIndex: 2,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                pb: 1.5,
                pointerEvents: 'none',
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
          )}
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
              color: 'text.primary',
              lineHeight: 1.3,
              wordBreak: 'break-word',
              fontSize: isCompact ? '0.9rem' : isCozy ? '1rem' : '1.1rem',
            }}
          >
            {product.name}
          </Typography>

          {/* spacer so brand/category chips stay vertically aligned with group cards */}
          <Box sx={{ minHeight: isCompact ? 0 : 28 }} />

          {/* Brand & Category Tags */}
          <Box sx={{ display: 'flex', gap: 0.75, mb: 1.5, flexWrap: 'wrap' }}>
            {product.brand && (
              <Chip
                label={product.brand}
                size="small"
                variant="outlined"
                sx={{
                  height: 24,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  '& .MuiChip-label': { px: 1.5 },
                }}
              />
            )}
            {product.category && (
              <Chip
                label={product.category}
                size="small"
                color="primary"
                sx={{
                  height: 24,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  '& .MuiChip-label': { px: 1.5 },
                }}
              />
            )}
            {!isCompact && product.sub_category && (
              <Chip
                label={product.sub_category}
                size="small"
                color="info"
                sx={{
                  height: 24,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  '& .MuiChip-label': { px: 1.5 },
                }}
              />
            )}
          </Box>

          {/* Price Section */}
          <Box sx={{ mt: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.5 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  fontSize: '0.68rem',
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
                  sx={{ fontSize: '0.62rem', fontFamily: 'monospace' }}
                >
                  {product.cf_sku_code}
                </Typography>
              )}
            </Box>

            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                fontSize: isCompact ? '1.2rem' : '1.45rem',
                fontFamily: 'system-ui',
                color: isOutOfStock ? 'text.secondary' : isDark ? 'text.primary' : 'primary.main',
                letterSpacing: '-0.5px',
              }}
            >
              ₹{product.rate?.toLocaleString('en-IN')}
            </Typography>

            {!isCompact && product?.item_tax_preferences?.length > 0 && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontSize: '0.62rem', mt: 0.25, display: 'block' }}
              >
                GST: {product.item_tax_preferences[product.item_tax_preferences.length - 1].tax_percentage}%
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  }
);

export default CatalogueProductCard;
