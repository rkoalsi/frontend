import { useEffect, useState } from 'react';
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
  TablePagination,
  TextField,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
} from '@mui/material';
import { toast } from 'react-toastify';
import axiosInstance from '../../src/util/axios';

const Hooks = () => {
  // State for shopHooks data and pagination
  const [shopHooks, setShopHooks] = useState([]);
  const [page, setPage] = useState(0); // 0-based index
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPagesCount, setTotalPageCount] = useState(0);
  const [skipPage, setSkipPage] = useState('');

  // Loading states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedCustomerHook, setSelectedCustomerHook]: any = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    is_active: true,
  });

  // Fetch shopHooks from the server
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: rowsPerPage,
      };
      const response = await axiosInstance.get(`/admin/hooks`, {
        params,
      });
      // The backend returns: { shopHooks, total_count, total_pages }
      const { shop_hooks = [], total_count, total_pages } = response.data;
      setShopHooks(shop_hooks);
      setTotalCount(total_count);
      setTotalPageCount(total_pages);
    } catch (error) {
      console.error(error);
      toast.error('Error fetching shopHooks.');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch shopHooks when page or rowsPerPage changes
  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, actionLoading]);

  // Pagination handlers
  const handleChangePage = (event: any, newPage: any) => {
    setPage(newPage);
    setSkipPage('');
  };

  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    setSkipPage('');
  };

  const handleSkipPage = () => {
    const requestedPage = parseInt(skipPage, 10);
    if (isNaN(requestedPage) || requestedPage < 1) {
      toast.error('Invalid page number');
      return;
    }
    setPage(requestedPage - 1); // convert to 0-based index
    setSkipPage('');
  };

  // Opens the dialog for editing an existing Category.
  const handleEditClick = (shopHook: any) => {
    setSelectedCustomerHook(shopHook);
    setFormData({
      name: shopHook.name || '',
      is_active: shopHook.is_active !== undefined ? shopHook.is_active : true,
    });
    setDialogOpen(true);
  };

  // Handler for saving a Category (update if editing, add if creating new)
  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setActionLoading(true);
    try {
      if (selectedCustomerHook) {
        // Update existing Category
        await axiosInstance.put(
          `/admin/hooks/${selectedCustomerHook._id}`,
          formData
        );
        toast.success('Category updated successfully');
      } else {
        // Add new Category (assuming you have a POST route defined)
        await axiosInstance.post(`/admin/hooks`, formData);
        toast.success('Category added successfully');
      }
      fetchCategories();
      setDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Error saving Category');
    } finally {
      setActionLoading(false);
    }
  };
  const handleCheck = async (shopHook: any) => {
    setActionLoading(true);
    try {
      if (shopHook) {
        // Update existing Category
        await axiosInstance.put(`/admin/hooks/${shopHook._id}`, {
          is_active: !shopHook.is_active,
        });
        toast.success('Category updated successfully');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error saving Category');
    } finally {
      setActionLoading(false);
    }
  };
  const formatAddress = (address: any) => {
    if (!address || typeof address !== 'object') return '';
    const parts = [
      address.attention,
      address.address,
      address.streetz,
      address.city,
      address.state,
      address.zip,
      address.country,
    ].filter((part) => part && part.toString().trim() !== '');
    return parts.join(', ');
  };
  const handleDeleteClick = async (shopHook: any) => {
    setActionLoading(true);
    try {
      // Here you might want to call an endpoint that toggles the status.
      // For simplicity, we re-use the delete endpoint (or create a new one) and assume it marks as inactive.
      const resp = await axiosInstance.delete(`/admin/hooks/${shopHook._id}`);
      if (resp.status === 200) {
        toast.success(`Category deleted successfully`);
        fetchCategories();
      }
    } catch (error: any) {
      console.error(error);
      toast.error(
        error.response?.data?.detail || 'Error updating Category status'
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Opens dialog for adding a new Category.
  const handleAddCategory = () => {
    setSelectedCustomerHook(null);
    setFormData({ name: '', is_active: true });
    setDialogOpen(true);
  };
  const onClickViewDetails = (hook: any) => {
    setSelectedCustomerHook(hook);
    setDialogOpen(true);
  };
  const handleDownload = async () => {
    try {
      const params = {};

      const response = await axiosInstance.get('/admin/hooks/report', {
        params,
        responseType: 'blob', // important for binary data!
      });

      // Create a URL and trigger a download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'shop_hooks_report.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error(error);
      toast.error('Error downloading report.');
    }
  };
  return (
    <Box sx={{ padding: 3 }}>
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          borderRadius: 4,
          backgroundColor: 'white',
        }}
      >
        <Box
          display='flex'
          flexDirection='row'
          justifyContent='space-between'
          alignItems='center'
        >
          <Typography variant='h4' gutterBottom sx={{ fontWeight: 'bold' }}>
            All Shop Hooks
          </Typography>
          <Button variant='contained' onClick={handleDownload}>
            Download All Shop Hooks
          </Button>
        </Box>
        <Typography variant='body1' sx={{ color: '#6B7280', marginBottom: 3 }}>
          View all hooks from all shops below.
        </Typography>
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
            {shopHooks.length > 0 ? (
              <>
                {/* shopHooks Table */}
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Customer Name</TableCell>
                        <TableCell>Address</TableCell>
                        <TableCell>City</TableCell>
                        <TableCell>State</TableCell>
                        <TableCell>Created By</TableCell>
                        <TableCell>Hooks</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {shopHooks.map((shopHook: any) => (
                        <TableRow key={shopHook._id}>
                          <TableCell>{shopHook.customer_name}</TableCell>
                          <TableCell>
                            {formatAddress(shopHook?.customer_address)}
                          </TableCell>
                          <TableCell>
                            {shopHook.customer_address.state}
                          </TableCell>
                          <TableCell>
                            {shopHook.customer_address.state}
                          </TableCell>
                          <TableCell>{shopHook.created_by_info.name}</TableCell>
                          <TableCell>
                            {shopHook.hooks.map((h: any) => (
                              <>
                                {`${h.category_name} - ${h.hooksAvailable}/${h.totalHooks}`}
                                <br />
                              </>
                            ))}
                          </TableCell>
                          <TableCell>
                            <Box display='flex' flexDirection='row' gap='8px'>
                              <Button
                                variant='contained'
                                onClick={() => onClickViewDetails(shopHook)}
                              >
                                View Details
                              </Button>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Pagination and "Go to page" */}
                <Box
                  display='flex'
                  flexDirection='row'
                  alignItems='end'
                  justifyContent='space-between'
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
                      count={totalCount}
                      rowsPerPage={rowsPerPage}
                      page={page}
                      onPageChange={handleChangePage}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                    {/* "Go to page" UI */}
                    <Box sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
                      <TextField
                        label='Go to page'
                        type='number'
                        variant='outlined'
                        size='small'
                        sx={{ width: 100, mr: 1 }}
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
              <Box display='flex' justifyContent='center' alignItems='center'>
                <Typography variant='h5' fontWeight='bold'>
                  No Hooks available
                </Typography>
              </Box>
            )}
          </>
        )}
      </Paper>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold' }}>
          Customer Details
        </DialogTitle>

        <DialogContent>
          {selectedCustomerHook && (
            <Box sx={{ textAlign: 'left', p: 2 }}>
              {/* Customer Info */}
              <Typography variant='subtitle1'>
                <strong>Name:</strong> {selectedCustomerHook.customer_name}
              </Typography>
              <Typography variant='subtitle1'>
                <strong>Address:</strong>{' '}
                {formatAddress(selectedCustomerHook?.customer_address)}
              </Typography>
              <Typography variant='subtitle1'>
                <strong>Created By:</strong>{' '}
                {selectedCustomerHook.created_by_info.name}
              </Typography>
              <Typography variant='subtitle1' gutterBottom>
                <strong>Created At:</strong>{' '}
                {new Date(selectedCustomerHook.created_at).toLocaleString()}
              </Typography>

              {/* Hooks Section */}
              <Box sx={{ mt: 2 }}>
                <Typography variant='subtitle1' fontWeight='bold'>
                  Hooks:
                </Typography>
                <ul style={{ paddingLeft: '20px', marginTop: '5px' }}>
                  {selectedCustomerHook.hooks.map(
                    (hook: any, index: number) => (
                      <li key={index}>
                        <strong>{hook.category_name}</strong>:{' '}
                        {hook.hooksAvailable}/{hook.totalHooks}
                      </li>
                    )
                  )}
                </ul>
              </Box>

              {/* Past Hooks Section */}
              <Box sx={{ mt: 2 }}>
                <Typography variant='subtitle1' fontWeight='bold'>
                  Past Hooks:
                </Typography>
                {selectedCustomerHook.history?.length > 0 ? (
                  selectedCustomerHook.history.map(
                    (historyItem: any, index: number) => (
                      <Box
                        key={index}
                        sx={{
                          mt: 1,
                          p: 2,
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          backgroundColor: '#f9f9f9',
                        }}
                      >
                        <Typography variant='body2' color='textSecondary'>
                          <strong>Updated At:</strong>{' '}
                          {new Date(historyItem.updated_at).toLocaleString()}
                        </Typography>
                        <ul style={{ paddingLeft: '20px', marginTop: '5px' }}>
                          {historyItem.previous_hooks.map(
                            (hook: any, hookIndex: number) => (
                              <li key={hookIndex}>
                                <strong>{hook.category_name}</strong>:{' '}
                                {hook.hooksAvailable}/{hook.totalHooks}
                              </li>
                            )
                          )}
                        </ul>
                      </Box>
                    )
                  )
                ) : (
                  <Typography variant='body2' color='textSecondary'>
                    No past hooks available.
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button variant='contained' onClick={() => setDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Hooks;
