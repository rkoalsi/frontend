// QuickViewModal.tsx - Modal for quick product details view
import React, { useState, useRef, useEffect } from "react";
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
  Slide,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import type { TransitionProps } from "@mui/material/transitions";
import { Close, ExpandMore } from "@mui/icons-material";
import ImageCarousel from "./ImageCarousel";
import { getTaxPercentage } from "../../../util/tax";

// Slide the dialog up from the bottom — reads as a premium bottom-sheet on
// mobile and a gentle rise on desktop.
const SlideUpTransition = React.forwardRef(function SlideUpTransition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// Drag distance (px) past which releasing dismisses the sheet.
const SWIPE_CLOSE_THRESHOLD = 110;

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
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selectedVariantId, setSelectedVariantId] = useState<string>(product?._id || '');

  // ── Swipe-down-to-dismiss (mobile bottom-sheet) ──
  // The sheet follows the finger while dragging down, then either snaps back
  // or dismisses once dragged past SWIPE_CLOSE_THRESHOLD.
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  // Keeps the paper transform under our control through the snap-back animation
  // (so releasing animates back to 0 instead of jumping).
  const [controlled, setControlled] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset any leftover drag offset whenever the modal (re)opens.
  useEffect(() => {
    if (open) {
      setDragY(0);
      setDragging(false);
      setControlled(false);
      touchStartY.current = null;
    }
  }, [open]);

  useEffect(() => () => { if (settleTimer.current) clearTimeout(settleTimer.current); }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    // Only arm the dismiss gesture when the content is scrolled to the top,
    // so mid-scroll downward swipes still scroll the details instead.
    if ((contentRef.current?.scrollTop ?? 0) > 0) {
      touchStartY.current = null;
      return;
    }
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile || touchStartY.current == null) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0 && (contentRef.current?.scrollTop ?? 0) <= 0) {
      setControlled(true);
      setDragging(true);
      // Slight resistance so the sheet feels weighty rather than 1:1.
      setDragY(delta * 0.85);
    } else if (delta <= 0 && dragY !== 0) {
      setDragY(0);
    }
  };

  const handleTouchEnd = () => {
    if (!isMobile) return;
    setDragging(false);
    touchStartY.current = null;
    if (dragY > SWIPE_CLOSE_THRESHOLD) {
      onClose();
      return;
    }
    // Snap back to rest, animated — keep controlling the transform until the
    // transition finishes so it eases to 0 rather than snapping.
    setDragY(0);
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => setControlled(false), 340);
  };

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
      TransitionComponent={SlideUpTransition}
      // On small screens the dialog behaves like a bottom sheet / drawer:
      // anchored to the bottom, rounded top corners, not forced full-height.
      sx={{ '& .MuiDialog-container': { alignItems: { xs: 'flex-end', md: 'center' } } }}
      slotProps={{
        paper: {
          // Inline style (not sx) so the drag transform overrides the inline
          // transform the Slide transition sets on the paper element.
          style: isMobile && controlled
            ? {
                transform: `translateY(${dragY}px)`,
                transition: dragging ? 'none' : 'transform 0.34s cubic-bezier(0.22, 1, 0.36, 1)',
              }
            : undefined,
          sx: {
            borderRadius: { xs: '20px 20px 0 0', md: 3 },
            m: { xs: 0, md: 2 },
            maxHeight: { xs: '92vh', md: '90vh' },
            height: 'auto',
            width: { xs: '100%', md: '85%' },
            maxWidth: { xs: '100%', md: '1000px' },
            willChange: 'transform',
          },
        },
      }}
    >
      <DialogContent
        ref={contentRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        sx={{ p: 0, overflow: 'auto', height: '100%', position: 'relative' }}
      >
        {/* Mobile grab handle — reinforces the bottom-sheet affordance */}
        <Box
          sx={{
            display: { xs: 'flex', md: 'none' },
            justifyContent: 'center',
            pt: 1,
            pb: 0.5,
          }}
        >
          <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: 'divider' }} />
        </Box>

        {/* Desktop Close Button */}
        <IconButton
          onClick={onClose}
          sx={{
            display: { xs: 'none', md: 'flex' },
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 10,
            bgcolor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.95)',
            boxShadow: 2,
            '&:hover': {
              bgcolor: isDark ? 'rgba(255,255,255,0.2)' : 'background.paper',
            },
          }}
        >
          <Close />
        </IconButton>

        {/* Mobile Close Button — floats over the image so the sheet content
            starts cleanly under the grab handle. */}
        <IconButton
          onClick={onClose}
          sx={{
            display: { xs: 'flex', md: 'none' },
            position: 'absolute',
            top: 18,
            right: 12,
            zIndex: 12,
            bgcolor: isDark ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.95)',
            color: isDark ? '#fff' : 'inherit',
            boxShadow: 2,
            width: 34,
            height: 34,
            '&:hover': {
              bgcolor: isDark ? 'rgba(0,0,0,0.6)' : 'background.paper',
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
            px: { xs: 1.5, md: 3 },
            pt: { xs: 0.5, md: 3 },
            pb: { xs: 0, md: 3 },
            flex: { xs: '0 0 auto', md: '0 0 45%' },
          }}>
            <Box
              sx={{
                position: 'relative',
                bgcolor: '#ffffff',
                width: { xs: '100%', md: '100%' },
                height: { xs: '270px', sm: '320px', md: '100%' },
                maxHeight: { md: '500px' },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                borderRadius: 2,
                border: '1px solid',
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
                    background: 'linear-gradient(135deg, #4633B8 0%, #6A5AD1 100%)',
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
              {/* Brand & Category — eyebrow above the name */}
              <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 0.75, md: 1 }, mb: { xs: 1, sm: 1.25, md: 1.5 }, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                {currentProduct.brand && (
                  <Chip
                    label={currentProduct.brand}
                    variant="outlined"
                    size="small"
                    sx={{
                      height: { xs: 24, sm: 26, md: 28 },
                      fontSize: { xs: '0.7rem', sm: '0.72rem', md: '0.75rem' },
                      fontWeight: 600,
                    }}
                  />
                )}
                {currentProduct.category && (
                  <Chip
                    label={currentProduct.category}
                    color="primary"
                    size="small"
                    sx={{
                      height: { xs: 24, sm: 26, md: 28 },
                      fontSize: { xs: '0.7rem', sm: '0.72rem', md: '0.75rem' },
                      fontWeight: 600,
                    }}
                  />
                )}
              </Box>

              {/* Product Name — the hero of the sheet */}
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  mb: { xs: 1.5, sm: 1.75, md: 2 },
                  fontSize: { xs: '1.3rem', sm: '1.45rem', md: '1.6rem' },
                  color: 'text.primary',
                  lineHeight: 1.25,
                  letterSpacing: '-0.3px',
                  pr: { xs: 5, md: 6 },
                }}
              >
                {currentProduct.name}
              </Typography>

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
                {/* Price Section — pulled into a soft panel to anchor attention */}
                <Box
                  sx={{
                    mb: { xs: 1.5, sm: 1.75, md: 2 },
                    px: { xs: 1.75, md: 2 },
                    py: { xs: 1.25, md: 1.5 },
                    borderRadius: 2.5,
                    bgcolor: isDark ? 'rgba(148,130,255,0.10)' : 'rgba(70,51,184,0.06)',
                    border: '1px solid',
                    borderColor: isDark ? 'rgba(148,130,255,0.24)' : 'rgba(70,51,184,0.14)',
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                    <Typography
                      component="span"
                      sx={{
                        fontSize: { xs: '0.7rem', md: '0.75rem' },
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        color: 'text.secondary',
                      }}
                    >
                      MRP
                    </Typography>
                    <Typography
                      component="span"
                      sx={{
                        fontWeight: 800,
                        fontSize: { xs: '1.75rem', sm: '1.9rem', md: '2rem' },
                        lineHeight: 1,
                        fontFamily: 'system-ui',
                        color: isDark ? 'text.primary' : 'primary.main',
                        letterSpacing: '-0.5px',
                      }}
                    >
                      ₹{currentProduct.rate?.toLocaleString('en-IN')}
                    </Typography>
                  </Box>
                  <Typography
                    component="span"
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.72rem', md: '0.78rem' }, fontWeight: 600 }}
                  >
                    incl. GST {getTaxPercentage(currentProduct)}%
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
