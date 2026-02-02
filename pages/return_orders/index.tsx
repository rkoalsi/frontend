import { useState, useEffect, useContext } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  Alert,
  Container,
  Dialog,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Chip,
  Pagination,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AssignmentReturnIcon from '@mui/icons-material/AssignmentReturn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import InventoryIcon from '@mui/icons-material/Inventory';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PhoneIcon from '@mui/icons-material/Phone';
import DescriptionIcon from '@mui/icons-material/Description';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import DownloadIcon from '@mui/icons-material/Download';
import Header from '../../src/components/common/Header';
import axios from 'axios';
import { toast } from 'react-toastify';
import AuthContext from '../../src/components/Auth';
import ReturnOrderStepper from '../../src/components/common/ReturnOrderStepper';
import Image from 'next/image';
import capitalize from '../../src/util/capitalize';
import formatAddress from '../../src/util/formatAddress';
import { LocationOn } from '@mui/icons-material';

const ReturnOrderCard = ({ user, returnOrder, onEdit, onDelete }: any) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [expanded, setExpanded] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleDownloadCreditNotePdf = async () => {
    setPdfLoading(true);
    try {
      const response = await axios.get(
        `${process.env.api_url}/return_orders/${returnOrder._id}/download-creditnote-pdf`,
        {
          params: { created_by: user?.data?._id },
          responseType: 'blob',
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `credit_note_${returnOrder._id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Credit Note PDF downloaded');
    } catch (error: any) {
      console.error(error);
      toast.error('Error downloading Credit Note PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleAccordionChange = (
    _event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpanded(isExpanded);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'draft':
        return 'warning';
      case 'approved':
      case 'returned':
        return 'success';
      case 'rejected':
        return 'error';
      case 'processing':
      case 'picked_up':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Card
      sx={{
        width: '100%',
        borderRadius: 3,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        },
      }}
    >
      {/* Header with return order number and status */}
      <Box
        sx={{
          background: 'linear-gradient(45deg, #f44336 30%, #ff5722 90%)',
          color: 'white',
          padding: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 1 : 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssignmentReturnIcon />
          <Typography variant={isMobile ? 'subtitle1' : 'h6'} fontWeight='bold'>
            Return #{returnOrder.return_number || returnOrder._id?.slice(-6)}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label={capitalize(returnOrder.status)}
            color={getStatusColor(returnOrder.status)}
            size='small'
            sx={{ fontWeight: 'bold' }}
          />
          <IconButton
            size='small'
            onClick={() => onEdit(returnOrder)}
            sx={{ color: 'white' }}
          >
            <EditIcon fontSize='small' />
          </IconButton>
          <IconButton
            size='small'
            onClick={() => onDelete(returnOrder)}
            sx={{ color: 'white' }}
          >
            <DeleteIcon fontSize='small' />
          </IconButton>
        </Box>
      </Box>

      <CardContent sx={{ p: 3 }}>
        {/* Customer and Order Info */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: isMobile
              ? '1fr'
              : 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 3,
            mb: 3,
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <PersonIcon color='primary' fontSize='small' />
              <Typography variant='body2' color='textSecondary'>
                Customer
              </Typography>
            </Box>
            <Typography variant='subtitle1' fontWeight='bold'>
              {returnOrder.contact_name || returnOrder.customer_name || 'N/A'}
            </Typography>
            {returnOrder.contact_no && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <PhoneIcon fontSize='small' color='action' />
                <Typography variant='caption' color='textSecondary'>
                  {returnOrder.contact_no}
                </Typography>
              </Box>
            )}
          </Box>

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <CalendarTodayIcon color='primary' fontSize='small' />
              <Typography variant='body2' color='textSecondary'>
                Return Date
              </Typography>
            </Box>
            <Typography variant='subtitle1' fontWeight='bold'>
              {returnOrder.return_form_date
                ? formatDate(returnOrder.return_form_date)
                : returnOrder.return_date
                ? formatDate(returnOrder.return_date)
                : formatDate(returnOrder.created_at) || 'N/A'}
            </Typography>
          </Box>

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <InventoryIcon color='primary' fontSize='small' />
              <Typography variant='body2' color='textSecondary'>
                Items / Boxes
              </Typography>
            </Box>
            <Typography variant='subtitle1' fontWeight='bold'>
              {returnOrder.items?.length || returnOrder.items_count || 0} items
              {returnOrder.box_count && ` / ${returnOrder.box_count} boxes`}
            </Typography>
          </Box>
        </Box>

        {/* Pickup Address */}
        {returnOrder.pickup_address && (
          <Box mb={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <LocationOn color='primary' fontSize='small' />
              <Typography variant='body2' color='textSecondary'>
                Pickup Address
              </Typography>
            </Box>
            <Typography variant='subtitle1' fontWeight='bold'>
              {formatAddress(returnOrder.pickup_address)}
            </Typography>
          </Box>
        )}

        {/* Return Reason */}
        {returnOrder.return_reason && (
          <Box sx={{ mb: 3 }}>
            <Typography variant='body2' color='textSecondary' gutterBottom>
              Return Reason
            </Typography>
            <Alert severity='info' sx={{ backgroundColor: '#f3f4f6' }}>
              {returnOrder.return_reason}
            </Alert>
          </Box>
        )}

        {/* Debit Note Documents */}
        {(() => {
          const docs = returnOrder.debit_note_documents?.length
            ? returnOrder.debit_note_documents
            : returnOrder.debit_note_document
            ? [returnOrder.debit_note_document]
            : [];
          return docs.length > 0 ? (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <DescriptionIcon color='primary' fontSize='small' />
                <Typography variant='body2' color='textSecondary'>
                  Debit Note Documents ({docs.length})
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {docs.map((doc: string, idx: number) => (
                  <Alert
                    key={idx}
                    severity='success'
                    sx={{
                      backgroundColor: '#f0fdf4',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DescriptionIcon fontSize='small' />
                      <a
                        href={doc}
                        target='_blank'
                        rel='noopener noreferrer'
                        style={{
                          color: 'inherit',
                          textDecoration: 'underline',
                          fontWeight: 'bold',
                        }}
                      >
                        Document {idx + 1}
                      </a>
                    </Box>
                  </Alert>
                ))}
              </Box>
            </Box>
          ) : null;
        })()}

        {/* Credit Note Info */}
        {returnOrder.zoho_creditnote_id && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <ReceiptLongIcon color='primary' fontSize='small' />
              <Typography variant='body2' color='textSecondary'>
                Credit Note
              </Typography>
            </Box>
            <Alert
              severity='success'
              sx={{ backgroundColor: '#f0fdf4' }}
              action={
                <Button
                  color='inherit'
                  size='small'
                  startIcon={pdfLoading ? <CircularProgress size={14} /> : <DownloadIcon />}
                  onClick={handleDownloadCreditNotePdf}
                  disabled={pdfLoading}
                >
                  {pdfLoading ? 'Downloading...' : 'Download PDF'}
                </Button>
              }
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant='body2' fontWeight='bold'>
                  {returnOrder.zoho_creditnote_number || 'Credit Note'}
                </Typography>
                {returnOrder.zoho_creditnote_status && (
                  <Chip
                    label={returnOrder.zoho_creditnote_status.toUpperCase()}
                    size='small'
                    color='info'
                    sx={{ ml: 1 }}
                  />
                )}
              </Box>
            </Alert>
          </Box>
        )}

        {/* Return Items Accordion */}
        {returnOrder.items && returnOrder.items.length > 0 && (
          <Accordion expanded={expanded} onChange={handleAccordionChange}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls='return-items-content'
              id='return-items-header'
              sx={{
                backgroundColor: '#f8f9fa',
                borderRadius: 1,
                '&:hover': { backgroundColor: '#e9ecef' },
              }}
            >
              <Typography fontWeight='medium'>
                Return Items ({returnOrder.items.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {returnOrder.items.map((item: any, index: number) => (
                  <Card
                    key={index}
                    sx={{ mb: 1, p: 2, backgroundColor: '#fafafa' }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: 2,
                        alignItems: isMobile ? 'stretch' : 'center',
                      }}
                    >
                      <Box sx={{ flex: '1 1 200px' }}>
                        <Image
                          src={item.image_url || '/placeholder.png'}
                          alt={item.cf_sku_code}
                          width={100}
                          height={100}
                        />
                        <Typography variant='subtitle2' fontWeight='bold'>
                          {item.product_name || item.name}
                        </Typography>
                        <Typography variant='caption' color='textSecondary'>
                          SKU: {item.sku || 'N/A'}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: isMobile
                            ? 'space-between'
                            : 'flex-end',
                          gap: 3,
                        }}
                      >
                        <Box>
                          <Typography variant='body2' color='textSecondary'>
                            Quantity
                          </Typography>
                          <Typography variant='subtitle2' fontWeight='bold'>
                            {item.quantity || 0}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Card>
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};

function ReturnOrders() {
  const { user }: any = useContext(AuthContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [returnOrders, setReturnOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openStepper, setOpenStepper] = useState(false);
  const [currentReturnOrder, setCurrentReturnOrder] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [customer, setCustomer]: any = useState();

  const fetchReturnOrders = async (currentPage = 1, query = '') => {
    if (!user?.data?._id) return;

    try {
      setLoading(true);
      const resp = await axios.get(`${process.env.api_url}/return_orders`, {
        params: {
          created_by: user.data._id,
          search: query,
          page: currentPage,
          limit: 12, // Reduced for better mobile experience
        },
      });
      setReturnOrders(resp.data.return_orders || []);
      setTotalPages(resp.data.pagination?.pages || 1);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch return orders');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (returnOrder: any) => {
    setCurrentReturnOrder(returnOrder);
    setIsEditing(true);
    const customerResponse = await axios.get(
      `${process.env.api_url}/customers/${returnOrder.customer_id}`
    );
    setCustomer(customerResponse.data.customer);
    setOpenStepper(true);
  };

  const handleDelete = async (returnOrder: any) => {
    if (
      window.confirm(
        'Are you sure you want to delete this return order? This action cannot be undone.'
      )
    ) {
      try {
        await axios.delete(
          `${process.env.api_url}/return_orders/${returnOrder._id}`
        );
        toast.success('Return order deleted successfully');
        fetchReturnOrders(page, searchQuery);
      } catch (error) {
        console.error('Error deleting return order:', error);
        toast.error('Failed to delete return order');
      }
    }
  };

  const handleCreateNew = () => {
    setCurrentReturnOrder(null);
    setCustomer(null);
    setIsEditing(false);
    setOpenStepper(true);
  };

  const handleStepperClose = () => {
    setOpenStepper(false);
    setCurrentReturnOrder(null);
    setIsEditing(false);
  };

  const handleStepperSave = () => {
    setOpenStepper(false);
    setCurrentReturnOrder(null);
    setIsEditing(false);
    fetchReturnOrders(page, searchQuery);
  };

  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    newPage: number
  ) => {
    setPage(newPage);
    fetchReturnOrders(newPage, searchQuery);
  };

  useEffect(() => {
    fetchReturnOrders();
  }, [user]);

  // Debounce search to prevent excessive API calls
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPage(1);
      fetchReturnOrders(1, searchQuery);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Convert current return order data for stepper editing
  const getInitialDataForStepper = () => {
    if (!currentReturnOrder || !isEditing) return null;

    return {
      _id: currentReturnOrder._id,
      customer: {
        _id: currentReturnOrder.customer_id,
        name:
          currentReturnOrder.contact_name || currentReturnOrder.customer_name,
      },
      pickupAddress: currentReturnOrder.pickup_address,
      items: currentReturnOrder.items || [],
      returnReason: currentReturnOrder.return_reason,
      returnFormDate: currentReturnOrder.return_form_date
        ? new Date(currentReturnOrder.return_form_date)
            .toISOString()
            .split('T')[0]
        : '',
      contactNo: currentReturnOrder.contact_no || '',
      boxCount: currentReturnOrder.box_count || 1,
      debitNoteDocuments: currentReturnOrder.debit_note_documents?.length
        ? currentReturnOrder.debit_note_documents
        : currentReturnOrder.debit_note_document
        ? [currentReturnOrder.debit_note_document]
        : [],
      referenceNumber: currentReturnOrder.reference_number || '',
    };
  };

  return (
    <Container maxWidth='lg'>
      <Box
        sx={{
          mt: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          mb: 4,
        }}
      >
        <Header title='Return Orders' showBackButton />
        <Alert
          severity='info'
          icon={<AssignmentReturnIcon />}
          sx={{
            mt: 2,
            backgroundColor: '#e3f2fd',
            color: '#1565c0',
            fontWeight: 'medium',
            textAlign: 'center',
          }}
        >
          Manage and track all product return orders from customers
        </Alert>
      </Box>

      {/* Search Bar and Create Button */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          mb: 4,
          width: '100%',
          gap: 2,
          px: isMobile ? 2 : 0,
        }}
      >
        <TextField
          label='Search Return Orders'
          placeholder='Search by customer name, order number, or return reason...'
          variant='outlined'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            flex: 1,
            maxWidth: 500,
            '& .MuiInputBase-input': {
              color: 'white',
            },
            '& .MuiInputLabel-root': {
              color: 'white',
            },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'white',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'white',
            },
            '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline':
              {
                borderColor: 'white',
              },
          }}
          fullWidth={isMobile}
        />
        <Button
          variant='contained'
          startIcon={<AssignmentReturnIcon />}
          onClick={handleCreateNew}
          sx={{
            backgroundColor: '#2e7d32',
            '&:hover': { backgroundColor: '#1b5e20' },
            whiteSpace: 'nowrap',
            minWidth: isMobile ? '100%' : 'auto',
          }}
          fullWidth={isMobile}
        >
          Create Return Order
        </Button>
      </Box>

      {/* Loading State */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress size={40} />
          <Typography sx={{ ml: 2, alignSelf: 'center' }}>
            Loading return orders...
          </Typography>
        </Box>
      ) : returnOrders.length === 0 ? (
        /* No Data State */
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 6,
            textAlign: 'center',
          }}
        >
          <AssignmentReturnIcon
            sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }}
          />
          <Typography variant='h5' color='textSecondary' gutterBottom>
            No Return Orders Found
          </Typography>
          <Typography variant='body1' color='textSecondary' sx={{ mb: 3 }}>
            {searchQuery
              ? `No return orders match your search "${searchQuery}"`
              : 'There are currently no return orders to display'}
          </Typography>
          {searchQuery && (
            <Button
              variant='outlined'
              onClick={() => setSearchQuery('')}
              sx={{ color: 'white', borderColor: 'white' }}
            >
              Clear Search
            </Button>
          )}
        </Box>
      ) : (
        <>
          {/* Return Orders Grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: isMobile
                ? '1fr'
                : 'repeat(auto-fit, minmax(450px, 1fr))',
              gap: 3,
              mb: 4,
              px: isMobile ? 1 : 0,
            }}
          >
            {returnOrders.map((returnOrder) => (
              <ReturnOrderCard
                user={user}
                key={returnOrder._id}
                returnOrder={returnOrder}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </Box>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box
              sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}
            >
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color='primary'
                size={isMobile ? 'medium' : 'large'}
                siblingCount={isMobile ? 0 : 1}
                boundaryCount={isMobile ? 1 : 2}
              />
            </Box>
          )}
        </>
      )}

      {/* Return Order Stepper Dialog */}
      <Dialog
        open={openStepper}
        onClose={handleStepperClose}
        maxWidth={false}
        fullWidth
        fullScreen={isMobile}
        sx={{
          '& .MuiDialog-paper': {
            width: isMobile ? '100%' : '90%',
            maxWidth: isMobile ? 'none' : '1200px',
            height: isMobile ? '100%' : 'auto',
            maxHeight: isMobile ? 'none' : '90vh',
            margin: isMobile ? 0 : 'auto',
          },
        }}
      >
        <ReturnOrderStepper
          customer={customer}
          setCustomer={setCustomer}
          onClose={handleStepperClose}
          onSave={handleStepperSave}
          isEditing={isEditing}
          initialData={getInitialDataForStepper()}
        />
      </Dialog>
    </Container>
  );
}

export default ReturnOrders;
