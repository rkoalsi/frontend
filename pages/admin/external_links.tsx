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
import { Campaign, Edit } from '@mui/icons-material';
import axiosInstance from '../../src/util/axios';

const ExternalLinks = () => {
  const [externalLinks, setExternalLinks] = useState([]);
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
  // When editing, selectedExternalLink is non-null.
  const [selectedExternalLink, setSelectedExternalLink] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    url: '', // will hold the catalogue file link
    is_active: true,
  });

  // Fetch externalLinks from the server
  const fetchExternalLinks = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: rowsPerPage,
      };
      const response = await axiosInstance.get(`/admin/external_links`, {
        params,
      });
      // The backend returns: { externalLinks, total_count, total_pages }
      const { external_links, total_count, total_pages } = response.data;
      setExternalLinks(external_links);
      setTotalCount(total_count);
      setTotalPageCount(total_pages);
    } catch (error) {
      console.error(error);
      toast.error('Error fetching external links.');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch externalLinks when page or rowsPerPage changes
  useEffect(() => {
    fetchExternalLinks();
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
    if (
      isNaN(requestedPage) ||
      requestedPage < 1 ||
      requestedPage > totalPagesCount
    ) {
      toast.error('Invalid page number');
      return;
    }
    setPage(requestedPage - 1); // convert to 0-based index
    setSkipPage('');
  };

  // Opens the dialog for editing an existing catalogue.
  const handleEditClick = (ext: any) => {
    setSelectedExternalLink(ext);
    setFormData({
      name: ext.name || '',
      url: ext.url || '',
      is_active: ext.is_active !== undefined ? ext.is_active : true,
    });
    setDialogOpen(true);
  };

  // Handler for saving a catalogue (update if editing, add if creating new)
  const handleSave = async () => {
    if (!formData.name || !formData.url) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setActionLoading(true);
    try {
      if (selectedExternalLink) {
        // Update existing catalogue
        await axiosInstance.put(
          `/admin/external_links/${selectedExternalLink._id}`,
          formData
        );
        toast.success('External Link updated successfully');
      } else {
        // Add new catalogue (assuming you have a POST route defined)
        await axiosInstance.post(`/admin/external_links`, formData);
        toast.success('External Link added successfully');
      }
      fetchExternalLinks();
      setDialogOpen(false);
      // Reset form data
      setFormData({ name: '', url: '', is_active: true });
      setSelectedExternalLink(null);
    } catch (error) {
      console.error(error);
      toast.error('Error saving external link');
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
        `/admin/external_links/${catalog._id}`
      );
      if (resp.status === 200) {
        toast.success(
          `External Link marked as ${
            !catalog.is_active ? 'Active' : 'Inactive'
          } successfully`
        );
        fetchExternalLinks();
      }
    } catch (error: any) {
      console.error(error);
      toast.error(
        error.response?.data?.detail || 'Error updating external link status'
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Opens dialog for adding a new catalogue.
  const handleAdd = () => {
    setSelectedExternalLink(null);
    setFormData({ name: '', url: '', is_active: true });
    setDialogOpen(true);
  };

  // Handler for closing dialog
  const handleDialogClose = () => {
    setDialogOpen(false);
    setFormData({ name: '', url: '', is_active: true });
    setSelectedExternalLink(null);
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
        '/admin/external_links/upload',
        uploadFormData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      // Expecting { file_url: "https://bucket.s3.amazonaws.com/..." }
      setFormData((prev) => ({
        ...prev,
        url: response.data.file_url,
      }));
      toast.success('File uploaded successfully');
    } catch (error) {
      console.error(error);
      toast.error('Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  // Handler for form input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
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
            All External Links
          </Typography>
          <Button variant='contained' onClick={handleAdd}>
            Add External Link
          </Button>
        </Box>
        <Typography variant='body1' sx={{ color: '#6B7280', marginBottom: 3 }}>
          View and manage all external links below.
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
            {externalLinks?.length > 0 ? (
              <>
                {/* ExternalLinks Table */}
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>External Link File URL</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {externalLinks.map((catalog: any) => (
                        <TableRow key={catalog._id}>
                          <TableCell>{catalog.name}</TableCell>
                          <TableCell>{catalog.url}</TableCell>
                          <TableCell>
                            <Switch
                              onClick={() => handleCheck(catalog)}
                              checked={catalog?.is_active}
                              disabled={actionLoading}
                            />
                          </TableCell>
                          <TableCell>
                            <Box display='flex' flexDirection='row' gap='8px'>
                              <IconButton
                                onClick={() => handleEditClick(catalog)}
                                disabled={actionLoading}
                              >
                                <Edit />
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
                        onChange={(e) => {
                          const value = e.target.value;
                          const numValue = parseInt(value);
                          if (
                            value === '' ||
                            (numValue >= 1 && numValue <= totalPagesCount)
                          ) {
                            setSkipPage(value);
                          } else {
                            toast.error('Invalid Page Number');
                          }
                        }}
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
                  No External Links
                </Typography>
              </Box>
            )}
          </>
        )}
      </Paper>

      {/* Dialog for Add/Edit External Link */}
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        fullWidth
        maxWidth='lg'
      >
        <DialogTitle>
          {selectedExternalLink ? 'Edit External Link' : 'Add External Link'}
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
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
            />
            {/* External Link File URL field and upload button */}
            <Box display='flex' alignItems='center' gap={2}>
              <TextField
                label='External Link File URL'
                variant='outlined'
                fullWidth
                value={formData.url}
                onChange={(e) => handleInputChange('url', e.target.value)}
                required
              />
            </Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.is_active}
                  onChange={(e) =>
                    handleInputChange('is_active', e.target.checked)
                  }
                />
              }
              label='Active'
            />
          </Box>
          <Box
            sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}
          >
            <Button onClick={handleDialogClose} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              variant='contained'
              onClick={handleSave}
              disabled={actionLoading || !formData.name || !formData.url}
            >
              {actionLoading ? 'Saving...' : 'Save'}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ExternalLinks;
