import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Button,
  Skeleton,
  List,
  ListItem,
  ListItemText,
  TextField,
  useTheme,
  useMediaQuery,
  IconButton,
  Collapse,
  Container,
  Card,
  CardContent,
  Badge,
  Chip,
  Tooltip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'react-toastify';
import ImagePopupDialog from '../../../../src/components/common/ImagePopUp';
import AuthContext from '../../../../src/components/Auth';
import SingleImagePopupDialog from '../../../../src/components/common/SingleImagePopUp';

const OrderDetails = () => {
  const [invoiceData, setInvoiceData]: any = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  // New images selected in the current session (File objects)
  const [uploadedImages, setUploadedImages] = useState([]);
  // Preview URLs for new images
  const [previewUrls, setPreviewUrls] = useState([]);
  // Already saved images from the backend (assumed to be array of string identifiers/URLs)
  const [existingImages, setExistingImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  // noteData will store any existing invoice note from the backend
  const [noteData, setNoteData]: any = useState(null);
  const [openImagePopup, setOpenImagePopup] = useState(false);
  const [popupImageSrc, setPopupImageSrc] = useState('');
  const [itemsExpanded, setItemsExpanded] = useState(false);

  const router = useRouter();
  const { id } = router.query;
  const theme = useTheme();
  const { user }: any = useContext(AuthContext);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleImageClick = useCallback((src: any) => {
    setPopupImageSrc(src);
    setOpenImagePopup(true);
  }, []);

  const handleClosePopup = useCallback(() => {
    setOpenImagePopup(false);
  }, []);

  const toggleItemsExpanded = () => {
    setItemsExpanded(!itemsExpanded);
  };

  /**
   * Fetch invoice details from the API
   */
  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.api_url}/invoices/${id}`);
      setInvoiceData(response.data);
    } catch (err) {
      setError('Failed to load invoice details. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch any existing invoice note for the given invoice_number
   */
  const fetchInvoiceNote = async (invoice_number: any) => {
    try {
      if (invoice_number !== '') {
        const response = await axios.get(
          `${process.env.api_url}/invoices/notes`,
          {
            params: { invoice_number },
          }
        );
        // If a note exists, it will not include a "message" field.
        if (!response.data.message) {
          setNoteData(response.data);
          setAdditionalInfo(response.data.additional_info || '');
          // Assume the backend returns an array of image identifiers/URLs.
          setExistingImages(response.data.images || []);
        }
      }
    } catch (err) {
      console.error('Error fetching invoice note:', err);
      // It's fine if no note exists; we'll leave noteData as null.
    }
  };

  useEffect(() => {
    if (id) {
      fetchInvoiceDetails();
    }
  }, [id]);

  // Once invoiceData is loaded, fetch the note for that invoice
  useEffect(() => {
    if (invoiceData && invoiceData.invoice_number) {
      fetchInvoiceNote(invoiceData.invoice_number);
    }
  }, [invoiceData]);

  /**
   * Generate preview URLs for selected new images.
   * Clean up the URLs when the component unmounts or when uploadedImages change.
   */
  useEffect(() => {
    if (uploadedImages.length > 0) {
      const urls: any = uploadedImages.map((file) => URL.createObjectURL(file));
      setPreviewUrls(urls);
      // Clean up: revoke object URLs when images change or component unmounts.
      return () => {
        urls.forEach((url: any) => URL.revokeObjectURL(url));
      };
    } else {
      setPreviewUrls([]);
    }
  }, [uploadedImages]);

  const handleRemoveNewImage = (index: any) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Remove an existing image by calling the DELETE endpoint.
  const handleRemoveExistingImage = async (index: any) => {
    const image_url = existingImages[index];
    try {
      await axios.delete(`${process.env.api_url}/invoices/notes/image`, {
        params: {
          invoice_number: invoiceData.invoice_number,
          image_url, // Passing the full file URL
        },
      });
      // Update local state if deletion was successful.
      setExistingImages((prev) => prev.filter((_, i) => i !== index));
      toast.success('Image deleted successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete image');
    }
  };

  /**
   * Handle submit for additional info and images.
   * If noteData exists (i.e. note already exists), use the update (PUT) endpoint.
   * Otherwise, call the create (POST) endpoint.
   *
   * Both new images (uploadedImages) and the current list of existingImages are sent.
   */
  const handleSubmit = async () => {
    if (
      !additionalInfo &&
      uploadedImages.length === 0 &&
      existingImages.length === 0
    ) {
      toast.warning(
        'Please provide additional text or select at least one image.'
      );
      return;
    }
    try {
      setSubmitting(true);
      const formData = new FormData();
      // Append the invoice number from invoiceData
      formData.append('created_by', user?.data?._id);
      formData.append('invoice_number', invoiceData.invoice_number);
      if (additionalInfo) {
        formData.append('additional_info', additionalInfo);
      }
      // Append each new image file
      uploadedImages.forEach((file) => {
        formData.append('images', file);
      });
      // Append current list of existing images as JSON string.
      // The backend should update the note to retain these images.
      formData.append('existing_images', JSON.stringify(existingImages));

      if (noteData && noteData._id) {
        // Existing note found – update via PUT
        await axios.put(`${process.env.api_url}/invoices/notes`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Invoice note updated successfully!');
      } else {
        // No note exists – create via POST
        await axios.post(`${process.env.api_url}/invoices/notes`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Invoice note submitted successfully!');
      }
      // Refresh the note data after submission
      fetchInvoiceNote(invoiceData.invoice_number);
      // Clear new images after submission (existing images are now stored)
      setUploadedImages([]);
    } catch (err) {
      console.error(err);
      toast.error('Error submitting invoice note. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const downloadAsPDF = async (invoice: any) => {
    try {
      const resp = await axios.get(
        `${process.env.api_url}/invoices/download_pdf/${invoice._id}`,
        {
          responseType: 'blob', // Receive the response as binary data
        }
      );

      // Check if the blob is an actual PDF or an error message
      if (resp.data.type !== 'application/pdf') {
        // Convert to text to read the error response
        toast.error('Invoice Not Created');
        return;
      }

      // Extract filename from headers or set default
      const contentDisposition = resp.headers['content-disposition'];
      let fileName = `${invoice.invoice_number}.pdf`;

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match && match[1]) {
          fileName = match[1];
        }
      }

      // Create and trigger download
      const blob = new Blob([resp.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded successfully');
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      toast.error(error.message || 'Failed to download PDF');
    }
  };

  /**
   * Handle Loading State
   */
  if (loading) {
    return (
      <Container maxWidth='md' sx={{ py: 3 }}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: '12px' }}>
          <Skeleton variant='rectangular' height={40} sx={{ mb: 2 }} />
          <Skeleton variant='rectangular' height={200} sx={{ mb: 2 }} />
          <Skeleton variant='rectangular' height={40} />
        </Paper>
      </Container>
    );
  }

  /**
   * Handle Error State
   */
  if (error || !invoiceData) {
    return (
      <Container maxWidth='md' sx={{ py: 3 }}>
        <Paper
          elevation={3}
          sx={{ p: 3, borderRadius: '12px', textAlign: 'center' }}
        >
          <Typography variant='h6' color='error'>
            {error || 'No order details available.'}
          </Typography>
          <Button
            variant='contained'
            color='secondary'
            sx={{ mt: 2 }}
            onClick={() => router.push('/orders/past')}
          >
            Back to Orders
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth='md' disableGutters={isMobile} sx={{ py: 2 }}>
      <Paper
        elevation={3}
        sx={{
          padding: { xs: 2, sm: 3 },
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          mx: { xs: 1, sm: 'auto' },
          width: '96%',
        }}
      >
        {/* Order Header */}
        <Box
          display='flex'
          alignItems='center'
          width={'100%'}
          gap={'12px'}
          justifyContent={'space-between'}
          flexWrap='wrap'
        >
          <Typography variant='h5' fontWeight='bold' gutterBottom>
            {invoiceData?.invoice_number}
          </Typography>
          <Button
            color='primary'
            variant='contained'
            startIcon={<PictureAsPdfIcon />}
            size={isMobile ? 'small' : 'medium'}
            onClick={() => downloadAsPDF(invoiceData)}
            sx={{ borderRadius: '8px' }}
          >
            Download PDF
          </Button>
        </Box>
        <Divider sx={{ mt: 2, mb: 2 }} />

        {/* Order Details */}
        <Box sx={{ mb: 2 }}>
          <Typography variant='body1' sx={{ mb: 1 }}>
            <strong>Customer Name:</strong>{' '}
            {invoiceData?.customer_name || 'N/A'}
          </Typography>
          <Typography variant='body1' sx={{ mb: 1 }}>
            <strong>Date:</strong>{' '}
            {new Date(invoiceData.date).toLocaleDateString()}
          </Typography>
          <Typography variant='body1' sx={{ mb: 1 }}>
            <strong>Due Date:</strong>{' '}
            {new Date(invoiceData.due_date).toLocaleDateString()}
          </Typography>
          <Typography variant='body1' sx={{ mb: 1 }}>
            <strong>Status:</strong>{' '}
            <Chip
              size='small'
              label={invoiceData?.status.split('_').join(' ') || 'N/A'}
              color={
                invoiceData?.status.includes('overdue') ? 'error' : 'primary'
              }
              sx={{ textTransform: 'capitalize', ml: 1 }}
            />
          </Typography>
          <Typography variant='body1' sx={{ mb: 1 }}>
            <strong>Amount:</strong> ₹{invoiceData?.total || '0'}
          </Typography>
          <Typography variant='body1' sx={{ mb: 1 }}>
            <strong>Balance:</strong> ₹{invoiceData?.balance || '0'}
          </Typography>
        </Box>

        {/* Collapsible Product List */}
        <Card
          elevation={1}
          sx={{
            mb: 2,
            borderRadius: '8px',
            border: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <Box
            onClick={toggleItemsExpanded}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 2,
              cursor: 'pointer',
              backgroundColor: theme.palette.action.hover,
              borderRadius: '8px 8px 0 0',
            }}
          >
            <Box display='flex' alignItems='center'>
              <ShoppingBagIcon
                sx={{ mr: 1, color: theme.palette.primary.main }}
              />
              <Typography variant='h6' fontWeight='bold'>
                Ordered Items
              </Typography>
              <Badge
                badgeContent={invoiceData.line_items?.length || 0}
                color='primary'
                sx={{ ml: 2 }}
              />
            </Box>
            {itemsExpanded ? (
              <ExpandLessIcon color='action' />
            ) : (
              <ExpandMoreIcon color='action' />
            )}
          </Box>

          <Collapse in={itemsExpanded}>
            <CardContent sx={{ p: 0 }}>
              {invoiceData.line_items?.length > 0 ? (
                <List dense={isMobile} disablePadding>
                  {invoiceData.line_items?.map((item: any, index: number) => (
                    <React.Fragment key={index}>
                      <ListItem sx={{ py: 1.5, px: 2 }}>
                        <ListItemText
                          primary={
                            <Typography variant='body1' fontWeight={500}>
                              {item.name}{' '}
                              <Typography
                                component='span'
                                variant='body2'
                                color='text.secondary'
                              >
                                (x{item.quantity})
                              </Typography>
                            </Typography>
                          }
                          secondary={
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mt: 0.5,
                              }}
                            >
                              <Typography variant='body2' color='textSecondary'>
                                Price: ₹{item.rate} per unit
                              </Typography>
                              <Typography variant='body2' fontWeight={500}>
                                Total: ₹{item.rate * item.quantity}
                              </Typography>
                            </Box>
                          }
                          secondaryTypographyProps={{ component: 'div' }}
                        />
                      </ListItem>
                      {index < invoiceData.line_items.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant='body2' color='textSecondary'>
                    No products found in this order.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Collapse>
        </Card>

        {/* Additional Information Section */}
        <Paper
          elevation={1}
          sx={{
            p: 2,
            backgroundColor: theme.palette.background.default,
            borderRadius: '8px',
            mb: 2,
          }}
        >
          <Typography variant='h6' fontWeight='bold' gutterBottom>
            {noteData && noteData._id
              ? 'Edit Invoice Note'
              : 'Add Invoice Note'}
          </Typography>
          <TextField
            label='Enter additional details'
            multiline
            rows={3}
            variant='outlined'
            fullWidth
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Box display='flex' flexDirection='column' gap={2}>
            <Box
              display='flex'
              flexDirection={isMobile ? 'column' : 'row'}
              alignItems={isMobile ? 'stretch' : 'center'}
              justifyContent='space-between'
              gap={1}
            >
              <input
                accept='image/*'
                style={{ display: 'none' }}
                id='upload-image'
                type='file'
                multiple
                onChange={(e: any) =>
                  setUploadedImages(Array.from(e.target.files))
                }
              />
              <label
                htmlFor='upload-image'
                style={{ width: isMobile ? '100%' : 'auto' }}
              >
                <Button
                  variant='outlined'
                  color='primary'
                  component='span'
                  startIcon={<AddPhotoAlternateIcon />}
                  fullWidth={isMobile}
                  sx={{ borderRadius: '8px' }}
                >
                  Upload Images
                </Button>
              </label>
              <Button
                variant='contained'
                color='primary'
                onClick={handleSubmit}
                disabled={submitting}
                fullWidth={isMobile}
                sx={{ borderRadius: '8px' }}
              >
                {submitting ? 'Submitting...' : 'Submit Note'}
              </Button>
            </Box>

            {/* Image Previews Section */}
            {(existingImages.length > 0 || previewUrls.length > 0) && (
              <Box
                sx={{
                  mt: 2,
                  p: 1,
                  borderRadius: '8px',
                  backgroundColor: theme.palette.background.paper,
                  border: `1px dashed ${theme.palette.divider}`,
                }}
              >
                <Typography variant='subtitle2' mb={1} color='text.secondary'>
                  {existingImages.length + previewUrls.length} image
                  {existingImages.length + previewUrls.length !== 1
                    ? 's'
                    : ''}{' '}
                  attached
                </Typography>

                {/* Display Existing Images (from backend) with remove option */}
                <Box
                  display='flex'
                  flexWrap='wrap'
                  gap={1}
                  sx={{
                    '&::-webkit-scrollbar': {
                      height: '6px',
                    },
                    '&::-webkit-scrollbar-track': {
                      backgroundColor: 'rgba(0,0,0,0.05)',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: 'rgba(0,0,0,0.15)',
                      borderRadius: '3px',
                    },
                  }}
                >
                  {existingImages.map((img, index) => (
                    <Box
                      key={index}
                      position='relative'
                      sx={{
                        width: '80px',
                        height: '80px',
                        flexShrink: 0,
                        borderRadius: '8px',
                        overflow: 'hidden',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      }}
                    >
                      <img
                        onClick={() => handleImageClick(img)}
                        src={img}
                        alt={`existing-${index}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          cursor: 'pointer',
                        }}
                      />
                      <Tooltip title='Remove image'>
                        <IconButton
                          size='small'
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveExistingImage(index);
                          }}
                          sx={{
                            position: 'absolute',
                            top: 2,
                            right: 2,
                            backgroundColor: 'rgba(255,255,255,0.8)',
                            width: '24px',
                            height: '24px',
                            '&:hover': {
                              backgroundColor: 'rgba(255,255,255,0.95)',
                            },
                          }}
                        >
                          <DeleteIcon fontSize='small' />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ))}

                  {/* Display New Image Previews with remove option */}
                  {previewUrls.map((url, index) => (
                    <Box
                      key={`new-${index}`}
                      position='relative'
                      sx={{
                        width: '80px',
                        height: '80px',
                        flexShrink: 0,
                        borderRadius: '8px',
                        overflow: 'hidden',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        border: `2px solid ${theme.palette.primary.main}`,
                      }}
                    >
                      <img
                        src={url}
                        alt={`preview-${index}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                      <Tooltip title='Remove image'>
                        <IconButton
                          size='small'
                          onClick={() => handleRemoveNewImage(index)}
                          sx={{
                            position: 'absolute',
                            top: 2,
                            right: 2,
                            backgroundColor: 'rgba(255,255,255,0.8)',
                            width: '24px',
                            height: '24px',
                            '&:hover': {
                              backgroundColor: 'rgba(255,255,255,0.95)',
                            },
                          }}
                        >
                          <DeleteIcon fontSize='small' />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </Paper>

        {/* Footer Navigation */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Button
            variant='contained'
            color='primary'
            onClick={() => router.push('/orders/past/payment_due')}
            sx={{ borderRadius: '8px', minWidth: '180px' }}
          >
            Back to Payments Due
          </Button>
        </Box>
      </Paper>

      <SingleImagePopupDialog
        open={openImagePopup}
        onClose={handleClosePopup}
        imageSrc={popupImageSrc}
      />
    </Container>
  );
};

export default OrderDetails;
