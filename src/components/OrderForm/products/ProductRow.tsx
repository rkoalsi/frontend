// ProductRow.tsx
import React, { memo } from "react";
import {
  TableRow,
  TableCell,
  Badge,
  IconButton,
  Box,
  Tooltip,
  Typography,
  Chip,
  Alert,
} from "@mui/material";
import { AddShoppingCart, LocalOffer, RemoveShoppingCart } from "@mui/icons-material";
import QuantitySelector from "../QuantitySelector";
import ImageCarousel from "./ImageCarousel";

interface SearchResult {
  _id: string;
  name: string;
  image_url?: string;
  sub_category?: string;
  series?: string;
  cf_sku_code?: string;
  rate: number;
  stock: number;
  new?: boolean;
  item_tax_preferences: any;
  upc_code?: string;
}

interface ProductRowProps {
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
  isShared?: boolean;
  showUPC?: boolean;
}

const ProductRow: React.FC<ProductRowProps> = memo(
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
    isShared = false,
    showUPC = false,
  }) => {
    const productId = product._id;
    const selectedProduct: any = selectedProducts.find(
      (p) => p._id === productId
    );
    const quantity: any =
      selectedProduct?.quantity || temporaryQuantities[productId] || "";
    const sellingPrice = getSellingPrice(product);
    const itemTotal = parseFloat((sellingPrice * quantity).toFixed(2));
    const isQuantityExceedingStock = quantity > product.stock;
    const isDisabled =
      orderStatus?.toLowerCase().includes('accepted') ||
      orderStatus?.toLowerCase().includes('declined');
    return (
      <TableRow
        key={productId}
        sx={{
          '&:hover': {
            backgroundColor: 'action.hover',
            transform: 'translateY(-1px)',
            boxShadow: 1,
          },
          transition: 'all 0.2s ease-in-out',
          borderLeft: selectedProduct ? '4px solid' : 'none',
          borderLeftColor: selectedProduct ? 'primary.main' : 'transparent',
        }}
      >
        {/* Product Image with Badge */}
        <TableCell sx={{ width: 120, p: 1 }}>
          <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <Badge
              badgeContent={product.new ? "New" : undefined}
              color="secondary"
              overlap="rectangular"
              sx={{

                '& .MuiBadge-badge': {
                  position: "absolute",
                  top: 18,
                  right: 24,
                  zIndex: 10,
                  fontSize: '0.65rem',
                  height: 18,
                  minWidth: 18,
                  borderRadius: '9px',
                  fontWeight: 600,
                }
              }}
            >
              <Box
                sx={{
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    borderColor: 'primary.main',
                  },
                  transition: 'border-color 0.2s ease',
                }}
              >
                <ImageCarousel
                  product={product}
                  handleImageClick={handleImageClick}
                />
              </Box>
            </Badge>
          </Box>
        </TableCell>

        {/* Product Name */}
        <TableCell sx={{ minWidth: 200 }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              mb: 2,
              color: 'text.primary',
              lineHeight: 1.3,
              wordWrap: 'break-word',
              wordBreak: 'break-word',
            }}
          >
            {product.name}
          </Typography>
        </TableCell>

        {/* Sub Category */}
        <TableCell sx={{ minWidth: 140 }}>
          <Chip
            label={product.sub_category || "No Category"}
            variant="outlined"
            size="small"
            sx={{
              borderRadius: 2,
              fontSize: '0.78rem',
              height: 'auto',
              minHeight: 24,
              maxWidth: '100%',
              '& .MuiChip-label': {
                display: 'block',
                wordWrap: 'break-word',
                wordBreak: 'break-word',
                padding: '6px',
                lineHeight: 1.2,
              },
            }}
          />
        </TableCell>

        {/* Series */}
        <TableCell>
          <Chip
            label={product.series || "-"}
            variant="outlined"
            size="small"
            sx={{
              borderRadius: 2,
              fontSize: '0.78rem',
              height: 'auto',
              minHeight: 24,
              maxWidth: '100%',
              '& .MuiChip-label': {
                display: 'block',
                wordWrap: 'break-word',
                wordBreak: 'break-word',
                padding: '6px',
                lineHeight: 1.2,
              },
            }}
          />
        </TableCell>

        {/* SKU Code */}
        <TableCell>
          <Chip
            label={product.cf_sku_code || "-"}
            variant="outlined"
            size="medium"
            sx={{
              borderRadius: 2,
              fontSize: '0.78rem',
              height: 'auto',
              minHeight: 24,
              minWidth: 'fit-content',
              '& .MuiChip-label': {
                display: 'block',
                wordWrap: 'break-word',
                wordBreak: 'break-word',
                padding: '6px',
                lineHeight: 1.2,
              },
            }}
          />
        </TableCell>

        {/* Rate */}
        <TableCell>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: 'info',
              fontSize: '0.95rem',
            }}
          >
            ₹{product.rate?.toLocaleString()}
          </Typography>
        </TableCell>

        {/* Stock */}
        <TableCell>
          <Chip
            label={product.stock}
            size="small"
            color={product.stock > 10 ? 'success' : 'error'}
            variant={product.stock > 10 ? 'filled' : 'outlined'}
            sx={{
              minWidth: 60,
              fontWeight: 600,
            }}
          />
        </TableCell>

        {/* Margin (if not shared) */}
        {!isShared && (
          <TableCell>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                color: 'black',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                textAlign: 'center',
                opacity: 0.8,
              }}
            >
              {specialMargins[productId] || customerMargin}
            </Typography>
          </TableCell>
        )}

        {/* Selling Price */}
        <TableCell>
          <Typography
            variant="body1"
            sx={{
              fontWeight: 700,
              color: 'primary.main',
              fontSize: '1rem',
            }}
          >
            ₹{sellingPrice?.toLocaleString()}
          </Typography>
        </TableCell>

        {/* Tax Percentage */}
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography
              variant="body1"
              sx={{ fontWeight: 500 }}
            >
              {product.item_tax_preferences[product?.item_tax_preferences.length - 1].tax_percentage}%
            </Typography>
          </Box>
        </TableCell>

        {/* Quantity Selector */}
        <TableCell sx={{ minWidth: 140 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
            <QuantitySelector
              quantity={quantity}
              max={product.stock}
              onChange={(newQuantity) => handleQuantityChange(productId, newQuantity)}
              disabled={isDisabled}
            />
            {isQuantityExceedingStock && (
              <Alert
                severity="error"
                sx={{
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
        </TableCell>

        {/* Item Total */}
        <TableCell>
          <Typography
            variant="body1"
            sx={{
              fontWeight: 700,
              color: selectedProduct ? 'success.dark' : 'text.disabled',
              fontSize: '1rem',
            }}
          >
            {selectedProduct ? `₹${itemTotal?.toLocaleString()}` : "—"}
          </Typography>
        </TableCell>

        {/* Action Button */}
        <TableCell sx={{ textAlign: 'center' }}>
          <Tooltip title={selectedProduct ? "Remove from cart" : "Add to cart"}>
            <span>
              <IconButton
                color={selectedProduct ? "error" : "primary"}
                disabled={isDisabled}
                onClick={() => handleAddOrRemove(product)}
                size="large"
                sx={{
                  borderRadius: 2,
                  color: 'white',
                  border: '2px solid',
                  borderColor: selectedProduct ? 'error.main' : 'primary.main',
                  backgroundColor: selectedProduct ? 'error.light' : 'primary.light',
                  '&:hover': {
                    backgroundColor: selectedProduct ? 'error.main' : 'primary.main',
                    color: 'white',
                    transform: 'scale(1.05)',
                  },
                  '&:disabled': {
                    borderColor: 'action.disabled',
                    backgroundColor: 'action.disabledBackground',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                {selectedProduct ? <RemoveShoppingCart /> : <AddShoppingCart />}
              </IconButton>
            </span>
          </Tooltip>
        </TableCell>

        {/* UPC Code (if shown) */}
        {showUPC && (
          <TableCell>
            <Chip
              label={product.upc_code || "-"}
              variant="outlined"
              size="small"
              sx={{
                borderRadius: 2,
                fontSize: '0.78rem',
                height: 'auto',
                minHeight: 24,
                maxWidth: '100%',
                '& .MuiChip-label': {
                  display: 'block',
                  whiteSpace: 'normal',
                  wordWrap: 'break-word',
                  wordBreak: 'break-word',
                  padding: '6px',
                  lineHeight: 1.2,
                },
              }}
            />
          </TableCell>
        )}
      </TableRow>
    );
  }
);

export default ProductRow;
