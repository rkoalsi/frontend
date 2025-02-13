// pages/daily_visits/[id].tsx

import { useState, useEffect, useContext, useCallback } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Typography,
  CircularProgress,
  TextField,
  Button,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import { toast } from 'react-toastify';
import AuthContext from '../../src/components/Auth';
import ImagePopupDialog from '../../src/components/common/ImagePopUp';

interface UpdateEntry {
  _id: string;
  text: string;
  images: {
    url: string;
    s3_key: string;
  }[];
  created_at: string;
  updated_at?: string;
}

const DailyVisitDetail = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user }: any = useContext(AuthContext);

  const [dailyVisit, setDailyVisit] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Dialog control for update form
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  // Form state for the update entry
  const [updateId, setUpdateId] = useState<string | null>(null);
  const [updateText, setUpdateText] = useState<string>('');
  const [newImages, setNewImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<
    { url: string; s3_key: string }[]
  >([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [openImagePopup, setOpenImagePopup] = useState(false);
  const [popupImageSrc, setPopupImageSrc] = useState('');
  useEffect(() => {
    if (id) {
      fetchDailyVisit();
    }
  }, [id]);
  const handleImageClick = useCallback((src: string) => {
    setPopupImageSrc(src);
    setOpenImagePopup(true);
  }, []);

  const handleClosePopup = useCallback(() => {
    setOpenImagePopup(false);
  }, []);
  const fetchDailyVisit = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.api_url}/daily_visits/${id}`
      );
      setDailyVisit(response.data);
    } catch (error) {
      console.error(error);
      toast.error('Error fetching daily visit details');
    } finally {
      setLoading(false);
    }
  };

  // Open the dialog for adding a new update.
  const handleOpenDialogForNew = () => {
    // Reset form state for a new update.
    setUpdateId(null);
    setUpdateText('');
    setNewImages([]);
    setExistingImages([]);
    setImagesToDelete([]);
    setDialogOpen(true);
  };

  // When editing an existing update, load its data into the form and open the dialog.
  const handleEditUpdate = (update: UpdateEntry) => {
    console.log('Editing update:', update);
    // Use update.id (or update._id if that’s how it comes down) for editing.
    setUpdateId(update._id);
    setUpdateText(update.text || '');
    setExistingImages(update.images || []);
    setImagesToDelete([]);
    setDialogOpen(true);
  };

  // Mark an existing image for deletion.
  const handleDeleteExistingImage = (s3_key: string) => {
    setExistingImages((prev) => prev.filter((img) => img.s3_key !== s3_key));
    setImagesToDelete((prev) => [...prev, s3_key]);
  };

  // Handle new file uploads for the update form.
  const handleNewImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewImages(Array.from(e.target.files));
    }
  };

  // Submit the update form.
  const handleSubmitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData();
    formData.append('uploaded_by', user?.data?._id);
    formData.append('update_text', updateText);
    if (updateId) {
      formData.append('update_id', updateId);
    }
    newImages.forEach((file) => {
      formData.append('new_images', file);
    });
    formData.append('delete_images', JSON.stringify(imagesToDelete));
    try {
      const response = await axios.put(
        `${process.env.api_url}/daily_visits/${id}`,
        formData
      );
      console.log(response.data);
      toast.success(response.data.message);
      setDailyVisit(response.data.daily_visit);
      // Reset the update form and close dialog.
      setUpdateId(null);
      setUpdateText('');
      setNewImages([]);
      setExistingImages([]);
      setImagesToDelete([]);
      setDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Error updating daily visit');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Main Daily Visit Details */}
      <Card>
        <CardHeader
          title='Daily Visit Details'
          subheader={`Date: ${new Date(
            dailyVisit.created_at
          ).toLocaleString()}`}
        />
        <CardContent>
          <Typography variant='h6'>Plan:</Typography>
          <Typography variant='body1' sx={{ mb: 2 }}>
            {dailyVisit.plan}
          </Typography>
          {dailyVisit.selfie && (
            <Box sx={{ mb: 2, textAlign: 'center' }}>
              <img
                onClick={() => handleImageClick(dailyVisit.selfie)}
                src={dailyVisit.selfie}
                alt='Selfie'
                style={{
                  borderRadius: '8px',
                  width: '100%',
                  maxWidth: '300px', // Smaller on desktop.
                }}
              />
            </Box>
          )}
          {/* Display Update Entries */}
          <Box sx={{ mb: 2 }}>
            <Typography variant='h6'>Updates:</Typography>
            {dailyVisit.updates && dailyVisit.updates.length > 0 ? (
              dailyVisit.updates.map((upd: UpdateEntry) => (
                <Paper key={upd._id} sx={{ p: 2, mb: 2 }}>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Typography variant='body1'>{upd.text}</Typography>
                    <IconButton onClick={() => handleEditUpdate(upd)}>
                      <EditIcon />
                    </IconButton>
                  </Box>
                  {upd.images && upd.images.length > 0 && (
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      {upd.images.map((img, idx) => (
                        <Grid item xs={6} md={4} key={idx}>
                          <Box sx={{ position: 'relative' }}>
                            <img
                              onClick={() => handleImageClick(img.url)}
                              src={img.url}
                              alt={`Update Image ${idx + 1}`}
                              style={{ width: '100%', borderRadius: '8px' }}
                            />
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Paper>
              ))
            ) : (
              <Typography variant='body2'>No updates yet.</Typography>
            )}
          </Box>
          {/* Button to add a new update */}
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Button variant='contained' onClick={handleOpenDialogForNew}>
              Add Additional Information
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Dialog for Adding/Editing Update */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth='sm'
      >
        <DialogTitle>{updateId ? 'Edit Update' : 'Add Update'}</DialogTitle>
        <DialogContent>
          <form onSubmit={async (e: any) => await handleSubmitUpdate(e)}>
            <TextField
              label='Enter update text'
              variant='outlined'
              fullWidth
              multiline
              rows={4}
              value={updateText}
              onChange={(e) => setUpdateText(e.target.value)}
              sx={{ mb: 2, mt: 1 }}
            />
            {/* When editing, show existing images with a delete icon */}
            {existingImages.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant='subtitle1'>Existing Images:</Typography>
                <Grid container spacing={2}>
                  {existingImages.map((img, idx) => (
                    <Grid
                      item
                      xs={6}
                      md={4}
                      key={idx}
                      sx={{ position: 'relative' }}
                    >
                      <img
                        onClick={() => handleImageClick(img.url)}
                        src={img.url}
                        alt={`Existing Update Image ${idx + 1}`}
                        style={{ width: '100%', borderRadius: '8px' }}
                      />
                      <IconButton
                        size='small'
                        color='error'
                        sx={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          background: 'rgba(255,255,255,0.7)',
                        }}
                        onClick={() => handleDeleteExistingImage(img.s3_key)}
                      >
                        <DeleteIcon fontSize='small' />
                      </IconButton>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Button
                variant='contained'
                color='error'
                component='label'
                sx={{ mr: 2 }}
              >
                Upload New Images
                <input
                  type='file'
                  hidden
                  multiple
                  accept='image/*'
                  onChange={handleNewImageChange}
                />
              </Button>
              {newImages.length > 0 && (
                <Typography variant='body2'>
                  {newImages.length} file(s) selected.
                </Typography>
              )}
            </Box>
            <DialogActions>
              <Button onClick={() => setDialogOpen(false)} color='secondary'>
                Cancel
              </Button>
              <Button
                type='submit'
                variant='contained'
                color='primary'
                disabled={submitting}
              >
                {submitting
                  ? 'Updating...'
                  : updateId
                  ? 'Update Entry'
                  : 'Add Update'}
              </Button>
            </DialogActions>
          </form>
        </DialogContent>
      </Dialog>
      <ImagePopupDialog
        open={openImagePopup}
        onClose={handleClosePopup}
        imageSrc={popupImageSrc}
      />
    </Box>
  );
};

export default DailyVisitDetail;
