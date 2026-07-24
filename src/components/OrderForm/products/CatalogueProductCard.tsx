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
    const imageHeight = isCompact ? 170 : isCozy ? 210 : 240;

    return (
      <Card
        onClick={() => !isOutOfStock && onQuickView(product)}
        role={isOutOfStock ? undefined : 'button'}
        tabIndex={isOutOfStock ? undefined : 0}
        onKeyDown={(e) => {
          if (!isOutOfStock && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onQuickView(product);
          }
        }}
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
          cursor: isOutOfStock ? 'default' : 'pointer',
          opacity: isOutOfStock ? 0.72 : 1,
          transition: 'box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease',
          '&:focus-visible': {
            outline: '2px solid',
            outlineColor: 'primary.main',
            outlineOffset: '2px',
          },
          '&:hover': isOutOfStock ? {} : {
            boxShadow: 6,
            transform: 'translate3d(0, -4px, 0)',
            borderColor: 'primary.light',
            '& .catalogue-card-overlay': { opacity: 1 },
          },
        }}
      >
        {/* Image Section */}
        <Box
          sx={{
            position: "relative",
            bgcolor: '#FFFFFF',
            borderRadius: '14px 14px 0 0',
            overflow: 'hidden',
            borderBottom: '1px solid #F1EEF8',
            height: imageHeight,
            width: '100%',
          }}
        >
          {/* New / Out of Stock chip — top-right */}
          {isOutOfStock ? (
            <Chip
              size="small"
              label="Out of Stock"
              color="error"
              sx={{
                position: 'absolute',
                top: 8,
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
            product.new && (
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
                  bgcolor: '#E7E2F9',
                  color: '#37279C',
                  boxShadow: 1,
                  '& .MuiChip-label': { px: 1 },
                }}
              />
            )
          )}

          <ImageCarousel product={product} handleImageClick={() => {}} />

          {/* Quick View hover overlay */}
          {!isOutOfStock && (
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
          )}
        </Box>

        {/* Product name */}
        <Box sx={{ bgcolor: isDark ? 'background.paper' : '#FFFFFF', px: { xs: 1.25, sm: 2 }, pt: 0.75, pb: 1 }}>
          <Typography
            variant="h6"
            title={product.name}
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
            {product.name}
          </Typography>
        </Box>

        <CardContent sx={{ p: { xs: 1.25, sm: 2 }, pt: { xs: 1, sm: 1.25 }, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
          {/* Category */}
          {product.category && (
            <Box sx={{ mb: 1 }}>
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
            </Box>
          )}

          <Box sx={{ flexGrow: 1 }} />

          {/* Price — MRP + GST */}
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
            <Typography sx={{ fontWeight: 800, fontSize: { xs: '0.95rem', sm: '1.05rem' }, color: 'text.primary', fontVariantNumeric: 'tabular-nums' }}>
              ₹{product.rate?.toLocaleString('en-IN')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              MRP{product?.item_tax_preferences?.length > 0 ? ` · GST ${getTaxPercentage(product)}%` : ''}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }
);

export default CatalogueProductCard;
