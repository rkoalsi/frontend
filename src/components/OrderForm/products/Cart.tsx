// CartDrawer.tsx
import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Button,
  Stack,
  Paper,
  Badge,
} from '@mui/material';
import {
  Close as CloseIcon,
  RemoveShoppingCart,
  ShoppingCartOutlined,
  ArrowForward,
} from '@mui/icons-material';
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
  handleImageClick: any;
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
          bgcolor: 'background.default',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          padding: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          boxShadow: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ShoppingCartOutlined sx={{ mr: 1 }} />
          <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
            Your Cart
          </Typography>
          {selectedProducts.length > 0 && (
            <Badge
              badgeContent={selectedProducts.length}
              color='primary'
              sx={{ ml: 2 }}
            />
          )}
        </Box>
        <IconButton
          onClick={onClose}
          size='small'
          sx={{ bgcolor: 'action.hover' }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Empty Cart Message */}
      {selectedProducts.length === 0 && (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            p: 3,
          }}
        >
          <ShoppingCartOutlined
            sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }}
          />
          <Typography variant='h6' color='text.secondary'>
            Your cart is empty
          </Typography>
          <Typography
            variant='body2'
            color='text.secondary'
            sx={{ mt: 1, textAlign: 'center' }}
          >
            Add items to your cart to see them here
          </Typography>
        </Box>
      )}

      {/* Cart Items */}
      {selectedProducts.length > 0 && (
        <Box sx={{ flex: 1, overflowY: 'auto', p: 2, width: '100%' }}>
          <Stack spacing={2} sx={{ width: '100%' }}>
            {selectedProducts.map((product) => {
              const productId = product._id;
              const sellingPrice = getSellingPrice(product);
              const itemTotal = parseFloat(
                (sellingPrice * product.quantity).toFixed(2)
              );

              return (
                <Paper
                  key={productId}
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.2s ease-in-out',
                    width: '100%',
                    '&:hover': {
                      boxShadow: 2,
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 2,
                      flexDirection: isMobile ? 'column' : 'row',
                      width: '100%',
                    }}
                  >
                    {/* Product Image - Full Width on Mobile */}
                    {isMobile ? (
                      <Box
                        sx={{
                          width: '100%',
                          height: 180,
                          borderRadius: 1,
                          overflow: 'hidden',
                          border: '1px solid',
                          borderColor: 'divider',
                          mb: 1,
                        }}
                      >
                        <img
                          src={product.image_url || '/placeholder.png'}
                          alt={product.name}
                          loading='lazy'
                          style={{
                            width: '100%',
                            height: '100%',
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
                    ) : (
                      <Box
                        sx={{
                          width: 80,
                          height: 80,
                          flexShrink: 0,
                          borderRadius: 1,
                          overflow: 'hidden',
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <img
                          src={product.image_url || '/placeholder.png'}
                          alt={product.name}
                          loading='lazy'
                          style={{
                            width: '100%',
                            height: '100%',
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
                    )}

                    {/* Product Details - Full Width on Mobile */}
                    <Box
                      sx={{
                        flex: 1,
                        width: isMobile ? '100%' : 'auto',
                        position: 'relative',
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          mb: 1,
                          pr: isMobile ? 5 : 0, // Make room for delete icon on mobile
                        }}
                      >
                        <Typography
                          variant='subtitle1'
                          sx={{
                            fontWeight: 'bold',
                            maxWidth: isMobile ? '90%' : '80%',
                          }}
                          noWrap
                        >
                          {product.name}
                        </Typography>

                        {/* Delete icon positioned absolutely on mobile for better layout */}
                        <IconButton
                          size='small'
                          color='error'
                          onClick={() => handleRemoveProduct(productId)}
                          aria-label={`Remove ${product.name} from cart`}
                          sx={{
                            p: 0.5,
                            position: isMobile ? 'absolute' : 'static',
                            right: isMobile ? 0 : 'auto',
                            top: isMobile ? 0 : 'auto',
                            '&:hover': {
                              bgcolor: 'error.light',
                              color: 'error.contrastText',
                            },
                          }}
                        >
                          <RemoveShoppingCart fontSize='small' />
                        </IconButton>
                      </Box>

                      <Typography
                        variant='body2'
                        color='text.secondary'
                        sx={{ mb: 1 }}
                      >
                        Price: ₹{sellingPrice.toFixed(2)}
                      </Typography>

                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mt: 2,
                          flexDirection: isMobile ? 'column' : 'row',
                          gap: isMobile ? 2 : 0,
                        }}
                      >
                        <QuantitySelector
                          quantity={product.quantity}
                          max={product.stock}
                          onChange={(newQuantity) =>
                            handleQuantityChange(productId, newQuantity)
                          }
                          disabled={isDisabled}
                        />

                        <Typography
                          variant='subtitle1'
                          sx={{
                            fontWeight: 'bold',
                            color: 'primary.main',
                            alignSelf: isMobile ? 'flex-end' : 'center',
                          }}
                        >
                          ₹{itemTotal.toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              );
            })}
          </Stack>
        </Box>
      )}

      {/* Footer with Totals and Checkout */}
      {selectedProducts.length > 0 && (
        <>
          <Divider />
          <Paper
            elevation={3}
            sx={{
              p: 2.5,
              borderRadius: 0,
              bgcolor: 'background.paper',
              width: '100%',
            }}
          >
            <Box sx={{ mb: 2 }}>
              <Box
                sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
              >
                <Typography variant='body2' color='text.secondary'>
                  GST ({customer?.cf_in_ex || 'Exclusive'}):
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  ₹{totals.totalGST.toFixed(2)}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant='subtitle1' sx={{ fontWeight: 'bold' }}>
                  Total Amount:
                </Typography>
                <Typography
                  variant='h6'
                  sx={{ fontWeight: 'bold', color: 'primary.main' }}
                >
                  ₹{totals.totalAmount.toFixed(2)}
                </Typography>
              </Box>
            </Box>

            <Button
              variant='contained'
              color='primary'
              fullWidth
              size='large'
              sx={{
                mt: 1,
                py: 1.2,
                fontWeight: 'bold',
                boxShadow: 2,
                '&:hover': {
                  boxShadow: 4,
                },
              }}
              onClick={onCheckout}
              disabled={selectedProducts.length === 0 || isDisabled}
              endIcon={<ArrowForward />}
            >
              Proceed to Checkout
            </Button>
          </Paper>
        </>
      )}
    </Drawer>
  );
};

export default CartDrawer;
