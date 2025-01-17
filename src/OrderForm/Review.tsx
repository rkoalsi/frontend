import { useRef, useState } from 'react';
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
  products: any;
  setSelectedProducts: any;
  totals: any;
  updateOrder: any;
  setActiveStep: any;
  isShared: any;
}

function Review(props: Props) {
  const {
    customer,
    shippingAddress,
    billingAddress,
    products,
    setSelectedProducts,
    totals,
    updateOrder,
    setActiveStep,
    isShared,
  } = props;
  const [openImagePopup, setOpenImagePopup] = useState(false);
  const [popupImageSrc, setPopupImageSrc] = useState('');
  if (!customer) {
    return <Typography>This is content for Review</Typography>;
  }
  const componentRef = useRef<HTMLDivElement>(null);
  const downloadAsPDF = async () => {
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

      pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight); // Center the image with margins
      pdf.save('Order_Review.pdf');
    }
  };
  const calculateLocalTotals = (products: any) => {
    return products.reduce(
      (acc: any, product: any) => {
        const taxPercentage =
          product?.item_tax_preferences?.[0]?.tax_percentage || 0;
        const rate = product?.rate || 0;
        const quantity = product?.quantity || 1;
        const margin = parseInt(customer?.cf_margin || '40') / 100; // Default to 40% if not defined

        // Calculate Selling Price
        const sellingPrice = rate - rate * margin;

        let gstAmount = 0;
        let totalAmount = 0;

        if (customer?.cf_in_ex === 'Inclusive') {
          const basePrice = sellingPrice / (1 + taxPercentage / 100);
          gstAmount = (sellingPrice - basePrice) * quantity;
          totalAmount = sellingPrice * quantity;
        } else {
          gstAmount = sellingPrice * (taxPercentage / 100) * quantity;
          totalAmount =
            (sellingPrice + sellingPrice * (taxPercentage / 100)) * quantity;
        }
        totalAmount =
          totalAmount % 1 === 0.5
            ? Math.ceil(totalAmount)
            : Math.floor(totalAmount);
        acc.totalGST += gstAmount;
        acc.totalAmount += totalAmount;

        return acc;
      },
      { totalGST: 0, totalAmount: 0 }
    );
  };
  const handleQuantityChange = async (id: string, newQuantity: number) => {
    const updatedProducts = products.map((product: any) => {
      if (product._id === id) {
        return {
          ...product,
          quantity: Math.max(1, Math.min(newQuantity, product.stock)),
        };
      }
      return product;
    });

    setSelectedProducts(updatedProducts); // Update state locally
    const totals = calculateLocalTotals(updatedProducts); // Recalculate totals

    await updateOrder({
      products: updatedProducts,
      total_gst: parseFloat(totals.totalGST.toFixed(2)),
      total_amount: parseFloat(totals.totalAmount.toFixed(2)),
    });
  };
  const handleRemoveProduct = async (id: string) => {
    const updatedProducts = products.filter(
      (product: any) => product._id !== id
    );

    setSelectedProducts(updatedProducts); // Update state locally
    const totals = calculateLocalTotals(updatedProducts); // Recalculate totals

    await updateOrder({
      products: updatedProducts,
      total_gst: parseFloat(totals.totalGST.toFixed(2)),
      total_amount: parseFloat(totals.totalAmount.toFixed(2)),
    });
  };
  const handleImageClick = (src: any) => {
    setPopupImageSrc(src);
    setOpenImagePopup(true);
  };

  const handleClosePopup = () => {
    setOpenImagePopup(false);
  };
  return (
    <Box sx={{ p: 3 }}>
      {/* Customer Information */}
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='flex-start'
        mb={'8px'}
      >
        <Typography variant='h6' sx={{ mb: 1 }}>
          Review
        </Typography>
        <Button variant='contained' color='primary' onClick={downloadAsPDF}>
          Download as PDF
        </Button>
      </Box>
      <Box ref={componentRef}>
        <Paper elevation={3} sx={{ p: 3, mb: 2, borderRadius: 2 }}>
          <Box
            display={'flex'}
            alignContent={'center'}
            justifyContent={'space-between'}
          >
            <Typography variant='h6' fontWeight='bold' gutterBottom>
              Customer Information
            </Typography>
            {!isShared && (
              <Edit onClick={() => setActiveStep(0)} className='no-pdf' />
            )}
          </Box>
          <Typography variant='body1'>
            <strong>Shop Name:</strong> {customer.contact_name}
          </Typography>
          <Typography variant='body1'>
            <strong>Contact Name:</strong> {customer.first_name}{' '}
            {customer.last_name}
          </Typography>
          <Typography variant='body1'>
            <strong>Phone:</strong> {customer.mobile || 'N/A'}
          </Typography>
        </Paper>

        <Divider sx={{ my: 2 }} />

        {/* Address Information */}
        <Stack direction={{ xs: 'row', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
          {/* Billing Address */}
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Box
                display={'flex'}
                alignContent={'center'}
                justifyContent={'space-between'}
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
                display={'flex'}
                alignContent={'center'}
                justifyContent={'space-between'}
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

        {/* Products List */}
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
          <Box
            display={'flex'}
            alignContent={'center'}
            justifyContent={'space-between'}
          >
            <Typography variant='h6' fontWeight='bold' gutterBottom>
              Products
            </Typography>
            <Edit onClick={() => setActiveStep(3)} className='no-pdf' />
          </Box>
          <TableContainer component={Paper} sx={{ overflowY: 'auto', mt: 2 }}>
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
                    <strong>Total</strong> {/* New Total Column */}
                  </TableCell>
                  <TableCell>
                    <strong>Actions</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((product: any, index: number) => {
                  // Calculate selling price
                  const sellingPrice = parseFloat(
                    (
                      product.rate -
                      (parseInt(customer.cf_margin || '40') / 100) *
                        product.rate
                    ).toFixed(2)
                  );

                  // Calculate item-level total
                  const itemTotal = (product.quantity || 1) * sellingPrice;

                  return (
                    <TableRow key={product._id.$oid || index}>
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
                      <TableCell>
                        {product?.item_tax_preferences?.[0]?.tax_percentage ||
                          'N/A'}
                        %
                      </TableCell>
                      <TableCell>₹{product.rate}</TableCell>
                      <TableCell>{customer.cf_margin || '40%'}</TableCell>
                      <TableCell>₹{sellingPrice}</TableCell>
                      <TableCell>{product.stock}</TableCell>
                      <TableCell>
                        <TextField
                          type='number'
                          value={product.quantity || 1}
                          onChange={(e: any) =>
                            handleQuantityChange(
                              product._id.$oid || product._id,
                              parseInt(e.target.value) || 1
                            )
                          }
                          inputProps={{ min: 1, max: product.stock }}
                          size='small'
                          sx={{ width: '60px' }}
                        />
                      </TableCell>
                      <TableCell>
                        ₹{itemTotal.toFixed(2)} {/* New Total Cell */}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant='outlined'
                          color='error'
                          size='small'
                          onClick={() =>
                            handleRemoveProduct(product._id.$oid || product._id)
                          }
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow>
                  <TableCell colSpan={7}>
                    <strong>Total GST:</strong> ₹{totals.totalGST.toFixed(2)}{' '}
                    <strong>({customer.cf_in_ex || 'Exclusive'})</strong>
                  </TableCell>
                  <TableCell colSpan={6}>
                    <strong>Total Amount:</strong> ₹
                    {totals.totalAmount.toFixed(2)}{' '}
                    <strong>(GST {customer.cf_in_ex || 'Exclusive'}) </strong>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
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
}

export default Review;
