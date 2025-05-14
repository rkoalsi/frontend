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
  IconButton,
  Drawer,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { toast } from 'react-toastify';
import axiosInstance from '../../src/util/axios';
import { FilterAlt } from '@mui/icons-material';

const PotentialCustomers = () => {
  // State for potentialCustomers data and pagination
  const [openFilterModal, setOpenFilterModal] = useState(false);
  const [filterSalesPerson, setFilterSalesPerson] = useState<string>('');
  const [potentialCustomers, setPotentialCustomers] = useState([]);
  const [page, setPage] = useState(0); // 0-based index
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPagesCount, setTotalPageCount] = useState(0);
  const [skipPage, setSkipPage] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer]: any = useState(null);
  const [editedCustomer, setEditedCustomer]: any = useState({});
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
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
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
  // Loading states
  const [loading, setLoading] = useState(true);
  const applyFilters = () => {
    setPage(0); // reset page
    setOpenFilterModal(false);
    fetchPotentialCustomers(); // fetch with new filters
  };
  // Fetch potentialCustomers from the server
  const fetchPotentialCustomers = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: rowsPerPage,
        code: filterSalesPerson,
      };
      if (filterStartDate) {
        params.startDate = filterStartDate;
      }
      if (filterEndDate) {
        // Optional: Add time to end date to include the whole day
        // params.endDate = `${filterEndDate}T23:59:59.999Z`;
        params.endDate = filterEndDate;
      }
      const response = await axiosInstance.get(`/admin/potential_customers`, {
        params,
      });
      // The backend returns: { potentialCustomers, total_count, total_pages }
      const {
        potential_customers = [],
        total_count,
        total_pages,
      } = response.data;
      setPotentialCustomers(potential_customers);
      setTotalCount(total_count);
      setTotalPageCount(total_pages);
    } catch (error) {
      console.error(error);
      toast.error('Error fetching potential customers.');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch potentialCustomers when page or rowsPerPage changes
  useEffect(() => {
    fetchPotentialCustomers();
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
  const handleDownloadPotentialCustomers = async () => {
    try {
      const params: any = {
        code: filterSalesPerson,
      };
      if (filterStartDate) {
        params.startDate = filterStartDate;
      }
      if (filterEndDate) {
        // Optional: Add time to end date to include the whole day
        // params.endDate = `${filterEndDate}T23:59:59.999Z`;
        params.endDate = filterEndDate;
      }
      const response = await axiosInstance.get(
        '/admin/potential_customers/report',
        {
          params,
          responseType: 'blob', // important for binary data!
        }
      );

      // Create a URL and trigger a download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'potential_customers_report.xlsx');
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
      await axiosInstance.delete(`/admin/potential_customers/${customerId}`);
      toast.success('Customer deleted successfully.');
      fetchPotentialCustomers();
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
        `/admin/potential_customers/${selectedCustomer._id}`,
        editedCustomer
      );
      toast.success('Customer updated successfully.');
      setEditDialogOpen(false);
      fetchPotentialCustomers();
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
            All Potential Customers
          </Typography>
          <Box
            display='flex'
            flexDirection='row'
            justifyContent='space-between'
            alignItems='center'
          >
            <Button
              variant='contained'
              onClick={handleDownloadPotentialCustomers}
            >
              Download Potential Customers Report
            </Button>
            <IconButton onClick={() => setOpenFilterModal(true)}>
              <FilterAlt />
            </IconButton>
          </Box>
        </Box>
        <Typography variant='body1' sx={{ color: '#6B7280', marginBottom: 3 }}>
          View and manage all potential customers below.
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
            {potentialCustomers.length > 0 ? (
              <>
                {/* Potential Customers Table */}
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Created At</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Address</TableCell>
                        <TableCell>Tier</TableCell>
                        <TableCell>Mobile</TableCell>
                        <TableCell>Created By</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {potentialCustomers.map((customer: any) => (
                        <TableRow key={customer._id}>
                          <TableCell>
                            {new Date(
                              customer?.created_at
                            ).toLocaleDateString()}
                          </TableCell>
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
                  No Potential Customers
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

          {/* Sales Person Filter */}
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id='sales-person-filter-label'>Sales Person</InputLabel>
            <Select
              labelId='sales-person-filter-label'
              id='sales-person-filter'
              value={filterSalesPerson}
              label='Sales Person'
              onChange={(e) => setFilterSalesPerson(e.target.value)}
            >
              <MenuItem value=''>All</MenuItem>
              {salesPeople.map((person: any) => (
                <MenuItem key={person} value={person}>
                  {person}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label='Start Date'
            type='date'
            fullWidth
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
            sx={{ mt: 2 }}
            InputLabelProps={{
              shrink: true,
            }}
          />

          {/* End Date Filter */}
          <TextField
            label='End Date'
            type='date'
            fullWidth
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
            sx={{ mt: 2 }}
            InputLabelProps={{
              shrink: true,
            }}
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
                // setFilterStatus('');
                setFilterSalesPerson('');
                setFilterStartDate('');
                setFilterEndDate('');
                // setFilterEstimatesCreated(false);
              }}
            >
              Reset Filters
            </Button>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
};

export default PotentialCustomers;
