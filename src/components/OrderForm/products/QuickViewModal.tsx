// QuickViewModal.tsx - Modal for quick product details view
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Chip,
  Grid,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Close, ExpandMore } from "@mui/icons-material";
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

interface QuickViewModalProps {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  allVariants?: Product[];
  handleImageClick: any;
}

const QuickViewModal: React.FC<QuickViewModalProps> = ({
  open,
  onClose,
  product,
  allVariants = [],
  handleImageClick,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [selectedVariantId, setSelectedVariantId] = useState<string>(product?._id || '');

  if (!product) return null;

  const currentProduct = allVariants.length > 0
    ? allVariants.find(p => p._id === selectedVariantId) || product
    : product;

  // Extract variants for group products
  const variants = allVariants.length > 0 ? (() => {
    const variantMap = new Map<string, Product>();
    allVariants.forEach((p) => {
      const sizeMatch = p.name.match(/[（(]\s*(XXXXL|XXXL|XXL|XL|XXS|XS|S|M|L)\s*\/\s*\d+\s*[Cc]?[Mm]\s*[)）]/i) ||
                       p.name.match(/#(\d+)/) ||
                       p.name.match(/(\d+\.?\d*mm)/i) ||
                       p.name.match(/-\s*(XXXXL|XXXL|XXL|XL|XXS|XS|L|M|S)$/i);
      if (sizeMatch) {
        const sizeLabel = sizeMatch[1].toUpperCase();
        if (!variantMap.has(sizeLabel)) {
          variantMap.set(sizeLabel, p);
        }
      }
    });
    return Array.from(variantMap.entries());
  })() : [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: { xs: 0, md: 3 },
          m: { xs: 0, md: 2 },
          maxHeight: { xs: '95vh', md: '90vh' },
          height: { xs: 'auto', md: 'auto' },
          width: { xs: '100vw', md: 'auto' },
        },
      }}
    >
      <DialogContent sx={{ p: 0, overflow: { xs: 'auto', md: 'hidden' }, height: '100%', position: 'relative' }}>
        {/* Mobile Close Button */}
        <IconButton
          onClick={onClose}
          sx={{
            display: { xs: 'flex', md: 'none' },
            position: 'sticky',
            top: 8,
            right: 8,
            zIndex: 10,
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            boxShadow: 2,
            ml: 'auto',
            mr: 1,
            mt: 1,
            '&:hover': {
              bgcolor: 'white',
            },
          }}
        >
          <Close />
        </IconButton>
        <Grid container spacing={0}>
          {/* Image Section */}
          <Grid item xs={12} sx={{ position: 'relative', display: 'flex', justifyContent: { xs: 'center', md: 'flex-end' }, p: { xs: 0, md: 3 } }}>
            <Box
              sx={{
                position: 'relative',
                bgcolor: 'grey.50',
                width: { xs: '100%', sm: 400, md: 500 },
                height: { xs: 'auto', sm: 400, md: 500 },
                aspectRatio: { xs: '1/1', md: 'auto' },
                maxWidth: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                borderRadius: { xs: 0, md: 2 },
                border: { xs: 'none', md: '1px solid' },
                borderColor: 'divider',
                p: { xs: 1, md: 2 },
              }}
            >
              {currentProduct.new && (
                <Chip
                  label="NEW"
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    zIndex: 2,
                    fontWeight: 800,
                    fontSize: '0.7rem',
                    background: 'linear-gradient(135deg, #3F51B5 0%, #2196F3 100%)',
                    color: 'white',
                    letterSpacing: '0.8px',
                    boxShadow: '0 3px 8px rgba(63, 81, 181, 0.4)',
                    border: '2px solid white',
                  }}
                />
              )}

              <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ImageCarousel
                  product={currentProduct}
                  handleImageClick={handleImageClick}
                />
              </Box>
            </Box>
          </Grid>

          {/* Details Section */}
          <Grid item xs={12}>
            <Box sx={{
              px: { xs: 2, sm: 2.5, md: 3 },
              pb: { xs: 2, md: 3 },
              pt: { xs: 1.5, md: 2.5 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: { xs: 'flex-start', md: 'center' },
              textAlign: { xs: 'left', md: 'center' },
            }}>
              {/* Product Name */}
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  mb: { xs: 1.5, md: 2 },
                  fontSize: { xs: '1rem', md: '1.25rem' },
                  color: currentProduct.new ? 'primary.dark' : 'text.primary',
                  lineHeight: 1.3,
                }}
              >
                {currentProduct.name}
              </Typography>

              {/* Brand & Category */}
              <Box sx={{ display: 'flex', gap: 1, mb: { xs: 2, md: 2.5 }, flexWrap: 'wrap', justifyContent: { xs: 'flex-start', md: 'center' } }}>
                {currentProduct.brand && (
                  <Chip
                    label={currentProduct.brand}
                    sx={{
                      height: 28,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      bgcolor: 'grey.100',
                      color: 'text.secondary',
                    }}
                  />
                )}
                {currentProduct.category && (
                  <Chip
                    label={currentProduct.category}
                    sx={{
                      height: 28,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      bgcolor: 'primary.50',
                      color: 'primary.dark',
                    }}
                  />
                )}
                {currentProduct.series && (
                  <Chip
                    label={currentProduct.series}
                    sx={{
                      height: 28,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      bgcolor: 'secondary.50',
                      color: 'secondary.dark',
                    }}
                  />
                )}
              </Box>

              {/* Variants Selection */}
              {variants.length > 0 && (
                <Box sx={{ mb: { xs: 2, md: 2.5 } }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 700,
                      mb: { xs: 1, md: 1.5 },
                      fontSize: { xs: '0.75rem', md: '0.8rem' },
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      color: 'text.secondary',
                    }}
                  >
                    Select Size
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: { xs: 'flex-start', md: 'center' } }}>
                    {variants.map(([sizeLabel, variantProduct]) => (
                      <Chip
                        key={variantProduct._id}
                        label={sizeLabel}
                        onClick={() => setSelectedVariantId(variantProduct._id)}
                        color={selectedVariantId === variantProduct._id ? "primary" : "default"}
                        variant={selectedVariantId === variantProduct._id ? "filled" : "outlined"}
                        sx={{
                          height: 36,
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          minWidth: 60,
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: 2,
                          },
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Price & Product Details Combined */}
              <Box sx={{ mb: { xs: 2, md: 2.5 } }}>
                {/* Price Section */}
                <Box sx={{ mb: { xs: 1.5, md: 2 } }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{
                      fontSize: { xs: '0.75rem', md: '0.8rem' },
                      fontWeight: 600,
                      mb: 0.5,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    MRP
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 800,
                      fontSize: { xs: '1.25rem', md: '1.75rem' },
                      fontFamily: 'system-ui',
                      color: 'primary.main',
                      letterSpacing: '-0.5px',
                    }}
                  >
                    ₹{currentProduct.rate?.toLocaleString('en-IN')}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.65rem', md: '0.7rem' }, mt: 0.5, display: 'block', mb: { xs: 1.5, md: 2 } }}
                  >
                    GST: {currentProduct?.item_tax_preferences[currentProduct?.item_tax_preferences.length - 1].tax_percentage}%
                  </Typography>
                </Box>

                {/* Product Details */}
                <Grid container spacing={{ xs: 1.5, md: 2.5 }}>
                  <Grid item xs={6} md={4}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                      SKU
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.875rem', mt: 0.5 }}>
                      {currentProduct.cf_sku_code || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={4}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                      UPC/EAN
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.875rem', mt: 0.5 }}>
                      {currentProduct.upc_code || '-'}
                    </Typography>
                  </Grid>
                  {currentProduct.sub_category && (
                    <Grid item xs={12} md={4}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                        Sub-Category
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem', mt: 0.5 }}>
                        {currentProduct.sub_category}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>

              {/* Dimensions */}
              {currentProduct.dimensions && (currentProduct.dimensions.length || currentProduct.dimensions.breadth || currentProduct.dimensions.height) && (
                <Accordion
                    elevation={0}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: '6px !important',
                      '&:before': { display: 'none' },
                    }}
                  >
                    <AccordionSummary expandIcon={<ExpandMore />} sx={{ minHeight: 40, '&.Mui-expanded': { minHeight: 40 } }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                        Dimensions
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0 }}>
                      <Grid container spacing={1.5}>
                        {currentProduct.dimensions.length !== undefined && (
                          <Grid item xs={4}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              Length
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {currentProduct.dimensions.length} cm
                            </Typography>
                          </Grid>
                        )}
                        {currentProduct.dimensions.breadth !== undefined && (
                          <Grid item xs={4}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              Breadth
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {currentProduct.dimensions.breadth} cm
                            </Typography>
                          </Grid>
                        )}
                        {currentProduct.dimensions.height !== undefined && (
                          <Grid item xs={4}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              Height
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {currentProduct.dimensions.height} cm
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                )}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default QuickViewModal;
