import React, { useContext, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Skeleton,
  Chip,
  IconButton,
  Paper,
  TextField,
  InputAdornment,
  Tooltip,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Pagination,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import InboxIcon from '@mui/icons-material/Inbox';
import { useTheme } from '@mui/material/styles';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import axios from 'axios';
import AuthContext from '../../../src/components/Auth';
import { toast } from 'react-toastify';
import Header from '../../../src/components/common/Header';

type OrderProduct = {
  pre_order?: boolean;
  pre_order_quantity?: number;
};

type OrderType = {
  _id: string;
  estimate_created?: boolean;
  estimate_number?: string;
  pre_order_estimate_created?: boolean;
  pre_order_estimate_number?: string;
  customer_name: string;
  created_at: string;
  status: string;
  total_amount?: number;
  spreadsheet_created?: boolean;
  products?: OrderProduct[];
};

const hasPreOrderProducts = (order: OrderType): boolean =>
  (order.products ?? []).some(
    (p) => p?.pre_order === true || Number(p?.pre_order_quantity ?? 0) > 0
  );

type FilterType = 'all' | 'draft' | 'accepted' | 'declined' | 'invoiced';

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'declined', label: 'Declined' },
  { value: 'invoiced', label: 'Invoiced' },
];

const STATUS_COLOR: Record<string, 'warning' | 'info' | 'success' | 'error' | 'default'> = {
  draft: 'warning',
  sent: 'info',
  accepted: 'success',
  invoiced: 'success',
  declined: 'error',
};

const listContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const PAGE_SIZE = 10;

const PastOrders = () => {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();
  const { user }: any = useContext(AuthContext);

  const getData = async () => {
    try {
      setLoading(true);
      const queryParams = { status: filterType === 'all' ? '' : filterType, created_by: user?._id };
      const queryString = new URLSearchParams(queryParams).toString();
      const resp = await axios.get(`${process.env.api_url}/orders?${queryString}`);
      setOrders(resp.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setOrderToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setOrderToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!orderToDelete) return;
    try {
      await axios.delete(`${process.env.api_url}/orders/${orderToDelete}`, {
        params: { deleted_by: user?._id },
      });
      toast.success('Order Deleted Successfully');
      setDeleteDialogOpen(false);
      setOrderToDelete(null);
      getData();
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Error Deleting Order');
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesFilter = filterType === 'all' || order.status.toLowerCase() === filterType;
    const matchesSearch =
      !search.trim() ||
      order.customer_name.toLowerCase().includes(search.trim().toLowerCase()) ||
      (order.estimate_number || '').toLowerCase().includes(search.trim().toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalPages = Math.ceil(filteredOrders.length / PAGE_SIZE);
  const pagedOrders = filteredOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    getData();
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: { xs: '100%', sm: 720, md: 960, lg: 1100 },
        mx: 'auto',
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 2, sm: 3 },
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Header title='Past Orders' showBackButton backUrl='/' />

      {/* Filter chips + search row */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 1.5,
          alignItems: { xs: 'stretch', sm: 'center' },
          flexWrap: 'wrap',
        }}
      >
        {/* Filter chips */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {FILTER_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              label={opt.label}
              onClick={() => setFilterType(opt.value)}
              color={filterType === opt.value ? 'primary' : 'default'}
              variant={filterType === opt.value ? 'filled' : 'outlined'}
              sx={{ fontWeight: filterType === opt.value ? 700 : 400, cursor: 'pointer' }}
            />
          ))}
        </Box>

        {/* Search */}
        <TextField
          size='small'
          placeholder='Search by customer…'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <SearchIcon fontSize='small' />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 220, ml: { sm: 'auto' } }}
        />
      </Box>

      {/* Result count */}
      {!loading && (
        <Typography variant='body2' color='text.secondary'>
          {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
        </Typography>
      )}

      {/* List */}
      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant='rectangular' height={110} sx={{ borderRadius: 2 }} />
          ))}
        </Box>
      ) : filteredOrders.length === 0 ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1.5,
            py: 8,
            color: 'text.secondary',
          }}
        >
          <InboxIcon sx={{ fontSize: 56, opacity: 0.35 }} />
          <Typography variant='body1'>No orders found.</Typography>
        </Box>
      ) : (
        <>
        <Box
          component={motion.div}
          variants={listContainerVariants}
          initial='hidden'
          animate='visible'
          sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
        >
          {pagedOrders.map((order) => {
            const statusKey = order.status.toLowerCase();
            const statusColor = STATUS_COLOR[statusKey] ?? 'default';
            const isEditable = !['declined', 'accepted', 'invoiced'].includes(statusKey);
            const title = order.estimate_created
              ? order.estimate_number
              : `Order #${order._id.slice(-6)}`;
            const isPreOrder = hasPreOrderProducts(order);

            return (
              <motion.div key={order._id} variants={cardVariants}>
                <Paper
                  onClick={() => router.push(`/orders/past/${order._id}`)}
                  elevation={0}
                  sx={{
                    p: { xs: 2, sm: 2 },
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderLeft: '4px solid',
                    borderLeftColor: `${statusColor}.main`,
                    cursor: 'pointer',
                    transition: 'box-shadow 0.2s, border-color 0.2s',
                    '&:hover': { boxShadow: 4, borderColor: 'primary.main' },
                    // Desktop: single row
                    display: { sm: 'flex' },
                    flexDirection: { sm: 'row' },
                    alignItems: { sm: 'center' },
                    gap: { sm: 2 },
                  }}
                >
                  {/* ── MOBILE layout ── */}
                  <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                    {/* Row 1: title + amount */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                      <Typography variant='h6' fontWeight={700} color='text.primary' sx={{ lineHeight: 1.25, mr: 1 }}>
                        {title}
                      </Typography>
                      <Typography variant='h6' fontWeight={700} color='text.primary' sx={{ whiteSpace: 'nowrap' }}>
                        ₹{(order.total_amount ?? 0).toLocaleString('en-IN')}
                      </Typography>
                    </Box>
                    {/* Row 2: customer */}
                    <Typography variant='body1' color='text.secondary' sx={{ mb: 0.5 }}>
                      {order.customer_name}
                    </Typography>
                    {/* Row 3: date + chips + actions */}
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 0.5 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                        <Typography variant='caption' color='text.secondary'>
                          {new Date(order.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </Typography>
                        <Chip
                          label={order.status.charAt(0).toUpperCase() + order.status.slice(1).toLowerCase()}
                          color={statusColor}
                          size='small'
                          sx={{ fontWeight: 600 }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        {isPreOrder && (
                          <Chip label='Pre Order' color='warning' size='small' sx={{ fontWeight: 600 }} onClick={(e) => e.stopPropagation()} />
                        )}
                        {order.estimate_created && (
                          <Chip label='Estimate' color='success' size='small' variant='outlined' onClick={(e) => e.stopPropagation()} />
                        )}
                        {order.pre_order_estimate_created && (
                          <Chip
                            label={order.pre_order_estimate_number || 'Pre-Order'}
                            size='small'
                            color='warning'
                            variant='outlined'
                            sx={{ fontSize: '0.7rem' }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                        {order.spreadsheet_created && (
                          <Chip label='XLSX' color='primary' size='small' variant='outlined' onClick={(e) => e.stopPropagation()} />
                        )}
                      </Box>
                      {!order.estimate_created && (
                        <Box sx={{ display: 'flex', gap: 0.25 }}>
                          <Tooltip title={isEditable ? 'Edit order' : 'Cannot edit'}>
                            <span>
                              <IconButton
                                size='small'
                                disabled={!isEditable}
                                color='primary'
                                onClick={() => router.push(`/orders/new/${order._id}`)}
                              >
                                <EditIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title='Delete order'>
                            <IconButton size='small' color='error' onClick={() => handleDeleteClick(order._id)}>
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                    </Box>
                  </Box>

                  {/* ── DESKTOP layout ── */}
                  <Box sx={{ display: { xs: 'none', sm: 'contents' } }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant='subtitle1' fontWeight={700} noWrap color='text.primary'>
                        {title}
                      </Typography>
                      <Typography variant='body2' color='text.secondary' noWrap>
                        {order.customer_name}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
                      <Chip
                        label={order.status.charAt(0).toUpperCase() + order.status.slice(1).toLowerCase()}
                        color={statusColor}
                        size='small'
                        sx={{ fontWeight: 600 }}
                      />
                      {isPreOrder && (
                        <Chip label='Pre Order' color='info' size='small' sx={{ fontWeight: 600 }} />
                      )}
                      {order.estimate_created && (
                        <Chip label='Estimate' color='success' size='small' variant='outlined' />
                      )}
                      {order.pre_order_estimate_created && (
                        <Chip
                          label={order.pre_order_estimate_number || 'Pre-Order'}
                          size='small'
                          color='warning'
                          variant='outlined'
                          sx={{ fontSize: '0.7rem' }}
                        />
                      )}
                      {order.spreadsheet_created && (
                        <Chip label='XLSX' color='primary' size='small' variant='outlined' />
                      )}
                    </Box>
                    <Typography
                      variant='subtitle2'
                      fontWeight={700}
                      color='text.primary'
                      sx={{ minWidth: 80, textAlign: 'right' }}
                    >
                      ₹{(order.total_amount ?? 0).toLocaleString('en-IN')}
                    </Typography>
                    {!order.estimate_created && (
                      <Box
                        sx={{ display: 'flex', gap: 0.5 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Tooltip title={isEditable ? 'Edit order' : 'Cannot edit'}>
                          <span>
                            <IconButton
                              size='small'
                              disabled={!isEditable}
                              color='primary'
                              onClick={() => router.push(`/orders/new/${order._id}`)}
                            >
                              <EditIcon fontSize='small' />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title='Delete order'>
                          <IconButton size='small' color='error' onClick={() => handleDeleteClick(order._id)}>
                            <DeleteIcon fontSize='small' />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                  </Box>
                </Paper>
              </motion.div>
            );
          })}
        </Box>
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, pt: 1 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, val) => { setPage(val); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              color='primary'
              shape='rounded'
              siblingCount={1}
              boundaryCount={1}
            />
            <Box
              component='form'
              onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                const input = (e.currentTarget.elements.namedItem('jumpPage') as HTMLInputElement).value;
                const num = parseInt(input, 10);
                if (num >= 1 && num <= totalPages) {
                  setPage(num);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  (e.currentTarget.elements.namedItem('jumpPage') as HTMLInputElement).value = '';
                }
              }}
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <Typography variant='body2' color='text.secondary'>
                Go to page
              </Typography>
              <TextField
                name='jumpPage'
                size='small'
                type='number'
                slotProps={{ htmlInput: { min: 1, max: totalPages } }}
                sx={{ width: 72 }}
              />
              <Button type='submit' size='small' variant='outlined' sx={{ borderRadius: 2 }}>
                Go
              </Button>
            </Box>
          </Box>
        )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Order?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This action is permanent and cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color='error' variant='contained' autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PastOrders;
