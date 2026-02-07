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
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { toast } from 'react-toastify';
import { Edit, Delete, Add } from '@mui/icons-material';
import axiosInstance from '../../src/util/axios';

interface CustomQuestion {
  question: string;
  type: 'text' | 'select';
  options: string[];
  required: boolean;
}

const Careers = () => {
  const [careers, setCareers] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPagesCount, setTotalPageCount] = useState(0);
  const [skipPage, setSkipPage] = useState('');

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [selectedCareer, setSelectedCareer] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    valid_until: '',
    is_active: true,
    location: '',
    department: '',
    type: '',
  });
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);

  const fetchCareers = async () => {
    setLoading(true);
    try {
      const params = { page, limit: rowsPerPage };
      const response = await axiosInstance.get(`/admin/careers`, { params });
      const { careers, total_count, total_pages } = response.data;
      setCareers(careers);
      setTotalCount(total_count);
      setTotalPageCount(total_pages);
    } catch (error) {
      console.error(error);
      toast.error('Error fetching careers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCareers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, actionLoading]);

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

  const handleEditClick = (career: any) => {
    setSelectedCareer(career);
    setFormData({
      title: career.title || '',
      description: career.description || '',
      valid_until: career.valid_until || '',
      is_active: career.is_active !== undefined ? career.is_active : true,
      location: career.location || '',
      department: career.department || '',
      type: career.type || '',
    });
    setCustomQuestions(career.custom_questions || []);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.description) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setActionLoading(true);
    try {
      const payload = {
        ...formData,
        custom_questions: customQuestions,
      };
      if (selectedCareer) {
        await axiosInstance.put(
          `/admin/careers/${selectedCareer._id}`,
          payload
        );
        toast.success('Career updated successfully');
      } else {
        await axiosInstance.post(`/admin/careers`, payload);
        toast.success('Career added successfully');
      }
      fetchCareers();
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error('Error saving career');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (career: any) => {
    setActionLoading(true);
    try {
      const resp = await axiosInstance.delete(`/admin/careers/${career._id}`);
      if (resp.status === 200) {
        toast.success(
          `Career marked as ${!career.is_active ? 'Active' : 'Inactive'} successfully`
        );
        fetchCareers();
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.detail || 'Error updating career status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedCareer(null);
    resetForm();
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      valid_until: '',
      is_active: true,
      location: '',
      department: '',
      type: '',
    });
    setCustomQuestions([]);
    setSelectedCareer(null);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    resetForm();
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Custom questions management
  const addCustomQuestion = () => {
    setCustomQuestions((prev) => [
      ...prev,
      { question: '', type: 'text', options: [], required: false },
    ]);
  };

  const updateCustomQuestion = (
    index: number,
    field: keyof CustomQuestion,
    value: any
  ) => {
    setCustomQuestions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeCustomQuestion = (index: number) => {
    setCustomQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateQuestionOption = (
    qIndex: number,
    oIndex: number,
    value: string
  ) => {
    setCustomQuestions((prev) => {
      const updated = [...prev];
      const opts = [...updated[qIndex].options];
      opts[oIndex] = value;
      updated[qIndex] = { ...updated[qIndex], options: opts };
      return updated;
    });
  };

  const addQuestionOption = (qIndex: number) => {
    setCustomQuestions((prev) => {
      const updated = [...prev];
      updated[qIndex] = {
        ...updated[qIndex],
        options: [...updated[qIndex].options, ''],
      };
      return updated;
    });
  };

  const removeQuestionOption = (qIndex: number, oIndex: number) => {
    setCustomQuestions((prev) => {
      const updated = [...prev];
      updated[qIndex] = {
        ...updated[qIndex],
        options: updated[qIndex].options.filter((_, i) => i !== oIndex),
      };
      return updated;
    });
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Paper
        elevation={3}
        sx={{ padding: 4, borderRadius: 4, backgroundColor: 'white' }}
      >
        <Box
          display='flex'
          flexDirection='row'
          justifyContent='space-between'
          alignItems='center'
        >
          <Typography variant='h4' gutterBottom sx={{ fontWeight: 'bold' }}>
            Careers
          </Typography>
          <Button variant='contained' onClick={handleAdd}>
            Add Career
          </Button>
        </Box>
        <Typography variant='body1' sx={{ color: '#6B7280', marginBottom: 3 }}>
          View and manage all job postings below.
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
            {careers?.length > 0 ? (
              <>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Title</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Location</TableCell>
                        <TableCell>Valid Until</TableCell>
                        <TableCell>Custom Qs</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {careers.map((career: any) => (
                        <TableRow key={career._id}>
                          <TableCell>{career.title}</TableCell>
                          <TableCell>
                            {career.description?.length > 100
                              ? career.description.substring(0, 100) + '...'
                              : career.description}
                          </TableCell>
                          <TableCell>{career.location || '-'}</TableCell>
                          <TableCell>
                            {career.valid_until
                              ? new Date(career.valid_until).toLocaleDateString()
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {career.custom_questions?.length || 0}
                          </TableCell>
                          <TableCell>
                            <Switch
                              onClick={() => handleToggleActive(career)}
                              checked={career?.is_active}
                              disabled={actionLoading}
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton
                              onClick={() => handleEditClick(career)}
                              disabled={actionLoading}
                            >
                              <Edit />
                            </IconButton>
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
                  No Careers Found
                </Typography>
              </Box>
            )}
          </>
        )}
      </Paper>

      {/* Dialog for Add/Edit Career */}
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        fullWidth
        maxWidth='md'
      >
        <DialogTitle>
          {selectedCareer ? 'Edit Career' : 'Add Career'}
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
              onChange={(e) => handleInputChange('title', e.target.value)}
              required
            />
            <TextField
              label='Description'
              variant='outlined'
              fullWidth
              multiline
              rows={4}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              required
            />
            <Box display='flex' gap={2}>
              <TextField
                label='Location'
                variant='outlined'
                fullWidth
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder='e.g. Goregaon, Mumbai / Pan India'
              />
              <TextField
                label='Department'
                variant='outlined'
                fullWidth
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                placeholder='e.g. Sales, Marketing'
              />
            </Box>
            <Box display='flex' gap={2}>
              <FormControl fullWidth>
                <InputLabel>Job Type</InputLabel>
                <Select
                  value={formData.type}
                  label='Job Type'
                  onChange={(e) => handleInputChange('type', e.target.value)}
                >
                  <MenuItem value=''>None</MenuItem>
                  <MenuItem value='Full-time'>Full-time</MenuItem>
                  <MenuItem value='Part-time'>Part-time</MenuItem>
                  <MenuItem value='Internship'>Internship</MenuItem>
                  <MenuItem value='Contract'>Contract</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label='Valid Until'
                type='date'
                variant='outlined'
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={formData.valid_until}
                onChange={(e) => handleInputChange('valid_until', e.target.value)}
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

            {/* Custom Questions Section */}
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
              <Box
                display='flex'
                justifyContent='space-between'
                alignItems='center'
                mb={2}
              >
                <Typography variant='h6' fontWeight='bold'>
                  Custom Questions
                </Typography>
                <Button
                  variant='outlined'
                  size='small'
                  startIcon={<Add />}
                  onClick={addCustomQuestion}
                >
                  Add Question
                </Button>
              </Box>
              <Typography
                variant='body2'
                sx={{ color: '#6B7280', mb: 2 }}
              >
                Add custom questions that applicants must answer for this
                position. These will appear in the application form.
              </Typography>

              {customQuestions.map((q, qIndex) => (
                <Paper
                  key={qIndex}
                  variant='outlined'
                  sx={{ p: 2, mb: 2, backgroundColor: '#fafafa' }}
                >
                  <Box
                    display='flex'
                    justifyContent='space-between'
                    alignItems='flex-start'
                    mb={1}
                  >
                    <Typography variant='subtitle2' color='textSecondary'>
                      Question {qIndex + 1}
                    </Typography>
                    <IconButton
                      size='small'
                      color='error'
                      onClick={() => removeCustomQuestion(qIndex)}
                    >
                      <Delete fontSize='small' />
                    </IconButton>
                  </Box>
                  <Box
                    display='flex'
                    flexDirection='column'
                    gap={1.5}
                  >
                    <TextField
                      label='Question Text'
                      variant='outlined'
                      size='small'
                      fullWidth
                      value={q.question}
                      onChange={(e) =>
                        updateCustomQuestion(qIndex, 'question', e.target.value)
                      }
                    />
                    <Box display='flex' gap={2} alignItems='center'>
                      <FormControl size='small' sx={{ minWidth: 150 }}>
                        <InputLabel>Answer Type</InputLabel>
                        <Select
                          value={q.type}
                          label='Answer Type'
                          onChange={(e) =>
                            updateCustomQuestion(
                              qIndex,
                              'type',
                              e.target.value as 'text' | 'select'
                            )
                          }
                        >
                          <MenuItem value='text'>Text Input</MenuItem>
                          <MenuItem value='select'>Dropdown</MenuItem>
                        </Select>
                      </FormControl>
                      <FormControlLabel
                        control={
                          <Checkbox
                            size='small'
                            checked={q.required}
                            onChange={(e) =>
                              updateCustomQuestion(
                                qIndex,
                                'required',
                                e.target.checked
                              )
                            }
                          />
                        }
                        label='Required'
                      />
                    </Box>

                    {q.type === 'select' && (
                      <Box sx={{ pl: 1 }}>
                        <Typography
                          variant='body2'
                          color='textSecondary'
                          sx={{ mb: 1 }}
                        >
                          Dropdown Options:
                        </Typography>
                        {q.options.map((opt, oIndex) => (
                          <Box
                            key={oIndex}
                            display='flex'
                            gap={1}
                            alignItems='center'
                            mb={0.5}
                          >
                            <TextField
                              size='small'
                              variant='outlined'
                              fullWidth
                              placeholder={`Option ${oIndex + 1}`}
                              value={opt}
                              onChange={(e) =>
                                updateQuestionOption(
                                  qIndex,
                                  oIndex,
                                  e.target.value
                                )
                              }
                            />
                            <IconButton
                              size='small'
                              color='error'
                              onClick={() =>
                                removeQuestionOption(qIndex, oIndex)
                              }
                            >
                              <Delete fontSize='small' />
                            </IconButton>
                          </Box>
                        ))}
                        <Button
                          size='small'
                          onClick={() => addQuestionOption(qIndex)}
                          sx={{ mt: 0.5 }}
                        >
                          + Add Option
                        </Button>
                      </Box>
                    )}
                  </Box>
                </Paper>
              ))}
            </Box>
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
              disabled={actionLoading || !formData.title || !formData.description}
            >
              {actionLoading ? 'Saving...' : 'Save'}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Careers;
