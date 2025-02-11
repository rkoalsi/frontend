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

const Announcements = () => {
  const router = useRouter();

  // State for Announcements data and pagination
  const [announcements, setTrainings] = useState([]);
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
    description: '',
    is_active: true,
  });

  // Fetch announcements from the server
  const fetchTrainings = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: rowsPerPage,
      };
      const response = await axiosInstance.get(`/admin/announcements`, {
        params,
      });
      // The backend returns: { announcements, total_count, total_pages }
      const { announcements, total_count, total_pages } = response.data;
      setTrainings(announcements);
      setTotalCount(total_count);
      setTotalPageCount(total_pages);
    } catch (error) {
      console.error(error);
      toast.error('Error fetching announcements.');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch announcements when page or rowsPerPage changes
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

  // Opens the dialog for editing an existing announcement video.
  const handleEditClick = (announcement: any) => {
    setSelectedTraining(announcement);
    setFormData({
      title: announcement.title || '',
      description: announcement.description || '',
      is_active:
        announcement.is_active !== undefined ? announcement.is_active : true,
    });
    setDialogOpen(true);
  };

  // Handler for saving a announcement video (update if editing, add if creating new)
  const handleSave = async () => {
    if (!formData.title) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setActionLoading(true);
    try {
      if (selectedTraining) {
        // Update existing announcement video
        await axiosInstance.put(
          `/admin/announcements/${selectedTraining._id}`,
          formData
        );
        toast.success('Announcement updated successfully');
      } else {
        // Add new announcement video
        await axiosInstance.post(`/admin/announcements`, formData);
        toast.success('Announcement added successfully');
      }
      fetchTrainings();
      setDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Error saving announcement video');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler for toggling active/inactive status
  const handleCheck = async (announcement: any) => {
    setActionLoading(true);
    try {
      // Here you might want to call an endpoint that toggles the status.
      // For simplicity, we re-use the delete endpoint (or create a new one) and assume it marks as inactive.
      const resp = await axiosInstance.delete(
        `/admin/announcements/${announcement._id}`
      );
      if (resp.status === 200) {
        toast.success(
          `Announcement marked as ${
            !announcement.is_active ? 'Active' : 'Inactive'
          } successfully`
        );
        fetchTrainings();
      }
    } catch (error: any) {
      console.error(error);
      toast.error(
        error.response?.data?.detail ||
          'Error updating announcement video status'
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Opens dialog for adding a new announcement video.
  const handleAddTraining = () => {
    setSelectedTraining(null);
    setFormData({ title: '', description: '', is_active: true });
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
            All Announcements
          </Typography>
          <Button variant='contained' onClick={handleAddTraining}>
            Add Announcement
          </Button>
        </Box>
        <Typography variant='body1' sx={{ color: '#6B7280', marginBottom: 3 }}>
          View and manage all announcements for sales people below.
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
            {announcements.length > 0 ? (
              <>
                {/* Training Videos Table */}
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Title</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {announcements.map((announcement: any) => (
                        <TableRow key={announcement._id}>
                          <TableCell>{announcement.title}</TableCell>
                          <TableCell>
                            <Switch
                              onClick={() => handleCheck(announcement)}
                              checked={announcement?.is_active}
                            />
                          </TableCell>
                          <TableCell>
                            <Box display='flex' flexDirection='row' gap='8px'>
                              <IconButton
                                onClick={() => handleEditClick(announcement)}
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
                  No Anouncements
                </Typography>
              </Box>
            )}
          </>
        )}
      </Paper>

      {/* Dialog for Add/Edit Announcment */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth='lg'
      >
        <DialogTitle>
          {selectedTraining ? 'Edit Announcment' : 'Add Announcment'}
        </DialogTitle>
        <DialogContent>
          <Box
            component='form'
            noValidate
            autoComplete='off'
            sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}
          >
            <TextField
              label='Title'
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

export default Announcements;
