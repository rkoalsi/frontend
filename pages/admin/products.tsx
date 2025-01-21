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
  Button, // <-- import Button
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0); // 0-based page

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);

  // NEW: For skip-page functionality
  const [skipPage, setSkipPage] = useState(''); // we'll store a string and convert on "Go"

  const baseApiUrl = process.env.api_url;

  const getData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${baseApiUrl}/admin/products?page=${page}&limit=${rowsPerPage}`
      );
      setProducts(response.data.products);
      setFilteredProducts(response.data.products);
      setTotalCount(response.data.total_count);
    } catch (error) {
      console.error(error);
      toast.error('Error Fetching Products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
    // Re-fetch data whenever page or rowsPerPage changes
  }, [page, rowsPerPage]);

  // Handle searching client-side (optional)
  const handleSearch = (e: any) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    const filtered = products.filter(
      (product: any) =>
        product.name.toLowerCase().includes(query) ||
        product.cf_sku_code.toLowerCase().includes(query)
    );
    setFilteredProducts(filtered);
    setPage(0);
  };

  const handleChangePage = (event: any, newPage: number) => {
    setPage(newPage);
    // Reset skipPage so the TextField shows the new page number
    setSkipPage('');
  };

  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
    setSkipPage('');
  };

  // NEW: Jump to page
  const handleSkipPage = () => {
    // Convert the user’s input from string to integer
    const requestedPage = parseInt(skipPage, 10);

    // Basic validation: must be a valid number and ≥ 1
    if (isNaN(requestedPage) || requestedPage < 1) {
      toast.error('Invalid page number');
      return;
    }

    // Our table is 0-based, but we let users input 1-based. So subtract 1.
    setPage(requestedPage - 1);
    setSkipPage('');
  };

  // Example: Toggling product status
  const handleToggleActive = async (product: any) => {
    try {
      const updatedFields = {
        status: product.status === 'active' ? 'inactive' : 'active',
      };

      await axios.put(`${baseApiUrl}/products/${product._id}`, updatedFields);
      setProducts((prev: any) =>
        prev.map((p: any) =>
          p._id === product._id ? { ...p, ...updatedFields } : p
        )
      );
      setFilteredProducts((prev: any) =>
        prev.map((p: any) =>
          p._id === product._id ? { ...p, ...updatedFields } : p
        )
      );
      toast.success(
        `Product ${product.name} marked as ${
          updatedFields.status === 'active' ? 'Active' : 'Inactive'
        }`
      );
    } catch (error) {
      console.error(error);
      toast.error('Failed to update product status.');
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
          All Products
        </Typography>
        <Typography variant='body1' sx={{ color: '#6B7280', marginBottom: 3 }}>
          A comprehensive list of all products in your inventory.
        </Typography>

        {/* Search Bar */}
        <TextField
          label='Search by Name or SKU'
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
                    <TableCell>Image</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>SKU</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Stock</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredProducts.map((product: any) => (
                    <TableRow key={product._id}>
                      <TableCell>
                        <img
                          src={product.image_url || '/placeholder.png'}
                          alt={product.name}
                          style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '4px',
                            objectFit: 'cover',
                          }}
                        />
                      </TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.cf_sku_code}</TableCell>
                      <TableCell>₹{product.rate}</TableCell>
                      <TableCell>{product.stock}</TableCell>
                      <TableCell>
                        <Switch
                          checked={product.status === 'active'}
                          onChange={() => handleToggleActive(product)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Table Pagination */}
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component='div'
                // If you're searching client side, you can do:
                count={searchQuery ? filteredProducts.length : totalCount}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />

              {/* --- NEW Skip Page UI --- */}
              <Box sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
                <TextField
                  label='Go to page'
                  type='number'
                  variant='outlined'
                  size='small'
                  sx={{ width: 100, mr: 1 }}
                  // Show skipPage if typed, otherwise show the real page+1
                  value={skipPage !== '' ? skipPage : page + 1}
                  onChange={(e) => setSkipPage(e.target.value)}
                />
                <Button variant='contained' onClick={handleSkipPage}>
                  Go
                </Button>
              </Box>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default Products;
