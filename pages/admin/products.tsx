import React, { useCallback, useEffect, useState } from 'react';
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
  Drawer,
  Checkbox,
  FormControlLabel,
  RadioGroup,
  Radio,
} from '@mui/material';
import { toast } from 'react-toastify';
import { useDropzone } from 'react-dropzone';
import { FilterAlt } from '@mui/icons-material';
import axiosInstance from '../../src/util/axios';
import ImagePopupDialog from '../../src/components/common/ImagePopUp';

const Products = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPageCount, setTotalPageCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [page, setPage] = useState(0); // 0-based page

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // NEW: For skip-page functionality
  const [skipPage, setSkipPage] = useState(''); // we'll store a string and convert on "Go"

  // State for Edit Modal
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [updating, setUpdating] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterStock, setFilterStock] = useState<string>('');
  const [filterNewArrivals, setFilterNewArrivals] = useState<boolean>(false);
  const [openFilterModal, setOpenFilterModal] = useState(false);
  // NEW: State for editable fields
  const [editableFields, setEditableFields] = useState({
    category: '',
    sub_category: '',
    series: '',
  });
  const [openImagePopup, setOpenImagePopup] = useState(false);
  const [popupImageSrc, setPopupImageSrc] = useState('');
  const applyFilters = () => {
    setPage(0); // reset page
    setOpenFilterModal(false);
    getData(); // fetch with new filters
  };
  const handleImageClick = useCallback((src: string) => {
    setPopupImageSrc(src);
    setOpenImagePopup(true);
  }, []);

  const handleClosePopup = useCallback(() => {
    setOpenImagePopup(false);
  }, []);
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
      const params: any = {
        page,
        limit: rowsPerPage,
      };
      if (debouncedSearchQuery.trim() !== '') {
        params.search = debouncedSearchQuery.trim();
      }

      // Add filters if chosen
      if (filterStatus) {
        params.status = filterStatus; // e.g. 'active' or 'inactive'
      }
      if (filterStock) {
        params.stock = filterStock; // e.g. 'zero' or 'gt_zero'
      }
      if (filterNewArrivals) {
        params.new_arrivals = true;
      }

      const response = await axiosInstance.get(`/admin/products`, {
        params,
      });
      setProducts(response.data.products);
      setTotalCount(response.data.total_count);
      setTotalPageCount(response.data.total_pages);
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

      await axiosInstance.put(`/products/${product._id}`, updatedFields);
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

    // Initialize editable fields with current product data
    setEditableFields({
      category: product.category || '',
      sub_category: product.sub_category || '',
      series: product.series || '',
    });
  };

  // Close Edit Modal
  const handleCloseEditModal = () => {
    setSelectedProduct(null);
    setOpenEditModal(false);
    setEditableFields({
      category: '',
      sub_category: '',
      series: '',
    });
  };

  // Handle Image Upload
  const handleImageUpload = async (file: File) => {
    if (!selectedProduct) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('product_id', selectedProduct._id);

    try {
      setUpdating(true);
      const response = await axiosInstance.post(
        `/admin/upload-image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const newImageUrl = response.data.image_url;

      // Update the product's image_url in the backend
      await axiosInstance.put(`/products/${selectedProduct._id}`, {
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

  // Handle Editable Field Changes
  const handleEditableFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditableFields((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Save Edited Fields
  const handleSaveEdit = async () => {
    if (!selectedProduct) return;

    const { category, sub_category, series } = editableFields;

    // Basic validation
    if (
      category.trim() === '' ||
      sub_category.trim() === '' ||
      series.trim() === ''
    ) {
      toast.error('All fields are required.');
      return;
    }

    try {
      setUpdating(true);

      const updatedFields = {
        category: category.trim(),
        sub_category: sub_category.trim(),
        series: series.trim(),
      };

      // Send update request to the backend
      await axiosInstance.put(
        `/products/${selectedProduct._id}`,
        updatedFields
      );

      // Update the product in the local state
      setProducts((prev) =>
        prev.map((p) =>
          p._id === selectedProduct._id ? { ...p, ...updatedFields } : p
        )
      );

      // Update the selected product
      setSelectedProduct((prev: any) =>
        prev ? { ...prev, ...updatedFields } : prev
      );

      toast.success('Product details updated successfully.');
      handleCloseEditModal();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update product details.');
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
        <Box
          display={'flex'}
          flexDirection={'row'}
          justifyContent={'space-between'}
          alignItems={'center'}
        >
          <Typography variant='h4' gutterBottom sx={{ fontWeight: 'bold' }}>
            All Products
          </Typography>
          <FilterAlt onClick={() => setOpenFilterModal(true)} />
        </Box>
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
                      <TableCell colSpan={9} align='center'>
                        No products found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((product) => (
                      <TableRow key={product._id}>
                        <TableCell>
                          <img
                            onClick={() =>
                              handleImageClick(
                                product.image_url || '/placeholder.png'
                              )
                            }
                            src={product.image_url || '/placeholder.png'}
                            alt={product.name}
                            style={{
                              width: '80px',
                              height: '80px',
                              borderRadius: '4px',
                              objectFit: 'cover',
                              cursor: 'pointer',
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
                            variant='contained'
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
            <Box
              display={'flex'}
              flexDirection={'row'}
              alignItems={'end'}
              justifyContent={'space-between'}
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
                  // totalCount from server
                  count={totalCount}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />

                {/* "Go to page" UI */}
                <Box
                  sx={{
                    ml: 2,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <TextField
                    label='Go to page'
                    type='number'
                    variant='outlined'
                    size='small'
                    sx={{ width: 100, mr: 1 }}
                    // If user typed something, show that; otherwise, current page + 1
                    value={skipPage !== '' ? skipPage : page + 1}
                    onChange={(e) =>
                      parseInt(e.target.value) <= totalPageCount
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
                Total Pages: {totalPageCount}
              </Typography>
            </Box>
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
        <Typography variant='h6' gutterBottom>
          Filter Products
        </Typography>

        {/* Status Filter */}
        <Typography variant='subtitle2'>Status</Typography>
        <RadioGroup
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <FormControlLabel value='' control={<Radio />} label='All' />
          <FormControlLabel value='active' control={<Radio />} label='Active' />
          <FormControlLabel
            value='inactive'
            control={<Radio />}
            label='Inactive'
          />
        </RadioGroup>

        {/* Stock Filter */}
        <Typography variant='subtitle2'>Stock</Typography>
        <RadioGroup
          value={filterStock}
          onChange={(e: any) => setFilterStock(e.target.value)}
        >
          <FormControlLabel value='' control={<Radio />} label='All' />
          <FormControlLabel
            value='zero'
            control={<Radio />}
            label='Zero Stock'
          />
          <FormControlLabel
            value='gt_zero'
            control={<Radio />}
            label='> 0 Stock'
          />
        </RadioGroup>

        {/* New Arrivals */}
        <FormControlLabel
          control={
            <Checkbox
              checked={filterNewArrivals}
              onChange={(e) => {
                setFilterNewArrivals(e.target.checked);
                setFilterStatus('');
              }}
            />
          }
          label='New Arrivals Only'
        />

        <Box sx={{ mt: 3 }}>
          <Button variant='contained' onClick={applyFilters}>
            Apply
          </Button>
        </Box>
      </Drawer>
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
                      onClick={() =>
                        handleImageClick(
                          selectedProduct.image_url || '/placeholder.png'
                        )
                      }
                      src={selectedProduct.image_url || '/placeholder.png'}
                      alt={selectedProduct.name}
                      style={{
                        width: '100%',
                        maxWidth: '200px',
                        height: 'auto',
                        borderRadius: '4px',
                        objectFit: 'cover',
                        cursor: 'pointer',
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
                    {/* Item Name (Read-only) */}
                    <Grid item xs={12} sm={6}>
                      <Typography variant='subtitle2' color='textSecondary'>
                        Item Name
                      </Typography>
                      <Typography variant='body1'>
                        {selectedProduct.item_name}
                      </Typography>
                    </Grid>

                    {/* Category (Editable) */}
                    <Grid item xs={12} sm={6}>
                      <Typography variant='subtitle2' color='textSecondary'>
                        Category
                      </Typography>
                      <TextField
                        name='category'
                        variant='outlined'
                        fullWidth
                        value={editableFields.category}
                        onChange={handleEditableFieldChange}
                        size='small'
                      />
                    </Grid>

                    {/* Sub Category (Editable) */}
                    <Grid item xs={12} sm={6}>
                      <Typography variant='subtitle2' color='textSecondary'>
                        Sub Category
                      </Typography>
                      <TextField
                        name='sub_category'
                        variant='outlined'
                        fullWidth
                        value={editableFields.sub_category}
                        onChange={handleEditableFieldChange}
                        size='small'
                      />
                    </Grid>

                    {/* Series (Editable) */}
                    <Grid item xs={12} sm={6}>
                      <Typography variant='subtitle2' color='textSecondary'>
                        Series
                      </Typography>
                      <TextField
                        name='series'
                        variant='outlined'
                        fullWidth
                        value={editableFields.series}
                        onChange={handleEditableFieldChange}
                        size='small'
                      />
                    </Grid>

                    {/* SKU (Read-only) */}
                    <Grid item xs={12} sm={6}>
                      <Typography variant='subtitle2' color='textSecondary'>
                        SKU
                      </Typography>
                      <Typography variant='body1'>
                        {selectedProduct.cf_sku_code}
                      </Typography>
                    </Grid>

                    {/* Manufacture Code (Read-only) */}
                    <Grid item xs={12} sm={6}>
                      <Typography variant='subtitle2' color='textSecondary'>
                        Manufacture Code
                      </Typography>
                      <Typography variant='body1'>
                        {selectedProduct.cf_item_code}
                      </Typography>
                    </Grid>

                    {/* Price (Read-only) */}
                    <Grid item xs={12} sm={6}>
                      <Typography variant='subtitle2' color='textSecondary'>
                        Price
                      </Typography>
                      <Typography variant='body1'>
                        ₹{selectedProduct.rate}
                      </Typography>
                    </Grid>

                    {/* Stock (Read-only) */}
                    <Grid item xs={12} sm={6}>
                      <Typography variant='subtitle2' color='textSecondary'>
                        Stock
                      </Typography>
                      <Typography variant='body1'>
                        {selectedProduct.stock}
                      </Typography>
                    </Grid>

                    {/* Status (Read-only) */}
                    <Grid item xs={12} sm={6}>
                      <Typography variant='subtitle2' color='textSecondary'>
                        Status
                      </Typography>
                      <Typography variant='body1'>
                        {selectedProduct.status.charAt(0).toUpperCase() +
                          selectedProduct.status.slice(1)}
                      </Typography>
                    </Grid>

                    {/* Brand (Read-only) */}
                    <Grid item xs={12} sm={6}>
                      <Typography variant='subtitle2' color='textSecondary'>
                        Brand
                      </Typography>
                      <Typography variant='body1'>
                        {selectedProduct.brand}
                      </Typography>
                    </Grid>

                    {/* HSN/SAC (Read-only) */}
                    <Grid item xs={12} sm={6}>
                      <Typography variant='subtitle2' color='textSecondary'>
                        HSN/SAC
                      </Typography>
                      <Typography variant='body1'>
                        {selectedProduct.hsn_or_sac}
                      </Typography>
                    </Grid>

                    {/* UPC/EAN (Read-only) */}
                    <Grid item xs={12} sm={6}>
                      <Typography variant='subtitle2' color='textSecondary'>
                        UPC/EAN
                      </Typography>
                      <Typography variant='body1'>
                        {selectedProduct?.upc_code}
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
          <Button
            onClick={handleCloseEditModal}
            color='primary'
            disabled={updating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveEdit}
            color='primary'
            variant='contained'
            disabled={updating}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
      <ImagePopupDialog
        open={openImagePopup}
        onClose={handleClosePopup}
        imageSrc={popupImageSrc}
      />
    </Box>
  );
};

export default Products;
