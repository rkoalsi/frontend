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
} from "@mui/material";
import { AddShoppingCart, RemoveShoppingCart } from "@mui/icons-material";
import QuantitySelector from "../QuantitySelector";
import ImageCarousel from "./ImageCarousel";

interface SearchResult {
  _id: string;
  name: string;
  images?: string[]; // Changed from image_url to image_urls array
  sub_category?: string;
  series?: string;
  cf_sku_code?: string;
  rate: number;
  stock: number;
  new?: boolean;
  item_tax_preferences: any;
  upc_code?: string;
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
  showUPC: boolean;
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
    showUPC = false,
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

    return (
      <Grid>
        <Card
          sx={{
            display: "flex",
            flexDirection: "column",
            borderRadius: 3,
            boxShadow: selectedProduct ? 4 : 2,
            overflow: "hidden",
            backgroundColor: "background.paper",
            mt: index === 0 ? "16px" : undefined,
            mb: "16px",
            border: selectedProduct ? '2px solid' : '1px solid',
            borderColor: selectedProduct ? 'primary.main' : 'divider',
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              boxShadow: 6,
              transform: 'translateY(-4px)',
              borderColor: 'primary.light',
            },
          }}
        >
          {/* Image Section */}
          <Box sx={{ position: "relative", backgroundColor: 'grey.50' }}>
            {product.new && (
              <Badge
                badgeContent="New"
                color="secondary"
                overlap="rectangular"
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
                sx={{
                  position: "absolute",
                  top: 12,
                  right: 12,
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

            {/* Stock Status Badge */}
            <Box
              sx={{
                position: 'absolute',
                top: 12,
                right: 12,
                zIndex: 10,
              }}
            >
              <Chip
                label={`Stock: ${product.stock}`}
                size="medium"
                color={product.stock > 10 ? 'success' : 'error'}
                variant={product.stock > 10 ? 'filled' : 'outlined'}
                sx={{
                  fontWeight: 600,
                  fontSize: '0.65rem',
                  backgroundColor: product.stock > 10 ? 'success.main' : 'error.light',
                  color: 'white',
                  boxShadow: 1,
                }}
              />
            </Box>

            <ImageCarousel
              product={product}
              handleImageClick={handleImageClick}
            />
          </Box>

          <CardContent sx={{ p: 3, flexGrow: 1 }}>
            {/* Product Name */}
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600, 
                mb: 2,
                color: 'text.primary',
                lineHeight: 1.3,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {product.name}
            </Typography>

            {/* Product Details Grid */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 2,
                mb: 2,
              }}
            >
              {/* Category */}
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
                >
                  Category
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={product.sub_category || "-"}
                    variant="outlined"
                    size="small"
                    sx={{
                      borderRadius: 2,
                      fontSize: '0.78rem',
                      height: 24,
                    }}
                  />
                </Box>
              </Box>

              {/* Series */}
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
                >
                  Series
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={product.series || "-"}
                    variant="outlined"
                    size="small"
                    sx={{
                      borderRadius: 2,
                      fontSize: '0.78rem',
                      height: 24,
                    }}
                  />
                </Box>
              </Box>

              {/* SKU */}
              <Box display={'flex'} flexDirection={'column'} alignItems={'baseline'}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
                >
                  SKU Code
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    mt: 0.5,
                    fontFamily: 'monospace',
                    backgroundColor: 'action.selected',
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    display: 'inline-block',
                    color: product.cf_sku_code ? 'text.primary' : 'text.disabled',
                  }}
                >
                  {product.cf_sku_code || "—"}
                </Typography>
              </Box>

              {/* UPC (if shown) */}
              {showUPC && (
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
                  >
                    UPC/EAN
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 0.5,
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      color: 'text.secondary',
                    }}
                  >
                    {product.upc_code || "—"}
                  </Typography>
                </Box>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Pricing Section */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
                >
                  Base Price
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: 'info',
                    fontSize: '1rem',
                  }}
                >
                  ₹{product.rate?.toLocaleString()}
                </Typography>
              </Box>

              {/* Stock Section */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
                >
                  Stock
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: product.stock > 10 ? 'success.main' : 'error.light',
                    fontSize: '1rem',
                  }}
                >
                  {product.stock}
                </Typography>
              </Box>

              {!isShared && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
                  >
                    Margin
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: 'info',
                    }}
                  >
                    {specialMargins[productId] || customerMargin}
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
                >
                  Selling Price
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: 'primary.main',
                    fontSize: '1.1rem',
                  }}
                >
                  ₹{sellingPrice?.toLocaleString()}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
                >
                  GST
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 500 }}
                >
                  {product?.item_tax_preferences[product?.item_tax_preferences.length - 1].tax_percentage}%
                </Typography>
              </Box>

              {selectedProduct && (
                <>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ 
                        fontWeight: 700,
                        color: 'success.dark',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      Item Total
                    </Typography>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: 700,
                        color: 'success.dark',
                        fontSize: '1.2rem',
                      }}
                    >
                      ₹{itemTotal?.toLocaleString()}
                    </Typography>
                  </Box>
                </>
              )}
            </Box>

            {/* Quantity Selector */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ 
                  fontWeight: 600, 
                  mb: 1,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
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
                    mt: 1,
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
                  size="large"
                  sx={{
                    textTransform: "none",
                    borderRadius: 2,
                    fontWeight: 600,
                    py: 1.5,
                    fontSize: '0.9rem',
                    boxShadow: 2,
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-1px)',
                    },
                    '&:disabled': {
                      backgroundColor: 'action.disabledBackground',
                      color: 'action.disabled',
                    },
                    transition: 'all 0.2s ease-in-out',
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