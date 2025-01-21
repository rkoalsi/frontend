import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  TablePagination,
  TextField,
  Switch,
  Button,
  Drawer,
  capitalize,
} from '@mui/material';
import axios from 'axios';
import { toast } from 'react-toastify';

const Customers = () => {
  // Data and loading
  const [customers, setCustomers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);

  // "Skip to page" typed by the user; if empty, show actual page
  const [skipPage, setSkipPage] = useState('');

  // Optional client-side search
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]);

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [customer, setSelectedCustomer] = useState<any>(null);

  const baseApiUrl = process.env.api_url;

  // Fetch data from server with pagination
  const getData = async () => {
    setLoading(true);
    try {
      // If you want server-side search, pass "name" param:
      // e.g. `?page=${page}&limit=${rowsPerPage}&name=${searchQuery}`
      const response = await axios.get(
        `${baseApiUrl}/admin/customers?page=${page}&limit=${rowsPerPage}`
      );

      // Destructure the server response
      const { customers, total_count } = response.data;
      setCustomers(customers);
      setFilteredCustomers(customers); // for optional client-side filtering
      setTotalCount(total_count);
    } catch (error) {
      console.error(error);
      toast.error('Error Fetching Customers');
    } finally {
      setLoading(false);
    }
  };

  // On mount & whenever page or rowsPerPage changes, fetch again
  useEffect(() => {
    getData();
  }, [page, rowsPerPage]);

  // Local filtering by name
  const handleSearch = (e: any) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    // Client-side filter of the *current page of data*
    const filtered = customers.filter((c: any) =>
      c.contact_name?.toLowerCase().includes(query)
    );
    setFilteredCustomers(filtered);
    setPage(0);
  };

  // MUI next/previous page
  const handleChangePage = (event: any, newPage: number) => {
    setPage(newPage);
    // Reset skipPage so "Go to page" field updates to the new actual page
    setSkipPage('');
  };

  // MUI rows-per-page
  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    setSkipPage('');
  };

  // "Go to page" logic
  const handleSkipPage = () => {
    // Parse user input
    const requestedPage = parseInt(skipPage, 10);
    if (isNaN(requestedPage) || requestedPage < 1) {
      toast.error('Invalid page number');
      return;
    }
    // Our internal "page" is 0-based, user enters 1-based
    setPage(requestedPage - 1);
    // Clear skipPage so it reflects the new "real" page on next render
    setSkipPage('');
  };

  // Drawer
  const handleViewDetails = (customer: any) => {
    setSelectedCustomer(customer);
    setDrawerOpen(true);
  };
  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedCustomer(null);
  };

  // Toggle active/inactive
  const handleToggleActive = async (customer: any) => {
    try {
      const updatedFields = {
        status: customer.status === 'active' ? 'inactive' : 'active',
      };

      await axios.put(`${baseApiUrl}/customers/${customer._id}`, updatedFields);
      // Update local states
      setCustomers((prev: any) =>
        prev.map((p: any) =>
          p._id === customer._id ? { ...p, ...updatedFields } : p
        )
      );
      setFilteredCustomers((prev: any) =>
        prev.map((p: any) =>
          p._id === customer._id ? { ...p, ...updatedFields } : p
        )
      );
      toast.success(
        `Customer ${customer.contact_name} marked as ${
          updatedFields.status === 'active' ? 'Active' : 'Inactive'
        }`
      );
    } catch (error) {
      console.error(error);
      toast.error('Failed to update customer status.');
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
        <Typography variant='h4' gutterBottom sx={{ fontWeight: 'bold' }}>
          All Customers
        </Typography>
        <Typography variant='body1' sx={{ color: '#6B7280', marginBottom: 3 }}>
          A comprehensive list of all customers.
        </Typography>

        {/* Search Bar (client-side) */}
        <TextField
          label='Search by Name'
          variant='outlined'
          fullWidth
          value={searchQuery}
          onChange={handleSearch}
          sx={{ marginBottom: 3 }}
        />

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
            {/* Table */}
            <TableContainer
              component={Paper}
              sx={{
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                overflowX: 'auto',
              }}
            >
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Sales Person</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Margin</TableCell>
                    <TableCell>Inclusive/Exclusive</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCustomers.map((cust: any) => (
                    <TableRow key={cust._id}>
                      <TableCell>{cust.contact_name}</TableCell>
                      <TableCell>{cust.cf_sales_person || 'N/A'}</TableCell>
                      <TableCell>
                        {cust.customer_sub_type
                          ? capitalize(cust.customer_sub_type)
                          : 'N/A'}
                      </TableCell>
                      <TableCell>{cust.cf_margin || '40%'}</TableCell>
                      <TableCell>{cust.cf_in_ex || 'Exclusive'}</TableCell>
                      <TableCell>
                        <Switch
                          checked={cust.status === 'active'}
                          onChange={() => handleToggleActive(cust)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant='outlined'
                          onClick={() => handleViewDetails(cust)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination + "Go to page" */}
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component='div'
                // If purely server-side, use totalCount. If you're still doing
                // local search, you can do: searchQuery ? filteredCustomers.length : totalCount
                count={searchQuery ? filteredCustomers.length : totalCount}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />

              {/* "Go to page" field + button */}
              <Box sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
                <TextField
                  label='Go to page'
                  type='number'
                  variant='outlined'
                  size='small'
                  sx={{ width: 100, mr: 1 }}
                  // If the user typed something, show that;
                  // otherwise, show the actual page + 1
                  value={skipPage !== '' ? skipPage : page + 1}
                  onChange={(e) => setSkipPage(e.target.value)}
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
          </>
        )}

        {/* Drawer for Customer Details */}
        <Drawer
          anchor='right'
          open={drawerOpen}
          onClose={handleCloseDrawer}
          sx={{
            '& .MuiDrawer-paper': {
              width: 400,
              padding: 3,
            },
          }}
        >
          <Box>
            <Typography
              variant='h5'
              gutterBottom
              sx={{ fontWeight: 'bold', marginBottom: 2 }}
            >
              Order Details
            </Typography>
            {customer && (
              <>
                <Box sx={{ marginBottom: 3 }}>
                  <Typography>
                    <strong>Customer Name:</strong> {customer.contact_name}
                  </Typography>
                  <Typography>
                    <strong>Status:</strong> {capitalize(customer.status)}
                  </Typography>
                  <Typography>
                    <strong>GST Number:</strong> {customer.gst_no || 'Unknown'}
                  </Typography>
                  <Typography>
                    <strong>Type:</strong>{' '}
                    {customer.customer_sub_type
                      ? capitalize(customer.customer_sub_type)
                      : 'N/A'}
                  </Typography>
                  <Typography>
                    <strong>Margin:</strong> {customer.cf_margin || '40%'}
                  </Typography>
                  <Typography>
                    <strong>GST Treatment:</strong>{' '}
                    {customer.cf_in_ex || 'Exclusive'}
                  </Typography>
                  <Typography>
                    <strong>Sales Person:</strong>{' '}
                    {customer.cf_sales_person || 'N/A'}
                  </Typography>
                  <Typography>
                    <strong>Created At:</strong>{' '}
                    {customer.created_at
                      ? new Date(customer.created_at).toLocaleString()
                      : new Date(customer.created_time).toLocaleString()}
                  </Typography>
                </Box>

                {/* Products Section Example (Uncomment if needed) */}
                {/* <Typography variant='h6' sx={{ fontWeight: 'bold', marginBottom: 2 }}>
                  Products
                </Typography>
                <TableContainer component={Paper}>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell>Image</TableCell>
                        <TableCell>Product Name</TableCell>
                        <TableCell>Qty</TableCell>
                        <TableCell>Price</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {customer.products?.map((product: any) => (
                        <TableRow key={product.product_id.$oid}>
                          <TableCell>
                            <img
                              src={product.image_url || '/placeholder.png'}
                              alt={product.name}
                              style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                            />
                          </TableCell>
                          <TableCell>{product.name}</TableCell>
                          <TableCell>{product.quantity}</TableCell>
                          <TableCell>₹{product.price?.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer> */}
              </>
            )}
          </Box>
        </Drawer>
      </Paper>
    </Box>
  );
};

export default Customers;
