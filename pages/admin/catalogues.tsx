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

const Catalogues = () => {
  const router = useRouter();

  // State for catalogues data and pagination
  const [catalogues, setCatalogues] = useState([]);
  const [page, setPage] = useState(0); // 0-based index
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPagesCount, setTotalPageCount] = useState(0);
  const [skipPage, setSkipPage] = useState('');

  // Loading states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // State for dialog & form (for add/edit)
  // When editing, selectedCatalogue is non-null.
  const [selectedCatalogue, setSelectedCatalogue]: any = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    image_url: '', // will hold the catalogue file link
    is_active: true,
  });

  // Fetch catalogues from the server
  const fetchCatalogues = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: rowsPerPage,
      };
      const response = await axiosInstance.get(`/admin/catalogues`, { params });
      // The backend returns: { catalogues, total_count, total_pages }
      const { catalogues, total_count, total_pages } = response.data;
      setCatalogues(catalogues);
      setTotalCount(total_count);
      setTotalPageCount(total_pages);
    } catch (error) {
      console.error(error);
      toast.error('Error fetching catalogues.');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch catalogues when page or rowsPerPage changes
  useEffect(() => {
    fetchCatalogues();
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

  // Opens the dialog for editing an existing catalogue.
  const handleEditClick = (catalog: any) => {
    setSelectedCatalogue(catalog);
    setFormData({
      name: catalog.name || '',
      image_url: catalog.image_url || '',
      is_active: catalog.is_active !== undefined ? catalog.is_active : true,
    });
    setDialogOpen(true);
  };

  // Handler for saving a catalogue (update if editing, add if creating new)
  const handleSave = async () => {
    if (!formData.name || !formData.image_url) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setActionLoading(true);
    try {
      if (selectedCatalogue) {
        // Update existing catalogue
        await axiosInstance.put(
          `/admin/catalogues/${selectedCatalogue._id}`,
          formData
        );
        toast.success('Catalogue updated successfully');
      } else {
        // Add new catalogue (assuming you have a POST route defined)
        await axiosInstance.post(`/admin/catalogues`, formData);
        toast.success('Catalogue added successfully');
      }
      fetchCatalogues();
      setDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Error saving catalogue');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler for toggling active/inactive status
  const handleCheck = async (catalog: any) => {
    setActionLoading(true);
    try {
      // Here you might want to call an endpoint that toggles the status.
      // For simplicity, we re-use the delete endpoint (or create a new one) and assume it marks as inactive.
      const resp = await axiosInstance.delete(
        `/admin/catalogues/${catalog._id}`
      );
      if (resp.status === 200) {
        toast.success(
          `Catalogue marked as ${
            !catalog.is_active ? 'Active' : 'Inactive'
          } successfully`
        );
        fetchCatalogues();
      }
    } catch (error: any) {
      console.error(error);
      toast.error(
        error.response?.data?.detail || 'Error updating catalogue status'
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Opens dialog for adding a new catalogue.
  const handleAddCatalogue = () => {
    setSelectedCatalogue(null);
    setFormData({ name: '', image_url: '', is_active: true });
    setDialogOpen(true);
  };

  // --- File Upload Handler ---
  const handleFileChange = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      const response = await axiosInstance.post(
        '/admin/catalogues/upload',
        uploadFormData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      // Expecting { file_url: "https://bucket.s3.amazonaws.com/..." }
      setFormData((prev) => ({
        ...prev,
        image_url: response.data.file_url,
      }));
      toast.success('File uploaded successfully');
    } catch (error) {
      console.error(error);
      toast.error('Error uploading file');
    } finally {
      setUploading(false);
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
            All Catalogues
          </Typography>
          <Button variant='contained' onClick={handleAddCatalogue}>
            Add Catalogue
          </Button>
        </Box>
        <Typography variant='body1' sx={{ color: '#6B7280', marginBottom: 3 }}>
          View and manage all catalogues below.
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
            {catalogues.length > 0 ? (
              <>
                {/* Catalogues Table */}
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Catalogue File URL</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {catalogues.map((catalog: any) => (
                        <TableRow key={catalog._id}>
                          <TableCell>{catalog.name}</TableCell>
                          <TableCell>{catalog.image_url}</TableCell>
                          <TableCell>
                            <Switch
                              onClick={() => handleCheck(catalog)}
                              checked={catalog?.is_active}
                            />
                          </TableCell>
                          <TableCell>
                            <Box display='flex' flexDirection='row' gap='8px'>
                              <IconButton
                                onClick={() => handleEditClick(catalog)}
                              >
                                <Edit />
                              </IconButton>
                              {/* You could add a delete icon if needed */}
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
                  No Catalogues
                </Typography>
              </Box>
            )}
          </>
        )}
      </Paper>

      {/* Dialog for Add/Edit Catalogue */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth='lg'
      >
        <DialogTitle>
          {selectedCatalogue ? 'Edit Catalogue' : 'Add Catalogue'}
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
            {/* Catalogue File URL field and upload button */}
            <Box display='flex' alignItems='center' gap={2}>
              <TextField
                label='Catalogue File URL'
                variant='outlined'
                fullWidth
                value={formData.image_url}
                InputProps={{
                  readOnly: true,
                }}
              />
              <Button variant='contained' component='label'>
                {formData.image_url ? 'Change Link' : 'Upload PDF'}
                <input
                  type='file'
                  hidden
                  accept='application/pdf'
                  onChange={handleFileChange}
                />
              </Button>
              {uploading && <CircularProgress size={24} />}
            </Box>
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

export default Catalogues;
