import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Button,
  TextField,
  DialogActions,
  Paper,
  Divider,
  CircularProgress,
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
  handleSecondaryImageUpload,
  description,
  onDescriptionChange,
  color,
  onColorChange,
}: any) => {
  const validColor = /^#[0-9a-fA-F]{6}$/.test(color || '');
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
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'action.hover',
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            {/* Description */}
            <TextField
              label='Description'
              multiline
              minRows={3}
              fullWidth
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              disabled={updating}
              helperText='Shown under the brand name on the order form.'
            />

            {/* Accent colour — drives the brand's tab highlight and the strip
                beside its name on the order form. */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 2,
                flexWrap: 'wrap',
              }}
            >
              <Box
                component='input'
                type='color'
                value={validColor ? color : '#4633b8'}
                onChange={(e: any) => onColorChange(e.target.value)}
                disabled={updating}
                aria-label='Brand accent colour'
                sx={{
                  width: 56,
                  height: 56,
                  p: 0,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1.5,
                  bgcolor: 'transparent',
                  cursor: updating ? 'default' : 'pointer',
                  flexShrink: 0,
                }}
              />
              <TextField
                label='Accent Colour'
                value={color || ''}
                onChange={(e) => onColorChange(e.target.value)}
                disabled={updating}
                placeholder='#4633B8'
                error={!!color && !validColor}
                helperText={
                  color && !validColor
                    ? 'Use a 6-digit hex value, e.g. #4633B8.'
                    : 'Leave blank to use an automatic colour derived from the brand name.'
                }
                sx={{ flex: 1, minWidth: 220 }}
              />
              <Button
                onClick={() => onColorChange('')}
                disabled={updating || !color}
                size='small'
                sx={{ mt: 1 }}
              >
                Clear
              </Button>
            </Box>

            {/* Images row */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: 3,
              }}
            >
              {/* Primary Image */}
              <Box sx={{ flex: 1 }}>
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
                        bgcolor: 'action.hover',
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

              {/* Secondary Image */}
              <Box sx={{ flex: 1 }}>
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
                    Secondary Image
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
                        bgcolor: 'action.hover',
                      }}
                    >
                      <img
                        onClick={() =>
                          handleImageClick(
                            selectedBrand.secondary_image_url ||
                              '/placeholder.png'
                          )
                        }
                        src={
                          selectedBrand.secondary_image_url ||
                          '/placeholder.png'
                        }
                        alt={`${selectedBrand.name} secondary`}
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
                    onImageUpload={handleSecondaryImageUpload}
                    updating={updating}
                  />
                </Paper>
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'action.hover',
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
