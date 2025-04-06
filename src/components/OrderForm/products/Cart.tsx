// CartDrawer.tsx
import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Button,
  Grid,
} from '@mui/material';
import { Close as CloseIcon, RemoveShoppingCart } from '@mui/icons-material';
import QuantitySelector from '../QuantitySelector';

interface SearchResult {
  _id: string;
  name: string;
  image_url?: string;
  quantity: number;
  stock: number;
}

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  selectedProducts: any[];
  getSellingPrice: any;
  handleImageClick: (src: string) => void;
  handleQuantityChange: (id: string, newQuantity: number) => void;
  handleRemoveProduct: (id: string) => void;
  totals: { totalGST: number; totalAmount: number };
  onCheckout: () => void;
  orderStatus?: string;
  customer?: { cf_in_ex?: string };
  isMobile: boolean;
}

const CartDrawer: React.FC<CartDrawerProps> = ({
  open,
  onClose,
  selectedProducts,
  getSellingPrice,
  handleImageClick,
  handleQuantityChange,
  handleRemoveProduct,
  totals,
  onCheckout,
  orderStatus,
  customer,
  isMobile,
}) => {
  const isDisabled =
    orderStatus?.toLowerCase().includes('accepted') ||
    orderStatus?.toLowerCase().includes('declined');

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      PaperProps={{
        sx: {
          width: isMobile ? '100%' : 450,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        },
      }}
    >
      <Box
        sx={{
          padding: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
          Cart
        </Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {selectedProducts.length === 0 ? (
          <Typography variant='body1' align='center' sx={{ mt: 4 }}>
            Your cart is empty.
          </Typography>
        ) : (
          <Grid container paddingX={2} gap={2}>
            {selectedProducts.map((product) => {
              const productId = product._id;
              const sellingPrice = getSellingPrice(product);
              const itemTotal = parseFloat(
                (sellingPrice * product.quantity).toFixed(2)
              );
              return (
                <Grid
                  // item
                  // xs={12}
                  // key={productId}
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 2,
                    padding: 2,
                    boxShadow: 1,
                    backgroundColor: 'background.paper',
                  }}
                >
                  <Grid
                    // container
                    spacing={2}
                    alignItems={isMobile ? 'center' : 'flex-end'}
                  >
                    <Grid>
                      <Box
                        display='flex'
                        justifyContent='center'
                        alignItems='center'
                      >
                        <img
                          src={product.image_url || '/placeholder.png'}
                          alt={product.name}
                          loading='lazy'
                          style={{
                            width: isMobile ? '200px' : '150px',
                            height: 'auto',
                            borderRadius: '4px',
                            objectFit: 'cover',
                            cursor: 'pointer',
                          }}
                          onClick={() =>
                            handleImageClick(
                              product.image_url || '/placeholder.png'
                            )
                          }
                        />
                      </Box>
                      <Typography
                        variant='subtitle1'
                        sx={{ fontWeight: 'bold' }}
                      >
                        {product.name}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <QuantitySelector
                          quantity={product.quantity}
                          max={product.stock}
                          onChange={(newQuantity) =>
                            handleQuantityChange(productId, newQuantity)
                          }
                          disabled={isDisabled}
                        />
                      </Box>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        sx={{ mt: 1 }}
                      >
                        Price: ₹{sellingPrice.toFixed(2)}
                      </Typography>
                    </Grid>
                    <Grid
                      // item
                      // xs={12}
                      // sm={4}
                      // container
                      direction={isMobile ? 'row' : 'column'}
                      justifyContent={isMobile ? 'space-between' : 'flex-end'}
                      alignItems={isMobile ? 'center' : 'flex-end'}
                      sx={{ mt: isMobile ? 0 : 1 }}
                    >
                      <Typography
                        variant='subtitle1'
                        sx={{ fontWeight: 'bold', mb: isMobile ? 0 : 1 }}
                      >
                        ₹{itemTotal.toFixed(2)}
                      </Typography>
                      <IconButton
                        size='small'
                        color='error'
                        onClick={() => handleRemoveProduct(productId)}
                        aria-label={`Remove ${product.name} from cart`}
                      >
                        <RemoveShoppingCart />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>
      <Divider />
      <Box sx={{ padding: 2 }}>
        {selectedProducts.length > 0 && (
          <>
            <Box sx={{ mb: 1 }}>
              <Typography variant='subtitle1' sx={{ fontWeight: 'bold' }}>
                Total GST ({customer?.cf_in_ex || 'Exclusive'}): ₹
                {totals.totalGST.toFixed(2)}
              </Typography>
              <Typography variant='h6' sx={{ fontWeight: 'bold', mt: 1 }}>
                Total Amount: ₹{totals.totalAmount.toFixed(2)}
              </Typography>
            </Box>
            <Button
              variant='contained'
              color='primary'
              fullWidth
              sx={{ mt: 2 }}
              onClick={onCheckout}
              disabled={selectedProducts.length === 0 || isDisabled}
            >
              Checkout
            </Button>
          </>
        )}
      </Box>
    </Drawer>
  );
};

export default CartDrawer;
