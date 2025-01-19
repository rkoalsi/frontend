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

const Products = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const baseApiUrl = process.env.api_url;

  const getData = async () => {
    try {
      const response = await axios.get(`${baseApiUrl}/products?role=admin`);
      setProducts(response.data.products);
      setFilteredProducts(response.data.products);
      setLoading(false);
    } catch (error) {
      console.error(error);
      toast.error(`Error Fetching Products`);
      setLoading(false);
    }
  };

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

  const handleChangePage = (event: any, newPage: any) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

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
                    {/* <TableCell>Actions</TableCell> */}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredProducts
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((product: any) => (
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
                        {/* <TableCell>
                          <IconButton
                            color='primary'
                            onClick={() =>
                              toast.info(
                                `Edit functionality for ${product.name}`
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
              count={filteredProducts.length}
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

export default Products;
