import React, { useEffect, useState } from 'react';
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
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'react-toastify';

const OrderDetails = () => {
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  // New images selected in the current session (File objects)
  const [uploadedImages, setUploadedImages] = useState<any[]>([]);
  // Preview URLs for new images
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  // Already saved images from the backend (assumed to be array of string identifiers/URLs)
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  // noteData will store any existing invoice note from the backend
  const [noteData, setNoteData] = useState<any>(null);
  const router = useRouter();
  const { id } = router.query;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  /**
   * Fetch invoice details from the API
   */
  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.api_url}/invoices/${id}`);
      setInvoiceData(response.data);
      console.log(response.data);
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
  const fetchInvoiceNote = async (invoice_number: string) => {
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
      // It’s fine if no note exists; we’ll leave noteData as null.
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
      const urls = uploadedImages.map((file: any) => URL.createObjectURL(file));
      setPreviewUrls(urls);
      // Clean up: revoke object URLs when images change or component unmounts.
      return () => {
        urls.forEach((url) => URL.revokeObjectURL(url));
      };
    } else {
      setPreviewUrls([]);
    }
  }, [uploadedImages]);

  const handleRemoveNewImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Remove an existing image by calling the DELETE endpoint.
  const handleRemoveExistingImage = async (index: number) => {
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
      alert('Please provide additional text or select at least one image.');
      return;
    }
    try {
      setSubmitting(true);
      const formData = new FormData();
      // Append the invoice number from invoiceData
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

  /**
   * Handle Loading State
   */
  if (loading) {
    return (
      <Box sx={{ padding: 3, maxWidth: '600px', margin: '0 auto' }}>
        <Skeleton variant='rectangular' height={40} sx={{ mb: 2 }} />
        <Skeleton variant='rectangular' height={200} sx={{ mb: 2 }} />
        <Skeleton variant='rectangular' height={40} />
      </Box>
    );
  }

  /**
   * Handle Error State
   */
  if (error || !invoiceData) {
    return (
      <Box sx={{ padding: 3, textAlign: 'center' }}>
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
      </Box>
    );
  }

  /**
   * Main UI for Order Details
   */
  if (!invoiceData) {
    return (
      <Box sx={{ padding: 3 }}>
        <Skeleton variant='rectangular' height={40} sx={{ mb: 2 }} />
        <Skeleton variant='rectangular' height={200} sx={{ mb: 2 }} />
        <Skeleton variant='rectangular' height={40} />
      </Box>
    );
  }

  return (
    <Box
      sx={{ padding: isMobile ? 1 : 3, maxWidth: '600px', margin: '0 auto' }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: 3,
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          marginX: { xs: 2, sm: 'auto' },
        }}
      >
        {/* Order Header */}
        <Box display='flex' alignItems='baseline'>
          <Typography variant='h5' fontWeight='bold' gutterBottom>
            {invoiceData?.invoice_number}
          </Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />

        {/* Order Details */}
        <Typography variant='body1' sx={{ mb: 1 }}>
          <strong>Customer Name:</strong> {invoiceData?.customer_name || 'N/A'}
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
          {invoiceData?.status.split('_').join(' ') || 'N/A'}
        </Typography>
        <Typography variant='body1' sx={{ mb: 1 }}>
          <strong>Amount:</strong> ₹{invoiceData?.total || '0'}
        </Typography>
        <Typography variant='body1' sx={{ mb: 2 }}>
          <strong>Balance:</strong> ₹{invoiceData?.balance || '0'}
        </Typography>
        <Divider sx={{ my: 2 }} />

        {/* Product List */}
        <Typography variant='h6' fontWeight='bold' gutterBottom>
          Ordered Items
        </Typography>
        <List
          sx={{
            maxHeight: isMobile ? 'none' : '300px',
            overflowY: isMobile ? 'visible' : 'auto',
            p: 0,
          }}
        >
          {invoiceData.line_items?.map((item: any, index: number) => (
            <ListItem key={index} sx={{ padding: '8px 0' }}>
              <ListItemText
                primary={
                  <Typography variant='body1'>
                    {item.name} (x{item.quantity})
                  </Typography>
                }
                secondary={
                  <Typography variant='body2' color='textSecondary'>
                    Price: ₹{item.rate}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
        {invoiceData.products?.length === 0 && (
          <Typography variant='body2' color='textSecondary'>
            No products found in this order.
          </Typography>
        )}

        {/* Additional Information Section */}
        <Divider sx={{ my: 2 }} />
        <Paper
          elevation={1}
          sx={{
            p: 2,
            backgroundColor: '#f9f9f9',
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
            rows={4}
            variant='outlined'
            fullWidth
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
          />
          <Box mt={2} display='flex' flexDirection='column' alignItems='center'>
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
            <Box
              display='flex'
              alignItems='center'
              justifyContent='space-between'
              width='100%'
            >
              <label htmlFor='upload-image'>
                <Button variant='contained' color='secondary' component='span'>
                  Upload Images
                </Button>
              </label>
              <Button
                variant='contained'
                color='primary'
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </Button>
            </Box>
            {/* Display Existing Images (from backend) with remove option */}
            {existingImages && existingImages.length > 0 && (
              <Box display='flex' flexWrap='wrap' mt={1}>
                {existingImages.map((img, index) => (
                  <Box
                    key={index}
                    position='relative'
                    mr={1}
                    mb={1}
                    width={100}
                    height={100}
                  >
                    <img
                      src={img} // Assuming img is a valid URL; adjust if needed.
                      alt={`existing-${index}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: 4,
                      }}
                    />
                    <IconButton
                      size='small'
                      onClick={() => handleRemoveExistingImage(index)}
                      sx={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        backgroundColor: 'rgba(255,255,255,0.7)',
                      }}
                    >
                      <DeleteIcon fontSize='small' />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
            {/* Display New Image Previews with remove option */}
            {previewUrls && previewUrls.length > 0 && (
              <Box display='flex' flexWrap='wrap' mt={1}>
                {previewUrls.map((url, index) => (
                  <Box
                    key={index}
                    position='relative'
                    mr={1}
                    mb={1}
                    width={100}
                    height={100}
                  >
                    <img
                      src={url}
                      alt={`preview-${index}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: 4,
                      }}
                    />
                    <IconButton
                      size='small'
                      onClick={() => handleRemoveNewImage(index)}
                      sx={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        backgroundColor: 'rgba(255,255,255,0.7)',
                      }}
                    >
                      <DeleteIcon fontSize='small' />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Paper>

        {/* Footer Navigation */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
          <Button
            variant='contained'
            color='primary'
            onClick={() => router.push('/orders/past/payment_due')}
          >
            Back to Payments Due
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default OrderDetails;
