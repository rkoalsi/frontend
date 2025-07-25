// ProductRow.tsx
import React, { memo } from 'react';
import {
  TableRow,
  TableCell,
  Badge,
  IconButton,
  Typography,
} from '@mui/material';
import { AddShoppingCart, RemoveShoppingCart } from '@mui/icons-material';
import QuantitySelector from '../QuantitySelector';

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
}

interface ProductRowProps {
  product: SearchResult;
  selectedProducts: SearchResult[];
  temporaryQuantities: { [key: string]: number };
  specialMargins: { [key: string]: string };
  customerMargin: string;
  orderStatus?: string;
  getSellingPrice: any;
  handleImageClick: (src: string) => void;
  handleQuantityChange: (id: string, newQuantity: number) => void;
  handleAddOrRemove: (product: SearchResult) => void;
  isShared: boolean;
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
  }) => {
    const productId = product._id;
    const selectedProduct: any = selectedProducts.find(
      (p) => p._id === productId
    );
    const quantity: any =
      selectedProduct?.quantity || temporaryQuantities[productId] || '';
    const sellingPrice = getSellingPrice(product);
    const itemTotal = parseFloat((sellingPrice * quantity).toFixed(2));
    const isQuantityExceedingStock = quantity > product.stock;
    const isDisabled =
      orderStatus?.toLowerCase().includes('accepted') ||
      orderStatus?.toLowerCase().includes('declined');
    return (
      <TableRow key={productId}>
        <TableCell>
          <Badge
            badgeContent={product.new ? 'New' : undefined}
            color='secondary'
            overlap='rectangular'
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <img
              src={product.image_url || '/placeholder.png'}
              alt={product.name}
              loading='lazy'
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '4px',
                objectFit: 'cover',
                cursor: 'pointer',
              }}
              onClick={() =>
                handleImageClick(product.image_url || '/placeholder.png')
              }
            />
          </Badge>
        </TableCell>
        <TableCell>{product.name}</TableCell>
        <TableCell>{product.sub_category || '-'}</TableCell>
        <TableCell>{product.series || '-'}</TableCell>
        <TableCell>{product.cf_sku_code || '-'}</TableCell>
        <TableCell>₹{product.rate}</TableCell>
        <TableCell>{product.stock}</TableCell>
        {isShared ? null : (
          <TableCell>
            {specialMargins[productId]
              ? specialMargins[productId]
              : customerMargin}
          </TableCell>
        )}
        <TableCell>₹{sellingPrice}</TableCell>
        <TableCell>
          {
            product.item_tax_preferences[
              product?.item_tax_preferences.length - 1
            ].tax_percentage
          }
          %
        </TableCell>
        <TableCell style={{ padding: 0 }}>
          <QuantitySelector
            quantity={quantity}
            max={product.stock}
            onChange={(newQuantity) =>
              handleQuantityChange(productId, newQuantity)
            }
            disabled={isDisabled}
          />
          {isQuantityExceedingStock && (
            <Typography variant='caption' color='error'>
              Exceeds stock!
            </Typography>
          )}
        </TableCell>
        <TableCell>{selectedProduct ? `₹${itemTotal}` : '-'}</TableCell>
        <TableCell>
          <IconButton
            color='primary'
            disabled={isDisabled}
            onClick={() => handleAddOrRemove(product)}
          >
            {selectedProduct ? <RemoveShoppingCart /> : <AddShoppingCart />}
          </IconButton>
        </TableCell>
      </TableRow>
    );
  }
);

export default ProductRow;
