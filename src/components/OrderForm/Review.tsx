import { useRef, useState, useEffect } from 'react';
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
import axios from 'axios';

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
  order: any;
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
    order,
  } = props;

  const [openImagePopup, setOpenImagePopup] = useState(false);
  const [popupImageSrc, setPopupImageSrc] = useState('');

  // ------------------ NEW: specialMargins State ---------------------
  /**
   * Will store data like:
   *   {
   *     "abc123": "45%",   // product_id => margin string
   *     "xyz789": "50%"
   *   }
   */
  const [specialMargins, setSpecialMargins] = useState<{
    [key: string]: string;
  }>({});

  // ------------------ FETCH SPECIAL MARGINS -------------------------
  /**
   * Once we know the customer's _id, fetch the special margins from your API.
   * Adjust the endpoint/response to match your backend.
   */
  useEffect(() => {
    if (!customer?._id) return;

    const fetchSpecialMargins = async () => {
      try {
        const baseApiUrl = process.env.api_url;
        const res = await axios.get(
          `${baseApiUrl}/admin/customer/special_margins/${customer._id}`
        );
        // Suppose it returns: { products: [ { product_id: 'abc123', margin: '45%' }, ... ] }
        const productList = res.data.products || [];

        // Transform the array into a dictionary for easy lookup
        const marginMap: { [key: string]: string } = {};
        productList.forEach((item: any) => {
          marginMap[item.product_id] = item.margin; // e.g. "45%"
        });

        setSpecialMargins(marginMap);
      } catch (error) {
        console.error('Error fetching special margins:', error);
      }
    };

    fetchSpecialMargins();
  }, [customer]);

  // ------------------ PDF Download Ref & Logic -----------------------
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

      pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight);
      pdf.save('Order_Review.pdf');
    }
  };

  // ------------------ Recalculate Totals w/ Special Margins ----------
  const calculateLocalTotals = (products: any) => {
    const totals = products.reduce(
      (acc: any, product: any) => {
        const taxPercentage =
          product?.item_tax_preferences?.[0]?.tax_percentage || 0;
        const rate = parseFloat(product.rate.toString()) || 0;
        const quantity = parseInt(product.quantity.toString()) || 1;

        // 1) Check if there's a special margin for this product
        let margin = 0.4; // default 40%
        const productId =
          typeof product._id === 'string' ? product._id : product._id.$oid;

        if (specialMargins[productId]) {
          margin = parseInt(specialMargins[productId].replace('%', '')) / 100;
        } else {
          // fallback to customer's margin (e.g. "40%")
          margin =
            parseInt(customer?.cf_margin?.replace('%', '') || '40') / 100;
        }

        // 2) Calculate Selling Price based on margin
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

        // Accumulate without rounding
        acc.totalGST += gstAmount;
        acc.totalAmount += totalAmount;
        return acc;
      },
      { totalGST: 0, totalAmount: 0 }
    );

    // Apply rounding once at the end
    const roundedTotalGST = Math.round(totals.totalGST * 100) / 100; // Round to 2 decimals
    const roundedTotalAmount =
      totals.totalAmount % 1 >= 0.5
        ? Math.ceil(totals.totalAmount) // Round up if decimal >= 0.5
        : Math.floor(totals.totalAmount); // Round down otherwise

    return { totalGST: roundedTotalGST, totalAmount: roundedTotalAmount };
  };

  // ------------------ Quantity Change & Remove Product ---------------
  const handleQuantityChange = async (id: string, newQuantity: number) => {
    const updatedProducts = products.map((product: any) => {
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

    setSelectedProducts(updatedProducts); // Update state locally
    const localTotals = calculateLocalTotals(updatedProducts);

    await updateOrder({
      products: updatedProducts,
      total_gst: parseFloat(localTotals.totalGST.toFixed(2)),
      total_amount: parseFloat(localTotals.totalAmount.toFixed(2)),
    });
  };

  const handleRemoveProduct = async (id: string) => {
    const updatedProducts = products.filter((product: any) => {
      const pid =
        typeof product._id === 'string' ? product._id : product._id?.$oid;
      return pid !== id;
    });

    setSelectedProducts(updatedProducts);
    const localTotals = calculateLocalTotals(updatedProducts);

    await updateOrder({
      products: updatedProducts,
      total_gst: parseFloat(localTotals.totalGST.toFixed(2)),
      total_amount: parseFloat(localTotals.totalAmount.toFixed(2)),
    });
  };

  // ------------------ Image Popup -----------------------------------
  const handleImageClick = (src: any) => {
    setPopupImageSrc(src);
    setOpenImagePopup(true);
  };
  const handleClosePopup = () => {
    setOpenImagePopup(false);
  };

  if (!customer) {
    return <Typography>This is content for Review</Typography>;
  }

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
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

      {/* PDF Content */}
      <Box ref={componentRef}>
        {/* Customer Info */}
        <Paper elevation={3} sx={{ p: 3, mb: 2, borderRadius: 2 }}>
          <Box
            display='flex'
            alignContent='center'
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

        {/* Addresses */}
        <Stack direction={{ xs: 'row', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
          {/* Billing Address */}
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Box
                display='flex'
                alignContent='center'
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
                alignContent='center'
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
            alignContent='center'
            justifyContent='space-between'
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
                    <strong>Total</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Actions</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((product: any, index: number) => {
                  const isActive = product.status === 'active';

                  // Convert _id to string
                  const productId =
                    typeof product._id === 'string'
                      ? product._id
                      : product._id?.$oid;

                  // 1) If special margin exists, use it; otherwise fallback
                  let marginPercent = 40; // default
                  if (specialMargins[productId]) {
                    marginPercent = parseInt(
                      specialMargins[productId].replace('%', '')
                    );
                  } else if (customer.cf_margin) {
                    marginPercent = parseInt(
                      customer.cf_margin.replace('%', '') || '40'
                    );
                  }
                  const margin = marginPercent / 100;

                  // 2) Calculate selling price
                  const sellingPrice = parseFloat(
                    (product.rate - product.rate * margin).toFixed(2)
                  );

                  // 3) Item-level total
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
                      <TableCell>
                        {product?.item_tax_preferences?.[0]?.tax_percentage ||
                          'N/A'}
                        %
                      </TableCell>
                      <TableCell>₹{product.rate}</TableCell>

                      {/* Show special margin or fallback margin */}
                      <TableCell>
                        {specialMargins[productId]
                          ? specialMargins[productId]
                          : customer.cf_margin || '40%'}
                      </TableCell>

                      <TableCell>₹{sellingPrice}</TableCell>
                      <TableCell>{product.stock}</TableCell>

                      {/* Quantity */}
                      <TableCell>
                        <TextField
                          type='number'
                          value={product.quantity || 1}
                          onChange={(e: any) =>
                            handleQuantityChange(
                              productId,
                              parseInt(e.target.value) || 1
                            )
                          }
                          inputProps={{ min: 1, max: product.stock }}
                          size='small'
                          sx={{ width: '60px' }}
                          disabled={
                            !isActive ||
                            order?.status
                              ?.toLowerCase()
                              ?.includes('accepted') ||
                            order?.status?.toLowerCase()?.includes('declined')
                          }
                        />
                      </TableCell>

                      {/* Item total */}
                      <TableCell>₹{itemTotal}</TableCell>

                      {/* Remove button */}
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
                    <strong>({customer.cf_in_ex || 'Exclusive'})</strong>
                  </TableCell>
                  <TableCell colSpan={6}>
                    <strong>Total Amount:</strong> ₹
                    {totals.totalAmount.toFixed(2)}{' '}
                    <strong>(GST {customer.cf_in_ex || 'Exclusive'})</strong>
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
}

export default Review;
