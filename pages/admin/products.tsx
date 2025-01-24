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
} from '@mui/material';
import { toast } from 'react-toastify';
import axios from 'axios';

const Products = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0); // 0-based page

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // NEW: For skip-page functionality
  const [skipPage, setSkipPage] = useState(''); // we'll store a string and convert on "Go"

  const baseApiUrl = process.env.api_url;

  // Debounce the search input to prevent excessive API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setPage(0); // Reset to first page on new search
    }, 500); // 500ms debounce delay

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const getData = async () => {
    setLoading(true);
    try {
      // Build the query parameters
      const params: any = {
        page,
        limit: rowsPerPage,
      };
      if (debouncedSearchQuery.trim() !== '') {
        params.search = debouncedSearchQuery.trim();
      }

      const response = await axios.get(`${baseApiUrl}/admin/products`, {
        params,
      });

      setProducts(response.data.products);
      setTotalCount(response.data.total_count);
    } catch (error) {
      console.error(error);
      toast.error('Error Fetching Products');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data whenever page, rowsPerPage, or debouncedSearchQuery changes
  useEffect(() => {
    getData();
  }, [page, rowsPerPage, debouncedSearchQuery]);

  // Handle searching by updating the searchQuery state
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleChangePage = (
    event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ) => {
    setPage(newPage);
    // Reset skipPage so the TextField shows the new page number
    setSkipPage('');
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
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

    // Calculate the zero-based page index
    const totalPages = Math.ceil(totalCount / rowsPerPage);
    if (requestedPage > totalPages) {
      toast.error(`Page number exceeds total pages (${totalPages})`);
      return;
    }

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
      setProducts((prev: any[]) =>
        prev.map((p) =>
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
                  {products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align='center'>
                        No products found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((product) => (
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
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Table Pagination */}
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component='div'
                count={totalCount}
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
                  inputProps={{
                    min: 1,
                    max: Math.ceil(totalCount / rowsPerPage),
                  }}
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
