import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  FormControlLabel,
  Typography,
  Button,
  TextField,
  DialogActions,
  Switch,
  Paper,
  Divider,
  CircularProgress,
  Chip,
} from '@mui/material';
import ImageDropzone from '../../common/ImageDropzone';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';

const ProductDialog = ({
  open,
  onClose,
  selectedBrand,
  updating,
  handleSaveEdit,
  handleImageClick,
  handleImageUpload,
}: any) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth='md'
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        },
      }}
    >
      <DialogTitle
        sx={{
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#f8f9fa',
          py: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <EditIcon fontSize='small' color='primary' />
        <Typography variant='h6' component='span' fontWeight={600}>
          Edit Brand Details
        </Typography>
        {updating && (
          <CircularProgress size={20} color='primary' sx={{ ml: 2 }} />
        )}
      </DialogTitle>
      <DialogContent sx={{ py: 3 }}>
        {selectedBrand && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              mt: 2,
            }}
          >
            <Box sx={{ flex: { xs: '1 1 100%', md: '0 0 30%' } }}>
              <Paper
                elevation={0}
                sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}
              >
                <Typography
                  variant='subtitle2'
                  color='primary'
                  gutterBottom
                  fontWeight={600}
                >
                  Brand Image
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box
                  sx={{
                    mb: 3,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Paper
                    elevation={3}
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      overflow: 'hidden',
                      backgroundColor: '#f5f5f5',
                    }}
                  >
                    <img
                      onClick={() =>
                        handleImageClick(
                          selectedBrand.image_url || '/placeholder.png'
                        )
                      }
                      src={selectedBrand.image_url || '/placeholder.png'}
                      alt={selectedBrand.name}
                      style={{
                        width: '100%',
                        maxWidth: '180px',
                        height: 'auto',
                        borderRadius: '4px',
                        objectFit: 'cover',
                        cursor: 'pointer',
                        transition: 'transform 0.3s ease',
                      }}
                    />
                  </Paper>
                </Box>
                <ImageDropzone
                  onImageUpload={handleImageUpload}
                  updating={updating}
                />
              </Paper>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: '1px solid #e0e0e0',
          backgroundColor: '#f8f9fa',
        }}
      >
        <Button
          onClick={onClose}
          color='inherit'
          disabled={updating}
          startIcon={<CloseIcon />}
          sx={{ mr: 1 }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSaveEdit}
          color='primary'
          variant='contained'
          disabled={updating}
          startIcon={<SaveIcon />}
        >
          {updating ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductDialog;
