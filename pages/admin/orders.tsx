import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Button,
  Drawer,
  capitalize,
  TablePagination,
  TextField,
  Checkbox,
  FormControlLabel,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  useTheme,
  Chip,
  FormGroup,
  Divider,
} from '@mui/material';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';
import {
  Delete,
  Download,
  Edit,
  FilterAlt,
  Visibility,
} from '@mui/icons-material';
import axiosInstance from '../../src/util/axios';
import axios from 'axios';
import SingleImagePopupDialog from '../../src/components/common/SingleImagePopUp';
import AuthContext from '../../src/components/Auth';

const Orders = () => {
  const router = useRouter();
  const theme: any = useTheme();
  const { user }: any = useContext(AuthContext);
  const isAdmin = user?.role === 'admin';
  // Orders data
  const [orders, setOrders] = useState([]);

  // App settings — minimum order value for self-registered customers
  const [minOrderValue, setMinOrderValue] = useState<string>('');
  const [settingsSaving, setSettingsSaving] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    axiosInstance
      .get('/admin/settings')
      .then((r) =>
        setMinOrderValue(String(r.data?.min_order_value_self_registered ?? ''))
      )
      .catch(() => {});
  }, [isAdmin]);

  const handleSaveSettings = async () => {
    const val = parseFloat(minOrderValue);
    if (isNaN(val) || val < 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setSettingsSaving(true);
    try {
      await axiosInstance.put('/admin/settings', {
        min_order_value_self_registered: val,
      });
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSettingsSaving(false);
    }
  };

  // Pagination states
  const [page, setPage] = useState(0); // 0-based current page
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0); // total number of orders from backend
  const [totalPagesCount, setTotalPageCount] = useState(0); // total number of orders from backend

  // "Go to page" input
  const [skipPage, setSkipPage] = useState('');

  // Loading and selected order
  const [loading, setLoading] = useState(true);
  const [orderLoading, setOrderLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [orderDocs, setOrderDocs] = useState<any>(null);
  const [orderDocsLoading, setOrderDocsLoading] = useState(false);
  const [openFilterModal, setOpenFilterModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterSalesPerson, setFilterSalesPerson] = useState<string>('');
  const [filterEstimatesCreated, setFilterEstimatesCreated] =
    useState<boolean>(false);
  const [filterEstimatesGreaterThanZero, setFilterEstimatesGreaterThanZero] =
    useState<boolean>(false);
  const [filterHasPreOrder, setFilterHasPreOrder] = useState<boolean>(false);
  const [salesPeople, setSalesPeople] = useState<string[]>([
    'SP1',
    'SP2',
    'SP3',
    'SP4',
    'SP5',
    'SP6',
    'SP7',
    'SP8',
    'SP9',
    'SP10',
    'SP11',
    'SP12',
    'SP13',
    'SP14',
    'SP15',
    'SP16',
    'SP17',
    'SP18',
    'SP19',
    'SP20',
    'SP21',
  ]);
  const [openImagePopup, setOpenImagePopup] = useState(false);
  const [popupImageSrc, setPopupImageSrc] = useState('');
  const [searchEstimateNumber, setSearchEstimateNumber] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [searchKey, setSearchKey] = useState(0);

  const [changeCreatorDialogOpen, setChangeCreatorDialogOpen] =
    useState<boolean>(false);
  const [loadingCreatorUpdate, setLoadingCreatorUpdate] =
    useState<boolean>(false);

  // Estimate-selection dialog (choose in-stock / pre-order estimate for an action)
  const [estimateSelectOpen, setEstimateSelectOpen] = useState<boolean>(false);
  const [estimateActionOrder, setEstimateActionOrder] = useState<any>(null);
  const [pendingAction, setPendingAction] = useState<
    'draft' | 'accepted' | 'declined'
  >('draft');
  const [estimateTypes, setEstimateTypes] = useState<{
    stock: boolean;
    pre_order: boolean;
  }>({ stock: true, pre_order: true });

  useEffect(() => {
    const fetchSalesPeople = async () => {
      try {
        const response = await axiosInstance.get(`/admin/sales-people`);
        setSalesPeople(response.data.sales_people);
      } catch (error) {
        console.error(error);
        toast.error('Error fetching sales people.');
      }
    };

    fetchSalesPeople();
  }, []);

  const handleChangeCreator = useCallback(
    async (newCreator: any) => {
      setLoadingCreatorUpdate(true);
      try {
        console.log(newCreator);
        await axiosInstance.put(`/orders/${selectedOrder._id}`, {
          created_by: newCreator._id,
        });
        setSelectedOrder((prev: any) => ({
          ...prev,
          created_by_info: newCreator,
        }));

        setChangeCreatorDialogOpen(false);
        toast.success('Order creator updated successfully');
        await fetchOrders();
      } catch (error) {
        console.error('Error updating order creator:', error);
        toast.error('Failed to update order creator');
      } finally {
        setLoadingCreatorUpdate(false);
      }
    },
    [selectedOrder]
  );
  const handleImageClick = useCallback((src: string) => {
    setPopupImageSrc(src);
    setOpenImagePopup(true);
  }, []);
  const handleDownloadXLSX = async () => {
    try {
      const params: any = {
        ...(filterStartDate && { start_date: filterStartDate }),
        ...(filterEndDate && { end_date: filterEndDate }),
        ...(searchEstimateNumber && { estimate_number: searchEstimateNumber }),
      };

      if (filterStatus) params.status = filterStatus;
      if (filterSalesPerson) params.sales_person = filterSalesPerson;
      if (filterEstimatesCreated)
        params.estimate_created = filterEstimatesCreated;
      if (filterEstimatesGreaterThanZero) params.amount = true;
      if (filterHasPreOrder) params.has_pre_order = true;
      console.log(params);
      const response = await axiosInstance.get('/admin/orders/export', {
        params,
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `orders_${new Date().toISOString()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading XLSX:', error);
      toast.error('Failed to download XLSX file.');
    }
  };
  const handleClosePopup = useCallback(() => {
    setOpenImagePopup(false);
  }, []);
  const applyFilters = () => {
    setOpenFilterModal(false);
    triggerSearch();
  };
  // Fetch orders from the server
  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Build query parameters based on filters
      const params: any = {
        page,
        limit: rowsPerPage,
        ...(filterStartDate && { start_date: filterStartDate }),
        ...(filterEndDate && { end_date: filterEndDate }),
        ...(searchEstimateNumber && { estimate_number: searchEstimateNumber }),
      };

      if (filterStatus) params.status = filterStatus;
      if (filterSalesPerson) params.sales_person = filterSalesPerson;
      if (filterEstimatesCreated)
        params.estimate_created = filterEstimatesCreated;
      if (filterEstimatesGreaterThanZero) params.amount = true;
      if (filterHasPreOrder) params.has_pre_order = true;
      const response = await axiosInstance.get(`/admin/orders`, {
        params,
      });

      // The backend returns { orders, total_count, total_pages }
      const { orders, total_count, total_pages } = response.data;

      setOrders(orders);
      setTotalCount(total_count);
      setTotalPageCount(total_pages);
    } catch (error) {
      console.error(error);
      toast.error('Error fetching orders.');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch orders whenever page, rowsPerPage, or search is triggered
  useEffect(() => {
    fetchOrders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, searchKey]);

  // Deep-link: open a specific order's drawer when arriving via ?order_id=
  useEffect(() => {
    if (!router.isReady) return;
    const oid = router.query.order_id;
    if (!oid || typeof oid !== 'string') return;
    (async () => {
      try {
        const { data } = await axiosInstance.get('/admin/orders', {
          params: { order_id: oid, limit: 1 },
        });
        const order = data?.orders?.[0];
        if (order) {
          setSelectedOrder(order);
          setDrawerOpen(true);
        } else {
          toast.error('Order not found.');
        }
      } catch {
        toast.error('Failed to load the linked order.');
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query.order_id]);

  // MUI Pagination: next/previous
  const handleChangePage = (event: any, newPage: number) => {
    setPage(newPage);
    setSkipPage(''); // reset skipPage so text field shows the new page
  };

  // MUI Pagination: rows per page
  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    setSkipPage('');
  };

  // "Go to page" button or Enter
  const handleSkipPage = () => {
    const requestedPage = parseInt(skipPage, 10);
    if (isNaN(requestedPage) || requestedPage < 1) {
      toast.error('Invalid page number');
      return;
    }
    // Our internal page is 0-based; user typed 1-based
    setPage(requestedPage - 1);
    setSkipPage(''); // clear input so it displays the new page on next render
  };

  // Drawer logic
  const handleViewDetails = (order: any) => {
    console.log(order);
    setSelectedOrder(order);
    setDrawerOpen(true);
  };

  // Fetch downstream Zoho documents (sales orders + invoices) for the open order
  useEffect(() => {
    if (!drawerOpen || !selectedOrder?._id) {
      setOrderDocs(null);
      return;
    }
    let cancelled = false;
    setOrderDocsLoading(true);
    (async () => {
      try {
        const { data } = await axiosInstance.get(
          `/orders/${selectedOrder._id}/documents`
        );
        if (!cancelled) setOrderDocs(data);
      } catch {
        if (!cancelled) setOrderDocs(null);
      } finally {
        if (!cancelled) setOrderDocsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [drawerOpen, selectedOrder?._id]);

  // Download a sales-order or invoice PDF from Zoho by its id
  const handleDownloadDoc = async (
    kind: 'salesorder' | 'invoice',
    id: string,
    label: string
  ) => {
    try {
      const apiUrl = `${process.env.api_url}/orders/download_${kind}/${id}`;
      const resp = await axios.get(apiUrl, { responseType: 'blob' });
      if (resp.data.type !== 'application/pdf') {
        toast.error(`Could not download ${label}`);
        return;
      }
      const blob = new Blob([resp.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${label}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      toast.error(error.message || `Failed to download ${label}`);
    }
  };

  const handleDownload = async (order: any, type?: 'pre_order') => {
    try {
      const apiUrl =
        type === 'pre_order'
          ? `${process.env.api_url}/orders/download_pdf/${order._id}?type=pre_order`
          : `${process.env.api_url}/orders/download_pdf/${order._id}`;
      const resp = await axios.get(apiUrl, {
        responseType: 'blob', // Receive the response as binary data
      });

      // Check if the blob is an actual PDF or an error message
      if (resp.data.type !== 'application/pdf') {
        // Convert to text to read the error response
        toast.error('Draft Estimate Not Created');
        return;
      }

      // Extract filename from headers or set default
      const contentDisposition = resp.headers['content-disposition'];
      let fileName =
        type === 'pre_order'
          ? `${order.pre_order_estimate_number}.pdf`
          : `${order.estimate_number}.pdf`;

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
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      toast.error(error.message || 'Failed to download PDF');
    }
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedOrder(null);
  };
  const getStatusChipColor = (status: string): 'default' | 'warning' | 'info' | 'success' | 'error' | 'primary' => {
    switch (status?.toLowerCase()) {
      case 'draft': return 'warning';
      case 'sent': return 'info';
      case 'accepted': return 'primary';
      case 'invoiced': return 'success';
      case 'declined': return 'error';
      case 'deleted': return 'error';
      default: return 'default';
    }
  };

  const getPaymentChipColor = (
    status?: string
  ): 'default' | 'warning' | 'success' | 'error' | 'info' => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'success';
      case 'failed': return 'error';
      case 'cod': return 'info';
      case 'pending':
      case 'created': return 'warning';
      default: return 'default';
    }
  };

  const getPaymentChipLabel = (status: string): string =>
    status.toLowerCase() === 'cod' ? 'COD' : capitalize(status);

  // Resolve a human name for who created the order. Self-registered B2B
  // customers place their own orders and may not have a `name` on their user
  // record (it's only their shop/contact), so fall back to first/last name,
  // the order's customer name, and finally a "Self-Registered Customer" label
  // instead of the misleading "Unknown".
  const getCreatedByLabel = (order: any): string => {
    const info = order?.created_by_info || {};
    const fullName = [info.first_name, info.last_name]
      .filter(Boolean)
      .join(' ')
      .trim();
    if (info.name) return info.name;
    if (fullName) return fullName;
    if (info.self_registered || info.role === 'customer') {
      return order?.customer_name
        ? `${order.customer_name} (Self-Registered)`
        : 'Self-Registered Customer';
    }
    return order?.customer_name || 'Unknown';
  };

  const triggerSearch = () => {
    setPage(0);
    setSearchKey(k => k + 1);
  };
  // Re-run the post-payment Zoho chain (idempotent — finishes failed steps,
  // e.g. a customer payment that hit a number conflict).
  const [retryingChain, setRetryingChain] = useState(false);
  const handleRetryChain = async () => {
    if (!selectedOrder?._id) return;
    setRetryingChain(true);
    try {
      const resp = await axiosInstance.post(
        `/admin/orders/${selectedOrder._id}/retry_payment_chain`
      );
      toast.success(resp.data?.message || 'Zoho payment chain completed');
      setDrawerOpen(false);
      fetchOrders();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.detail || 'Failed to re-run the Zoho payment chain'
      );
    } finally {
      setRetryingChain(false);
    }
  };

  const handleDelete = async (order: any) => {
    setOrderLoading(true);
    try {
      const resp = await axiosInstance.delete(`/orders/${order._id}`, {
        params: { deleted_by: user?._id }
      });
      console.log(resp.data);
      if (resp.status === 200) {
        toast.success('Order Deleted Successfully');
      }
    } catch (error: any) {
      toast.error(error.response.data.detail || 'Error Deleting Order');
    } finally {
      setOrderLoading(false);
    }
  };
  const handleEnd = async (
    order: any,
    status = 'draft',
    createFlags?: { stock: boolean; pre_order: boolean }
  ) => {
    const base = `${process.env.api_url}`;
    setOrderLoading(true);
    try {
      const resp = await axiosInstance.post(`${base}/orders/finalise`, {
        order_id: order._id,
        status,
        create_stock: createFlags?.stock ?? true,
        create_pre_order: createFlags?.pre_order ?? true,
      });
      console.log(resp.data);
      if (resp.status === 200) {
        if (resp.data.status == 'success') {
          toast.success(resp.data.message);
        } else {
          toast.error(resp.data.message);
        }
      }
      await fetchOrders();
    } catch (error) {
      console.log(error);
    } finally {
      setOrderLoading(false);
    }
  };

  // ── Pre-order / in-stock helpers ──────────────────────────────────
  // Saved order products carry `pre_order`, `quantity` and `pre_order_quantity`
  // (but not live `stock`). A split product (pre_order with both portions) keeps
  // a separate `pre_order_quantity`; a pure pre-order product carries its qty in
  // `quantity`.
  const productIsSplit = (p: any) =>
    !!p?.pre_order && Number(p?.pre_order_quantity) > 0;

  const orderHasStockItems = (o: any) =>
    (o?.products || []).some((p: any) =>
      productIsSplit(p)
        ? Number(p.quantity) > 0
        : !p.pre_order && Number(p.quantity) > 0
    );

  const orderHasPreOrderItems = (o: any) =>
    (o?.products || []).some((p: any) =>
      p.pre_order
        ? productIsSplit(p)
          ? Number(p.pre_order_quantity) > 0
          : Number(p.quantity) > 0
        : false
    );

  // Whether an order has both an in-stock and a pre-order dimension, so the
  // admin must choose which estimate(s) the action applies to.
  const orderNeedsEstimateChoice = (o: any) => {
    const hasStock = orderHasStockItems(o) || !!o?.estimate_created;
    const hasPreOrder = orderHasPreOrderItems(o) || !!o?.pre_order_estimate_created;
    return hasStock && hasPreOrder;
  };

  // Entry point for the Save As Draft / Accept / Decline buttons.
  const handleEstimateAction = (
    order: any,
    status: 'draft' | 'accepted' | 'declined'
  ) => {
    if (orderNeedsEstimateChoice(order)) {
      setEstimateActionOrder(order);
      setPendingAction(status);
      // draft → create the estimates that don't exist yet;
      // accept/decline → target the estimates that already exist.
      setEstimateTypes(
        status === 'draft'
          ? {
              stock: !order?.estimate_created,
              pre_order: !order?.pre_order_estimate_created,
            }
          : {
              stock: !!order?.estimate_created,
              pre_order: !!order?.pre_order_estimate_created,
            }
      );
      setEstimateSelectOpen(true);
    } else {
      handleEnd(order, status);
    }
  };
  return (
    <Box sx={{ padding: 3 }}>
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          borderRadius: 4,
                  }}
      >
        <Box
          display={'flex'}
          flexDirection={'row'}
          justifyContent={'space-between'}
          alignItems={'center'}
        >
          <Typography variant='h4' gutterBottom sx={{ fontWeight: 'bold' }}>
            All Orders
          </Typography>
          <Box display='flex' alignItems='center' gap={2}>
            <TextField
              label='Search Estimate Number'
              variant='outlined'
              size='small'
              value={searchEstimateNumber}
              onChange={(e) => setSearchEstimateNumber(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && triggerSearch()}
            />
            <Button
              variant='contained'
              color='primary'
              onClick={triggerSearch}
            >
              Search
            </Button>
            <Button
              variant='contained'
              startIcon={<Download />}
              onClick={handleDownloadXLSX}
            >
              Export
            </Button>
            <IconButton onClick={() => setOpenFilterModal(true)}>
              <FilterAlt />
            </IconButton>
          </Box>
        </Box>
        <Typography variant='body1' sx={{ marginBottom: 3 }} color='text.secondary'>
          View and manage all orders below.
        </Typography>

        {/* Order settings — minimum order value for self-registered customers */}
        {isAdmin && (
          <Paper
            variant='outlined'
            sx={{
              p: { xs: 2, sm: 2.5 },
              borderRadius: 2,
              mb: 3,
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { sm: 'center' },
              gap: 2,
            }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography variant='subtitle1' fontWeight={600}>
                Order Settings
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Minimum cart value before a self-registered customer can place
                an order (online payment or cash/cheque on delivery).
              </Typography>
            </Box>
            <TextField
              label='Min order value (₹)'
              type='number'
              size='small'
              value={minOrderValue}
              onChange={(e) => setMinOrderValue(e.target.value)}
              sx={{ width: { xs: '100%', sm: 200 } }}
            />
            <Button
              variant='contained'
              onClick={handleSaveSettings}
              disabled={settingsSaving}
              startIcon={
                settingsSaving ? (
                  <CircularProgress size={16} color='inherit' />
                ) : undefined
              }
            >
              {settingsSaving ? 'Saving…' : 'Save'}
            </Button>
          </Paper>
        )}

        {loading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '200px',
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <>
            {orders.length > 0 ? (
              <>
                {/* Orders Table */}
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Created At</TableCell>
                        <TableCell>Estimate Created</TableCell>
                        <TableCell>Spreadsheet Created</TableCell>
                        <TableCell>Order ID</TableCell>
                        <TableCell>Customer Name</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Payment Status</TableCell>
                        <TableCell>Created By</TableCell>
                        <TableCell>Total Amount</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orders.map((order: any) => (
                        <TableRow key={order._id}>
                          <TableCell>
                            {new Date(order.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Checkbox
                              disabled
                              checked={order?.estimate_created}
                            />
                          </TableCell>
                          <TableCell>
                            <Checkbox
                              disabled
                              checked={order?.spreadsheet_created}
                            />
                          </TableCell>
                          <TableCell>
                            <Box
                              display='flex'
                              flexDirection='column'
                              gap={0.25}
                            >
                              <span>
                                {order?.estimate_created
                                  ? order?.estimate_number
                                  : order._id.slice(-6)}
                              </span>
                              {order?.pre_order_estimate_created && (
                                <Chip
                                  label={order?.pre_order_estimate_number}
                                  color='warning'
                                  size='small'
                                  variant='outlined'
                                  sx={{ fontWeight: 600 }}
                                />
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>{order.customer_name}</TableCell>
                          <TableCell>
                            <Chip
                              label={capitalize(order.estimate_status || order.status)}
                              color={getStatusChipColor(order.estimate_status || order.status)}
                              size='small'
                              sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                            />
                          </TableCell>
                          <TableCell>
                            {order?.payment?.status ? (
                              <Chip
                                label={getPaymentChipLabel(order.payment.status)}
                                color={getPaymentChipColor(order.payment.status)}
                                size='small'
                                sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                              />
                            ) : (
                              <Typography variant='body2' color='text.secondary'>
                                —
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>{getCreatedByLabel(order)}</TableCell>
                          <TableCell>₹{order.total_amount || 0}</TableCell>
                          <TableCell>
                            <Box
                              display={'flex'}
                              flexDirection={'row'}
                              gap={'8px'}
                            >
                              <Button
                                variant='outlined'
                                color={'warning'}
                                disabled={
                                  (order?.status?.toLowerCase() === 'draft'
                                    ? !!order?.estimate_created
                                    : !['deleted', 'sent'].includes(
                                        order?.status?.toLowerCase()
                                      )) || !order?.total_amount
                                }
                                onClick={() => handleEstimateAction(order, 'draft')}
                              >
                                Save As Draft
                              </Button>
                              <Button
                                variant='outlined'
                                color={'success'}
                                disabled={
                                  !order?.estimate_created ||
                                  ['deleted'].includes(
                                    order?.status?.toLowerCase()
                                  ) ||
                                  !['draft', 'sent', 'declined'].includes(
                                    order?.status?.toLowerCase()
                                  )
                                }
                                onClick={() => handleEstimateAction(order, 'accepted')}
                              >
                                Accept
                              </Button>
                              <Button
                                variant='outlined'
                                color={'error'}
                                onClick={() => handleEstimateAction(order, 'declined')}
                                disabled={
                                  !order?.estimate_created ||
                                  ['deleted'].includes(
                                    order?.status?.toLowerCase()
                                  ) ||
                                  !['draft', 'sent', 'accepted'].includes(
                                    order?.status?.toLowerCase()
                                  )
                                }
                              >
                                Decline
                              </Button>
                              <IconButton
                                color={'error'}
                                disabled={
                                  ['deleted'].includes(
                                    order?.status?.toLowerCase()
                                  ) || order?.estimate_created
                                }
                                onClick={() => handleDelete(order)}
                              >
                                <Delete />
                              </IconButton>
                              <IconButton
                                onClick={() =>
                                  router.push(`/orders/new/${order._id}`)
                                }
                                disabled={['invoiced'].includes(
                                  order?.status?.toLowerCase()
                                )}
                              >
                                <Edit />
                              </IconButton>
                              <IconButton
                                onClick={() => handleViewDetails(order)}
                              >
                                <Visibility />
                              </IconButton>
                              {order?.estimate_created && (
                                <IconButton
                                  onClick={() => handleDownload(order)}
                                >
                                  <Download />
                                </IconButton>
                              )}
                              {order?.pre_order_estimate_created && (
                                <IconButton
                                  color='warning'
                                  onClick={() =>
                                    handleDownload(order, 'pre_order')
                                  }
                                >
                                  <Download />
                                </IconButton>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Pagination + "Go to page" */}
                <Box
                  display={'flex'}
                  flexDirection={'row'}
                  alignItems={'end'}
                  justifyContent={'space-between'}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mt: 2,
                      gap: '8px',
                    }}
                  >
                    <TablePagination
                      rowsPerPageOptions={[25, 50, 100, 200]}
                      component='div'
                      // totalCount from server
                      count={totalCount}
                      rowsPerPage={rowsPerPage}
                      page={page}
                      onPageChange={handleChangePage}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                    />

                    {/* "Go to page" UI */}
                    <Box
                      sx={{
                        ml: 2,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <TextField
                        label='Go to page'
                        type='number'
                        variant='outlined'
                        size='small'
                        sx={{ width: 100, mr: 1 }}
                        // If user typed something, show that; otherwise, current page + 1
                        value={skipPage !== '' ? skipPage : page + 1}
                        onChange={(e) =>
                          parseInt(e.target.value) <= totalPagesCount
                            ? setSkipPage(e.target.value)
                            : toast.error('Invalid Page Number')
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSkipPage();
                          }
                        }}
                      />
                      <Button variant='contained' onClick={handleSkipPage}>
                        Go
                      </Button>
                    </Box>
                  </Box>
                  <Typography variant='subtitle1'>
                    Total Pages: {totalPagesCount}
                  </Typography>
                </Box>
              </>
            ) : (
              <Box
                display={'flex'}
                justifyContent={'center'}
                alignItems={'center'}
              >
                <Typography variant='h5' fontWeight={'bold'}>
                  No Orders
                </Typography>
              </Box>
            )}
          </>
        )}
        {/* Drawer for Order Details */}
        <Drawer
          anchor='right'
          open={drawerOpen}
          onClose={handleCloseDrawer}
          sx={{
            '& .MuiDrawer-paper': {
              width: 500,
              padding: 3,
            },
          }}
        >
          <Box>
            <Typography
              variant='h5'
              gutterBottom
              sx={{
                fontWeight: 'bold',
                marginBottom: 2,
                fontFamily: 'Roboto, sans-serif',
              }}
            >
              Order Details
            </Typography>
            {selectedOrder && (
              <>
                {/* Order Info */}
                <Box sx={{ marginBottom: 3 }}>
                  <Typography>
                    <strong>Order ID:</strong> {selectedOrder._id}
                  </Typography>
                  {selectedOrder?.spreadsheet_created && (
                    <Typography>
                      <strong>Spreadsheet Created:</strong>{' '}
                      <Button
                        variant={'text'}
                        // variant='outlined'
                        sx={{
                          textTransform: 'none',
                          fontWeight: 'bold',
                          flex: 1,
                          color: theme.palette.primary.main,
                        }}
                        onClick={() =>
                          window.open(selectedOrder?.spreadsheet_url, '_blank')
                        }
                      >
                        Visit Link
                      </Button>
                    </Typography>
                  )}
                  {selectedOrder?.estimate_created && (
                    <Typography>
                      <strong>Estimate Number:</strong>{' '}
                      {selectedOrder?.estimate_number}
                      {selectedOrder?.estimate_url && (
                        <>
                          {' '}
                          <a
                            href={selectedOrder.estimate_url}
                            target='_blank'
                            rel='noopener noreferrer'
                            style={{
                              color: theme.palette.primary.main,
                              textDecoration: 'none',
                            }}
                          >
                            View ↗
                          </a>
                        </>
                      )}
                    </Typography>
                  )}
                  {selectedOrder?.pre_order_estimate_created && (
                    <Typography>
                      <strong>Pre-Order Estimate Number:</strong>{' '}
                      {selectedOrder?.pre_order_estimate_number}
                      {selectedOrder?.pre_order_estimate_url && (
                        <>
                          {' '}
                          <a
                            href={selectedOrder.pre_order_estimate_url}
                            target='_blank'
                            rel='noopener noreferrer'
                            style={{
                              color: theme.palette.warning.main,
                              textDecoration: 'none',
                            }}
                          >
                            View ↗
                          </a>
                        </>
                      )}
                    </Typography>
                  )}
                  {selectedOrder?.reference_number && (
                    <Typography>
                      <strong>Reference Number:</strong>{' '}
                      {selectedOrder?.reference_number}
                    </Typography>
                  )}
                  <Typography>
                    <strong>Status:</strong>{' '}
                    {selectedOrder.estimate_status || selectedOrder.status
                      ? capitalize(
                          selectedOrder.estimate_status || selectedOrder.status
                        )
                      : ''}
                  </Typography>
                  <Typography>
                    <strong>Created By:</strong>{' '}
                    {selectedOrder.created_by_info?.name || 'Unknown'}
                  </Typography>
                  <Typography>
                    <strong>Total Amount:</strong> ₹
                    {selectedOrder.total_amount?.toFixed(2) || '0.00'}
                  </Typography>
                  <Typography>
                    <strong>Total GST:</strong> ₹
                    {selectedOrder.total_gst?.toFixed(2) || '0.00'}
                  </Typography>
                  <Typography>
                    <strong>Created At:</strong>{' '}
                    {new Date(selectedOrder.created_at).toLocaleString()}
                  </Typography>
                  <Typography>
                    <strong>Updated At:</strong>{' '}
                    {new Date(selectedOrder.updated_at).toLocaleString()}
                  </Typography>
                </Box>

                {/* Documents — grouped by In-Stock vs Pre-Order so the flow
                    (Estimate → Sales Order → Invoice) is clear at a glance. */}
                <Box sx={{ marginBottom: 3 }}>
                  <Typography sx={{ mb: 1 }}>
                    <strong>Documents</strong>
                  </Typography>

                  {orderDocsLoading && (
                    <Typography variant='body2' color='text.secondary'>
                      Loading documents…
                    </Typography>
                  )}

                  {([
                    {
                      key: 'stock',
                      title: 'In-Stock',
                      accent: theme.palette.primary.main,
                      created: selectedOrder?.estimate_created,
                      estimateNumber: selectedOrder?.estimate_number,
                      estimateStatus: orderDocs?.estimate?.status,
                      dlType: undefined as undefined | 'pre_order',
                    },
                    {
                      key: 'pre_order',
                      title: 'Pre-Order',
                      accent: theme.palette.warning.main,
                      created: selectedOrder?.pre_order_estimate_created,
                      estimateNumber: selectedOrder?.pre_order_estimate_number,
                      estimateStatus: orderDocs?.pre_order_estimate?.status,
                      dlType: 'pre_order' as 'pre_order',
                    },
                  ]).map((group) => {
                    const salesOrders = (orderDocs?.sales_orders || []).filter(
                      (d: any) => d.source === group.key
                    );
                    const invoices = (orderDocs?.invoices || []).filter(
                      (d: any) => d.source === group.key
                    );
                    if (!group.created && salesOrders.length === 0 && invoices.length === 0)
                      return null;
                    return (
                      <Box
                        key={group.key}
                        sx={{
                          mb: 1.5,
                          p: 1.5,
                          borderRadius: 2,
                          border: `1px solid ${theme.palette.divider}`,
                          borderLeft: `4px solid ${group.accent}`,
                        }}
                      >
                        <Typography
                          variant='subtitle2'
                          sx={{ fontWeight: 'bold', color: group.accent, mb: 1 }}
                        >
                          {group.title}
                        </Typography>

                        {/* Estimate */}
                        {group.created && (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              mb: 0.75,
                              flexWrap: 'wrap',
                            }}
                          >
                            <Typography
                              variant='body2'
                              sx={{ minWidth: 70, color: 'text.secondary' }}
                            >
                              Estimate
                            </Typography>
                            <Typography variant='body2'>
                              {group.estimateNumber}
                            </Typography>
                            {group.estimateStatus && (
                              <Chip
                                size='small'
                                label={capitalize(group.estimateStatus)}
                                color={getStatusChipColor(group.estimateStatus)}
                              />
                            )}
                            <Button
                              variant='text'
                              size='small'
                              startIcon={<Download />}
                              onClick={() =>
                                handleDownload(selectedOrder, group.dlType)
                              }
                              sx={{ textTransform: 'none', minWidth: 0 }}
                            >
                              Download
                            </Button>
                          </Box>
                        )}

                        {/* Sales Orders */}
                        {salesOrders.map((so: any) => (
                          <Box
                            key={so.salesorder_id}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              mb: 0.75,
                              flexWrap: 'wrap',
                            }}
                          >
                            <Typography
                              variant='body2'
                              sx={{ minWidth: 70, color: 'text.secondary' }}
                            >
                              Sales Order
                            </Typography>
                            <Typography variant='body2'>
                              {so.salesorder_number}
                            </Typography>
                            {so.status && (
                              <Chip
                                size='small'
                                label={capitalize(so.status)}
                                color={getStatusChipColor(so.status)}
                              />
                            )}
                            <Button
                              variant='text'
                              size='small'
                              startIcon={<Download />}
                              onClick={() =>
                                handleDownloadDoc(
                                  'salesorder',
                                  so.salesorder_id,
                                  so.salesorder_number
                                )
                              }
                              sx={{ textTransform: 'none', minWidth: 0 }}
                            >
                              Download
                            </Button>
                          </Box>
                        ))}

                        {/* Invoices */}
                        {invoices.map((inv: any) => (
                          <Box
                            key={inv.invoice_id}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              mb: 0.75,
                              flexWrap: 'wrap',
                            }}
                          >
                            <Typography
                              variant='body2'
                              sx={{ minWidth: 70, color: 'text.secondary' }}
                            >
                              Invoice
                            </Typography>
                            <Typography variant='body2'>
                              {inv.invoice_number}
                            </Typography>
                            {inv.status && (
                              <Chip
                                size='small'
                                label={capitalize(inv.status)}
                                color={getPaymentChipColor(inv.status)}
                              />
                            )}
                            <Button
                              variant='text'
                              size='small'
                              startIcon={<Download />}
                              onClick={() =>
                                handleDownloadDoc(
                                  'invoice',
                                  inv.invoice_id,
                                  inv.invoice_number
                                )
                              }
                              sx={{ textTransform: 'none', minWidth: 0 }}
                            >
                              Download
                            </Button>
                          </Box>
                        ))}
                      </Box>
                    );
                  })}

                  {!orderDocsLoading &&
                    !selectedOrder?.estimate_created &&
                    !selectedOrder?.pre_order_estimate_created &&
                    !(orderDocs?.sales_orders?.length > 0) &&
                    !(orderDocs?.invoices?.length > 0) && (
                      <Typography variant='body2' color='text.secondary'>
                        No documents available yet.
                      </Typography>
                    )}
                </Box>

                {/* Payment (Razorpay) — shown when a payment link/gateway payment exists */}
                {selectedOrder?.payment && (
                  <Box sx={{ marginBottom: 3 }}>
                    <Typography sx={{ mb: 1 }}>
                      <strong>Payment</strong>
                    </Typography>
                    <Typography sx={{ mb: 1 }}>
                      <strong>Status:</strong>{' '}
                      <Chip
                        size='small'
                        label={getPaymentChipLabel(
                          selectedOrder.payment.status || 'pending'
                        )}
                        color={getPaymentChipColor(
                          selectedOrder.payment.status || 'pending'
                        )}
                      />
                    </Typography>
                    {selectedOrder.payment.provider && (
                      <Typography>
                        <strong>Provider:</strong>{' '}
                        {capitalize(selectedOrder.payment.provider)}
                      </Typography>
                    )}
                    {selectedOrder.payment.razorpay_payment_id && (
                      <Typography>
                        <strong>Payment ID:</strong>{' '}
                        {selectedOrder.payment.razorpay_payment_id}
                      </Typography>
                    )}
                    {selectedOrder.payment.razorpay_order_id && (
                      <Typography>
                        <strong>Razorpay Order ID:</strong>{' '}
                        {selectedOrder.payment.razorpay_order_id}
                      </Typography>
                    )}
                    {selectedOrder.payment.payment_link_id && (
                      <Typography>
                        <strong>Payment Link ID:</strong>{' '}
                        {selectedOrder.payment.payment_link_id}
                        {selectedOrder.payment.short_url && (
                          <>
                            {' '}
                            <a
                              href={selectedOrder.payment.short_url}
                              target='_blank'
                              rel='noopener noreferrer'
                              style={{
                                color: theme.palette.primary.main,
                                textDecoration: 'none',
                              }}
                            >
                              Open ↗
                            </a>
                          </>
                        )}
                      </Typography>
                    )}
                    {selectedOrder.payment.method && (
                      <Typography>
                        <strong>Method:</strong>{' '}
                        {String(selectedOrder.payment.method).toUpperCase()}
                        {selectedOrder.payment.card_network &&
                          ` — ${selectedOrder.payment.card_network}${
                            selectedOrder.payment.card_last4
                              ? ` •••• ${selectedOrder.payment.card_last4}`
                              : ''
                          }`}
                        {selectedOrder.payment.bank &&
                          ` — ${selectedOrder.payment.bank}`}
                        {selectedOrder.payment.wallet &&
                          ` — ${selectedOrder.payment.wallet}`}
                        {selectedOrder.payment.vpa &&
                          ` — ${selectedOrder.payment.vpa}`}
                      </Typography>
                    )}
                    {selectedOrder.payment.amount_paid != null && (
                      <Typography>
                        <strong>Amount Paid:</strong> ₹
                        {Number(selectedOrder.payment.amount_paid).toLocaleString(
                          'en-IN'
                        )}
                        {selectedOrder.payment.fee != null &&
                          ` (gateway fee ₹${selectedOrder.payment.fee})`}
                      </Typography>
                    )}
                    {(selectedOrder.payment.email ||
                      selectedOrder.payment.contact) && (
                      <Typography>
                        <strong>Payer:</strong>{' '}
                        {[
                          selectedOrder.payment.email,
                          selectedOrder.payment.contact,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </Typography>
                    )}
                    {selectedOrder.payment.paid_at && (
                      <Typography>
                        <strong>Paid At:</strong>{' '}
                        {selectedOrder.payment.paid_at} IST
                      </Typography>
                    )}
                    {selectedOrder.payment.terms && (
                      <Typography>
                        <strong>Payment Terms:</strong>{' '}
                        {selectedOrder.payment.terms}
                      </Typography>
                    )}
                    {selectedOrder.payment.updated_at && (
                      <Typography>
                        <strong>Payment Updated:</strong>{' '}
                        {selectedOrder.payment.updated_at} IST
                      </Typography>
                    )}
                    {selectedOrder.zoho_flow?.salesorder_number && (
                      <Typography>
                        <strong>Sales Order:</strong>{' '}
                        {selectedOrder.zoho_flow.salesorder_number}
                      </Typography>
                    )}
                    {selectedOrder.zoho_flow?.invoice_number && (
                      <Typography>
                        <strong>Invoice:</strong>{' '}
                        {selectedOrder.zoho_flow.invoice_number}
                      </Typography>
                    )}
                    {selectedOrder.zoho_flow?.customerpayment_number && (
                      <Typography>
                        <strong>Payment Received:</strong>{' '}
                        {selectedOrder.zoho_flow.customerpayment_number}
                      </Typography>
                    )}
                    {selectedOrder.payment?.status === 'paid' &&
                      !selectedOrder.zoho_flow?.chain_completed_at && (
                        <>
                          {selectedOrder.zoho_flow?.last_error && (
                            <Typography sx={{ color: theme.palette.error.main }}>
                              <strong>Chain Error:</strong>{' '}
                              {selectedOrder.zoho_flow.last_error}
                            </Typography>
                          )}
                          <Button
                            variant='outlined'
                            color='warning'
                            size='small'
                            disabled={retryingChain}
                            onClick={handleRetryChain}
                            sx={{ mt: 1 }}
                          >
                            {retryingChain
                              ? 'Re-running Zoho chain…'
                              : 'Retry Zoho Chain (SO / Invoice / Payment)'}
                          </Button>
                        </>
                      )}
                  </Box>
                )}

                <Box sx={{ marginBottom: 3 }}>
                  <Typography>
                    <strong>Billing Address</strong>
                  </Typography>
                  <Typography>
                    <strong>Attention:</strong>{' '}
                    {selectedOrder?.billing_address?.attention
                      ? selectedOrder?.billing_address?.attention
                      : ''}
                  </Typography>
                  <Typography>
                    <strong>Address:</strong>{' '}
                    {selectedOrder?.billing_address?.address
                      ? selectedOrder?.billing_address?.address
                      : ''}
                  </Typography>
                  <Typography>
                    <strong>Street:</strong>{' '}
                    {selectedOrder?.billing_address?.street2
                      ? selectedOrder?.billing_address?.street2
                      : ''}
                  </Typography>
                  <Typography>
                    <strong>City:</strong>{' '}
                    {selectedOrder?.billing_address?.city
                      ? selectedOrder?.billing_address?.city
                      : ''}
                  </Typography>

                  <Typography>
                    <strong>State:</strong>{' '}
                    {selectedOrder?.billing_address?.state
                      ? selectedOrder?.billing_address?.state
                      : ''}
                  </Typography>
                  <Typography>
                    <strong>Zip:</strong>{' '}
                    {selectedOrder?.billing_address?.zip
                      ? selectedOrder?.billing_address?.zip
                      : ''}
                  </Typography>
                  <Typography>
                    <strong>Phone:</strong>{' '}
                    {selectedOrder?.billing_address?.phone
                      ? selectedOrder?.billing_address?.phone
                      : ''}
                  </Typography>
                </Box>
                <Box sx={{ marginBottom: 3 }}>
                  <Typography>
                    <strong>Shipping Address</strong>
                  </Typography>
                  <Typography>
                    <strong>Attention:</strong>{' '}
                    {selectedOrder?.shipping_address?.attention
                      ? selectedOrder?.shipping_address?.attention
                      : ''}
                  </Typography>
                  <Typography>
                    <strong>Address:</strong>{' '}
                    {selectedOrder?.shipping_address?.address
                      ? selectedOrder?.shipping_address?.address
                      : ''}
                  </Typography>
                  <Typography>
                    <strong>Street:</strong>{' '}
                    {selectedOrder?.shipping_address?.street2
                      ? selectedOrder?.shipping_address?.street2
                      : ''}
                  </Typography>
                  <Typography>
                    <strong>City:</strong>{' '}
                    {selectedOrder?.shipping_address?.city
                      ? selectedOrder?.shipping_address?.city
                      : ''}
                  </Typography>

                  <Typography>
                    <strong>State:</strong>{' '}
                    {selectedOrder?.shipping_address?.state
                      ? selectedOrder?.shipping_address?.state
                      : ''}
                  </Typography>
                  <Typography>
                    <strong>Zip:</strong>{' '}
                    {selectedOrder?.shipping_address?.zip
                      ? selectedOrder?.shipping_address?.zip
                      : ''}
                  </Typography>
                  <Typography>
                    <strong>Phone:</strong>{' '}
                    {selectedOrder?.shipping_address?.phone
                      ? selectedOrder?.shipping_address?.phone
                      : ''}
                  </Typography>
                </Box>
                <Typography>
                  <strong>Created By:</strong>{' '}
                  {selectedOrder.created_by_info?.name || 'Unknown'}
                </Typography>
                <Button
                  variant='outlined'
                  size='small'
                  onClick={() => setChangeCreatorDialogOpen(true)}
                  sx={{ mt: 1, mb: 2 }}
                >
                  Change Creator
                </Button>
                {/* Products Section */}
                <Typography
                  variant='h6'
                  sx={{
                    fontWeight: 'bold',
                    marginBottom: 2,
                    fontFamily: 'Roboto, sans-serif',
                  }}
                >
                  Products
                </Typography>
                <TableContainer
                  component={Paper}
                  sx={{
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    borderRadius: 2,
                  }}
                >
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell>Image</TableCell>
                        <TableCell>Product Name</TableCell>
                        <TableCell>Qty</TableCell>
                        <TableCell>Price</TableCell>
                        <TableCell>Added By</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedOrder.products
                        ?.filter((product: any) => Number(product.quantity) > 0)
                        .map((product: any) => (
                        <TableRow key={product.product_id}>
                          <TableCell>
                            <img
                              onClick={() =>
                                handleImageClick(
                                  product.image_url || '/placeholder.png'
                                )
                              }
                              src={product.image_url || '/placeholder.png'}
                              alt={product.name}
                              style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '4px',
                                objectFit: 'cover',
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Box
                              display='flex'
                              flexDirection='column'
                              gap={0.5}
                            >
                              <span>{product.name}</span>
                              {product?.pre_order && (
                                <Box display='flex' gap={0.5} flexWrap='wrap'>
                                  <Chip
                                    label={
                                      productIsSplit(product)
                                        ? 'Pre-Order (Split)'
                                        : 'Pre-Order'
                                    }
                                    color='warning'
                                    size='small'
                                    variant='outlined'
                                    sx={{ fontWeight: 600, height: 20 }}
                                  />
                                  {productIsSplit(product) && (
                                    <Chip
                                      label={`PO Qty: ${product.pre_order_quantity}`}
                                      color='warning'
                                      size='small'
                                      sx={{ height: 20 }}
                                    />
                                  )}
                                </Box>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>{product.quantity}</TableCell>
                          <TableCell>₹{product.price?.toFixed(2)}</TableCell>
                          <TableCell>
                            {capitalize(
                              product?.added_by?.split('_')?.join(' ')
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </Box>
        </Drawer>
        <Drawer
          anchor='right'
          open={openFilterModal}
          onClose={() => setOpenFilterModal(false)}
          sx={{
            '& .MuiDrawer-paper': {
              width: 300,
              padding: 3,
            },
          }}
        >
          <Box>
            <Typography variant='h6' gutterBottom>
              Filter Orders
            </Typography>

            {/* Status Filter */}
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel id='status-filter-label'>Status</InputLabel>
              <Select
                labelId='status-filter-label'
                id='status-filter'
                value={filterStatus}
                label='Status'
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value=''>All</MenuItem>
                <MenuItem value='draft'>Draft</MenuItem>
                <MenuItem value='sent'>Sent</MenuItem>
                <MenuItem value='declined'>Declined</MenuItem>
                <MenuItem value='accepted'>Accepted</MenuItem>
                <MenuItem value='invoiced'>Invoiced</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label='Start Date'
              type='date'
              fullWidth
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ mt: 2 }}
            />

            {/* End Date Picker */}
            <TextField
              label='End Date'
              type='date'
              fullWidth
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ mt: 2 }}
            />
            {/* Sales Person Filter */}
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel id='sales-person-filter-label'>
                Sales Person
              </InputLabel>
              <Select
                labelId='sales-person-filter-label'
                id='sales-person-filter'
                value={filterSalesPerson}
                label='Sales Person'
                onChange={(e) => setFilterSalesPerson(e.target.value)}
              >
                <MenuItem value=''>All</MenuItem>
                {salesPeople.map((person: any) => (
                  <MenuItem key={person._id} value={person.code}>
                    {person.code}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Estimates Created Filter */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={filterEstimatesCreated}
                  onChange={(e) => setFilterEstimatesCreated(e.target.checked)}
                />
              }
              label='Estimates Created'
              sx={{ mt: 2 }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={filterEstimatesGreaterThanZero}
                  onChange={(e) =>
                    setFilterEstimatesGreaterThanZero(e.target.checked)
                  }
                />
              }
              label='Amount > 0'
              sx={{ mt: 2 }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={filterHasPreOrder}
                  onChange={(e) => setFilterHasPreOrder(e.target.checked)}
                />
              }
              label='Has Pre-Order Items'
              sx={{ mt: 2 }}
            />

            {/* Apply Filters Button */}
            <Box sx={{ mt: 3 }}>
              <Button variant='contained' fullWidth onClick={applyFilters}>
                Apply Filters
              </Button>
            </Box>

            {/* Reset Filters Button */}
            <Box sx={{ mt: 2 }}>
              <Button
                variant='contained'
                fullWidth
                onClick={() => {
                  setFilterStatus('');
                  setFilterSalesPerson('');
                  setFilterEstimatesCreated(false);
                  setFilterEstimatesGreaterThanZero(false);
                  setFilterHasPreOrder(false);
                }}
              >
                Reset Filters
              </Button>
            </Box>
          </Box>
        </Drawer>
      </Paper>
      {/* Change Creator Dialog */}
      <Dialog
        open={changeCreatorDialogOpen}
        onClose={() => setChangeCreatorDialogOpen(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>
          <Typography variant='h6' fontWeight='bold'>
            Change Order Creator
          </Typography>
          {selectedOrder?.created_by_info && (
            <Typography variant='body2' color='textSecondary'>
              Current: {selectedOrder.created_by_info?.name}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {loadingCreatorUpdate ? (
            <Box display='flex' justifyContent='center' padding='20px'>
              <CircularProgress />
            </Box>
          ) : (
            <List>
              {salesPeople.map((person: any) => (
                <ListItem key={person._id} disablePadding>
                  <ListItemButton
                    onClick={() => handleChangeCreator(person)}
                    selected={
                      selectedOrder?.created_by_info?._id === person._id
                    }
                  >
                    {person.code}
                  </ListItemButton>
                </ListItem>
              ))}
              {salesPeople.length === 0 && (
                <ListItem>
                  <ListItemText primary='No sales people found' />
                </ListItem>
              )}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setChangeCreatorDialogOpen(false)}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
      {/* Estimate type selection dialog */}
      <Dialog
        open={estimateSelectOpen}
        onClose={() => setEstimateSelectOpen(false)}
        maxWidth='xs'
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          {pendingAction === 'accepted'
            ? 'Accept Order'
            : pendingAction === 'declined'
            ? 'Decline Order'
            : 'Save as Draft'}{' '}
          — Select Estimates
        </DialogTitle>
        <DialogContent>
          {(() => {
            const o = estimateActionOrder;
            const hasStock = orderHasStockItems(o) || !!o?.estimate_created;
            const hasPreOrder =
              orderHasPreOrderItems(o) || !!o?.pre_order_estimate_created;
            const stockCount = (o?.products || []).filter((p: any) =>
              productIsSplit(p)
                ? Number(p.quantity) > 0
                : !p.pre_order && Number(p.quantity) > 0
            ).length;
            const preOrderCount = (o?.products || []).filter((p: any) =>
              p.pre_order
                ? productIsSplit(p)
                  ? Number(p.pre_order_quantity) > 0
                  : Number(p.quantity) > 0
                : false
            ).length;
            return (
              <>
                <Typography variant='body2' color='text.secondary' mb={2}>
                  This order has both in-stock and pre-order items. Choose which
                  estimates this action applies to.
                </Typography>
                <FormGroup>
                  {/* Select All */}
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={
                          (hasStock ? estimateTypes.stock : true) &&
                          (hasPreOrder ? estimateTypes.pre_order : true)
                        }
                        indeterminate={
                          hasStock &&
                          hasPreOrder &&
                          estimateTypes.stock !== estimateTypes.pre_order
                        }
                        onChange={(e) => {
                          const val = e.target.checked;
                          setEstimateTypes({
                            stock: hasStock ? val : estimateTypes.stock,
                            pre_order: hasPreOrder
                              ? val
                              : estimateTypes.pre_order,
                          });
                        }}
                      />
                    }
                    label={
                      <Typography variant='body2' fontWeight={700}>
                        Select All
                      </Typography>
                    }
                  />
                  <Divider sx={{ mb: 1 }} />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={estimateTypes.stock}
                        onChange={(e) =>
                          setEstimateTypes((prev) => ({
                            ...prev,
                            stock: e.target.checked,
                          }))
                        }
                        disabled={!hasStock}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant='body2' fontWeight={700}>
                          In-Stock Estimate
                          {o?.estimate_number && (
                            <Chip
                              label={o.estimate_number}
                              size='small'
                              sx={{ ml: 1, fontSize: '0.65rem', height: 18 }}
                            />
                          )}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {stockCount} item{stockCount !== 1 ? 's' : ''}
                          {o?.estimate_created
                            ? ' · existing estimate'
                            : ' · will create new estimate'}
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    sx={{ mt: 1 }}
                    control={
                      <Checkbox
                        checked={estimateTypes.pre_order}
                        onChange={(e) =>
                          setEstimateTypes((prev) => ({
                            ...prev,
                            pre_order: e.target.checked,
                          }))
                        }
                        disabled={!hasPreOrder}
                      />
                    }
                    label={
                      <Box>
                        <Typography
                          variant='body2'
                          fontWeight={700}
                          color='warning.main'
                        >
                          Pre-Order Estimate
                          {o?.pre_order_estimate_number && (
                            <Chip
                              label={o.pre_order_estimate_number}
                              size='small'
                              color='warning'
                              sx={{ ml: 1, fontSize: '0.65rem', height: 18 }}
                            />
                          )}
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {preOrderCount} item{preOrderCount !== 1 ? 's' : ''}
                          {o?.pre_order_estimate_created
                            ? ' · existing estimate'
                            : ' · will create new estimate'}
                        </Typography>
                      </Box>
                    }
                  />
                </FormGroup>
              </>
            );
          })()}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            variant='outlined'
            onClick={() => setEstimateSelectOpen(false)}
            disabled={orderLoading}
            sx={{ textTransform: 'none', borderRadius: 24 }}
          >
            Cancel
          </Button>
          <Button
            variant='contained'
            color={pendingAction === 'declined' ? 'error' : 'primary'}
            disabled={
              orderLoading ||
              (!estimateTypes.stock && !estimateTypes.pre_order)
            }
            onClick={async () => {
              const o = estimateActionOrder;
              setEstimateSelectOpen(false);
              await handleEnd(o, pendingAction, estimateTypes);
            }}
            sx={{ textTransform: 'none', borderRadius: 24, fontWeight: 700 }}
          >
            {orderLoading ? (
              <CircularProgress size={22} color='inherit' />
            ) : pendingAction === 'accepted' ? (
              'Accept Order'
            ) : pendingAction === 'declined' ? (
              'Decline Order'
            ) : (
              'Save as Draft'
            )}
          </Button>
        </DialogActions>
      </Dialog>
      <SingleImagePopupDialog
        open={openImagePopup}
        onClose={handleClosePopup}
        imageSrc={popupImageSrc}
      />
    </Box>
  );
};

export default Orders;
