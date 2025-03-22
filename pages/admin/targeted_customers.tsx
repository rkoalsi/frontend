import React, { useEffect, useState } from 'react';
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
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { toast } from 'react-toastify';
import axiosInstance from '../../src/util/axios';

const TargetedCustomers = () => {
  // State for targetedCustomers data and pagination
  const [targetedCustomers, setTargetedCustomers] = useState([]);
  const [page, setPage] = useState(0); // 0-based index
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPagesCount, setTotalPageCount] = useState(0);
  const [skipPage, setSkipPage] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer]: any = useState(null);
  const [editedCustomer, setEditedCustomer]: any = useState({});

  // Loading states
  const [loading, setLoading] = useState(true);

  // Fetch targetedCustomers from the server
  const fetchTargetedCustomers = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: rowsPerPage,
      };
      const response = await axiosInstance.get(`/admin/targeted_customers`, {
        params,
      });
      // The backend returns: { targetedCustomers, total_count, total_pages }
      const {
        targeted_customers = [],
        total_count,
        total_pages,
      } = response.data;
      setTargetedCustomers(targeted_customers);
      setTotalCount(total_count);
      setTotalPageCount(total_pages);
    } catch (error) {
      console.error(error);
      toast.error('Error fetching targeted customers.');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch targetedCustomers when page or rowsPerPage changes
  useEffect(() => {
    fetchTargetedCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage]);

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

  // Opens dialog for adding a new catalogue.
  const handleDownloadTargetedCustomers = async () => {
    try {
      const params = {};

      const response = await axiosInstance.get(
        '/admin/targeted_customers/report',
        {
          params,
          responseType: 'blob', // important for binary data!
        }
      );

      // Create a URL and trigger a download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'targeted_customers_report.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error(error);
      toast.error('Error downloading report.');
    }
  };
  const handleDelete = async (customerId: any) => {
    if (!window.confirm('Are you sure you want to delete this customer?'))
      return;
    try {
      await axiosInstance.delete(`/admin/targeted_customers/${customerId}`);
      toast.success('Customer deleted successfully.');
      fetchTargetedCustomers();
    } catch (error) {
      console.error(error);
      toast.error('Error deleting customer.');
    }
  };
  const handleEdit = (customer: any) => {
    setSelectedCustomer(customer);
    setEditedCustomer({ ...customer });
    setEditDialogOpen(true);
  };
  const handleSaveEdit = async () => {
    try {
      await axiosInstance.put(
        `/admin/targeted_customers/${selectedCustomer._id}`,
        editedCustomer
      );
      toast.success('Customer updated successfully.');
      setEditDialogOpen(false);
      fetchTargetedCustomers();
    } catch (error) {
      console.error(error);
      toast.error('Error updating customer.');
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
            All Targeted Customers
          </Typography>
          <Button variant='contained' onClick={handleDownloadTargetedCustomers}>
            Download Targeted Customers Report
          </Button>
        </Box>
        <Typography variant='body1' sx={{ color: '#6B7280', marginBottom: 3 }}>
          View and manage all targeted customers below.
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
            {targetedCustomers.length > 0 ? (
              <>
                {/* Targeted Customers Table */}
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Address</TableCell>
                        <TableCell>Tier</TableCell>
                        <TableCell>Mobile</TableCell>
                        <TableCell>Created By</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {targetedCustomers.map((customer: any) => (
                        <TableRow key={customer._id}>
                          <TableCell>{customer.name}</TableCell>
                          <TableCell>{customer.address}</TableCell>
                          <TableCell>{customer.tier}</TableCell>
                          <TableCell>{customer?.mobile || '-'}</TableCell>
                          <TableCell>
                            {customer?.created_by_info?.name}
                          </TableCell>
                          <TableCell>
                            <Box
                              display={'flex'}
                              flexDirection={'row'}
                              gap={'8px'}
                            >
                              <Button
                                variant='outlined'
                                color={'info'}
                                onClick={() => handleEdit(customer)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant='outlined'
                                color={'error'}
                                onClick={() => handleDelete(customer._id)}
                              >
                                Delete
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
                  No Targeted Customers
                </Typography>
              </Box>
            )}
          </>
        )}
      </Paper>
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit Potential Customer</DialogTitle>
        <DialogContent>
          <TextField
            label='Name'
            fullWidth
            margin='dense'
            value={editedCustomer.name || ''}
            onChange={(e) =>
              setEditedCustomer({ ...editedCustomer, name: e.target.value })
            }
          />
          <TextField
            label='Address'
            fullWidth
            margin='dense'
            value={editedCustomer.address || ''}
            onChange={(e) =>
              setEditedCustomer({ ...editedCustomer, address: e.target.value })
            }
          />
          <TextField
            label='Tier'
            fullWidth
            margin='dense'
            value={editedCustomer.tier || ''}
            onChange={(e) =>
              setEditedCustomer({ ...editedCustomer, tier: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button variant='contained' onClick={handleSaveEdit}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TargetedCustomers;
