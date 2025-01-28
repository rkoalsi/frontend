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
  TableContainer,
  TableHead,
  TableBody,
  TableCell,
  Table,
  TableRow,
  Button,
  TextField,
  Dialog,
  DialogContent,
  IconButton,
} from '@mui/material';
import { Close, Edit } from '@mui/icons-material';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
        const pid =
          typeof product._id === 'string' ? product._id : product._id?.$oid;

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
        const pid =
          typeof product._id === 'string' ? product._id : product._id?.$oid;
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

  return (
    <Box sx={{ p: 3, flex: 1 }}>
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
              <Edit onClick={() => setActiveStep(0)} className='no-pdf' />
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
                  <Edit onClick={() => setActiveStep(2)} className='no-pdf' />
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
                  <Edit onClick={() => setActiveStep(1)} className='no-pdf' />
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
            justifyContent='space-between'
          >
            <Typography variant='h6' fontWeight='bold' gutterBottom>
              Products
            </Typography>
            <Edit onClick={() => setActiveStep(3)} className='no-pdf' />
          </Box>

          <TableContainer component={Paper} sx={{ overflowX: 'auto', mt: 2 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>S No.</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Image</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Brand</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Product Code</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Name</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Category</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Sub Category</strong>
                  </TableCell>
                  <TableCell>
                    <strong>GST</strong>
                  </TableCell>
                  <TableCell>
                    <strong>MRP</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Margin</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Selling Price</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Stock</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Quantity</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Total</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Actions</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((product, index) => {
                  const isActive = product.status === 'active';
                  const productId =
                    typeof product._id === 'string'
                      ? product._id
                      : product._id?.$oid;

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

                  return (
                    <TableRow
                      key={productId || index}
                      sx={{
                        backgroundColor: !isActive ? '#f0f0f0' : 'inherit',
                        opacity: !isActive ? 0.7 : 1,
                      }}
                    >
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <img
                          src={product.image_url || '/placeholder.png'}
                          alt={product.name}
                          style={{
                            width: '80px',
                            height: '80px',
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
                      </TableCell>
                      <TableCell>{product.brand}</TableCell>
                      <TableCell>{product.cf_sku_code}</TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>{product.sub_category}</TableCell>
                      <TableCell>
                        {product?.item_tax_preferences?.[0]?.tax_percentage ||
                          'N/A'}
                        %
                      </TableCell>
                      <TableCell>₹{product.rate}</TableCell>
                      <TableCell>
                        {specialMargins[productId] ||
                          customer?.cf_margin ||
                          '40%'}
                      </TableCell>
                      <TableCell>₹{sellingPrice}</TableCell>
                      <TableCell>{product.stock}</TableCell>
                      <TableCell>
                        <TextField
                          type='number'
                          value={product.quantity || 1}
                          onChange={(e) =>
                            handleQuantityChange(
                              productId,
                              parseInt(e.target.value) || 1
                            )
                          }
                          inputProps={{ min: 1, max: product.stock }}
                          size='small'
                          sx={{ width: '70px' }}
                          disabled={
                            !isActive ||
                            order?.status
                              ?.toLowerCase()
                              ?.includes('accepted') ||
                            order?.status?.toLowerCase()?.includes('declined')
                          }
                        />
                      </TableCell>
                      <TableCell>₹{itemTotal}</TableCell>
                      <TableCell>
                        <Button
                          variant='outlined'
                          color='error'
                          size='small'
                          disabled={
                            order?.status
                              ?.toLowerCase()
                              ?.includes('accepted') ||
                            order?.status?.toLowerCase()?.includes('declined')
                          }
                          onClick={() => handleRemoveProduct(productId)}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {/* Totals Row */}
                <TableRow>
                  <TableCell colSpan={7}>
                    <strong>Total GST:</strong> ₹{totals.totalGST.toFixed(2)}{' '}
                    <strong>({customer?.cf_in_ex || 'Exclusive'})</strong>
                  </TableCell>
                  <TableCell colSpan={6}>
                    <strong>Total Amount:</strong> ₹
                    {totals.totalAmount.toFixed(2)}{' '}
                    <strong>(GST {customer?.cf_in_ex || 'Exclusive'})</strong>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
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
