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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider,
} from '@mui/material';
import { toast } from 'react-toastify';
import { Visibility, Delete } from '@mui/icons-material';
import axiosInstance from '../../src/util/axios';

const STATUS_OPTIONS = ['pending', 'reviewed', 'rejected', 'accepted'];

const statusColor = (status: string) => {
  switch (status) {
    case 'accepted':
      return 'success';
    case 'rejected':
      return 'error';
    case 'reviewed':
      return 'info';
    default:
      return 'warning';
  }
};

const CareerApplications = () => {
  const [applications, setApplications] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPagesCount, setTotalPageCount] = useState(0);
  const [skipPage, setSkipPage] = useState('');

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [filterCareerId, setFilterCareerId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Detail dialog
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusValue, setStatusValue] = useState('');

  // Careers list for reference
  const [careers, setCareers] = useState<any[]>([]);

  const fetchCareers = async () => {
    try {
      const response = await axiosInstance.get(`/admin/careers`, {
        params: { page: 0, limit: 1000 },
      });
      setCareers(response.data.careers || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: rowsPerPage };
      if (filterCareerId) params.career_id = filterCareerId;
      if (filterStatus) params.status = filterStatus;

      const response = await axiosInstance.get(`/admin/career_applications`, {
        params,
      });
      const { career_applications, total_count, total_pages } = response.data;
      setApplications(career_applications);
      setTotalCount(total_count);
      setTotalPageCount(total_pages);
    } catch (error) {
      console.error(error);
      toast.error('Error fetching career applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCareers();
  }, []);

  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, filterCareerId, filterStatus, actionLoading]);

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
    setPage(requestedPage - 1);
    setSkipPage('');
  };

  const getCareerTitle = (careerId: string) => {
    const career = careers.find((c: any) => c._id === careerId);
    return career ? career.title : careerId;
  };

  const handleViewClick = (application: any) => {
    setSelectedApplication(application);
    setStatusValue(application.status || 'pending');
    setDialogOpen(true);
  };

  const handleStatusUpdate = async () => {
    if (!selectedApplication) return;
    setActionLoading(true);
    try {
      await axiosInstance.put(
        `/admin/career_applications/${selectedApplication._id}`,
        { status: statusValue }
      );
      toast.success('Application status updated');
      setDialogOpen(false);
      setSelectedApplication(null);
      fetchApplications();
    } catch (error) {
      console.error(error);
      toast.error('Error updating application status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (applicationId: string) => {
    if (!confirm('Are you sure you want to delete this application?')) return;
    setActionLoading(true);
    try {
      await axiosInstance.delete(`/admin/career_applications/${applicationId}`);
      toast.success('Application deleted successfully');
      fetchApplications();
    } catch (error) {
      console.error(error);
      toast.error('Error deleting application');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedApplication(null);
  };

  const DetailRow = ({ label, value }: { label: string; value: any }) => {
    if (!value) return null;
    return (
      <Typography variant='body2' sx={{ mb: 0.5 }}>
        <strong>{label}:</strong> {value}
      </Typography>
    );
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Paper
        elevation={3}
        sx={{ padding: 4, borderRadius: 4, backgroundColor: 'white' }}
      >
        <Typography variant='h4' gutterBottom sx={{ fontWeight: 'bold' }}>
          Career Applications
        </Typography>
        <Typography variant='body1' sx={{ color: '#6B7280', marginBottom: 3 }}>
          View and manage all career applications below.
        </Typography>

        {/* Filters */}
        <Box display='flex' gap={2} mb={3}>
          <FormControl size='small' sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Career</InputLabel>
            <Select
              value={filterCareerId}
              label='Filter by Career'
              onChange={(e) => {
                setFilterCareerId(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value=''>All</MenuItem>
              {careers.map((career: any) => (
                <MenuItem key={career._id} value={career._id}>
                  {career.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size='small' sx={{ minWidth: 160 }}>
            <InputLabel>Filter by Status</InputLabel>
            <Select
              value={filterStatus}
              label='Filter by Status'
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value=''>All</MenuItem>
              {STATUS_OPTIONS.map((s) => (
                <MenuItem key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

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
            {applications?.length > 0 ? (
              <>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Applicant Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Phone</TableCell>
                        <TableCell>Career</TableCell>
                        <TableCell>Location</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Applied On</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {applications.map((app: any) => (
                        <TableRow key={app._id}>
                          <TableCell>{app.applicant_name}</TableCell>
                          <TableCell>{app.applicant_email}</TableCell>
                          <TableCell>{app.applicant_phone}</TableCell>
                          <TableCell>{getCareerTitle(app.career_id)}</TableCell>
                          <TableCell>{app.current_location || '-'}</TableCell>
                          <TableCell>
                            <Chip
                              label={app.status || 'pending'}
                              color={statusColor(app.status) as any}
                              size='small'
                            />
                          </TableCell>
                          <TableCell>
                            {app.created_at
                              ? new Date(app.created_at).toLocaleDateString()
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <Box display='flex' gap='4px'>
                              <IconButton
                                onClick={() => handleViewClick(app)}
                                disabled={actionLoading}
                              >
                                <Visibility />
                              </IconButton>
                              <IconButton
                                onClick={() => handleDelete(app._id)}
                                disabled={actionLoading}
                                color='error'
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
                          if (e.key === 'Enter') handleSkipPage();
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
                  No Applications Found
                </Typography>
              </Box>
            )}
          </>
        )}
      </Paper>

      {/* Detail / Status Update Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        fullWidth
        maxWidth='md'
      >
        <DialogTitle>Application Details</DialogTitle>
        <DialogContent>
          {selectedApplication && (
            <Box
              sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}
            >
              <Typography variant='subtitle1' fontWeight='bold' color='primary'>
                Personal Details
              </Typography>
              <DetailRow label='Name' value={selectedApplication.applicant_name} />
              <DetailRow label='Email' value={selectedApplication.applicant_email} />
              <DetailRow label='Phone' value={selectedApplication.applicant_phone} />
              <DetailRow label='Current Location' value={selectedApplication.current_location} />

              <Divider sx={{ my: 1 }} />
              <Typography variant='subtitle1' fontWeight='bold' color='primary'>
                Professional Information
              </Typography>
              <DetailRow label='Total Experience' value={selectedApplication.total_experience} />
              <DetailRow label='Relevant Experience' value={selectedApplication.relevant_experience} />
              <DetailRow label='Current Company' value={selectedApplication.current_company} />
              <DetailRow label='Current Designation' value={selectedApplication.current_designation} />
              <DetailRow label='Current CTC' value={selectedApplication.current_ctc} />
              <DetailRow label='Expected CTC' value={selectedApplication.expected_ctc} />
              <DetailRow label='Notice Period' value={selectedApplication.notice_period} />
              <DetailRow label='Preferred Location' value={selectedApplication.preferred_location} />

              <Divider sx={{ my: 1 }} />
              <Typography variant='subtitle1' fontWeight='bold' color='primary'>
                Documents & Availability
              </Typography>
              <DetailRow
                label='Career'
                value={getCareerTitle(selectedApplication.career_id)}
              />
              {selectedApplication.resume_url && (
                <Typography variant='body2' sx={{ mb: 0.5 }}>
                  <strong>Resume:</strong>{' '}
                  <a
                    href={selectedApplication.resume_url}
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    View Resume
                  </a>
                </Typography>
              )}
              <DetailRow label='LinkedIn' value={selectedApplication.linkedin_url} />
              <DetailRow
                label='Available for Interview (7 days)'
                value={selectedApplication.available_for_interview}
              />
              <DetailRow label='Applied Before' value={selectedApplication.applied_before} />

              {selectedApplication.custom_answers &&
                Object.keys(selectedApplication.custom_answers).length > 0 && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <Typography
                      variant='subtitle1'
                      fontWeight='bold'
                      color='primary'
                    >
                      Custom Answers
                    </Typography>
                    {Object.entries(selectedApplication.custom_answers).map(
                      ([question, answer]: [string, any]) => (
                        <DetailRow key={question} label={question} value={answer} />
                      )
                    )}
                  </>
                )}

              <Divider sx={{ my: 1 }} />
              <DetailRow
                label='Applied On'
                value={
                  selectedApplication.created_at
                    ? new Date(selectedApplication.created_at).toLocaleString()
                    : '-'
                }
              />

              <FormControl fullWidth sx={{ mt: 1 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusValue}
                  label='Status'
                  onChange={(e) => setStatusValue(e.target.value)}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
          <Box
            sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}
          >
            <Button onClick={handleDialogClose} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              variant='contained'
              onClick={handleStatusUpdate}
              disabled={actionLoading}
            >
              {actionLoading ? 'Updating...' : 'Update Status'}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default CareerApplications;
