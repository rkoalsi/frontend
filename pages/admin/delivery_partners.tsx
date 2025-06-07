import React, { useContext, useEffect, useState } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { toast } from 'react-toastify';
import axiosInstance from '../../src/util/axios';
import AuthContext from '../../src/components/Auth';

const DeliveryPartners = () => {
  // State for deliveryPartners data and pagination
  const { user }: any = useContext(AuthContext);
  const [deliveryPartners, setDeliveryPartners] = useState([]);
  const [page, setPage] = useState(0); // 0-based index
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPagesCount, setTotalPageCount] = useState(0);
  const [skipPage, setSkipPage] = useState('');
  const [editingId, setEditingId] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editedPartner, setEditedPartner] = useState({
    name: '',
    tracking_url: '',
  });

  // Loading states
  const [loading, setLoading] = useState(true);

  // Fetch deliveryPartners from the server
  const fetchDeliveryPartners = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: rowsPerPage,
      };
      const response = await axiosInstance.get(`/admin/delivery_partners`, {
        params,
      });
      // The backend returns: { delivery_partners, total_count, total_pages }
      const {
        delivery_partners = [],
        total_count,
        total_pages,
      } = response.data;
      setDeliveryPartners(delivery_partners);
      setTotalCount(total_count);
      setTotalPageCount(total_pages);
    } catch (error) {
      console.error(error);
      toast.error('Error fetching delivery partners.');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch deliveryPartners when page or rowsPerPage changes
  useEffect(() => {
    fetchDeliveryPartners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage]);

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

  // Opens dialog for adding a new delivery partner
  const handleAddDeliveryPartner = () => {
    setEditedPartner({ name: '', tracking_url: '' });
    setEditingId('');
    setEditDialogOpen(true);
  };

  const handleDelete = async (partnerId: any) => {
    if (
      !window.confirm('Are you sure you want to delete this delivery partner?')
    )
      return;
    try {
      await axiosInstance.delete(`/admin/delivery_partners/${partnerId}`);
      toast.success('Delivery partner deleted successfully.');
      fetchDeliveryPartners();
    } catch (error) {
      console.error(error);
      toast.error('Error deleting delivery partner.');
    }
  };

  const handleEdit = (partner: any) => {
    setEditedPartner({
      name: partner.name,
      tracking_url: partner.tracking_url || partner.tracking_url,
    });
    setEditingId(partner._id);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    // Validation
    if (!editedPartner.name.trim()) {
      toast.error('Name is required.');
      return;
    }
    if (!editedPartner.tracking_url.trim()) {
      toast.error('Tracking link is required.');
      return;
    }

    try {
      let action = '';
      const payload = {
        name: editedPartner.name.trim(),
        tracking_url: editedPartner.tracking_url.trim(),
        created_by: user?.data?._id,
      };

      if (editingId !== '') {
        action = 'updated';
        await axiosInstance.put(
          `/admin/delivery_partners/${editingId}`,
          payload
        );
      } else {
        action = 'created';
        await axiosInstance.post(`/admin/delivery_partners`, payload);
      }

      toast.success(`Delivery partner ${action} successfully.`);
      setEditDialogOpen(false);
      fetchDeliveryPartners();
    } catch (error) {
      console.error(error);
      toast.error('Error creating/updating delivery partner.');
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
            All Delivery Partners
          </Typography>
          <Button variant='contained' onClick={handleAddDeliveryPartner}>
            Add Delivery Partner
          </Button>
        </Box>
        <Typography variant='body1' sx={{ color: '#6B7280', marginBottom: 3 }}>
          View and manage all delivery partners below.
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
            {deliveryPartners.length > 0 ? (
              <>
                {/* Delivery Partners Table */}
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Created At</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Tracking Link</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {deliveryPartners.map((partner: any) => (
                        <TableRow key={partner._id}>
                          <TableCell>
                            {new Date(partner.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{partner.name}</TableCell>
                          <TableCell>
                            <a
                              href={
                                partner.tracking_url || partner.tracking_url
                              }
                              target='_blank'
                              rel='noopener noreferrer'
                            >
                              {partner.tracking_url || partner.tracking_url}
                            </a>
                          </TableCell>
                          <TableCell>
                            <IconButton
                              onClick={() => handleEdit(partner)}
                              color='primary'
                              size='small'
                            >
                              <Edit />
                            </IconButton>
                            <IconButton
                              onClick={() => handleDelete(partner._id)}
                              color='error'
                              size='small'
                            >
                              <Delete />
                            </IconButton>
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
                  No Delivery Partners
                </Typography>
              </Box>
            )}
          </>
        )}
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        fullWidth
        maxWidth='sm'
      >
        <DialogTitle sx={{ fontWeight: 'bold', textAlign: 'center' }}>
          {editingId ? 'Edit Delivery Partner' : 'Add Delivery Partner'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <TextField
              label='Name *'
              variant='outlined'
              fullWidth
              value={editedPartner.name}
              onChange={(e) =>
                setEditedPartner({ ...editedPartner, name: e.target.value })
              }
              error={!editedPartner.name.trim()}
              helperText={!editedPartner.name.trim() ? 'Name is required' : ''}
            />
            <TextField
              label='Tracking Link *'
              variant='outlined'
              fullWidth
              value={editedPartner.tracking_url}
              onChange={(e) =>
                setEditedPartner({
                  ...editedPartner,
                  tracking_url: e.target.value,
                })
              }
              error={!editedPartner.tracking_url.trim()}
              helperText={
                !editedPartner.tracking_url.trim()
                  ? 'Tracking link is required'
                  : ''
              }
              placeholder='https://example.com/track'
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', p: 2 }}>
          <Button
            onClick={() => setEditDialogOpen(false)}
            color='error'
            variant='outlined'
          >
            Cancel
          </Button>
          <Button
            variant='contained'
            color='primary'
            onClick={handleSaveEdit}
            disabled={
              !editedPartner.name.trim() || !editedPartner.tracking_url.trim()
            }
          >
            {editingId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DeliveryPartners;
