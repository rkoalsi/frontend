import React, { useContext, useEffect, useState } from 'react';
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
import CustomerSearchBar from '../../src/components/OrderForm/CustomerSearchBar';
import AddressSelection from '../../src/components/common/AddressSelection';
import SalesPersonSelection from '../../src/components/common/SalesPersonSelection';
import formatAddress from '../../src/util/formatAddress';
import axios from 'axios';
import AuthContext from '../../src/components/Auth';

const TargetedCustomers = () => {
  // State for targetedCustomers data and pagination
  const { user }: any = useContext(AuthContext);
  const [targetedCustomers, setTargetedCustomers] = useState([]);
  const [page, setPage] = useState(0); // 0-based index
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPagesCount, setTotalPageCount] = useState(0);
  const [skipPage, setSkipPage] = useState('');
  const [editingId, setEditingId] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer]: any = useState(null);
  const [editedCustomer, setEditedCustomer]: any = useState({});
  const [salesPeople, setSalesPeople] = useState<any[]>([]);

  const fetchSalesPeople = async () => {
    try {
      const { data = {} } = await axiosInstance.get(`/admin/salespeople`);
      setSalesPeople(data.users || []);
    } catch (error) {
      console.error('Error fetching sales people:', error);
    }
  };
  useEffect(() => {
    fetchSalesPeople();
  }, []);

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
    setEditedCustomer({ customer: '', address: '', sales_people: [] });
    setEditDialogOpen(true);
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
  const handleEdit = async (targetCustomer: any) => {
    const { data = {} } = await axios.get(
      `${process.env.api_url}/customers/${targetCustomer.customer_id}`
    );
    const { customer: fetchedCustomer = {} } = data;
    setSelectedCustomer(fetchedCustomer);
    setEditedCustomer({ ...targetCustomer, customer: fetchedCustomer });
    setEditingId(fetchedCustomer._id);
    setEditDialogOpen(true);
  };
  const handleSaveEdit = async () => {
    try {
      let action = '';
      if (editingId !== '') {
        action = 'updated';
        await axiosInstance.put(
          `/admin/targeted_customers/${editedCustomer.customer._id}`,
          {
            _id: editedCustomer._id,
            customer_id: editedCustomer.customer._id,
            customer_name: selectedCustomer.contact_name,
            address: editedCustomer.address,
            sales_people: editedCustomer.sales_people,
            created_by: user?.data?._id,
          }
        );
      } else {
        action = 'created';
        await axiosInstance.post(`/admin/targeted_customers`, {
          customer_id: editedCustomer.customer._id,
          customer_name: selectedCustomer.contact_name,
          address: editedCustomer.address,
          sales_people: editedCustomer.sales_people,
          created_by: user?.data?._id,
        });
      }
      toast.success(`Customer ${action} successfully.`);
      setEditDialogOpen(false);
      fetchTargetedCustomers();
    } catch (error) {
      console.error(error);
      toast.error('Error creating/updating customer.');
    }
  };

  return (
    <Box sx={{ padding: { xs: 2, sm: 3 } }}>
      <Paper
        elevation={3}
        sx={{
          padding: { xs: 2, sm: 3, md: 4 },
          borderRadius: 4,
          backgroundColor: 'white',
        }}
      >
        <Box
          display='flex'
          flexDirection={{ xs: 'column', sm: 'row' }}
          justifyContent='space-between'
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          gap={{ xs: 2, sm: 0 }}
        >
          <Typography variant='h4' gutterBottom sx={{ fontWeight: 'bold', fontSize: { xs: '1.5rem', sm: '2rem' } }}>
            All Targeted Customers
          </Typography>
          <Button variant='contained' onClick={handleDownloadTargetedCustomers}>
            Target Customer
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
                        <TableCell>Created At</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Address</TableCell>
                        <TableCell>Sales People</TableCell>
                        <TableCell>Created By</TableCell>
                        <TableCell>Notes</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {targetedCustomers.map((customer: any) => (
                        <TableRow key={customer._id}>
                          <TableCell>
                            {new Date(customer.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{customer.customer_name}</TableCell>
                          <TableCell>
                            {formatAddress(customer.address)}
                          </TableCell>
                          <TableCell>
                            {customer.sales_people_info
                              .map((sp: any) => sp.name)
                              .join(', ')}
                          </TableCell>
                          <TableCell>
                            {customer?.created_by_info?.name}
                          </TableCell>
                          <TableCell>
                            {customer?.notes?.map(
                              (n: any, index: number) =>
                                `${index + 1}. ${'\t'} ${n.note} - ${
                                  customer.sales_people_info.filter(
                                    (sp: any) => sp._id === n.created_by
                                  )[0]?.name
                                }`
                            )}
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
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        fullWidth
        maxWidth='sm'
      >
        <DialogTitle sx={{ fontWeight: 'bold', textAlign: 'center' }}>
          Target Customer
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <CustomerSearchBar
              ref_no={false}
              label='Select Customer'
              onChange={(value) => {
                setEditedCustomer({ ...editedCustomer, customer: value });
                setSelectedCustomer(value);
              }}
              initialValue={editedCustomer.customer}
              value={editedCustomer.customer}
            />
            <AddressSelection
              shop={{ selectedCustomer: editedCustomer.customer }}
              selectedAddressId={editedCustomer?.address?.address_id}
              handleAddressChange={(e: any) => {
                const address_id = e.target.value;
                const selectedAddress = editedCustomer.customer.addresses.find(
                  (a: any) => a.address_id === address_id
                );
                if (selectedAddress) {
                  setEditedCustomer({
                    ...editedCustomer,
                    address: selectedAddress,
                  });
                }
              }}
            />
            <SalesPersonSelection
              salesPeople={salesPeople}
              selectedSalesPeople={editedCustomer?.sales_people || []}
              handleSalesPeopleChange={(selectedIds) => {
                setEditedCustomer({
                  ...editedCustomer,
                  sales_people: selectedIds,
                });
                console.log(selectedIds);
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', p: 2 }}>
          <Button
            onClick={() => setEditDialogOpen(false)}
            color='error'
            variant='outlined'
          >
            Cancel
          </Button>
          <Button variant='contained' color='primary' onClick={handleSaveEdit}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TargetedCustomers;
