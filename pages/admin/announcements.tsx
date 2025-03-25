import React, { useEffect, useState, useRef } from 'react';
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
import { Delete, Edit, Mic, Stop, PlayArrow, Pause } from '@mui/icons-material';
import { useRouter } from 'next/router';
import axiosInstance from '../../src/util/axios';

const Announcements = () => {
  const router = useRouter();

  // State for Announcements data and pagination
  const [announcements, setTrainings]: any = useState([]);
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
  const [selectedTraining, setSelectedTraining]: any = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData]: any = useState({
    title: '',
    description: '',
    is_active: true,
    audio_file: null,
  });

  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob]: any = useState(null);
  const [audioURL, setAudioURL] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef: any = useRef(null);
  const audioChunksRef: any = useRef([]);
  const audioRef = useRef(new Audio());

  // Fetch announcements from the server
  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: rowsPerPage,
      };
      const response = await axiosInstance.get('/admin/announcements', {
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
    fetchAnnouncements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, actionLoading]);

  // Clean up audio resources when component unmounts
  useEffect(() => {
    return () => {
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, [audioURL]);

  // Handle audio playback state changes
  useEffect(() => {
    const handleEnded = () => setIsPlaying(false);
    audioRef.current.addEventListener('ended', handleEnded);

    return () => {
      audioRef.current.removeEventListener('ended', handleEnded);
    };
  }, []);

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

  // Opens the dialog for editing an existing announcement
  const handleEditClick = (announcement: any) => {
    setSelectedTraining(announcement);
    setFormData({
      title: announcement.title || '',
      description: announcement.description || '',
      is_active:
        announcement.is_active !== undefined ? announcement.is_active : true,
      audio_file: null,
    });

    // If there's an existing audio URL from the server
    if (announcement.audio_url) {
      setAudioURL(announcement.audio_url);
      setAudioBlob(null); // We don't have the blob, just the URL
    } else {
      setAudioURL('');
      setAudioBlob(null);
    }

    setDialogOpen(true);
  };
  const handleDelete = async (announcement: any) => {
    try {
      const { data = {} } = await axiosInstance.delete(
        `${process.env.api_url}/admin/announcements/${announcement._id}`
      );
      if (data) {
        toast.success(`Announcement Deleted Successfully`);
        fetchAnnouncements();
      }
    } catch (error) {
      console.log(error);
      toast.error('Error Deleting Announcement');
    }
  };

  // Handler for saving an announcement (update if editing, add if creating new)
  const handleSave = async () => {
    if (!formData.title) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setActionLoading(true);
    try {
      // Create FormData object for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('is_active', formData.is_active);

      // Append audio file if it exists
      if (audioBlob) {
        const audioFile = new File([audioBlob], 'recording.wav', {
          type: 'audio/wav',
        });
        formDataToSend.append('audio_file', audioFile);
      }

      if (selectedTraining) {
        // Update existing announcement
        await axiosInstance.put(
          `/admin/announcements/${selectedTraining._id}`,
          formDataToSend,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        toast.success('Announcement updated successfully');
      } else {
        // Add new announcement
        await axiosInstance.post('/admin/announcements', formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        toast.success('Announcement added successfully');
      }

      fetchAnnouncements();
      setDialogOpen(false);
      resetAudioState();
    } catch (error) {
      console.error(error);
      toast.error('Error saving announcement');
    } finally {
      setActionLoading(false);
    }
  };

  // Reset audio recording state
  const resetAudioState = () => {
    setAudioBlob(null);
    setAudioURL('');
    setIsRecording(false);
    audioChunksRef.current = [];
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current = null;
    }
  };

  // Handler for toggling active/inactive status
  const handleCheck = async (announcement: any) => {
    setActionLoading(true);
    try {
      const resp = await axiosInstance.delete(
        `/admin/announcements/${announcement._id}`
      );
      if (resp.status === 200) {
        toast.success(
          `Announcement marked as ${
            !announcement.is_active ? 'Active' : 'Inactive'
          } successfully`
        );
        fetchAnnouncements();
      }
    } catch (error: any) {
      console.error(error);
      toast.error(
        error.response?.data?.detail || 'Error updating announcement status'
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Opens dialog for adding a new announcement
  const handleAddTraining = () => {
    setSelectedTraining(null);
    setFormData({
      title: '',
      description: '',
      is_active: true,
      audio_file: null,
    });
    resetAudioState();
    setDialogOpen(true);
  };

  // Start recording audio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event: any) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/wav',
        });
        const audioUrl = URL.createObjectURL(audioBlob);

        setAudioBlob(audioBlob);
        setAudioURL(audioUrl);

        // Stop all tracks in the stream to release the microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Error accessing microphone. Please check permissions.');
    }
  };

  // Stop recording audio
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Handle file upload for audio
  const handleFileUpload = (event: any) => {
    const file = event.target.files[0];
    if (file) {
      // Check if file is an audio file
      if (!file.type.startsWith('audio/')) {
        toast.error('Please upload an audio file');
        return;
      }

      const audioUrl = URL.createObjectURL(file);
      setAudioBlob(file);
      setAudioURL(audioUrl);
    }
  };

  // Handle audio playback in the form
  const togglePlayback = (url = null) => {
    // If a specific URL is provided (from the table), use that
    const audioToPlay = url || audioURL;

    if (!audioToPlay) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // If we're switching to a new audio source
      if (audioRef.current.src !== audioToPlay) {
        audioRef.current.src = audioToPlay;
      }
      audioRef.current.play().catch((err) => {
        console.error('Error playing audio:', err);
        toast.error('Error playing audio file');
      });
      setIsPlaying(true);
    }
  };

  // Clear the audio recording
  const clearAudio = () => {
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
    setAudioBlob(null);
    setAudioURL('');
    // If it was playing, stop it
    if (isPlaying) {
      audioRef.current.pause();
      audioRef.current.src = '';
      setIsPlaying(false);
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
                {/* Announcements Table */}
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Title</TableCell>
                        <TableCell>Audio</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {announcements.map((announcement: any) => (
                        <TableRow key={announcement._id}>
                          <TableCell>{announcement.title}</TableCell>
                          <TableCell>
                            {announcement.audio_url ? (
                              <IconButton
                                onClick={() =>
                                  togglePlayback(announcement.audio_url)
                                }
                                color='primary'
                              >
                                {isPlaying &&
                                audioRef.current.src ===
                                  announcement.audio_url ? (
                                  <Pause />
                                ) : (
                                  <PlayArrow />
                                )}
                              </IconButton>
                            ) : (
                              <Typography
                                variant='body2'
                                color='text.secondary'
                              >
                                No audio
                              </Typography>
                            )}
                          </TableCell>
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
                              <IconButton
                                onClick={() => handleDelete(announcement)}
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
                  No Announcements
                </Typography>
              </Box>
            )}
          </>
        )}
      </Paper>

      {/* Dialog for Add/Edit Announcement */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth='lg'
      >
        <DialogTitle>
          {selectedTraining ? 'Edit Announcement' : 'Add Announcement'}
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

            {/* Audio Recording Section */}
            <Typography variant='h6' sx={{ mt: 2 }}>
              Voice Recording
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Record Audio Buttons */}
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                {!isRecording ? (
                  <Button
                    variant='contained'
                    color='primary'
                    startIcon={<Mic />}
                    onClick={startRecording}
                    disabled={!!audioURL} // Disable if we already have a recording
                  >
                    Record Audio
                  </Button>
                ) : (
                  <Button
                    variant='contained'
                    color='error'
                    startIcon={<Stop />}
                    onClick={stopRecording}
                  >
                    Stop Recording
                  </Button>
                )}

                {/* Upload Audio File */}
                <Button
                  variant='outlined'
                  component='label'
                  disabled={isRecording || !!audioURL} // Disable during recording or if we have audio
                >
                  Upload Audio
                  <input
                    type='file'
                    accept='audio/*'
                    hidden
                    onChange={handleFileUpload}
                  />
                </Button>

                {/* Clear Audio Button - only show if we have audio */}
                {audioURL && (
                  <Button variant='outlined' color='error' onClick={clearAudio}>
                    Clear Audio
                  </Button>
                )}
              </Box>

              {/* Audio Player */}
              {audioURL && (
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}
                >
                  <IconButton onClick={() => togglePlayback()} color='primary'>
                    {isPlaying ? <Pause /> : <PlayArrow />}
                  </IconButton>
                  <Typography>
                    {audioBlob
                      ? `Recording (${(audioBlob.size / 1024).toFixed(2)} KB)`
                      : 'Existing Recording'}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
          <Box
            sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}
          >
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              variant='contained'
              onClick={handleSave}
              disabled={actionLoading}
            >
              {actionLoading ? <CircularProgress size={24} /> : 'Save'}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Announcements;
