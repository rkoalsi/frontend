// ProductCard.tsx
import React, { memo, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Button,
  Badge,
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
  handleQuantityChange: (id: string, newQuantity: number) => void;
  handleAddOrRemove: (product: SearchResult) => void;
  index: number;
  isShared: boolean;
}

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
  }) => {
    const productId = product._id;
    const selectedProduct: any = selectedProducts.find(
      (p) => p._id === productId
    );
    const quantity =
      selectedProduct?.quantity || temporaryQuantities[productId] || "";
    const sellingPrice = getSellingPrice(product);
    const itemTotal = parseFloat((sellingPrice * quantity).toFixed(2));
    const isQuantityExceedingStock = quantity > product.stock;
    const isDisabled =
      orderStatus?.toLowerCase().includes("accepted") ||
      orderStatus?.toLowerCase().includes("declined");

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const isTablet = useMediaQuery(theme.breakpoints.down("md"));

    return (
      <Grid sx={{ height: '100%' }}>
        <Card
          sx={{
            display: "flex",
            flexDirection: "column",
            height: '100%',
            minHeight: '100%',
            borderRadius: 3,
            boxShadow: selectedProduct ? 4 : 2,
            overflow: "visible",
            backgroundColor: "background.paper",
            border: selectedProduct ? '2px solid' : '1px solid',
            borderColor: selectedProduct ? 'primary.main' : 'divider',
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
              backgroundColor: 'grey.50',
              height: 280,
              width: '100%',
            }}
          >
            {product.new && (
              <Badge
                badgeContent="New"
                color="secondary"
                overlap="rectangular"
                sx={{
                  position: "absolute",
                  top: 20,
                  right: 24,
                  zIndex: 10,
                  "& .MuiBadge-badge": {
                    fontSize: "0.65rem",
                    fontWeight: 600,
                    borderRadius: '12px',
                    padding: "6px 8px",
                    boxShadow: 2,
                  },
                }}
              />
            )}

            <ImageCarousel
              product={product}
              handleImageClick={handleImageClick}
            />
          </Box>


          <CardContent sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Product Name */}
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                mb: 1.5,
                color: 'text.primary',
                lineHeight: 1.3,
                wordWrap: 'break-word',
                wordBreak: 'break-word',
                minHeight: '40px',
                fontSize: '1rem',
              }}
            >
              {product.name}
            </Typography>

            {/* Product Details - Enhanced Design */}
            <Box sx={{ mb: 1.5 }}>
              {/* Category & Series in one row */}
              <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                {product.category && (
                  <Chip
                    label={product.category}
                    variant="filled"
                    size="small"
                    sx={{
                      borderRadius: 1.5,
                      fontSize: '0.7rem',
                      height: '24px',
                      fontWeight: 600,
                      bgcolor: 'primary.50',
                      color: 'primary.dark',
                      '& .MuiChip-label': { px: 1.5 },
                    }}
                  />
                )}
              </Box>

              {/* SKU & UPC in enhanced grid */}
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 2,
              }}>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px',
                      display: 'block',
                      mb: 0.5,
                    }}
                  >
                    SKU
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      fontFamily: 'monospace',
                      color: 'text.primary',
                    }}
                  >
                    {product.cf_sku_code || "-"}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px',
                      display: 'block',
                      mb: 0.5,
                    }}
                  >
                    UPC
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      fontFamily: 'monospace',
                      color: 'text.primary',
                    }}
                  >
                    {product.upc_code || "-"}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Dimensions Accordion - More Compact */}
            {product.dimensions && (product.dimensions.length || product.dimensions.breadth || product.dimensions.height) && (
              <Box sx={{ mb: 1.5 }}>
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

            <Divider sx={{ my: 1.5 }} />

            {/* Pricing Section - Enhanced */}
            <Box sx={{ mb: 1.5 }}>
              {/* Price Information Grid */}
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 2,
                mb: 1.5,
              }}>
                {/* MRP */}
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px',
                      display: 'block',
                      mb: 0.5,
                    }}
                  >
                    MRP
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      fontFamily: 'system-ui',
                      color: 'text.primary',
                      letterSpacing: '-0.3px',
                    }}
                  >
                    ₹{product.rate?.toLocaleString('en-IN')}
                  </Typography>
                </Box>

                {/* Stock - Hidden when isShared */}
                {!isShared && (
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px',
                        display: 'block',
                        mb: 0.5,
                      }}
                    >
                      Stock
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'end', gap: 0.5, justifyContent: 'flex-end' }}>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          fontFamily: 'system-ui',
                          color: product.stock > 10 ? 'success.main' : product.stock > 0 ? 'error.main' : 'primary',
                          letterSpacing: '-0.3px',
                        }}
                      >
                        {product.stock.toLocaleString('en-IN')}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Selling Price - Hidden when isShared */}
                {!isShared && (
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px',
                        display: 'block',
                        mb: 0.5,
                      }}
                    >
                      Selling Price
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 800,
                        fontSize: '1.05rem',
                        fontFamily: 'system-ui',
                        color: 'primary.main',
                        letterSpacing: '-0.5px',
                      }}
                    >
                      ₹{sellingPrice?.toLocaleString('en-IN')}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.65rem',
                        color: 'text.secondary',
                        fontStyle: 'italic',
                      }}
                    >
                      {specialMargins[productId] || customerMargin} margin
                    </Typography>
                  </Box>
                )}

                {/* GST */}
                <Box sx={{ textAlign: 'right' }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px',
                      display: 'block',
                      mb: 0.5,
                    }}
                  >
                    GST
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      fontFamily: 'system-ui',
                      color: 'text.primary',
                      letterSpacing: '-0.3px',
                    }}
                  >
                    {product?.item_tax_preferences[product?.item_tax_preferences.length - 1].tax_percentage}%
                  </Typography>
                </Box>
              </Box>

              {selectedProduct && (
                <Box
                  sx={{
                    p: 1.5,
                    bgcolor: 'success.50',
                    borderRadius: 1.5,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: '2px solid',
                    borderColor: 'success.main',
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 700,
                      color: 'success.dark',
                      fontSize: '0.85rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Item Total
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 800,
                      color: 'success.dark',
                      fontSize: '1.15rem',
                      fontFamily: 'system-ui',
                      letterSpacing: '-0.5px',
                    }}
                  >
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
                mb: 1.5,
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  fontWeight: 600,
                  mb: 0.75,
                  fontSize: '0.7rem',
                }}
              >
                Quantity
              </Typography>
              <QuantitySelector
                quantity={quantity}
                max={product.stock}
                onChange={(newQuantity) =>
                  handleQuantityChange(productId, newQuantity)
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
            <Tooltip title={selectedProduct ? "Remove from cart" : "Add to cart"}>
              <span>
                <Button
                  variant="contained"
                  color={selectedProduct ? "error" : "primary"}
                  startIcon={
                    selectedProduct ? <RemoveShoppingCart /> : <AddShoppingCart />
                  }
                  onClick={() => handleAddOrRemove(product)}
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
                  {selectedProduct ? "Remove from Cart" : "Add to Cart"}
                </Button>
              </span>
            </Tooltip>
          </CardContent>
        </Card>
      </Grid>
    );
  }
);

export default ProductCard;