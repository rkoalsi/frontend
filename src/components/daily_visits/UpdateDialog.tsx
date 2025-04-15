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
  updateData: any;
  dailyVisitId: string;
  dailyVisit: any;
  refreshDailyVisit: () => void;
  user: any;
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
  const [updateText, setUpdateText] = useState<string>(updateData?.text || '');
  const [newImages, setNewImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>(
    updateData?.images || []
  );
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const getAvailableShops = () => {
    if (updateData) return dailyVisit.shops; // Show all shops when editing

    return dailyVisit.shops?.filter((shop: any) => {
      const hasExistingUpdate = dailyVisit.updates?.some((update: any) => {
        if (shop.potential_customer) {
          return (
            update.potential_customer_name === shop.potential_customer_name
          );
        }
        return (
          update.customer_id === shop.customer_id &&
          update?.address?.address_id === shop?.address?.address_id // Properly compare stringified addresses
        );
      });
      return !hasExistingUpdate;
    });
  };
  useEffect(() => {
    if (updateData) {
      setUpdateText(updateData.text);
      setExistingImages(updateData.images || []);
      if (updateData.customer_id) {
        setShop({
          customer_id: updateData.customer_id,
          customer_name: updateData.customer_name,
          address: updateData.address,
        });
      } else if (updateData.potential_customer) {
        setShop({
          potential_customer: updateData.potential_customer,
          potential_customer_id: updateData.potential_customer_id,
          potential_customer_name: updateData.potential_customer_name,
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

  const handleNewImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewImages((prev) => [...prev, ...Array.from(e.target.files!)]);
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

    if (shop.potential_customer) {
      formData.append('potential_customer', shop.potential_customer);
      formData.append('potential_customer_id', shop.potential_customer_id);
      formData.append('potential_customer_name', shop.potential_customer_name);
    } else {
      console.log(shop.address);
      formData.append('customer_id', shop.customer_id);
      formData.append('customer_name', shop.customer_name);
      formData.append('address', JSON.stringify(shop?.address)); // Include address for regular customers
    }

    formData.append('uploaded_by', user?.data?._id);
    formData.append('update_text', updateText);
    if (updateData?._id) formData.append('update_id', updateData._id);
    newImages.forEach((file) => formData.append('new_images', file));
    formData.append('delete_images', JSON.stringify(imagesToDelete));

    try {
      await axios.put(
        `${process.env.api_url}/daily_visits/${dailyVisitId}`,
        formData
      );
      toast.success('Update processed successfully');
      refreshDailyVisit();
      onClose();
    } catch (error) {
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
            <InputLabel>Select Customer</InputLabel>
            <Select
              value={
                shop?.potential_customer
                  ? shop.potential_customer_name
                  : shop?.customer_id
                  ? `${shop.customer_id}|${shop.address?.address_id}`
                  : ''
              }
              disabled={!!updateData}
              label='Select Customer'
              onChange={(e) => {
                // For regular customers, split the composite value
                const [customerId, addressId] = e.target.value.split('|');
                const selectedShop = dailyVisit.shops.find((s: any) =>
                  s.potential_customer
                    ? s.potential_customer_name === e.target.value
                    : s.customer_id === customerId &&
                      s.address.address_id === addressId
                );
                console.log(selectedShop);
                setShop(selectedShop);
              }}
            >
              {getAvailableShops()?.map((shop: any) => (
                <MenuItem
                  key={
                    shop.potential_customer
                      ? shop.potential_customer_name
                      : `${shop.customer_id}|${shop?.address?.address_id}`
                  }
                  value={
                    shop.potential_customer
                      ? shop.potential_customer_name
                      : `${shop.customer_id}|${shop?.address?.address_id}`
                  }
                >
                  {shop.potential_customer
                    ? `${shop.potential_customer_name} (Potential)`
                    : `${shop.customer_name} - ${shop?.address?.address}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label='Update Text'
            fullWidth
            multiline
            rows={4}
            value={updateText}
            onChange={(e) => setUpdateText(e.target.value)}
            sx={{ my: 2 }}
          />

          {existingImages.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant='subtitle2'>Existing Images:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {existingImages.map((img, index) => (
                  <Box key={index} sx={{ position: 'relative' }}>
                    <img
                      src={img.url}
                      alt={`Existing ${index}`}
                      style={{ width: 100, height: 100, objectFit: 'cover' }}
                    />
                    <IconButton
                      size='small'
                      onClick={() => handleDeleteExistingImage(img.s3_key)}
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        backgroundColor: 'rgba(255,255,255,0.7)',
                      }}
                    >
                      <DeleteIcon fontSize='small' />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          <Box sx={{ mb: 2 }}>
            <Button variant='contained' component='label'>
              Upload Images
              <input
                type='file'
                hidden
                multiple
                accept='image/*'
                onChange={handleNewImageChange}
              />
            </Button>
            {newImages.length > 0 && (
              <Box sx={{ mt: 1 }}>
                {newImages.map((file, index) => (
                  <Box
                    key={index}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                  >
                    <Typography variant='body2'>{file.name}</Typography>
                    <IconButton
                      size='small'
                      onClick={() => handleRemoveNewImage(index)}
                    >
                      <DeleteIcon fontSize='small' />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          <DialogActions>
            <Button onClick={onClose}>Cancel</Button>
            <Button type='submit' variant='contained' disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit'}
            </Button>
          </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateDialog;
