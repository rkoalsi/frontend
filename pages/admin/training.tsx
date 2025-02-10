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

const Trainings = () => {
  const router = useRouter();

  // State for trainings data and pagination
  const [trainings, setTrainings] = useState([]);
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
  // When editing, selectedTraining is non-null.
  const [selectedTraining, setSelectedTraining]: any = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    video_url: '', // will hold the training video file link
    description: '',
    is_active: true,
  });

  // Fetch trainings from the server
  const fetchTrainings = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: rowsPerPage,
      };
      const response = await axiosInstance.get(`/admin/trainings`, { params });
      // The backend returns: { trainings, total_count, total_pages }
      const { trainings, total_count, total_pages } = response.data;
      setTrainings(trainings);
      setTotalCount(total_count);
      setTotalPageCount(total_pages);
    } catch (error) {
      console.error(error);
      toast.error('Error fetching trainings.');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch trainings when page or rowsPerPage changes
  useEffect(() => {
    fetchTrainings();
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

  // Opens the dialog for editing an existing training video.
  const handleEditClick = (training: any) => {
    setSelectedTraining(training);
    setFormData({
      title: training.title || '',
      video_url: training.video_url || '',
      description: training.description || '',
      is_active: training.is_active !== undefined ? training.is_active : true,
    });
    setDialogOpen(true);
  };

  // Handler for saving a training video (update if editing, add if creating new)
  const handleSave = async () => {
    if (!formData.title || !formData.video_url) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setActionLoading(true);
    try {
      if (selectedTraining) {
        // Update existing training video
        await axiosInstance.put(
          `/admin/trainings/${selectedTraining._id}`,
          formData
        );
        toast.success('Training video updated successfully');
      } else {
        // Add new training video
        await axiosInstance.post(`/admin/trainings`, formData);
        toast.success('Training video added successfully');
      }
      fetchTrainings();
      setDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Error saving training video');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler for toggling active/inactive status
  const handleCheck = async (training: any) => {
    setActionLoading(true);
    try {
      // Here you might want to call an endpoint that toggles the status.
      // For simplicity, we re-use the delete endpoint (or create a new one) and assume it marks as inactive.
      const resp = await axiosInstance.delete(
        `/admin/trainings/${training._id}`
      );
      if (resp.status === 200) {
        toast.success(
          `Training video marked as ${
            !training.is_active ? 'Active' : 'Inactive'
          } successfully`
        );
        fetchTrainings();
      }
    } catch (error: any) {
      console.error(error);
      toast.error(
        error.response?.data?.detail || 'Error updating training video status'
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Opens dialog for adding a new training video.
  const handleAddTraining = () => {
    setSelectedTraining(null);
    setFormData({ title: '', video_url: '', description: '', is_active: true });
    setDialogOpen(true);
  };

  // --- File Upload Handler for video ---
  const handleFileChange = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      const response = await axiosInstance.post(
        '/admin/trainings/upload',
        uploadFormData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      // Expecting { file_url: "https://bucket.s3.amazonaws.com/..." }
      setFormData((prev) => ({
        ...prev,
        video_url: response.data.file_url,
      }));
      toast.success('Video uploaded successfully');
    } catch (error) {
      console.error(error);
      toast.error('Error uploading video');
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
            All Training Videos
          </Typography>
          <Button variant='contained' onClick={handleAddTraining}>
            Add Training Video
          </Button>
        </Box>
        <Typography variant='body1' sx={{ color: '#6B7280', marginBottom: 3 }}>
          View and manage all training videos for sales people below.
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
            {trainings.length > 0 ? (
              <>
                {/* Training Videos Table */}
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Title</TableCell>
                        <TableCell>Video URL</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {trainings.map((training: any) => (
                        <TableRow key={training._id}>
                          <TableCell>{training.title}</TableCell>
                          <TableCell>{training.video_url}</TableCell>
                          <TableCell>
                            <Switch
                              onClick={() => handleCheck(training)}
                              checked={training?.is_active}
                            />
                          </TableCell>
                          <TableCell>
                            <Box display='flex' flexDirection='row' gap='8px'>
                              <IconButton
                                onClick={() => handleEditClick(training)}
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
                  No Training Videos
                </Typography>
              </Box>
            )}
          </>
        )}
      </Paper>

      {/* Dialog for Add/Edit Training Video */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth='lg'
      >
        <DialogTitle>
          {selectedTraining ? 'Edit Training Video' : 'Add Training Video'}
        </DialogTitle>
        <DialogContent>
          <Box
            component='form'
            noValidate
            autoComplete='off'
            sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}
          >
            <TextField
              label='Video Title'
              variant='outlined'
              fullWidth
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
            <TextField
              label='Description'
              variant='outlined'
              fullWidth
              multiline
              rows={4}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
            {/* Video URL field and upload button */}
            <Box display='flex' alignItems='center' gap={2}>
              <TextField
                label='Video URL'
                variant='outlined'
                fullWidth
                value={formData.video_url}
                InputProps={{
                  readOnly: true,
                }}
              />
              <Button variant='contained' component='label'>
                {formData.video_url ? 'Change Video' : 'Upload Video'}
                <input
                  type='file'
                  hidden
                  accept='video/*'
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

export default Trainings;
