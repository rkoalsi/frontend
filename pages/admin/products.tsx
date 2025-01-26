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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from '@mui/material';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';

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

  // State for Edit Modal
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [updating, setUpdating] = useState(false);

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

  // Open Edit Modal
  const handleOpenEditModal = (product: any) => {
    setSelectedProduct(product);
    setOpenEditModal(true);
  };

  // Close Edit Modal
  const handleCloseEditModal = () => {
    setSelectedProduct(null);
    setOpenEditModal(false);
  };

  // Handle Image Upload
  const handleImageUpload = async (file: File) => {
    if (!selectedProduct) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('product_id', selectedProduct._id);

    try {
      setUpdating(true);
      const response = await axios.post(
        `${baseApiUrl}/admin/upload-image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const newImageUrl = response.data.image_url;

      // Update the product's image_url in the backend
      await axios.put(`${baseApiUrl}/products/${selectedProduct._id}`, {
        image_url: newImageUrl,
      });

      // Update the product in the local state
      setProducts((prev) =>
        prev.map((p) =>
          p._id === selectedProduct._id ? { ...p, image_url: newImageUrl } : p
        )
      );

      // Update the selected product
      setSelectedProduct((prev: any) =>
        prev ? { ...prev, image_url: newImageUrl } : prev
      );

      toast.success('Image updated successfully.');
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload image.');
    } finally {
      setUpdating(false);
    }
  };

  // Dropzone Component for Image Upload
  const ImageDropzone = () => {
    const onDrop = (acceptedFiles: File[]) => {
      if (acceptedFiles && acceptedFiles.length > 0) {
        handleImageUpload(acceptedFiles[0]);
      }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      accept: {
        'image/*': [],
      },
      multiple: false,
    });

    return (
      <Box
        {...getRootProps()}
        sx={{
          border: '2px dashed #cccccc',
          padding: 2,
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: isDragActive ? '#f0f0f0' : 'transparent',
        }}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <Typography>Drop the image here...</Typography>
        ) : (
          <Typography>
            Drag and drop an image here, or click to select an image
          </Typography>
        )}
      </Box>
    );
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
                    <TableCell>Category</TableCell>
                    <TableCell>Sub Category</TableCell>
                    <TableCell>SKU</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Stock</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align='center'>
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
                        <TableCell>{product.category}</TableCell>
                        <TableCell>{product.sub_category}</TableCell>
                        <TableCell>{product.cf_sku_code}</TableCell>
                        <TableCell>₹{product.rate}</TableCell>
                        <TableCell>{product.stock}</TableCell>
                        <TableCell>
                          <Switch
                            checked={product.status === 'active'}
                            onChange={() => handleToggleActive(product)}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant='outlined'
                            size='small'
                            onClick={() => handleOpenEditModal(product)}
                          >
                            Edit
                          </Button>
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

      {/* Edit Product Modal */}
      <Dialog
        open={openEditModal}
        onClose={handleCloseEditModal}
        fullWidth
        maxWidth='md'
      >
        <DialogTitle>Edit Product Details</DialogTitle>
        <DialogContent>
          {selectedProduct && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                {/* Image Section */}
                <Grid item xs={12} md={4}>
                  <Typography
                    variant='subtitle2'
                    color='textSecondary'
                    gutterBottom
                  >
                    Product Image
                  </Typography>
                  <Box
                    sx={{
                      mb: 2,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <img
                      src={selectedProduct.image_url || '/placeholder.png'}
                      alt={selectedProduct.name}
                      style={{
                        width: '100%',
                        maxWidth: '200px',
                        height: 'auto',
                        borderRadius: '4px',
                        objectFit: 'cover',
                      }}
                    />
                  </Box>
                  <ImageDropzone />
                  {updating && (
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        mt: 2,
                      }}
                    >
                      <CircularProgress size={24} />
                    </Box>
                  )}
                </Grid>

                {/* Details Section */}
                <Grid item xs={12} md={8}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant='subtitle2' color='textSecondary'>
                        Item Name
                      </Typography>
                      <Typography variant='body1'>
                        {selectedProduct.item_name}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant='subtitle2' color='textSecondary'>
                        Category
                      </Typography>
                      <Typography variant='body1'>
                        {selectedProduct.category || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant='subtitle2' color='textSecondary'>
                        Sub Category
                      </Typography>
                      <Typography variant='body1'>
                        {selectedProduct.sub_category || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant='subtitle2' color='textSecondary'>
                        Series
                      </Typography>
                      <Typography variant='body1'>
                        {selectedProduct?.series || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant='subtitle2' color='textSecondary'>
                        SKU
                      </Typography>
                      <Typography variant='body1'>
                        {selectedProduct.cf_sku_code}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant='subtitle2' color='textSecondary'>
                        Manufacture Code
                      </Typography>
                      <Typography variant='body1'>
                        {selectedProduct.cf_item_code}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant='subtitle2' color='textSecondary'>
                        Price
                      </Typography>
                      <Typography variant='body1'>
                        ₹{selectedProduct.rate}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant='subtitle2' color='textSecondary'>
                        Stock
                      </Typography>
                      <Typography variant='body1'>
                        {selectedProduct.stock}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant='subtitle2' color='textSecondary'>
                        Status
                      </Typography>
                      <Typography variant='body1'>
                        {selectedProduct.status.charAt(0).toUpperCase() +
                          selectedProduct.status.slice(1)}
                      </Typography>
                    </Grid>
                    {/* Add more fields as necessary */}
                    {/* Example: Brand */}
                    <Grid item xs={12} sm={6}>
                      <Typography variant='subtitle2' color='textSecondary'>
                        Brand
                      </Typography>
                      <Typography variant='body1'>
                        {selectedProduct.brand}
                      </Typography>
                    </Grid>
                    {/* Example: HSN/SAC */}
                    <Grid item xs={12} sm={6}>
                      <Typography variant='subtitle2' color='textSecondary'>
                        HSN/SAC
                      </Typography>
                      <Typography variant='body1'>
                        {selectedProduct.hsn_or_sac}
                      </Typography>
                    </Grid>
                    {/* Add any other fields you wish to display */}
                  </Grid>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditModal} color='primary'>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Products;
