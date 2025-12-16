// QuickViewModal.tsx - Modal for quick product details view
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
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
      slotProps={{
        paper: {
          sx: {
            borderRadius: { xs: 0, md: 3 },
            m: { xs: 0, md: 2 },
            maxHeight: { xs: '75vh', md: '90vh' },
            height: { xs: '100vh', md: 'auto' },
            width: { xs: '100vw', md: '85%' },
            maxWidth: { xs: '100vw', md: '1000px' },
          },
        },
      }}
    >
      <DialogContent sx={{ p: 0, overflow: 'auto', height: '100%', position: 'relative' }}>
        {/* Desktop Close Button */}
        <IconButton
          onClick={onClose}
          sx={{
            display: { xs: 'none', md: 'flex' },
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 10,
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            boxShadow: 2,
            '&:hover': {
              bgcolor: 'white',
            },
          }}
        >
          <Close />
        </IconButton>

        {/* Mobile Close Button */}
        <IconButton
          onClick={onClose}
          sx={{
            display: { xs: 'flex', md: 'none' },
            position: 'sticky',
            top: 4,
            right: 4,
            zIndex: 10,
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            boxShadow: 2,
            ml: 'auto',
            mr: 0.5,
            mt: 0.5,
            width: 36,
            height: 36,
            '&:hover': {
              bgcolor: 'white',
            },
          }}
        >
          <Close fontSize="small" />
        </IconButton>

        {/* Main Content - Side by side on desktop, stacked on mobile */}
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          minHeight: { xs: 'auto', md: '500px' },
          gap: { xs: 0, md: 3 },
        }}>
          {/* Image Section */}
          <Box sx={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            p: { xs: 0, md: 3 },
            flex: { xs: '0 0 auto', md: '0 0 45%' },
          }}>
            <Box
              sx={{
                position: 'relative',
                bgcolor: 'grey.50',
                width: { xs: '100%', md: '100%' },
                height: { xs: '240px', sm: '280px', md: '100%' },
                maxHeight: { md: '500px' },
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
                    top: { xs: 8, md: 12 },
                    right: { xs: 8, md: 12 },
                    zIndex: 2,
                    fontWeight: 800,
                    fontSize: { xs: '0.6rem', md: '0.7rem' },
                    height: { xs: 20, md: 24 },
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
          </Box>

          {/* Details Section */}
          <Box sx={{
            flex: { xs: '1', md: '1' },
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <Box sx={{
              px: { xs: 1.5, sm: 2, md: 3 },
              pb: { xs: 1.5, sm: 2, md: 3 },
              pt: { xs: 1, sm: 1.5, md: 3 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              textAlign: 'left',
            }}>
              {/* Product Name */}
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  mb: { xs: 1, sm: 1.5, md: 2 },
                  fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' },
                  color: currentProduct.new ? 'primary.dark' : 'text.primary',
                  lineHeight: 1.3,
                }}
              >
                {currentProduct.name}
              </Typography>

              {/* Brand & Category */}
              <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 0.75, md: 1 }, mb: { xs: 1, sm: 1.5, md: 2.5 }, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                {currentProduct.brand && (
                  <Chip
                    label={currentProduct.brand}
                    sx={{
                      height: { xs: 22, sm: 24, md: 28 },
                      fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
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
                      height: { xs: 22, sm: 24, md: 28 },
                      fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
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
                      height: { xs: 22, sm: 24, md: 28 },
                      fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                      fontWeight: 600,
                      bgcolor: 'secondary.50',
                      color: 'secondary.dark',
                    }}
                  />
                )}
              </Box>

              {/* Variants Selection */}
              {variants.length > 0 && (
                <Box sx={{ mb: { xs: 1, sm: 1.5, md: 2.5 }, width: '100%' }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 700,
                      mb: { xs: 0.75, sm: 1, md: 1.5 },
                      fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' },
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      color: 'text.secondary',
                    }}
                  >
                    Select Size
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 0.5, sm: 0.75, md: 1 }, justifyContent: 'flex-start' }}>
                    {variants.map(([sizeLabel, variantProduct]) => (
                      <Chip
                        key={variantProduct._id}
                        label={sizeLabel}
                        onClick={() => setSelectedVariantId(variantProduct._id)}
                        color={selectedVariantId === variantProduct._id ? "primary" : "default"}
                        variant={selectedVariantId === variantProduct._id ? "filled" : "outlined"}
                        sx={{
                          height: { xs: 28, sm: 32, md: 36 },
                          fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem' },
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          minWidth: { xs: 50, sm: 55, md: 60 },
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
              <Box sx={{ mb: { xs: 1, sm: 1.5, md: 2.5 }, width: '100%' }}>
                {/* Price Section */}
                <Box sx={{ mb: { xs: 1, sm: 1.5, md: 2 } }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{
                      fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.8rem' },
                      fontWeight: 600,
                      mb: { xs: 0.25, sm: 0.5 },
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
                      fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.75rem' },
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
                    sx={{ fontSize: { xs: '0.6rem', sm: '0.65rem', md: '0.7rem' }, mt: { xs: 0.25, sm: 0.5 }, display: 'block', mb: { xs: 1, sm: 1.5, md: 2 } }}
                  >
                    GST: {currentProduct?.item_tax_preferences[currentProduct?.item_tax_preferences.length - 1].tax_percentage}%
                  </Typography>
                </Box>

                {/* Product Details */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1, sm: 1.5, md: 2.5 } }}>
                  <Box sx={{ flex: { xs: '0 0 calc(50% - 8px)', sm: '0 0 calc(50% - 12px)', md: '0 0 calc(33.333% - 20px)' } }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6rem', sm: '0.65rem', md: '0.7rem' }, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                      SKU
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace', fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem' }, mt: { xs: 0.25, sm: 0.5 } }}>
                      {currentProduct.cf_sku_code || '-'}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: { xs: '0 0 calc(50% - 8px)', sm: '0 0 calc(50% - 12px)', md: '0 0 calc(33.333% - 20px)' } }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6rem', sm: '0.65rem', md: '0.7rem' }, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                      UPC/EAN
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace', fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem' }, mt: { xs: 0.25, sm: 0.5 } }}>
                      {currentProduct.upc_code || '-'}
                    </Typography>
                  </Box>
                  {currentProduct.sub_category && (
                    <Box sx={{ flex: { xs: '0 0 100%', md: '0 0 calc(33.333% - 20px)' } }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6rem', sm: '0.65rem', md: '0.7rem' }, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                        Sub-Category
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem' }, mt: { xs: 0.25, sm: 0.5 } }}>
                        {currentProduct.sub_category}
                      </Typography>
                    </Box>
                  )}
                </Box>
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
                    <AccordionSummary
                      expandIcon={<ExpandMore fontSize="small" />}
                      sx={{
                        minHeight: { xs: 36, sm: 40 },
                        '&.Mui-expanded': { minHeight: { xs: 36, sm: 40 } },
                        py: { xs: 0.5, sm: 1 }
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' } }}>
                        Dimensions
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0, pb: { xs: 1.5, sm: 2 } }}>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1, sm: 1.5 } }}>
                        {currentProduct.dimensions.length !== undefined && (
                          <Box sx={{ flex: { xs: '0 0 calc(33.333% - 8px)', sm: '0 0 calc(33.333% - 12px)' } }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6rem', sm: '0.65rem', md: '0.7rem' } }}>
                              Length
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem' }, mt: { xs: 0.25, sm: 0.5 } }}>
                              {currentProduct.dimensions.length} cm
                            </Typography>
                          </Box>
                        )}
                        {currentProduct.dimensions.breadth !== undefined && (
                          <Box sx={{ flex: { xs: '0 0 calc(33.333% - 8px)', sm: '0 0 calc(33.333% - 12px)' } }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6rem', sm: '0.65rem', md: '0.7rem' } }}>
                              Breadth
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem' }, mt: { xs: 0.25, sm: 0.5 } }}>
                              {currentProduct.dimensions.breadth} cm
                            </Typography>
                          </Box>
                        )}
                        {currentProduct.dimensions.height !== undefined && (
                          <Box sx={{ flex: { xs: '0 0 calc(33.333% - 8px)', sm: '0 0 calc(33.333% - 12px)' } }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6rem', sm: '0.65rem', md: '0.7rem' } }}>
                              Height
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem' }, mt: { xs: 0.25, sm: 0.5 } }}>
                              {currentProduct.dimensions.height} cm
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                )}
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default QuickViewModal;
