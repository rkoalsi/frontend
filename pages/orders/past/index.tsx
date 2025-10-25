import React, { useContext, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  Divider,
  Skeleton,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useMediaQuery,
  Paper,
  styled,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useTheme } from '@mui/material/styles';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import axios from 'axios';
import AuthContext from '../../../src/components/Auth';
import { toast } from 'react-toastify';
import CustomButton from '../../../src/components/common/Button';
import Header from '../../../src/components/common/Header';

type OrderType = {
  _id: string;
  estimate_created?: boolean;
  estimate_number?: string;
  customer_name: string;
  created_at: string;
  status: string;
  total_amount?: number;
};

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  background:
    'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0))',
  borderRadius: 18,
  border: '1px solid rgba(255, 255, 255, 0.2)',
  boxShadow: '0px 6px 25px rgba(0,0,0,0.3)',
  width: '100%',
  maxWidth: '600px',
  marginBottom: theme.spacing(3),
}));

// Container variants for staggered animations
const listContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

// Card motion variants with a slightly larger hover effect
const cardVariants = {
  hidden: { opacity: 0, y: 25 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
  hover: { scale: 1.04 },
  tap: { scale: 0.98 },
};

const PastOrders = () => {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [filterType, setFilterType] = useState<
    'all' | 'draft' | 'accepted' | 'declined' | 'invoiced'
  >('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();
  const { user }: any = useContext(AuthContext);

  // Fetch orders from the backend
  const getData = async () => {
    try {
      setLoading(true);
      const queryParams = {
        status: filterType === 'all' ? '' : filterType,
        created_by: user?.data?._id,
      };
      const queryString = new URLSearchParams(queryParams).toString();
      const resp = await axios.get(
        `${process.env.api_url}/orders?${queryString}`
      );
      setOrders(resp.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Navigate to order details page
  const handleOrderClick = (id: string) => {
    router.push(`/orders/past/${id}`);
  };

  // Open delete confirmation dialog
  const handleDeleteClick = (id: string) => {
    setOrderToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Close delete confirmation dialog
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setOrderToDelete(null);
  };

  // Delete a specific order after confirmation
  const handleDeleteConfirm = async () => {
    if (!orderToDelete) return;

    try {
      await axios.delete(`${process.env.api_url}/orders/${orderToDelete}`);
      toast.success(`Order Deleted Successfully`);
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
      getData();
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error(`Error Deleting Order`);
    }
  };

  // Filter orders based on selected dropdown value
  const filteredOrders = orders.filter((order) =>
    filterType === 'all' ? true : order.status.toLowerCase() === filterType
  );

  useEffect(() => {
    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType]);

  return (
    <Box
      display='flex'
      flexDirection='column'
      alignItems='center'
      sx={{
        width: '100%',
        gap: 2,
        padding: isMobile ? 2 : 4,
      }}
    >
      {/* Reusable Header with Back Button */}
      <Header title='Past Orders' showBackButton />

      {/* Dropdown for filtering orders */}
      <FormControl
        variant='outlined'
        sx={{ minWidth: isMobile ? 200 : 250, color: 'white' }}
      >
        <InputLabel id='order-filter-label' sx={{ color: 'white' }}>
          Filter Orders
        </InputLabel>
        <Select
          labelId='order-filter-label'
          value={filterType}
          label='Filter Orders'
          onChange={(e) =>
            setFilterType(
              e.target.value as
              | 'all'
              | 'draft'
              | 'accepted'
              | 'declined'
              | 'invoiced'
            )
          }
          sx={{
            color: 'white',
            '.MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: 'white',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'white',
            },
          }}
        >
          <MenuItem value='all'>All Orders</MenuItem>
          <MenuItem value='draft'>Draft Orders</MenuItem>
          <MenuItem value='accepted'>Accepted Orders</MenuItem>
          <MenuItem value='declined'>Declined Orders</MenuItem>
          <MenuItem value='invoiced'>Invoiced Orders</MenuItem>
        </Select>
      </FormControl>

      {/* Orders List */}
      {loading ? (
        <Box sx={{ width: '100%', maxWidth: '600px', mt: 4 }}>
          <Skeleton variant='rectangular' height={100} sx={{ mb: 2 }} />
          <Skeleton variant='rectangular' height={100} sx={{ mb: 2 }} />
          <Skeleton variant='rectangular' height={100} />
        </Box>
      ) : (
        <StyledPaper>
          {filteredOrders.length > 0 ? (
            <Box
              component={motion.div}
              variants={listContainerVariants}
              initial='hidden'
              animate='visible'
            >
              {filteredOrders.map((order: any, index) => (
                <motion.div
                  key={order._id}
                  variants={cardVariants}
                  whileHover='hover'
                  whileTap='tap'
                >
                  <ListItem
                    onClick={() => handleOrderClick(order._id)}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      padding: 2,
                      cursor: 'pointer',
                      backgroundColor: 'white',
                      border: '2px solid #475569',
                      borderRadius: 2,
                      mb: 2,
                    }}
                  >
                    <Box
                      display='flex'
                      flexDirection='row'
                      alignItems='center'
                      justifyContent='space-between'
                      sx={{ width: '100%' }}
                    >
                      <Typography variant='h6' fontWeight='bold' color='black'>
                        {order.estimate_created
                          ? order.estimate_number
                          : `Order #${order._id.slice(-6)}`}
                      </Typography>
                      {!order.estimate_created && (
                        <Box display='flex' alignItems='center' gap={2}>
                          <IconButton
                            disabled={['declined', 'accepted', 'invoiced'].includes(
                              order?.status?.toLowerCase()
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/orders/new/${order._id}`);
                            }}
                            aria-label='edit order'
                            color='primary'
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(order._id);
                            }}
                            aria-label='delete order'
                            color='error'
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      )}
                    </Box>
                    <Typography variant='body2' color='black'>
                      Customer: {order.customer_name}
                    </Typography>
                    <Typography variant='body2' color='black'>
                      Date: {new Date(order.created_at).toLocaleDateString()}
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        alignItems: isMobile ? 'flex-start' : 'center',
                        gap: isMobile ? 1 : 1,
                        mt: 1,
                        width: '100%',
                        justifyContent: 'space-between',
                      }}
                    >
                      {/* Chips Container */}
                      <Box
                        sx={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          gap: 0.5,
                          flex: 1,
                        }}
                      >
                        <Chip
                          label={
                            order.status.charAt(0).toUpperCase() +
                            order.status.slice(1).toLowerCase()
                          }
                          color={
                            order.status.toLowerCase() === 'draft' ||
                              order.status.toLowerCase() === 'sent'
                              ? 'default'
                              : order.status.toLowerCase() === 'accepted' ||
                                order.status.toLowerCase() === 'invoiced'
                                ? 'success'
                                : 'error'
                          }
                          sx={{
                            fontWeight: 'bold',
                            fontSize: isMobile ? '0.75rem' : '0.85rem',
                            height: isMobile ? 24 : 'auto',
                            color: 'black',
                            '& .MuiChip-label': {
                              padding: isMobile ? '0 8px' : '0 12px',
                            },
                          }}
                        />
                        {order?.estimate_created && (
                          <Chip
                            label={'Estimate Created'}
                            color={'success'}
                            sx={{
                              fontWeight: 'bold',
                              fontSize: isMobile ? '0.75rem' : '0.85rem',
                              height: isMobile ? 24 : 'auto',
                              color: 'black',
                              '& .MuiChip-label': {
                                padding: isMobile ? '0 8px' : '0 12px',
                              },
                            }}
                          />
                        )}
                        {order?.spreadsheet_created && (
                          <Chip
                            label={'XLSX Created'}
                            color={'success'}
                            sx={{
                              fontWeight: 'bold',
                              fontSize: isMobile ? '0.75rem' : '0.85rem',
                              height: isMobile ? 24 : 'auto',
                              color: 'black',
                              '& .MuiChip-label': {
                                padding: isMobile ? '0 8px' : '0 12px',
                              },
                            }}
                          />
                        )}
                      </Box>

                      {/* Total Amount */}
                      <Typography
                        variant='body1'
                        fontWeight='bold'
                        sx={{
                          color: 'black',
                          fontSize: isMobile ? '0.9rem' : '1rem',
                          mt: isMobile ? 0.5 : 0,
                          alignSelf: isMobile ? 'flex-end' : 'center',
                        }}
                      >
                        ₹{order.total_amount || 0}
                      </Typography>
                    </Box>
                  </ListItem>
                  {index < filteredOrders.length - 1 && <Divider />}
                </motion.div>
              ))}
            </Box>
          ) : (
            <Typography
              variant='body1'
              align='center'
              sx={{ p: 2, color: 'white' }}
            >
              No past orders available.
            </Typography>
          )}
        </StyledPaper>
      )}

      {/* Navigation Buttons */}
      <Box display='flex' justifyContent='center' gap={1} sx={{ mt: 2 }}>
        <CustomButton
          color='secondary'
          onClick={() => router.push('/')}
          text='Go Back'
        />
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby='delete-dialog-title'
        aria-describedby='delete-dialog-description'
      >
        <DialogTitle id='delete-dialog-title'>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <DialogContentText id='delete-dialog-description'>
            Are you sure you want to delete this order? This action is irreversible and cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color='primary'>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color='error' variant='contained' autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PastOrders;
