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
  DeleteOutline,
} from '@mui/icons-material';
import QuantitySelector from '../QuantitySelector';

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
          padding: { xs: 2, sm: 2.5 },
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2px solid',
          borderColor: 'primary.main',
          bgcolor: 'background.paper',
          boxShadow: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ShoppingCartOutlined
            sx={{
              fontSize: 28,
              color: 'primary.main',
            }}
          />
            <Typography
              variant='h5'
              sx={{
                fontWeight: 700,
                color: 'text.primary',
                letterSpacing: '-0.5px',
              }}
            >
              Your Cart
            </Typography>
            {selectedProducts.length > 0 && (
              <Chip
                label={selectedProducts.length}
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
                <DeleteOutline />
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
              fontSize: 80,
              color: 'text.disabled',
              mb: 3,
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
            p: { xs: 2, sm: 2.5 },
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
          <Stack spacing={2.5} sx={{ width: '100%', maxWidth: '100%' }}>
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
                    p: { xs: 2, sm: 2.5 },
                    borderRadius: 3,
                    border: '2px solid',
                    borderColor: 'divider',
                    transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
                    width: '100%',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    position: 'relative',
                    bgcolor: 'background.paper',
                    '&:hover': {
                      boxShadow: 2,
                      borderColor: 'primary.light',
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '4px',
                      height: '100%',
                      bgcolor: 'primary.main',
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
                      {/* Product Image */}
                      <Box
                        sx={{
                          width: isMobile ? '100%' : 100,
                          height: isMobile ? 200 : 100,
                          flexShrink: 0,
                          borderRadius: 2,
                          overflow: 'hidden',
                          border: '2px solid',
                          borderColor: 'grey.200',
                          bgcolor: 'grey.50',
                          position: 'relative',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer',
                          '&:hover': {
                            transform: 'scale(1.05)',
                            borderColor: 'primary.main',
                            boxShadow: 3,
                          },
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
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            padding: '8px',
                          }}
                        />
                      </Box>

                      {/* Product Details */}
                      <Box
                        sx={{
                          flex: 1,
                          width: isMobile ? '100%' : 'auto',
                          minWidth: 0,
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        {/* Product Name & Remove Button */}
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            mb: 1.5,
                            gap: 1,
                          }}
                        >
                          <Typography
                            variant='subtitle1'
                            sx={{
                              fontWeight: 700,
                              lineHeight: 1.3,
                              color: 'text.primary',
                              flex: 1,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              fontSize: { xs: '0.95rem', sm: '1rem' },
                            }}
                          >
                            {product.name}
                          </Typography>

                          <IconButton
                            size='small'
                            onClick={() => handleRemoveProduct(productId)}
                            aria-label={`Remove ${product.name} from cart`}
                            sx={{
                              p: 0.75,
                              bgcolor: 'error.lighter',
                              color: 'error.main',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                bgcolor: 'error.main',
                                color: 'error.contrastText',
                                transform: 'scale(1.1) rotate(10deg)',
                              },
                            }}
                          >
                            <RemoveShoppingCart fontSize='small' />
                          </IconButton>
                        </Box>

                        {/* Price Badge */}
                        <Box sx={{ mb: 2 }}>
                          <Chip
                            icon={<LocalOffer sx={{ fontSize: 16 }} />}
                            label={`₹${sellingPrice.toFixed(2)}`}
                            size='small'
                            sx={{
                              bgcolor: 'info.lighter',
                              color: 'info.main',
                              fontWeight: 600,
                              fontSize: '0.85rem',
                              height: 28,
                              '& .MuiChip-icon': {
                                color: 'info.main',
                              },
                            }}
                          />
                        </Box>

                        <Divider sx={{ mb: 2 }} />

                        {/* Quantity & Total */}
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexDirection: isMobile ? 'column' : 'row',
                            gap: 2,
                          }}
                        >
                          <Box sx={{ width: isMobile ? '100%' : 'auto' }}>
                            <Typography
                              variant='caption'
                              color='text.secondary'
                              sx={{
                                textTransform: 'uppercase',
                                fontWeight: 600,
                                letterSpacing: '0.5px',
                                display: 'block',
                                mb: 0.5,
                              }}
                            >
                              Quantity
                            </Typography>
                            <QuantitySelector
                              quantity={product.quantity}
                              max={product.stock}
                              onChange={(newQuantity) =>
                                handleQuantityChange(productId, newQuantity)
                              }
                              disabled={isDisabled}
                            />
                          </Box>

                          <Box
                            sx={{
                              textAlign: isMobile ? 'right' : 'center',
                              width: isMobile ? '100%' : 'auto',
                            }}
                          >
                            <Typography
                              variant='caption'
                              color='text.secondary'
                              sx={{
                                textTransform: 'uppercase',
                                fontWeight: 600,
                                letterSpacing: '0.5px',
                                display: 'block',
                                mb: 0.5,
                              }}
                            >
                              Subtotal
                            </Typography>
                            <Typography
                              variant='h6'
                              sx={{
                                fontWeight: 700,
                                color: 'success.main',
                                fontSize: { xs: '1.15rem', sm: '1.25rem' },
                              }}
                            >
                              ₹{itemTotal.toLocaleString()}
                            </Typography>
                          </Box>
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
              p: { xs: 2.5, sm: 3 },
              borderRadius: 0,
              bgcolor: 'background.paper',
              width: '100%',
            }}
          >
              {/* Price Summary */}
              <Box
                sx={{
                  mb: 2.5,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'grey.50',
                  border: '1px solid',
                  borderColor: 'grey.200',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 1.5,
                    pb: 1.5,
                    borderBottom: '1px dashed',
                    borderColor: 'grey.300',
                  }}
                >
                  <Typography
                    variant='body2'
                    sx={{
                      fontWeight: 600,
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    GST ({customer?.cf_in_ex || 'Exclusive'})
                  </Typography>
                  <Typography
                    variant='body1'
                    sx={{ fontWeight: 600, color: 'text.primary' }}
                  >
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
                  <Typography
                    variant='h6'
                    sx={{
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Total Amount
                  </Typography>
                  <Typography
                    variant='h5'
                    sx={{
                      fontWeight: 800,
                      color: 'success.main',
                    }}
                  >
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
                  py: { xs: 1.5, sm: 1.8 },
                  fontWeight: 700,
                  fontSize: { xs: '1rem', sm: '1.1rem' },
                  borderRadius: 3,
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
