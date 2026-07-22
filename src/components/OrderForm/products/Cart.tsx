// CartDrawer.tsx
import React, { useState } from 'react';
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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Close as CloseIcon,
  RemoveShoppingCart,
  ShoppingCartOutlined,
  ArrowForward,
  LocalOffer,
  DeleteOutlined,
} from '@mui/icons-material';
import QuantitySelector from '../QuantitySelector';
import { getPackStep } from '../../../util/groupProducts';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  selectedProducts: any[];
  getSellingPrice: any;
  handleImageClick: any;
  handleQuantityChange: (id: string, newQuantity: number, isPreOrder?: boolean) => void;
  handleRemoveProduct: (id: string, isPreOrder?: boolean) => void;
  totals: { totalGST: number; totalAmount: number };
  onCheckout: () => void;
  orderStatus?: string;
  customer?: { cf_in_ex?: string };
  isMobile: boolean;
  handleClearCart?: () => void;
  order?: any;
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
  handleClearCart,
  order,
}) => {
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const isDisabled =
    orderStatus?.toLowerCase().includes('accepted') ||
    orderStatus?.toLowerCase().includes('declined');

  const handleOpenConfirmModal = () => {
    setConfirmModalOpen(true);
  };

  const handleCloseConfirmModal = () => {
    setConfirmModalOpen(false);
  };

  const handleConfirmClear = () => {
    if (handleClearCart) {
      handleClearCart();
    }
    setConfirmModalOpen(false);
  };

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      slotProps={{
        paper: {
          sx: {
            width: isMobile ? '100%' : 480,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            bgcolor: 'background.default',
          },
        },
      }}
      transitionDuration={{ enter: 250, exit: 200 }}
    >
      {/* Header */}
      <Box
        sx={{
          padding: { xs: 1.5, sm: 2 },
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ShoppingCartOutlined
            sx={{
              fontSize: 22,
              color: 'primary.main',
            }}
          />
            <Typography
              variant='h6'
              sx={{
                fontWeight: 700,
                color: 'text.primary',
              }}
            >
              Your Cart
            </Typography>
            {selectedProducts.length > 0 && (
              <Chip
                label={selectedProducts.reduce((n: number, p: any) => {
                  const isSplit = p.pre_order === true && (p.stock ?? 0) > 0;
                  if (isSplit) return n + ((p.quantity ?? 0) > 0 ? 1 : 0) + ((p.pre_order_quantity ?? 0) > 0 ? 1 : 0);
                  return n + 1;
                }, 0)}
                color='primary'
                size='small'
                sx={{
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  height: 28,
                  minWidth: 28,
                  borderRadius: '14px',
                }}
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {selectedProducts.length > 0 && handleClearCart && (
              <IconButton
                onClick={handleOpenConfirmModal}
                size='medium'
                disabled={
                  selectedProducts.length === 0 ||
                  !['draft', 'sent'].includes(order?.status?.toLowerCase() as string)
                }
                sx={{
                  bgcolor: 'error.lighter',
                  color: 'error.main',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: 'error.main',
                    color: 'error.contrastText',
                    transform: 'scale(1.1)',
                  },
                  '&:disabled': {
                    bgcolor: 'action.disabledBackground',
                    color: 'action.disabled',
                  },
                }}
              >
                <DeleteOutlined />
              </IconButton>
            )}
            <IconButton
              onClick={onClose}
              size='medium'
              sx={{
                bgcolor: 'action.hover',
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: 'error.light',
                  transform: 'rotate(90deg)',
                  color: 'error.contrastText',
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
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
            p: 4,
          }}
        >
          <ShoppingCartOutlined
            sx={{
              fontSize: 56,
              color: 'text.disabled',
              mb: 2,
              opacity: 0.5,
            }}
          />
            <Typography
              variant='h6'
              color='text.secondary'
              sx={{ fontWeight: 600, mb: 1 }}
            >
              Your cart is empty
            </Typography>
            <Typography
              variant='body2'
              color='text.secondary'
              sx={{ textAlign: 'center', maxWidth: 300 }}
            >
              Add items to your cart to see them here
            </Typography>
        </Box>
      )}

      {/* Cart Items */}
      {selectedProducts.length > 0 && (
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            p: { xs: 1.5, sm: 2 },
            width: '100%',
            WebkitOverflowScrolling: 'touch',
            willChange: 'scroll-position',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              bgcolor: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: 'primary.main',
              borderRadius: '4px',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
            },
          }}
        >
          <Stack spacing={1.5} sx={{ width: '100%', maxWidth: '100%' }}>
            {selectedProducts.flatMap((product) => {
              const isSplit = product.pre_order === true && (product.stock ?? 0) > 0;
              const rows: any[] = [];
              if ((product.quantity ?? 0) > 0) {
                rows.push({ ...product, _cartKey: product._id, _cartIsPreOrder: false, _cartQty: product.quantity });
              }
              if (isSplit && (product.pre_order_quantity ?? 0) > 0) {
                rows.push({ ...product, _cartKey: product._id + '-pre', _cartIsPreOrder: true, _cartQty: product.pre_order_quantity, quantity: product.pre_order_quantity });
              }
              return rows;
            }).map((product) => {
              const productId = product._id;
              const cartKey = product._cartKey;
              const isPreOrderRow = product._cartIsPreOrder;
              const sellingPrice = getSellingPrice(product);
              const itemTotal = parseFloat(
                (sellingPrice * product.quantity).toFixed(2)
              );

              return (
                <Paper
                  key={cartKey}
                  elevation={0}
                  sx={{
                    p: 1.5,
                    borderRadius: 2.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'border-color 0.2s ease',
                    width: '100%',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    bgcolor: 'background.paper',
                    '&:hover': { borderColor: 'primary.light' },
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 1.5, width: '100%' }}>
                    {/* Thumbnail */}
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        flexShrink: 0,
                        borderRadius: 1.5,
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: '#fff',
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        const imageList = product.images && product.images.length > 0
                          ? product.images
                          : product.image_url
                          ? [product.image_url]
                          : ['/placeholder.png'];
                        handleImageClick(imageList, 0);
                      }}
                    >
                      <img
                        src={
                          product.images && product.images.length > 0
                            ? product.images[0]
                            : product.image_url || '/placeholder.png'
                        }
                        alt={product.name}
                        loading='lazy'
                        style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }}
                      />
                    </Box>

                    {/* Details */}
                    <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant='subtitle2'
                            sx={{
                              fontWeight: 600,
                              lineHeight: 1.3,
                              color: 'text.primary',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              fontSize: '0.85rem',
                            }}
                          >
                            {product.name}
                          </Typography>
                          <Typography variant='caption' sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
                            ₹{sellingPrice.toFixed(2)} each
                            {(isPreOrderRow || (product.pre_order === true && (product.stock ?? 0) <= 0)) && (
                              <Box component='span' sx={{ color: 'warning.main', fontWeight: 700 }}> · Pre-Order</Box>
                            )}
                          </Typography>
                        </Box>
                        <IconButton
                          size='small'
                          onClick={() => handleRemoveProduct(productId, isPreOrderRow)}
                          aria-label={`Remove ${product.name} from cart`}
                          sx={{ p: 0.5, color: 'error.main', flexShrink: 0 }}
                        >
                          <RemoveShoppingCart sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Box>

                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 1,
                          flexWrap: 'wrap',
                        }}
                      >
                        <QuantitySelector
                          quantity={product.quantity}
                          max={isPreOrderRow ? (product.upcoming_stock || Infinity) : (product.pre_order && (product.stock ?? 0) <= 0 ? (product.upcoming_stock || Infinity) : product.stock)}
                          step={getPackStep(product.name)}
                          onChange={(newQuantity) =>
                            handleQuantityChange(productId, newQuantity, isPreOrderRow)
                          }
                          disabled={isDisabled}
                        />
                        <Typography
                          sx={{
                            fontWeight: 700,
                            color: 'success.main',
                            fontSize: '0.95rem',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          ₹{itemTotal.toLocaleString()}
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
        <Box>
          <Divider sx={{ borderColor: 'primary.light', borderWidth: 1 }} />
          <Paper
            elevation={4}
            sx={{
              p: { xs: 1.5, sm: 2 },
              borderRadius: 0,
              bgcolor: 'background.paper',
              width: '100%',
            }}
          >
              {/* Price Summary */}
              <Box
                sx={{
                  mb: 1.5,
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'action.hover',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 1,
                    pb: 1,
                    borderBottom: '1px dashed',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant='caption' sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    GST ({customer?.cf_in_ex || 'Exclusive'})
                  </Typography>
                  <Typography variant='body2' sx={{ fontWeight: 600, color: 'text.primary', fontVariantNumeric: 'tabular-nums' }}>
                    ₹{totals.totalGST.toLocaleString()}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography variant='subtitle2' sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Total
                  </Typography>
                  <Typography variant='h6' sx={{ fontWeight: 800, color: 'success.main', fontVariantNumeric: 'tabular-nums' }}>
                    ₹{totals.totalAmount.toLocaleString()}
                  </Typography>
                </Box>
              </Box>

              {/* Checkout Button */}
              <Button
                variant='contained'
                color='primary'
                fullWidth
                size='large'
                sx={{
                  py: { xs: 1.1, sm: 1.25 },
                  fontWeight: 700,
                  fontSize: { xs: '0.9rem', sm: '0.95rem' },
                  borderRadius: 2.5,
                  textTransform: 'none',
                  boxShadow: 2,
                  transition: 'box-shadow 0.2s ease',
                  '&:hover': {
                    boxShadow: 4,
                  },
                  '&:disabled': {
                    background: 'grey.300',
                    color: 'grey.500',
                  },
                }}
                onClick={onCheckout}
                disabled={selectedProducts.length === 0 || isDisabled}
                endIcon={<ArrowForward />}
              >
                Proceed to Review
              </Button>
            </Paper>
          </Box>
      )}

      {/* Clear Cart Confirmation Dialog */}
      <Dialog
        open={confirmModalOpen}
        onClose={handleCloseConfirmModal}
        aria-labelledby="clear-cart-dialog-title"
        aria-describedby="clear-cart-dialog-description"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="clear-cart-dialog-title">Clear Cart</DialogTitle>
        <DialogContent>
          <DialogContentText id="clear-cart-dialog-description">
            Are you sure you want to clear all items from the cart? This
            action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={handleCloseConfirmModal}
            variant="outlined"
            sx={{
              textTransform: "none",
              fontWeight: "bold",
              borderRadius: "24px",
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmClear}
            variant="contained"
            color="error"
            sx={{
              textTransform: "none",
              fontWeight: "bold",
              borderRadius: "24px",
            }}
            autoFocus
          >
            Clear Cart
          </Button>
        </DialogActions>
      </Dialog>
    </Drawer>
  );
};

export default CartDrawer;
