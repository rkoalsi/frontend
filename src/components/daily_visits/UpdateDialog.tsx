import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Grid,
  IconButton,
  Select,
  FormControl,
  InputLabel,
  MenuItem,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import { toast } from 'react-toastify';

interface UpdateDialogProps {
  open: boolean;
  onClose: () => void;
  updateData: any; // If null, then this is a new update
  dailyVisitId: string;
  dailyVisit: any;
  refreshDailyVisit: () => void;
  user: any;
}

interface Shop {
  customer_id: string;
  customer_name: string;
}

const UpdateDialog = ({
  open,
  onClose,
  updateData,
  dailyVisitId,
  dailyVisit,
  refreshDailyVisit,
  user,
}: UpdateDialogProps) => {
  const [shop, setShop] = useState<any | null>(null);
  const [updateText, setUpdateText] = useState<string>(
    updateData ? updateData.text : ''
  );
  const [newImages, setNewImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>(
    updateData ? updateData.images : []
  );
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Update state when updateData changes (for edit mode)
  useEffect(() => {
    if (updateData) {
      setUpdateText(updateData.text);
      setExistingImages(updateData.images || []);
      // If updateData includes shop info, set it
      if (updateData.customer_id && updateData.customer_name) {
        setShop({
          customer_id: updateData.customer_id,
          customer_name: updateData.customer_name,
        });
      }
    } else {
      setUpdateText('');
      setExistingImages([]);
      setShop(null);
    }
    setNewImages([]);
    setImagesToDelete([]);
  }, [updateData, open]);

  const handleNewImageChange = (e: any) => {
    if (e.target.files) {
      setNewImages((prev: any) => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const handleDeleteExistingImage = (s3_key: string) => {
    setExistingImages((prev) => prev.filter((img) => img.s3_key !== s3_key));
    setImagesToDelete((prev) => [...prev, s3_key]);
  };

  const handleRemoveNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateText.trim()) {
      toast.error('Please enter update text');
      return;
    }
    if (!shop) {
      toast.error('Please select a customer');
      return;
    }
    setSubmitting(true);
    const formData = new FormData();
    // Include the shop's ID so the backend can remove it
    formData.append('potential_customer', shop.potential_customer);
    formData.append('potential_customer_name', shop.potential_customer_name);
    // Send both customer_id and customer_name
    formData.append('customer_id', shop.customer_id);
    formData.append('customer_name', shop.customer_name);
    formData.append('uploaded_by', user?.data?._id);
    formData.append('update_text', updateText);
    if (updateData?._id) {
      formData.append('update_id', updateData._id);
    }
    newImages.forEach((file) => {
      formData.append('new_images', file);
    });
    formData.append('delete_images', JSON.stringify(imagesToDelete));
    try {
      const response = await axios.put(
        `${process.env.api_url}/daily_visits/${dailyVisitId}`,
        formData
      );
      toast.success(response.data.message || 'Update processed successfully');
      refreshDailyVisit(); // This refreshes the dailyVisit state so that the shop is removed from dailyVisit.shops.
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Error updating daily visit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm'>
      <DialogTitle>{updateData ? 'Edit Update' : 'Add Update'}</DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmitUpdate}>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id='shop-select-filter-label'>
              Select Customer
            </InputLabel>
            <Select
              labelId='shop-select-filter-label'
              id='shop-select-filter'
              value={
                shop?.potential_customer
                  ? shop?.potential_customer_name
                  : shop
                  ? shop.customer_id
                  : ''
              }
              disabled={updateData}
              label='Select Customer'
              onChange={(e: any) => {
                const selectedId = e.target.value;
                // Find the shop from the updated dailyVisit.shops
                const selectedShop = dailyVisit.shops.find((s: any) =>
                  s.potential_customer
                    ? s.potential_customer_name === selectedId
                    : s.customer_id === selectedId
                );
                setShop(selectedShop);
              }}
            >
              {updateData
                ? dailyVisit.shops?.map((shop: any) => (
                    <MenuItem key={shop.customer_id} value={shop.customer_id}>
                      {shop.potential_customer
                        ? shop.potential_customer_name
                        : shop.customer_name}
                    </MenuItem>
                  ))
                : dailyVisit.shops
                    ?.filter(
                      (shop: any) =>
                        !dailyVisit.updates?.some((update: any) =>
                          update.potential_customer
                            ? update.potential_customer_name ===
                              shop.potential_customer_name
                            : update.customer_id === shop.customer_id
                        )
                    )
                    .map((shop: any) => (
                      <MenuItem
                        key={
                          shop.potential_customer
                            ? shop.potential_customer_name
                            : shop.customer_id
                        }
                        value={
                          shop.potential_customer
                            ? shop.potential_customer_name
                            : shop.customer_id
                        }
                      >
                        {shop.potential_customer
                          ? shop.potential_customer_name
                          : shop.customer_name}
                      </MenuItem>
                    ))}
            </Select>
          </FormControl>
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
                      onClick={() => {}}
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
            <Button onClick={onClose} color='secondary'>
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
                : updateData
                ? 'Update Entry'
                : 'Add Update'}
            </Button>
          </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateDialog;
