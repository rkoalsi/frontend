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
  Checkbox,
  FormControlLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Switch,
} from '@mui/material';
import { toast } from 'react-toastify';
import { Delete, Edit } from '@mui/icons-material';
import { useRouter } from 'next/router';
import axiosInstance from '../../src/util/axios';

const HooksAndCategories = () => {
  // State for categories data and pagination
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(0); // 0-based index
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPagesCount, setTotalPageCount] = useState(0);
  const [skipPage, setSkipPage] = useState('');

  // Loading states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedCategory, setSelectedCategory]: any = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    is_active: true,
  });

  // Fetch categories from the server
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: rowsPerPage,
      };
      const response = await axiosInstance.get(`/admin/hooks_categories`, {
        params,
      });
      // The backend returns: { categories, total_count, total_pages }
      const { hooks_category = [], total_count, total_pages } = response.data;
      setCategories(hooks_category);
      setTotalCount(total_count);
      setTotalPageCount(total_pages);
    } catch (error) {
      console.error(error);
      toast.error('Error fetching categories.');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch categories when page or rowsPerPage changes
  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, actionLoading]);

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

  // Opens the dialog for editing an existing Category.
  const handleEditClick = (category: any) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name || '',
      is_active: category.is_active !== undefined ? category.is_active : true,
    });
    setDialogOpen(true);
  };

  // Handler for saving a Category (update if editing, add if creating new)
  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setActionLoading(true);
    try {
      if (selectedCategory) {
        // Update existing Category
        await axiosInstance.put(
          `/admin/hooks_categories/${selectedCategory._id}`,
          formData
        );
        toast.success('Category updated successfully');
      } else {
        // Add new Category (assuming you have a POST route defined)
        await axiosInstance.post(`/admin/hooks_categories`, formData);
        toast.success('Category added successfully');
      }
      fetchCategories();
      setDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Error saving Category');
    } finally {
      setActionLoading(false);
    }
  };
  const handleCheck = async (category: any) => {
    setActionLoading(true);
    try {
      if (category) {
        // Update existing Category
        await axiosInstance.put(`/admin/hooks_categories/${category._id}`, {
          is_active: !category.is_active,
        });
        toast.success('Category updated successfully');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error saving Category');
    } finally {
      setActionLoading(false);
    }
  };
  const handleDeleteClick = async (category: any) => {
    setActionLoading(true);
    try {
      // Here you might want to call an endpoint that toggles the status.
      // For simplicity, we re-use the delete endpoint (or create a new one) and assume it marks as inactive.
      const resp = await axiosInstance.delete(
        `/admin/hooks_categories/${category._id}`
      );
      if (resp.status === 200) {
        toast.success(`Category deleted successfully`);
        fetchCategories();
      }
    } catch (error: any) {
      console.error(error);
      toast.error(
        error.response?.data?.detail || 'Error updating Category status'
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Opens dialog for adding a new Category.
  const handleAddCategory = () => {
    setSelectedCategory(null);
    setFormData({ name: '', is_active: true });
    setDialogOpen(true);
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
            All Categories for Hooks
          </Typography>
          <Button variant='contained' onClick={handleAddCategory}>
            Add Category
          </Button>
        </Box>
        <Typography variant='body1' sx={{ color: '#6B7280', marginBottom: 3 }}>
          View and manage all categories for hooks below.
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
            {categories.length > 0 ? (
              <>
                {/* categories Table */}
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {categories.map((category: any) => (
                        <TableRow key={category._id}>
                          <TableCell>{category.name}</TableCell>
                          <TableCell>
                            <Switch
                              onClick={() => handleCheck(category)}
                              checked={category?.is_active}
                            />
                          </TableCell>
                          <TableCell>
                            <Box display='flex' flexDirection='row' gap='8px'>
                              <IconButton
                                onClick={() => handleEditClick(category)}
                              >
                                <Edit />
                              </IconButton>
                              <IconButton
                                onClick={() => handleDeleteClick(category)}
                              >
                                <Delete />
                              </IconButton>
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
                  No categories
                </Typography>
              </Box>
            )}
          </>
        )}
      </Paper>

      {/* Dialog for Add/Edit Category */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth='lg'
      >
        <DialogTitle>
          {selectedCategory ? 'Edit Category' : 'Add Category'}
        </DialogTitle>
        <DialogContent>
          <Box
            component='form'
            noValidate
            autoComplete='off'
            sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}
          >
            <TextField
              label='Name'
              variant='outlined'
              fullWidth
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                />
              }
              label='Active'
            />
          </Box>
          <Box
            sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}
          >
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button variant='contained' onClick={handleSave}>
              Save
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default HooksAndCategories;
