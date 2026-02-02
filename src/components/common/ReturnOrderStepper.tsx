import React, { useState, useContext, useEffect } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Paper,
  Container,
  Card,
  CardContent,
  TextField,
  Alert,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Divider,
  useTheme,
  useMediaQuery,
  CardMedia,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import {
  PersonAdd,
  LocationOn,
  Inventory,
  ArrowBack,
  ArrowForward,
  CheckCircle,
  ExpandMore,
  Add,
  Remove,
  Delete,
  NoteAdd,
  CancelOutlined,
  KeyboardArrowDown,
  KeyboardArrowUp,
  Phone,
  Description,
  CalendarMonth,
  Inbox,
} from '@mui/icons-material';
import CustomerSearchBar from '../OrderForm/CustomerSearchBar';
import Address from '../OrderForm/SelectAddress';
import axios from 'axios';
import { toast } from 'react-toastify';
import AuthContext from '../Auth';
import Image from 'next/image';
import formatAddress from '../../util/formatAddress';

const steps = [
  {
    label: 'Select Customer',
    icon: <PersonAdd />,
    description: 'Choose the customer for this return order',
  },
  {
    label: 'Pickup Address',
    icon: <LocationOn />,
    description: 'Select or add pickup address',
  },
  {
    label: 'Return Items',
    icon: <Inventory />,
    description: 'Add products to be returned',
  },
  {
    label: 'Return Note',
    icon: <NoteAdd />,
    description: 'Add reason for return',
  },
  {
    label: 'Review & Submit',
    icon: <CheckCircle />,
    description: 'Review all details before submission',
  },
];

// Mobile-responsive product search component
const ProductSearchBar = ({ onProductSelect, disabled }: any) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Debounce the search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Mock product search - replace with actual API call
  const searchProducts = async (term: string) => {
    if (!term.trim()) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log('Searching for:', term);
      const response: any = await axios.get(
        `${process.env.api_url}/products/all`,
        {
          params: { search: term },
        }
      );
      const { products = [] } = response.data;
      setProducts(products);
    } catch (error) {
      console.error('Error searching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Trigger search when debounced term changes
  useEffect(() => {
    if (debouncedSearchTerm !== searchTerm) {
      // Show loading immediately when user types
      setLoading(searchTerm.trim().length > 0);
    }
    searchProducts(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  const clearSearch = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setProducts([]);
    setLoading(false);
  };

  console.log(products);

  return (
    <Box>
      <TextField
        fullWidth
        label='Search Products'
        placeholder='Type to search products...'
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
        }}
        disabled={disabled}
        sx={{ mb: 2 }}
      />

      {(loading || (searchTerm && searchTerm !== debouncedSearchTerm)) && (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <CircularProgress size={24} />
          {searchTerm !== debouncedSearchTerm && (
            <Typography
              variant='caption'
              sx={{ display: 'block', mt: 1, color: 'text.secondary' }}
            >
              Typing...
            </Typography>
          )}
        </Box>
      )}

      {products.length > 0 && (
        <Paper
          sx={{
            maxHeight: 400,
            overflow: 'auto',
            p: 1,
            borderRadius: 2,
          }}
        >
          {/* Grid container using flexbox */}
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              justifyContent: 'space-between',
            }}
          >
            {products.map((product: any) => (
              <Box
                key={product._id}
                sx={{
                  // 2-column layout on mobile, 3-column on larger screens
                  width: {
                    xs: 'calc(50% - 4px)', // Mobile: 2 columns
                    sm: 'calc(33.333% - 6px)', // Tablet: 3 columns
                    md: 'calc(25% - 6px)', // Desktop: 4 columns
                  },
                  minHeight: 160,
                  p: 1.5,
                  cursor: 'pointer',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: 'background.paper',
                  transition: 'all 0.2s ease-in-out',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                    borderColor: 'primary.main',
                    transform: 'scale(1.02)',
                    boxShadow: 2,
                  },
                  '&:active': {
                    transform: 'scale(0.98)',
                  },
                }}
                onClick={() => {
                  onProductSelect(product);
                  clearSearch();
                }}
              >
                {/* Product Image */}
                <Box
                  sx={{
                    width: {
                      xs: 60, // Smaller on mobile
                      sm: 70,
                      md: 80,
                    },
                    height: {
                      xs: 60,
                      sm: 70,
                      md: 80,
                    },
                    mb: 1,
                    borderRadius: 1,
                    overflow: 'hidden',
                    backgroundColor: 'grey.100',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Image
                    src={product.image_url || '/placeholder.png'}
                    alt={product.cf_sku_code}
                    width={60}
                    height={60}
                    style={{
                      objectFit: 'cover',
                      borderRadius: '4px',
                      maxWidth: '100%',
                      maxHeight: '100%',
                    }}
                  />
                </Box>

                {/* Product Info */}
                <Box sx={{ flex: 1, width: '100%' }}>
                  <Typography
                    variant='body2'
                    sx={{
                      fontWeight: 500,
                      fontSize: {
                        xs: '0.75rem', // Smaller text on mobile
                        sm: '0.875rem',
                      },
                      lineHeight: 1.3,
                      mb: 0.5,
                      wordBreak: 'break-word',
                    }}
                  >
                    {product.item_name}
                  </Typography>

                  <Typography
                    variant='caption'
                    color='textSecondary'
                    sx={{
                      fontSize: {
                        xs: '0.65rem',
                        sm: '0.75rem',
                      },
                      fontWeight: 400,
                    }}
                  >
                    SKU: {product.cf_sku_code}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>

          {/* Show message if no products found */}
          {debouncedSearchTerm &&
            products.length === 0 &&
            !loading &&
            searchTerm === debouncedSearchTerm && (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant='body2' color='textSecondary'>
                  No products found for "{debouncedSearchTerm}"
                </Typography>
              </Box>
            )}
        </Paper>
      )}
    </Box>
  );
};

const ReturnOrderStepper = ({
  onClose,
  onSave,
  isEditing = false,
  initialData = null,
  customer,
  setCustomer,
}: any) => {
  const { user }: any = useContext(AuthContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [activeStep, setActiveStep] = useState(0);
  const [referenceNumber, setReferenceNumber] = useState(
    initialData?.referenceNumber || ''
  );
  const [pickupAddress, setPickupAddress] = useState(
    initialData?.pickupAddress || null
  );
  const [returnItems, setReturnItems] = useState(initialData?.items || []);
  const [returnReason, setReturnReason] = useState(
    initialData?.returnReason || ''
  );
  const [returnFormDate, setReturnFormDate] = useState(
    initialData?.returnFormDate || ''
  );
  const [contactNo, setContactNo] = useState(initialData?.contactNo || '');
  const [boxCount, setBoxCount] = useState(initialData?.boxCount || 1);
  const [debitNoteFiles, setDebitNoteFiles] = useState<File[]>([]);
  const [debitNoteDocuments, setDebitNoteDocuments] = useState<string[]>(
    initialData?.debitNoteDocuments || (initialData?.debitNoteDocument ? [initialData.debitNoteDocument] : [])
  );
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const handleNext = () => {
    if (canProceedToNext()) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const canProceedToNext = () => {
    switch (activeStep) {
      case 0: // Customer selection
        return customer !== null;
      case 1: // Address selection
        return pickupAddress !== null;
      case 2: // Items selection
        return returnItems.length > 0;
      case 3: // Return note and details
        return (
          returnReason.trim() !== '' &&
          returnFormDate !== '' &&
          contactNo.trim() !== '' &&
          boxCount > 0
        );
      case 4: // Review step
        return true; // Always can proceed from review to submit
      default:
        return false;
    }
  };

  const handleProductSelect = (product: any) => {
    const existingItem = returnItems.find(
      (item: any) => item._id === product._id
    );
    if (existingItem) {
      toast.info('Product already added to return list');
      return;
    }

    const newItem = {
      ...product,
      quantity: 1,
      returnAmount: product.price,
    };
    setReturnItems([...returnItems, newItem]);
  };

  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
      return;
    }

    setReturnItems(
      returnItems.map((item: any) =>
        item._id === itemId
          ? {
              ...item,
              quantity: newQuantity,
              returnAmount: item.price * newQuantity,
            }
          : item
      )
    );
  };

  const removeItem = (itemId: string) => {
    setReturnItems(returnItems.filter((item: any) => item._id !== itemId));
  };

  const getTotalReturnAmount = () => {
    return returnItems.reduce(
      (total: number, item: any) => total + (item.returnAmount || 0),
      0
    );
  };

  const handleSaveReturnOrder = async () => {
    try {
      setLoading(true);
      console.log(returnItems);

      const returnOrderData = {
        customer_id: customer._id,
        customer_name: customer.contact_name,
        pickup_address: pickupAddress,
        return_reason: returnReason,
        return_form_date: returnFormDate,
        contact_no: contactNo,
        box_count: boxCount,
        items: returnItems.map((item: any) => ({
          product_id: item._id || item.product_id,
          product_name: item.name || item.product_name,
          sku: item.sku,
          quantity: item.quantity,
          image_url: item.image_url,
        })),
        status: 'draft',
        created_by: user.data._id,
      };

      let returnOrderId = initialData?._id;

      if (isEditing && initialData?._id) {
        await axios.put(
          `${process.env.api_url}/return_orders/${initialData._id}`,
          returnOrderData
        );
        toast.success('Return order updated successfully');
      } else {
        const response = await axios.post(
          `${process.env.api_url}/return_orders`,
          returnOrderData
        );
        returnOrderId = response.data.return_order._id;
        toast.success('Return order created successfully');
      }

      // Upload files if any were selected
      if (debitNoteFiles.length > 0 && returnOrderId) {
        try {
          setUploadingFile(true);
          const formData = new FormData();
          debitNoteFiles.forEach((file) => {
            formData.append('files', file);
          });

          await axios.post(
            `${process.env.api_url}/return_orders/${returnOrderId}/upload-documents`,
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            }
          );
          toast.success(`${debitNoteFiles.length} document(s) uploaded successfully`);
        } catch (uploadError) {
          console.error('Error uploading documents:', uploadError);
          toast.error('Failed to upload documents');
        } finally {
          setUploadingFile(false);
        }
      }

      onSave?.();
    } catch (error) {
      console.error('Error saving return order:', error);
      toast.error('Failed to save return order');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Select Customer
              </Typography>
              <Typography variant='body2' color='textSecondary' sx={{ mb: 3 }}>
                Choose the customer who wants to return products
              </Typography>

              <CustomerSearchBar
                label='Search Customer'
                onChange={(value: any) => {
                  setCustomer(value);
                  setPickupAddress(null); // Reset address when customer changes
                }}
                value={customer}
                initialValue={customer}
                onChangeReference={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setReferenceNumber(e.target.value);
                }}
                reference={referenceNumber}
              />

              {customer && (
                <Alert severity='success' sx={{ mt: 2 }}>
                  <Typography variant='subtitle2'>
                    Customer Selected:
                  </Typography>
                  <Typography variant='body2'>
                    {customer.contact_name}
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        );

      case 1:
        return (
          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Pickup Address
              </Typography>
              <Typography variant='body2' color='textSecondary' sx={{ mb: 3 }}>
                Select the address where products will be picked up from
              </Typography>

              {customer && (
                <Address
                  addNewAddress={true}
                  type='Pickup'
                  id={pickupAddress?._id as string}
                  address={pickupAddress}
                  setAddress={setPickupAddress}
                  selectedAddress={pickupAddress}
                  customer={customer}
                  setLoading={setLoading}
                />
              )}

              {pickupAddress && (
                <Alert severity='success' sx={{ mt: 2 }}>
                  <Typography variant='subtitle2'>
                    Pickup Address Selected:
                  </Typography>
                  <Typography variant='body2'>
                    {pickupAddress.street}, {pickupAddress.city}
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Return Items
              </Typography>
              <Typography variant='body2' color='textSecondary' sx={{ mb: 3 }}>
                Add products that need to be returned
              </Typography>

              <ProductSearchBar
                onProductSelect={handleProductSelect}
                disabled={loading}
              />

              {returnItems.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 2,
                    }}
                  >
                    <Typography variant='subtitle1' fontWeight={600}>
                      Selected Items
                    </Typography>
                    <Chip
                      label={`${returnItems.length} item${
                        returnItems.length > 1 ? 's' : ''
                      }`}
                      size='small'
                      color='primary'
                      variant='outlined'
                    />
                  </Box>

                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                  >
                    {returnItems.map((item: any, index: number) => (
                      <Paper
                        key={item._id}
                        elevation={2}
                        sx={{
                          borderRadius: 3,
                          border: '1px solid',
                          borderColor: 'divider',
                          overflow: 'hidden',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            borderColor: 'primary.main',
                            boxShadow: 3,
                          },
                        }}
                      >
                        <Box sx={{ p: 2.5 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: { xs: 'column', sm: 'row' },
                              gap: 2,
                              alignItems: { xs: 'stretch', sm: 'center' },
                            }}
                          >
                            {/* Product Image & Info */}
                            <Box
                              sx={{
                                display: 'flex',
                                gap: 2,
                                flex: 1,
                                alignItems: 'center',
                              }}
                            >
                              <Box
                                sx={{
                                  width: { xs: 80, sm: 100 },
                                  height: { xs: 80, sm: 100 },
                                  borderRadius: 2,
                                  overflow: 'hidden',
                                  backgroundColor: 'grey.100',
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                <Image
                                  src={item.image_url || '/placeholder.png'}
                                  alt={item.sku}
                                  width={100}
                                  height={100}
                                  style={{
                                    objectFit: 'cover',
                                    width: '100%',
                                    height: '100%',
                                  }}
                                />
                              </Box>

                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography
                                  variant='subtitle1'
                                  fontWeight={600}
                                  sx={{
                                    mb: 0.5,
                                    lineHeight: 1.4,
                                    wordBreak: 'break-word',
                                  }}
                                >
                                  {item.name || item.product_name}
                                </Typography>
                              </Box>
                            </Box>

                            {/* Quantity Controls & Actions */}
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                justifyContent: {
                                  xs: 'space-between',
                                  sm: 'flex-end',
                                },
                                flexShrink: 0,
                              }}
                            >
                              {/* Quantity Controls */}
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  backgroundColor: 'grey.50',
                                  borderRadius: 2,
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  overflow: 'hidden',
                                }}
                              >
                                <IconButton
                                  size='small'
                                  onClick={() =>
                                    updateItemQuantity(
                                      item._id,
                                      item.quantity - 1
                                    )
                                  }
                                  disabled={item.quantity <= 1}
                                  sx={{
                                    borderRadius: 0,
                                    '&:hover': {
                                      backgroundColor: 'primary.main',
                                      color: 'white',
                                    },
                                  }}
                                >
                                  <Remove fontSize='small' />
                                </IconButton>

                                <Typography
                                  variant='body2'
                                  fontWeight={600}
                                  sx={{
                                    minWidth: '40px',
                                    textAlign: 'center',
                                    px: 1,
                                    py: 0.5,
                                    backgroundColor: 'white',
                                  }}
                                >
                                  {item.quantity}
                                </Typography>

                                <IconButton
                                  size='small'
                                  onClick={() =>
                                    updateItemQuantity(
                                      item._id,
                                      item.quantity + 1
                                    )
                                  }
                                  sx={{
                                    borderRadius: 0,
                                    '&:hover': {
                                      backgroundColor: 'primary.main',
                                      color: 'white',
                                    },
                                  }}
                                >
                                  <Add fontSize='small' />
                                </IconButton>
                              </Box>

                              {/* Delete Button */}
                              <IconButton
                                size='small'
                                color='error'
                                onClick={() => removeItem(item._id)}
                                sx={{
                                  backgroundColor: 'error.50',
                                  border: '1px solid',
                                  borderColor: 'error.200',
                                  '&:hover': {
                                    backgroundColor: 'error.100',
                                    borderColor: 'error.main',
                                  },
                                }}
                              >
                                <Delete fontSize='small' />
                              </IconButton>
                            </Box>
                          </Box>
                        </Box>
                      </Paper>
                    ))}
                  </Box>

                  {/* Summary Footer */}
                  <Box
                    sx={{
                      mt: 3,
                      p: 2,
                      backgroundColor: 'primary.50',
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'primary.200',
                    }}
                  >
                    <Typography
                      variant='body2'
                      color='primary.main'
                      fontWeight={600}
                    >
                      Total Items:{' '}
                      {returnItems.reduce(
                        (sum: any, item: any) => sum + item.quantity,
                        0
                      )}
                    </Typography>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                Return Details
              </Typography>
              <Typography variant='body2' color='textSecondary' sx={{ mb: 3 }}>
                Provide additional information about the return
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Return Reason */}
                <TextField
                  fullWidth
                  label='Return Reason'
                  placeholder='Please specify the reason for return...'
                  multiline
                  rows={3}
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <NoteAdd color='primary' />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiInputBase-root': {
                      alignItems: 'flex-start',
                    },
                  }}
                />

                {/* Return Form Date */}
                <TextField
                  fullWidth
                  label='Return Form Date'
                  type='date'
                  value={returnFormDate}
                  onChange={(e) => setReturnFormDate(e.target.value)}
                  required
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    },
                    input: {
                      inputProps: {
                        min: new Date().toISOString().split('T')[0],
                      },
                      startAdornment: (
                        <InputAdornment position='start'>
                          <CalendarMonth color='primary' />
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                {/* Contact Number */}
                <TextField
                  fullWidth
                  label='Contact Number'
                  placeholder='Enter contact number...'
                  value={contactNo}
                  onChange={(e) => setContactNo(e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <Phone color='primary' />
                      </InputAdornment>
                    ),
                  }}
                />

                {/* Box Count */}
                <Box>
                  <Typography variant='subtitle2' gutterBottom>
                    Box Count
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      backgroundColor: 'grey.50',
                    }}
                  >
                    <Inbox color='primary' />
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        flex: 1,
                      }}
                    >
                      <IconButton
                        onClick={() => setBoxCount(Math.max(1, boxCount - 1))}
                        disabled={boxCount <= 1}
                        sx={{
                          backgroundColor: 'primary.main',
                          color: 'white',
                          '&:hover': {
                            backgroundColor: 'primary.dark',
                          },
                          '&:disabled': {
                            backgroundColor: 'grey.300',
                          },
                          width: 40,
                          height: 40,
                        }}
                      >
                        <Remove />
                      </IconButton>
                      <TextField
                        value={boxCount}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '') {
                            setBoxCount(1);
                          } else {
                            const num = parseInt(value);
                            if (!isNaN(num) && num >= 1) {
                              setBoxCount(num);
                            }
                          }
                        }}
                        sx={{
                          width: '80px',
                          '& .MuiOutlinedInput-root': {
                            '& input': {
                              textAlign: 'center',
                              fontSize: '1.2rem',
                              fontWeight: 'bold',
                            },
                          },
                        }}
                        inputProps={{
                          min: 1,
                          style: { textAlign: 'center' },
                        }}
                      />
                      <IconButton
                        onClick={() => setBoxCount(boxCount + 1)}
                        sx={{
                          backgroundColor: 'primary.main',
                          color: 'white',
                          '&:hover': {
                            backgroundColor: 'primary.dark',
                          },
                          width: 40,
                          height: 40,
                        }}
                      >
                        <Add />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>

                {/* Debit Note Document Upload */}
                <Box
                  sx={{
                    p: 2,
                    border: '2px dashed',
                    borderColor: 'primary.main',
                    borderRadius: 2,
                    backgroundColor: 'grey.50',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Description color='primary' />
                    <Typography variant='subtitle2'>
                      Debit Note Document (Optional)
                    </Typography>
                  </Box>
                  <Typography
                    variant='caption'
                    color='textSecondary'
                    sx={{ mb: 2, display: 'block' }}
                  >
                    Upload xlsx, csv, pdf, or image files
                  </Typography>
                  <input
                    type='file'
                    accept='.xlsx,.xls,.csv,.jpg,.jpeg,.png,.pdf'
                    multiple
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) {
                        setDebitNoteFiles((prev) => [...prev, ...Array.from(files)]);
                      }
                    }}
                    style={{ display: 'none' }}
                    id='debit-note-upload'
                  />
                  <label htmlFor='debit-note-upload'>
                    <Button
                      variant='contained'
                      component='span'
                      fullWidth
                      startIcon={<Description />}
                      sx={{
                        mb: 1,
                        backgroundColor: debitNoteFiles.length > 0
                          ? 'success.main'
                          : 'primary.main',
                        '&:hover': {
                          backgroundColor: debitNoteFiles.length > 0
                            ? 'success.dark'
                            : 'primary.dark',
                        },
                      }}
                    >
                      {debitNoteFiles.length > 0
                        ? `${debitNoteFiles.length} file(s) selected`
                        : debitNoteDocuments.length > 0
                        ? 'Add More Documents'
                        : 'Choose Files'}
                    </Button>
                  </label>

                  {debitNoteFiles.length > 0 && (
                    <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {debitNoteFiles.map((file, index) => (
                        <Alert
                          key={index}
                          severity='success'
                          onClose={() => {
                            setDebitNoteFiles((prev) => prev.filter((_, i) => i !== index));
                          }}
                        >
                          {file.name}
                        </Alert>
                      ))}
                    </Box>
                  )}

                  {debitNoteDocuments.length > 0 && (
                    <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {debitNoteDocuments.map((doc, index) => (
                        <Alert key={index} severity='info'>
                          <a
                            href={doc}
                            target='_blank'
                            rel='noopener noreferrer'
                            style={{ color: 'inherit', textDecoration: 'underline' }}
                          >
                            Existing Document {index + 1}
                          </a>
                        </Alert>
                      ))}
                    </Box>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        );
      case 4:
        return (
          <Box sx={{ position: 'relative' }}>
            {/* Scroll Navigation Buttons */}
            <Box
              sx={{
                position: 'fixed',
                right: 4,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
              }}
            >
              <IconButton
                size='small'
                onClick={() => {
                  const element = document.getElementById('summary-top');
                  element?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  });
                }}
                sx={{
                  backgroundColor: 'primary.main',
                  color: 'white',
                  boxShadow: 3,
                  width: 40,
                  height: 40,
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                    boxShadow: 4,
                  },
                }}
              >
                <KeyboardArrowUp />
              </IconButton>

              <IconButton
                size='small'
                onClick={() => {
                  const element = document.getElementById('summary-bottom');
                  element?.scrollIntoView({ behavior: 'smooth', block: 'end' });
                }}
                sx={{
                  backgroundColor: 'primary.main',
                  color: 'white',
                  boxShadow: 3,
                  width: 40,
                  height: 40,
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                    boxShadow: 4,
                  },
                }}
              >
                <KeyboardArrowDown />
              </IconButton>
            </Box>

            {/* Summary Content */}
            <Box id='summary-top'>
              {' '}
              {/* Add right padding to avoid scroll buttons */}
              {/* Customer Information Section */}
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  mb: 3,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography
                  variant='h6'
                  sx={{
                    mb: 2,
                    color: 'primary.main',
                    fontWeight: 600,
                    borderBottom: '2px solid',
                    borderColor: 'primary.100',
                    pb: 1,
                  }}
                >
                  Customer Information
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography
                      variant='subtitle2'
                      color='textSecondary'
                      sx={{ mb: 0.5 }}
                    >
                      Customer Name
                    </Typography>
                    <Typography variant='body1' fontWeight={500}>
                      {customer.contact_name}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography
                      variant='subtitle2'
                      color='textSecondary'
                      sx={{ mb: 0.5 }}
                    >
                      Contact Number
                    </Typography>
                    <Typography variant='body1' fontWeight={500}>
                      {contactNo}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography
                      variant='subtitle2'
                      color='textSecondary'
                      sx={{ mb: 0.5 }}
                    >
                      Pickup Address
                    </Typography>
                    <Typography variant='body1' sx={{ lineHeight: 1.6 }}>
                      {formatAddress(pickupAddress)}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography
                      variant='subtitle2'
                      color='textSecondary'
                      sx={{ mb: 0.5 }}
                    >
                      Return Form Date
                    </Typography>
                    <Typography variant='body1' fontWeight={500}>
                      {new Date(returnFormDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography
                      variant='subtitle2'
                      color='textSecondary'
                      sx={{ mb: 0.5 }}
                    >
                      Box Count
                    </Typography>
                    <Typography variant='body1' fontWeight={500}>
                      {boxCount}
                    </Typography>
                  </Box>

                  {(debitNoteFiles.length > 0 || debitNoteDocuments.length > 0) && (
                    <Box>
                      <Typography
                        variant='subtitle2'
                        color='textSecondary'
                        sx={{ mb: 0.5 }}
                      >
                        Debit Note Documents
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {debitNoteFiles.map((file, index) => (
                          <Typography key={`new-${index}`} variant='body2' fontWeight={500}>
                            {file.name} (new)
                          </Typography>
                        ))}
                        {debitNoteDocuments.map((doc, index) => (
                          <Typography key={`existing-${index}`} variant='body2' fontWeight={500}>
                            <a
                              href={doc}
                              target='_blank'
                              rel='noopener noreferrer'
                              style={{
                                color: 'inherit',
                                textDecoration: 'underline',
                              }}
                            >
                              Existing Document {index + 1}
                            </a>
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              </Paper>
              {/* Return Items Section */}
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  mb: 3,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 2,
                    borderBottom: '2px solid',
                    borderColor: 'primary.100',
                    pb: 1,
                  }}
                >
                  <Typography
                    variant='h6'
                    sx={{
                      color: 'primary.main',
                      fontWeight: 600,
                    }}
                  >
                    Return Items
                  </Typography>
                  <Chip
                    label={`${returnItems.reduce(
                      (sum: any, item: any) => sum + item.quantity,
                      0
                    )} items`}
                    size='small'
                    color='primary'
                    variant='outlined'
                  />
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {returnItems.map((item: any, index: number) => (
                    <Paper
                      key={item._id}
                      variant='outlined'
                      sx={{
                        p: 2.5,
                        borderRadius: 2,
                        backgroundColor: 'grey.50',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          backgroundColor: 'grey.100',
                          borderColor: 'primary.main',
                        },
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: { xs: 'column', sm: 'row' },
                          gap: 2,
                          alignItems: { xs: 'stretch', sm: 'center' },
                        }}
                      >
                        {/* Product Image & Info */}
                        <Box
                          sx={{
                            display: 'flex',
                            gap: 2,
                            flex: 1,
                            alignItems: 'center',
                          }}
                        >
                          <Box
                            sx={{
                              width: { xs: 80, sm: 100 },
                              height: { xs: 80, sm: 100 },
                              borderRadius: 2,
                              overflow: 'hidden',
                              backgroundColor: 'white',
                              border: '2px solid',
                              borderColor: 'divider',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <Image
                              src={item.image_url || '/placeholder.png'}
                              alt={item.name}
                              width={100}
                              height={100}
                              style={{
                                objectFit: 'cover',
                                width: '100%',
                                height: '100%',
                              }}
                            />
                          </Box>

                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant='subtitle1'
                              fontWeight={600}
                              sx={{
                                mb: 1,
                                color: 'text.primary',
                                lineHeight: 1.4,
                                wordBreak: 'break-word',
                              }}
                            >
                              {item.name}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Quantity Controls & Actions */}
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            justifyContent: {
                              xs: 'space-between',
                              sm: 'flex-end',
                            },
                            flexShrink: 0,
                          }}
                        >
                          {/* Quantity Controls */}
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              backgroundColor: 'white',
                              borderRadius: 2,
                              border: '2px solid',
                              borderColor: 'primary.200',
                              overflow: 'hidden',
                            }}
                          >
                            <IconButton
                              size='small'
                              onClick={() =>
                                updateItemQuantity(item._id, item.quantity - 1)
                              }
                              disabled={item.quantity <= 1}
                              sx={{
                                borderRadius: 0,
                                backgroundColor: 'primary.50',
                                '&:hover': {
                                  backgroundColor: 'primary.main',
                                  color: 'white',
                                },
                                '&:disabled': {
                                  backgroundColor: 'grey.100',
                                },
                              }}
                            >
                              <Remove fontSize='small' />
                            </IconButton>

                            <Typography
                              variant='body1'
                              fontWeight={700}
                              sx={{
                                minWidth: '50px',
                                textAlign: 'center',
                                px: 2,
                                py: 1,
                                backgroundColor: 'white',
                                color: 'primary.main',
                              }}
                            >
                              {item.quantity}
                            </Typography>

                            <IconButton
                              size='small'
                              onClick={() =>
                                updateItemQuantity(item._id, item.quantity + 1)
                              }
                              sx={{
                                borderRadius: 0,
                                backgroundColor: 'primary.50',
                                '&:hover': {
                                  backgroundColor: 'primary.main',
                                  color: 'white',
                                },
                              }}
                            >
                              <Add fontSize='small' />
                            </IconButton>
                          </Box>

                          {/* Delete Button */}
                          <IconButton
                            size='medium'
                            color='error'
                            onClick={() => removeItem(item._id)}
                            sx={{
                              backgroundColor: 'error.50',
                              border: '2px solid',
                              borderColor: 'error.200',
                              '&:hover': {
                                backgroundColor: 'error.100',
                                borderColor: 'error.main',
                              },
                            }}
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              </Paper>
              {/* Return Reason Section */}
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
                id='summary-bottom'
              >
                <Typography
                  variant='h6'
                  sx={{
                    mb: 2,
                    color: 'primary.main',
                    fontWeight: 600,
                    borderBottom: '2px solid',
                    borderColor: 'primary.100',
                    pb: 1,
                  }}
                >
                  Return Reason
                </Typography>

                <Typography
                  variant='body1'
                  sx={{
                    lineHeight: 1.6,
                    p: 2,
                    backgroundColor: 'grey.50',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'grey.200',
                  }}
                >
                  {returnReason}
                </Typography>
              </Paper>
            </Box>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth='md'>
      <Paper sx={{ p: 3, mt: 2 }}>
        <Box
          display={'flex'}
          flexDirection={'row'}
          alignItems={'center'}
          justifyContent={'space-between'}
          width={'100%'}
        >
          <Typography variant='h5' gutterBottom>
            {isEditing ? 'Edit Return Order' : 'Create Return Order'}
          </Typography>
          <CancelOutlined onClick={onClose} />
        </Box>

        <Stepper
          activeStep={activeStep}
          orientation={isMobile ? 'vertical' : 'horizontal'}
          sx={{ mb: 4 }}
        >
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel
                icon={
                  index < activeStep ? (
                    <CheckCircle color='success' />
                  ) : (
                    step.icon
                  )
                }
              >
                <Box>
                  <Typography variant='subtitle2'>{step.label}</Typography>
                  {!isMobile && (
                    <Typography variant='caption' color='textSecondary'>
                      {step.description}
                    </Typography>
                  )}
                </Box>
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ mb: 4 }}>{renderStepContent()}</Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: 2,
            justifyContent: 'space-between',
          }}
        >
          <Button
            startIcon={<ArrowBack />}
            onClick={activeStep === 0 ? onClose : handleBack}
            variant='outlined'
          >
            {activeStep === 0 ? 'Cancel' : 'Back'}
          </Button>

          <Box
            sx={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: 2,
              justifyContent: 'space-between',
            }}
          >
            {activeStep === steps.length - 1 ? (
              <Button
                variant='contained'
                onClick={handleSaveReturnOrder}
                disabled={!canProceedToNext() || loading || uploadingFile}
                startIcon={<CheckCircle />}
                color='success'
              >
                {loading || uploadingFile
                  ? uploadingFile
                    ? 'Uploading Document...'
                    : 'Saving...'
                  : isEditing
                  ? 'Update Return Order'
                  : 'Create Return Order'}
              </Button>
            ) : (
              <Button
                endIcon={<ArrowForward />}
                onClick={handleNext}
                variant='contained'
                disabled={!canProceedToNext()}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>

        {/* Progress indicator */}
        <Box sx={{ mt: 3 }}>
          <Typography variant='caption' color='textSecondary'>
            Step {activeStep + 1} of {steps.length}
          </Typography>
          <Box
            sx={{
              width: '100%',
              height: 4,
              backgroundColor: 'grey.200',
              borderRadius: 2,
              mt: 1,
            }}
          >
            <Box
              sx={{
                width: `${((activeStep + 1) / steps.length) * 100}%`,
                height: '100%',
                backgroundColor: 'primary.main',
                borderRadius: 2,
                transition: 'width 0.3s ease',
              }}
            />
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default ReturnOrderStepper;
