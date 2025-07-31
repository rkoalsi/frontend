// ProductCard.tsx
import React, { memo, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Button,
  Badge,
} from '@mui/material';
import {
  AddShoppingCart,
  RemoveShoppingCart,
} from '@mui/icons-material';
import QuantitySelector from '../QuantitySelector';
import ImageCarousel from './ImageCarousel';

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
  upc_code?:string;
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
      selectedProduct?.quantity || temporaryQuantities[productId] || '';
    const sellingPrice = getSellingPrice(product);
    const itemTotal = parseFloat((sellingPrice * quantity).toFixed(2));
    const isQuantityExceedingStock = quantity > product.stock;
    const isDisabled =
      orderStatus?.toLowerCase().includes('accepted') ||
      orderStatus?.toLowerCase().includes('declined');

    return (
      <Grid>
        <Card
          sx={{
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 2,
            boxShadow: 3,
            overflow: 'hidden',
            backgroundColor: 'background.paper',
            mt: index === 0 ? '16px' : undefined,
            mb: '16px',
          }}
        >
          <Box sx={{ position: 'relative' }}>
            {product.new && (
              <Badge
                badgeContent='New'
                color='secondary'
                overlap='rectangular'
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 20,
                  zIndex: 10,
                  '& .MuiBadge-badge': {
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    borderRadius: 1,
                    padding: '4px 6px',
                  },
                }}
              />
            )}

            <ImageCarousel
              product={product}
              handleImageClick={handleImageClick}
            />
          </Box>

          <CardContent sx={{ p: 2 }}>
            <Typography variant='h6' sx={{ fontWeight: 'bold', mb: 1 }}>
              {product.name}
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, auto)',
                gap: 1,
                mb: 1,
              }}
            >
              <Typography
                variant='body2'
                color='text.secondary'
                sx={{ fontWeight: 500 }}
              >
                Sub Category
              </Typography>
              <Typography variant='body2'>
                {product.sub_category || '-'}
              </Typography>
              <Typography
                variant='body2'
                color='text.secondary'
                sx={{ fontWeight: 500 }}
              >
                Series
              </Typography>
              <Typography variant='body2'>{product.series || '-'}</Typography>
              <Typography
                variant='body2'
                color='text.secondary'
                sx={{ fontWeight: 500 }}
              >
                SKU
              </Typography>
              <Typography variant='body2'>
                {product.cf_sku_code || '-'}
              </Typography>
              <Typography
                variant='body2'
                color='text.secondary'
                sx={{ fontWeight: 500 }}
              >
                UPC Code
              </Typography>
              <Typography variant='body2'>
                {product.upc_code || '-'}
              </Typography>
              <Typography
                variant='body2'
                color='text.secondary'
                sx={{ fontWeight: 500 }}
              >
                Price
              </Typography>
              <Typography variant='body2'>₹{product.rate}</Typography>
              <Typography
                variant='body2'
                color='text.secondary'
                sx={{ fontWeight: 500 }}
              >
                Stock
              </Typography>
              <Typography variant='body2'>{product.stock}</Typography>
              {!isShared ? (
                <>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ fontWeight: 500 }}
                  >
                    Margin
                  </Typography>
                  <Typography variant='body2'>
                    {specialMargins[productId]
                      ? specialMargins[productId]
                      : customerMargin}
                  </Typography>
                </>
              ) : null}
              <Typography
                variant='body2'
                color='text.secondary'
                sx={{ fontWeight: 500 }}
              >
                Selling Price
              </Typography>
              <Typography variant='body2'>₹{sellingPrice}</Typography>
              <Typography
                variant='body2'
                color='text.secondary'
                sx={{ fontWeight: 500 }}
              >
                GST
              </Typography>
              <Typography variant='body2'>
                {
                  product?.item_tax_preferences[
                    product?.item_tax_preferences.length - 1
                  ].tax_percentage
                }
                %
              </Typography>
              {selectedProduct && (
                <>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ fontWeight: 800 }}
                  >
                    Item Total
                  </Typography>
                  <Typography variant='body2' fontWeight='bold'>
                    ₹{itemTotal}
                  </Typography>
                </>
              )}
            </Box>
            <Box
              sx={{
                mt: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <QuantitySelector
                quantity={quantity}
                max={product.stock}
                onChange={(newQuantity) =>
                  handleQuantityChange(productId, newQuantity)
                }
                disabled={isDisabled}
              />
            </Box>
            {isQuantityExceedingStock && (
              <Typography variant='caption' color='error'>
                Exceeds stock!
              </Typography>
            )}
            <Box mt={2}>
              <Button
                variant='contained'
                color={selectedProduct ? 'error' : 'primary'}
                startIcon={
                  selectedProduct ? <RemoveShoppingCart /> : <AddShoppingCart />
                }
                onClick={() => handleAddOrRemove(product)}
                disabled={isDisabled}
                fullWidth
                sx={{
                  textTransform: 'none',
                  borderRadius: 2,
                  fontWeight: 'bold',
                }}
              >
                {selectedProduct ? 'Remove from Cart' : 'Add to Cart'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    );
  }
);

export default ProductCard;
