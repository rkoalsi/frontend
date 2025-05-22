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
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Drawer,
  Switch,
} from '@mui/material';
import { toast } from 'react-toastify';
import axiosInstance from '../../src/util/axios';
import formatAddress from '../../src/util/formatAddress';
import { FilterAlt } from '@mui/icons-material';

const ExpectedReorders = () => {
  // State for expectedReorders data and pagination
  const [expectedReorders, setExpectedReorders] = useState([]);
  const [page, setPage] = useState(0); // 0-based index
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPagesCount, setTotalPageCount] = useState(0);
  const [skipPage, setSkipPage] = useState('');
  const [openFilterModal, setOpenFilterModal] = useState(false);
  const [filterSalesPerson, setFilterSalesPerson] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterOrderStatus, setFilterOrderStatus] = useState(''); // New state for order status filter
  const [salesPeople, setSalesPeople] = useState([
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
  // Loading states
  const [loading, setLoading] = useState(true);
  const [updatingOrder, setUpdatingOrder] = useState(false);

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

  const applyFilters = () => {
    setPage(0); // reset page
    setOpenFilterModal(false);
    fetchExpectedReorders(); // fetch with new filters
  };

  // Fetch expectedReorders from the server
  const fetchExpectedReorders = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: rowsPerPage,
        code: filterSalesPerson,
        ...(filterStartDate && { start_date: filterStartDate }),
        ...(filterEndDate && { end_date: filterEndDate }),
        ...(filterOrderStatus !== '' && {
          has_ordered: filterOrderStatus === 'true',
        }),
      };
      const response = await axiosInstance.get(`/admin/expected_reorders`, {
        params,
      });
      // The backend returns: { expectedReorders, total_count, total_pages }
      const {
        expected_reorders = [],
        total_count,
        total_pages,
      } = response.data;
      setExpectedReorders(expected_reorders);
      setTotalCount(total_count);
      setTotalPageCount(total_pages);
    } catch (error) {
      console.error(error);
      toast.error('Error fetching expected reorders.');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch expectedReorders when page or rowsPerPage changes
  useEffect(() => {
    fetchExpectedReorders();
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

  // Update has_ordered status
  const handleOrderStatusChange = async (customerId: any, newStatus: any) => {
    setUpdatingOrder(true);
    try {
      await axiosInstance.put(`/admin/expected_reorders/${customerId}`, {
        has_ordered: newStatus,
        customer_id: customerId,
      });
      // Update local state to reflect change
      setExpectedReorders(
        expectedReorders.map((customer: any) =>
          customer._id === customerId
            ? { ...customer, has_ordered: newStatus }
            : customer
        ) as any
      );
      toast.success('Order status updated successfully');
    } catch (error) {
      console.error(error);
      toast.error('Error updating order status.');
    } finally {
      setUpdatingOrder(false);
    }
  };

  // Opens dialog for adding a new catalogue.
  const handleDownloadExpectedReorders = async () => {
    try {
      const params = {
        code: filterSalesPerson,
        ...(filterStartDate && { start_date: filterStartDate }),
        ...(filterEndDate && { end_date: filterEndDate }),
        ...(filterOrderStatus !== '' && {
          has_ordered: filterOrderStatus === 'true',
        }),
      };

      const response = await axiosInstance.get(
        '/admin/expected_reorders/report',
        {
          params,
          responseType: 'blob', // important for binary data!
        }
      );

      // Create a URL and trigger a download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'expected_reorders_report.xlsx');
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
            All Expected Reorders
          </Typography>
          <Box
            display='flex'
            flexDirection='row'
            justifyContent='space-between'
            alignItems='center'
          >
            <Button
              variant='contained'
              onClick={handleDownloadExpectedReorders}
            >
              Download Expected Reorders Report
            </Button>
            <IconButton onClick={() => setOpenFilterModal(true)}>
              <FilterAlt />
            </IconButton>
          </Box>
        </Box>
        <Typography variant='body1' sx={{ color: '#6B7280', marginBottom: 3 }}>
          View and manage all expected reorders below.
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
            {expectedReorders.length > 0 ? (
              <>
                {/* Expected Reorders Table */}
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Created At</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Address</TableCell>
                        <TableCell>Created By</TableCell>
                        <TableCell>Has Ordered</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {expectedReorders.map((customer: any) => (
                        <TableRow key={customer._id}>
                          <TableCell>
                            {new Date(customer?.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell>{customer.customer_name}</TableCell>
                          <TableCell>
                            {formatAddress(customer.address)}
                          </TableCell>
                          <TableCell>
                            {customer?.created_by_info?.name}
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={customer.has_ordered === true}
                              onChange={(e) =>
                                handleOrderStatusChange(
                                  customer._id,
                                  e.target.checked
                                )
                              }
                              disabled={updatingOrder}
                              color='primary'
                            />
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
                  No Expected Reorders
                </Typography>
              </Box>
            )}
          </>
        )}
      </Paper>
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
        <Box sx={{ p: 3 }}>
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
              {salesPeople.map((person) => (
                <MenuItem key={person} value={person}>
                  {person}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Order Status Filter */}
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id='order-status-filter-label'>Order Status</InputLabel>
            <Select
              labelId='order-status-filter-label'
              id='order-status-filter'
              value={filterOrderStatus}
              label='Order Status'
              onChange={(e) => setFilterOrderStatus(e.target.value)}
            >
              <MenuItem value=''>All</MenuItem>
              <MenuItem value='true'>Has Ordered</MenuItem>
              <MenuItem value='false'>Has Not Ordered</MenuItem>
            </Select>
          </FormControl>

          {/* Date Filters */}
          <TextField
            label='Start Date'
            type='date'
            fullWidth
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ mt: 2 }}
          />

          <TextField
            label='End Date'
            type='date'
            fullWidth
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
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
                setFilterSalesPerson('');
                setFilterStartDate('');
                setFilterEndDate('');
                setFilterOrderStatus('');
                applyFilters();
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

export default ExpectedReorders;
