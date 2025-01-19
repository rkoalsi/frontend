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
  IconButton,
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const baseApiUrl = process.env.api_url;

  const getData = async () => {
    try {
      const response = await axios.get(`${baseApiUrl}/customers?role=admin`);
      setCustomers(response.data.customers);
      setFilteredCustomers(response.data.customers);
      setLoading(false);
    } catch (error) {
      console.error(error);
      toast.error(`Error Fetching Customers`);
      setLoading(false);
    }
  };

  const handleSearch = (e: any) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    const filtered = customers.filter((customer: any) =>
      customer?.company_name?.toLowerCase().includes(query)
    );
    setFilteredCustomers(filtered);
    setPage(0);
  };

  const handleChangePage = (event: any, newPage: any) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleToggleActive = async (customer: any) => {
    try {
      const updatedFields = {
        status: customer.status === 'active' ? 'inactive' : 'active',
      };

      await axios.put(`${baseApiUrl}/customers/${customer._id}`, updatedFields);
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
        `Customer ${customer.company_name} marked as ${
          updatedFields.status === 'active' ? 'Active' : 'Inactive'
        }`
      );
    } catch (error) {
      console.error(error);
      toast.error('Failed to update customer status.');
    }
  };

  useEffect(() => {
    getData();
  }, []);
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
        <Typography
          variant='h4'
          gutterBottom
          sx={{
            fontFamily: 'Roboto, sans-serif',
            fontWeight: 'bold',
          }}
        >
          All Customers
        </Typography>
        <Typography variant='body1' sx={{ color: '#6B7280', marginBottom: 3 }}>
          A comprehensive list of all customers.
        </Typography>

        {/* Search Bar */}
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
                    <TableCell>GST Number</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Margin</TableCell>
                    <TableCell>Inclusive/Exclusive</TableCell>
                    <TableCell>Status</TableCell>
                    {/* <TableCell>Actions</TableCell> */}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCustomers
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((customer: any) => (
                      <TableRow key={customer._id}>
                        <TableCell>{customer.contact_name}</TableCell>
                        <TableCell>{customer.gst_no}</TableCell>
                        <TableCell>
                          {String(customer.customer_sub_type)
                            .charAt(0)
                            .toUpperCase() +
                            String(customer.customer_sub_type).slice(1)}
                        </TableCell>
                        <TableCell>{customer.cf_margin || '40%'}</TableCell>
                        <TableCell>
                          {customer.cf_in_ex || 'Exclusive'}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={customer.status === 'active'}
                            onChange={() => handleToggleActive(customer)}
                          />
                        </TableCell>
                        {/* <TableCell>
                          <IconButton
                            color='primary'
                            onClick={() =>
                              toast.info(
                                `Edit functionality for ${customer.name}`
                              )
                            }
                          >
                            <Edit />
                          </IconButton>
                        </TableCell> */}
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component='div'
              count={filteredCustomers.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>
    </Box>
  );
};

export default Customers;
