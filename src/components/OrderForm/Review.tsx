// Review.tsx
import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Box,
  Divider,
  Typography,
  Paper,
  Stack,
  Card,
  CardContent,
  Button,
  TextField,
  Dialog,
  DialogContent,
  IconButton,
  Grid,
  Badge,
  CardMedia,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { Close, Edit, ExpandMore } from '@mui/icons-material';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import QuantitySelector from './QuantitySelector'; // Adjust the path as necessary

interface Props {
  customer: any;
  shippingAddress: any;
  billingAddress: any;
  products: any[];
  setSelectedProducts: any;
  totals: {
    totalGST: number;
    totalAmount: number;
  };
  specialMargins: { [key: string]: string };
  setActiveStep: (step: number) => void;
  isShared: boolean;
  order: any;
}

const Review: React.FC<Props> = React.memo((props) => {
  const {
    customer,
    shippingAddress,
    billingAddress,
    products,
    setSelectedProducts,
    totals,
    specialMargins,
    setActiveStep,
    isShared,
    order,
  } = props;

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [openImagePopup, setOpenImagePopup] = useState(false);
  const [popupImageSrc, setPopupImageSrc] = useState('');

  // PDF Download Ref & Logic
  const componentRef = useRef<HTMLDivElement>(null);

  const downloadAsPDF = useCallback(async () => {
    if (componentRef.current) {
      // Temporarily hide edit icons
      const editIcons = componentRef.current.querySelectorAll('.no-pdf');
      editIcons.forEach((icon) => {
        (icon as HTMLElement).style.display = 'none';
      });

      const canvas = await html2canvas(componentRef.current, {
        scale: 2, // Higher scale for better quality
        useCORS: true, // Ensures cross-origin images are included
      });

      // Restore edit icons visibility
      editIcons.forEach((icon) => {
        (icon as HTMLElement).style.display = '';
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4', // Use standard A4 size
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pdfWidth - 40; // Add 20px margin on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight);
      pdf.save('Order_Review.pdf');
    }
  }, []);

  // Quantity Change Handler
  const handleQuantityChange = useCallback(
    (id: string, newQuantity: number) => {
      const updatedProducts = products.map((product) => {
        const pid = product._id;

        if (pid === id) {
          return {
            ...product,
            quantity: Math.max(1, Math.min(newQuantity, product.stock)),
          };
        }
        return product;
      });

      setSelectedProducts(updatedProducts);
      // Parent component handles totals and order update via useEffect
    },
    [products, setSelectedProducts]
  );

  // Remove Product Handler
  const handleRemoveProduct = useCallback(
    (id: string) => {
      const updatedProducts = products.filter((product) => {
        const pid = product._id;
        return pid !== id;
      });

      setSelectedProducts(updatedProducts);
      // Parent component handles totals and order update via useEffect
    },
    [products, setSelectedProducts]
  );

  // Image Popup Handlers
  const handleImageClick = useCallback((src: string) => {
    setPopupImageSrc(src);
    setOpenImagePopup(true);
  }, []);

  const handleClosePopup = useCallback(() => {
    setOpenImagePopup(false);
  }, []);

  if (!customer) {
    return <Typography>This is content for Review</Typography>;
  }

  // Helper function to calculate selling price and item total
  const calculatePrices = (product: any) => {
    const productId = product._id;

    // Determine margin
    const marginPercent = specialMargins[productId]
      ? parseInt(specialMargins[productId].replace('%', ''))
      : parseInt(customer?.cf_margin?.replace('%', '') || '40');
    const margin = marginPercent / 100;

    // Calculate selling price
    const sellingPrice = parseFloat(
      (product.rate - product.rate * margin).toFixed(2)
    );

    // Calculate item total
    const quantity = product.quantity || 1;
    const itemTotal = (quantity * sellingPrice).toFixed(2);

    return { sellingPrice, itemTotal, marginPercent };
  };

  return (
    <Box sx={{ p: isMobile ? 0 : 3, flex: 1 }}>
      {/* Header */}
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='flex-start'
        mb={2}
      >
        <Typography variant='h6' sx={{ mb: 1 }}>
          Review
        </Typography>
        <Button variant='contained' color='primary' onClick={downloadAsPDF}>
          Download as PDF
        </Button>
      </Box>

      {/* PDF Content */}
      <Box ref={componentRef}>
        {/* Customer Info */}
        <Paper elevation={3} sx={{ p: 3, mb: 2, borderRadius: 2 }}>
          <Box
            display='flex'
            alignItems='center'
            justifyContent='space-between'
          >
            <Typography variant='h6' fontWeight='bold' gutterBottom>
              Customer Information
            </Typography>
            {!isShared && (
              <Edit
                onClick={() => setActiveStep(0)}
                className='no-pdf'
                sx={{ cursor: 'pointer' }}
              />
            )}
          </Box>
          <Typography variant='body1'>
            <strong>Shop Name:</strong> {customer?.contact_name}
          </Typography>
          <Typography variant='body1'>
            <strong>Contact Name:</strong> {customer?.first_name}{' '}
            {customer?.last_name}
          </Typography>
          <Typography variant='body1'>
            <strong>Phone:</strong>{' '}
            {customer?.mobile || customer?.phone || 'N/A'}
          </Typography>
        </Paper>

        <Divider sx={{ my: 2 }} />

        {/* Addresses */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ mb: 2 }}
        >
          {/* Billing Address */}
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Box
                display='flex'
                alignItems='center'
                justifyContent='space-between'
              >
                <Typography variant='h6' fontWeight='bold' gutterBottom>
                  Billing Address
                </Typography>
                {!isShared && (
                  <Edit
                    onClick={() => setActiveStep(1)}
                    className='no-pdf'
                    sx={{ cursor: 'pointer' }}
                  />
                )}
              </Box>
              <Typography variant='body2'>{billingAddress?.address}</Typography>
              <Typography variant='body2'>{billingAddress?.city}</Typography>
              <Typography variant='body2'>{billingAddress?.state}</Typography>
              <Typography variant='body2'>{billingAddress?.zip}</Typography>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Box
                display='flex'
                alignItems='center'
                justifyContent='space-between'
              >
                <Typography variant='h6' fontWeight='bold' gutterBottom>
                  Shipping Address
                </Typography>
                {!isShared && (
                  <Edit
                    onClick={() => setActiveStep(2)}
                    className='no-pdf'
                    sx={{ cursor: 'pointer' }}
                  />
                )}
              </Box>
              <Typography variant='body2'>
                {shippingAddress?.address}
              </Typography>
              <Typography variant='body2'>{shippingAddress?.city}</Typography>
              <Typography variant='body2'>{shippingAddress?.state}</Typography>
              <Typography variant='body2'>{shippingAddress?.zip}</Typography>
            </CardContent>
          </Card>
        </Stack>

        <Divider sx={{ my: 2 }} />

        {/* Products */}
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
          <Box
            display='flex'
            alignItems='center'
            justifyContent={'space-between'}
          >
            <Typography variant='h6' fontWeight='bold' gutterBottom>
              Products
            </Typography>
            {!isShared && (
              <Edit
                onClick={() => setActiveStep(3)}
                className='no-pdf'
                sx={{ cursor: 'pointer' }}
              />
            )}
          </Box>

          {/* Responsive Products Display */}
          {!isMobile ? (
            // Desktop/Grid View
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                {products.length > 0 ? (
                  products.map((product, index) => {
                    const isActive = product.status === 'active';
                    const productId = product._id;

                    const { sellingPrice, itemTotal, marginPercent } =
                      calculatePrices(product);

                    return (
                      <Grid item xs={12} key={productId}>
                        <Card
                          sx={{
                            display: 'flex',
                            p: 2,
                            backgroundColor: !isActive ? '#f0f0f0' : 'inherit',
                            opacity: !isActive ? 0.7 : 1,
                          }}
                        >
                          {/* Image Section */}
                          <Box sx={{ mr: 2 }}>
                            <Badge
                              badgeContent={product.new ? 'New' : undefined}
                              color='secondary'
                              overlap='rectangular'
                              anchorOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                              }}
                            >
                              <CardMedia
                                component='img'
                                image={product.image_url || '/placeholder.png'}
                                alt={product.name}
                                sx={{
                                  width: 100,
                                  height: 100,
                                  objectFit: 'cover',
                                  cursor: 'pointer',
                                }}
                                onClick={() =>
                                  handleImageClick(
                                    product.image_url || '/placeholder.png'
                                  )
                                }
                              />
                            </Badge>
                          </Box>

                          {/* Details Section */}
                          <Box sx={{ flex: 1 }}>
                            <Box
                              display='flex'
                              justifyContent='space-between'
                              alignItems='center'
                            >
                              <Typography variant='h6'>
                                {product.name}
                              </Typography>
                              <Tooltip title='Remove Product'>
                                <Button
                                  variant='outlined'
                                  color='error'
                                  size='small'
                                  disabled={
                                    order?.status
                                      ?.toLowerCase()
                                      ?.includes('accepted') ||
                                    order?.status
                                      ?.toLowerCase()
                                      ?.includes('declined')
                                  }
                                  onClick={() => handleRemoveProduct(productId)}
                                >
                                  Remove
                                </Button>
                              </Tooltip>
                            </Box>

                            {/* Basic Info */}
                            <Typography variant='body2' color='textSecondary'>
                              <strong>Brand:</strong> {product.brand}
                            </Typography>
                            <Typography variant='body2' color='textSecondary'>
                              <strong>SKU:</strong> {product.cf_sku_code || '-'}
                            </Typography>
                            <Typography variant='body2' color='textSecondary'>
                              <strong>Category:</strong> {product.category}
                            </Typography>
                            <Typography variant='body2' color='textSecondary'>
                              <strong>Sub Category:</strong>{' '}
                              {product.sub_category || '-'}
                            </Typography>

                            {/* Additional Info in Accordion */}
                            <Accordion>
                              <AccordionSummary
                                expandIcon={<ExpandMore />}
                                aria-controls={`panel-content-${productId}`}
                                id={`panel-header-${productId}`}
                              >
                                <Typography>More Details</Typography>
                              </AccordionSummary>
                              <AccordionDetails>
                                <Typography
                                  variant='body2'
                                  color='textSecondary'
                                >
                                  <strong>Series:</strong>{' '}
                                  {product.series || '-'}
                                </Typography>
                                <Typography
                                  variant='body2'
                                  color='textSecondary'
                                >
                                  <strong>GST:</strong>{' '}
                                  {product?.item_tax_preferences?.[0]
                                    ?.tax_percentage || 'N/A'}
                                  %
                                </Typography>
                                <Typography
                                  variant='body2'
                                  color='textSecondary'
                                >
                                  <strong>MRP:</strong> ₹{product.rate}
                                </Typography>
                                <Typography
                                  variant='body2'
                                  color='textSecondary'
                                >
                                  <strong>Margin:</strong> {marginPercent}%
                                </Typography>
                                <Typography
                                  variant='body2'
                                  color='textSecondary'
                                >
                                  <strong>Selling Price:</strong> ₹
                                  {sellingPrice}
                                </Typography>
                                <Typography
                                  variant='body2'
                                  color='textSecondary'
                                >
                                  <strong>Stock:</strong> {product.stock}
                                </Typography>
                              </AccordionDetails>
                            </Accordion>

                            {/* Quantity and Total */}
                            <Box
                              display='flex'
                              alignItems='center'
                              justifyContent='space-between'
                              mt={2}
                            >
                              <QuantitySelector
                                quantity={product.quantity || 1}
                                max={product.stock}
                                onChange={(newQuantity) =>
                                  handleQuantityChange(productId, newQuantity)
                                }
                                disabled={
                                  !isActive ||
                                  order?.status
                                    ?.toLowerCase()
                                    ?.includes('accepted') ||
                                  order?.status
                                    ?.toLowerCase()
                                    ?.includes('declined')
                                }
                              />
                              <Typography variant='body1'>
                                <strong>Total:</strong> ₹{itemTotal}
                              </Typography>
                            </Box>
                          </Box>
                        </Card>
                      </Grid>
                    );
                  })
                ) : (
                  <Grid item xs={12}>
                    <Typography variant='body1' align='center'>
                      {products.length > 0
                        ? 'Loading products...'
                        : 'No products found.'}
                    </Typography>
                  </Grid>
                )}
              </Grid>

              {/* Totals Section */}
              {products.length > 0 && (
                <Box mt={4}>
                  <Paper elevation={3} sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant='h6' gutterBottom>
                      Total
                    </Typography>
                    <Typography variant='body1'>
                      <strong>Total GST:</strong> ₹{totals.totalGST.toFixed(2)}{' '}
                      <strong>({customer?.cf_in_ex || 'Exclusive'})</strong>
                    </Typography>
                    <Typography variant='body1'>
                      <strong>Total Amount:</strong> ₹
                      {totals.totalAmount.toFixed(2)}{' '}
                      <strong>(GST {customer?.cf_in_ex || 'Exclusive'})</strong>
                    </Typography>
                  </Paper>
                </Box>
              )}
            </Box>
          ) : (
            // Mobile/Card View
            <Box>
              {products.length > 0 ? (
                <Grid container spacing={2}>
                  {products.map((product, index) => {
                    const isActive = product.status === 'active';
                    const productId = product._id;
                    const { sellingPrice, itemTotal, marginPercent } =
                      calculatePrices(product);

                    return (
                      <Grid item xs={12} key={productId}>
                        <Card
                          sx={{
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {/* Image Section */}
                          <Box>
                            <Badge
                              badgeContent={product.new ? 'New' : undefined}
                              color='secondary'
                              overlap='rectangular'
                              anchorOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                              }}
                            >
                              <CardMedia
                                component='img'
                                image={product.image_url || '/placeholder.png'}
                                alt={product.name}
                                sx={{
                                  width: '100%',
                                  height: '200px',
                                  objectFit: 'cover',
                                  cursor: 'pointer',
                                }}
                                onClick={() =>
                                  handleImageClick(
                                    product.image_url || '/placeholder.png'
                                  )
                                }
                              />
                            </Badge>
                          </Box>
                          {/* Details Section */}
                          <CardContent>
                            <Box
                              display='flex'
                              justifyContent='space-between'
                              alignItems='center'
                            >
                              <Typography variant='h6' gutterBottom>
                                {product.name}
                              </Typography>
                            </Box>
                            <Typography variant='body2' color='textSecondary'>
                              <strong>Sub Category:</strong>{' '}
                              {product.sub_category || '-'}
                            </Typography>
                            <Typography variant='body2' color='textSecondary'>
                              <strong>Series:</strong> {product.series || '-'}
                            </Typography>
                            <Typography variant='body2' color='textSecondary'>
                              <strong>SKU:</strong> {product.cf_sku_code || '-'}
                            </Typography>
                            <Typography variant='body2' color='textSecondary'>
                              <strong>Price:</strong> ₹{product.rate}
                            </Typography>
                            <Typography variant='body2' color='textSecondary'>
                              <strong>Stock:</strong> {product.stock}
                            </Typography>
                            <Typography variant='body2' color='textSecondary'>
                              <strong>Margin:</strong> {marginPercent}%
                            </Typography>
                            <Typography variant='body2' color='textSecondary'>
                              <strong>Selling Price:</strong> ₹{sellingPrice}
                            </Typography>

                            {/* Quantity Selector */}
                            <Box mt={1}>
                              <QuantitySelector
                                quantity={product.quantity || 1}
                                max={product.stock}
                                onChange={(newQuantity) =>
                                  handleQuantityChange(productId, newQuantity)
                                }
                                disabled={
                                  !isActive ||
                                  order?.status
                                    ?.toLowerCase()
                                    ?.includes('accepted') ||
                                  order?.status
                                    ?.toLowerCase()
                                    ?.includes('declined')
                                }
                              />
                              {product.quantity > product.stock && (
                                <Typography variant='caption' color='error'>
                                  Exceeds stock!
                                </Typography>
                              )}
                            </Box>

                            {/* Item Total */}
                            {isActive && (
                              <Typography variant='body2' mt={1}>
                                <strong>Total:</strong> ₹{itemTotal}
                              </Typography>
                            )}

                            {/* Action Button */}
                            <Box mt={1}>
                              <Button
                                variant='outlined'
                                color='error'
                                size='small'
                                disabled={
                                  order?.status
                                    ?.toLowerCase()
                                    ?.includes('accepted') ||
                                  order?.status
                                    ?.toLowerCase()
                                    ?.includes('declined')
                                }
                                onClick={() => handleRemoveProduct(productId)}
                                fullWidth
                              >
                                Remove
                              </Button>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              ) : (
                <Box mt={2}>
                  <Typography variant='body1' align='center'>
                    {products.length > 0
                      ? 'Loading products...'
                      : 'No products found.'}
                  </Typography>
                </Box>
              )}

              {/* Totals Section */}
              <Box mt={2}>
                <Paper elevation={3} sx={{ p: 2, borderRadius: 2 }}>
                  <Typography variant='h6' gutterBottom>
                    Totals
                  </Typography>
                  <Typography variant='body1'>
                    <strong>Total GST:</strong> ₹{totals.totalGST.toFixed(2)}{' '}
                    <strong>({customer?.cf_in_ex || 'Exclusive'})</strong>
                  </Typography>
                  <Typography variant='body1'>
                    <strong>Total Amount:</strong> ₹
                    {totals.totalAmount.toFixed(2)}{' '}
                    <strong>(GST {customer?.cf_in_ex || 'Exclusive'})</strong>
                  </Typography>
                </Paper>
              </Box>
            </Box>
          )}
        </Paper>

        {/* Image Popup */}
        <Dialog
          open={openImagePopup}
          onClose={handleClosePopup}
          sx={{ zIndex: 1300 }}
        >
          <DialogContent
            sx={{
              position: 'relative',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
            }}
          >
            <IconButton
              onClick={handleClosePopup}
              sx={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                color: 'white',
                zIndex: 1400,
              }}
            >
              <Close />
            </IconButton>
            <img
              src={popupImageSrc}
              alt='Full screen'
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
              }}
            />
          </DialogContent>
        </Dialog>
      </Box>
    </Box>
  );
});

export default Review;
