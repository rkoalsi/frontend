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
  selectedProduct,
  updating,
  editableFields,
  handleEditableFieldChange,
  handleSaveEdit,
  handleToggleActive,
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
          Edit Product Details
        </Typography>
        {updating && (
          <CircularProgress size={20} color='primary' sx={{ ml: 2 }} />
        )}
      </DialogTitle>
      <DialogContent sx={{ py: 3 }}>
        {selectedProduct && (
          <Box sx={{ mt: 2 }}>
            {/* Flex container for layout */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: 3,
              }}
            >
              {/* Image Section */}
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
                    Product Image
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
                            selectedProduct.image_url || '/placeholder.png'
                          )
                        }
                        src={selectedProduct.image_url || '/placeholder.png'}
                        alt={selectedProduct.name}
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

              {/* Details Section */}
              <Box sx={{ flex: { xs: '1 1 100%', md: '0 0 70%' } }}>
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
                    Product Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  {/* Status and Product Name */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 1,
                    }}
                  >
                    <Typography variant='subtitle1' fontWeight={500}>
                      {selectedProduct.item_name}
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={selectedProduct?.status === 'active'}
                          onChange={() => handleToggleActive(selectedProduct)}
                          color='primary'
                        />
                      }
                      label={
                        <Chip
                          size='small'
                          label={
                            selectedProduct?.status === 'active'
                              ? 'Active'
                              : 'Inactive'
                          }
                          color={
                            selectedProduct?.status === 'active'
                              ? 'success'
                              : 'default'
                          }
                          variant='outlined'
                        />
                      }
                    />
                  </Box>
                  <Divider sx={{ mb: 2 }} />

                  {/* Fields Container */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {/* Left Column */}
                    <Box sx={{ flex: '1 1 45%', minWidth: '200px' }}>
                      {/* Category (Editable) */}
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant='subtitle2'
                          color='textSecondary'
                          fontWeight={500}
                        >
                          Category
                        </Typography>
                        <TextField
                          name='category'
                          variant='outlined'
                          fullWidth
                          value={editableFields.category}
                          onChange={handleEditableFieldChange}
                          size='small'
                          sx={{ mt: 0.5 }}
                        />
                      </Box>

                      {/* Sub Category (Editable) */}
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant='subtitle2'
                          color='textSecondary'
                          fontWeight={500}
                        >
                          Sub Category
                        </Typography>
                        <TextField
                          name='sub_category'
                          variant='outlined'
                          fullWidth
                          value={editableFields.sub_category}
                          onChange={handleEditableFieldChange}
                          size='small'
                          sx={{ mt: 0.5 }}
                        />
                      </Box>

                      {/* Series (Editable) */}
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant='subtitle2'
                          color='textSecondary'
                          fontWeight={500}
                        >
                          Series
                        </Typography>
                        <TextField
                          name='series'
                          variant='outlined'
                          fullWidth
                          value={editableFields.series}
                          onChange={handleEditableFieldChange}
                          size='small'
                          sx={{ mt: 0.5 }}
                        />
                      </Box>

                      {/* Brand (Editable) */}
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant='subtitle2'
                          color='textSecondary'
                          fontWeight={500}
                        >
                          Brand
                        </Typography>
                        <TextField
                          name='brand'
                          variant='outlined'
                          fullWidth
                          value={editableFields.brand}
                          onChange={handleEditableFieldChange}
                          size='small'
                          sx={{ mt: 0.5 }}
                        />
                      </Box>

                      {/* Price (Read-only) */}
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant='subtitle2'
                          color='textSecondary'
                          fontWeight={500}
                        >
                          Price
                        </Typography>
                        <Typography
                          variant='body1'
                          sx={{ mt: 0.5, fontWeight: 600 }}
                        >
                          ₹{selectedProduct.rate}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Right Column */}
                    <Box sx={{ flex: '1 1 45%', minWidth: '200px' }}>
                      {/* SKU (Read-only) */}
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant='subtitle2'
                          color='textSecondary'
                          fontWeight={500}
                        >
                          SKU
                        </Typography>
                        <Typography variant='body1' sx={{ mt: 0.5 }}>
                          {selectedProduct.cf_sku_code}
                        </Typography>
                      </Box>

                      {/* UPC/EAN (Editable) */}
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant='subtitle2'
                          color='textSecondary'
                          fontWeight={500}
                        >
                          UPC/EAN
                        </Typography>
                        <TextField
                          name='upc_code'
                          variant='outlined'
                          fullWidth
                          value={editableFields?.upc_code}
                          onChange={handleEditableFieldChange}
                          size='small'
                          sx={{ mt: 0.5 }}
                        />
                      </Box>

                      {/* Manufacture Code (Read-only) */}
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant='subtitle2'
                          color='textSecondary'
                          fontWeight={500}
                        >
                          Manufacture Code
                        </Typography>
                        <Typography variant='body1' sx={{ mt: 0.5 }}>
                          {selectedProduct.cf_item_code}
                        </Typography>
                      </Box>

                      {/* Stock (Read-only) */}
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant='subtitle2'
                          color='textSecondary'
                          fontWeight={500}
                        >
                          Stock
                        </Typography>
                        <Typography variant='body1' sx={{ mt: 0.5 }}>
                          {selectedProduct.stock} units
                        </Typography>
                      </Box>

                      {/* HSN/SAC (Read-only) */}
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant='subtitle2'
                          color='textSecondary'
                          fontWeight={500}
                        >
                          HSN/SAC
                        </Typography>
                        <Typography variant='body1' sx={{ mt: 0.5 }}>
                          {selectedProduct.hsn_or_sac}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Catalogue Information Section */}
                  <Box sx={{ mt: 3 }}>
                    <Typography
                      variant='subtitle2'
                      color='primary'
                      gutterBottom
                      fontWeight={600}
                    >
                      Catalogue Information
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      {/* Catalogue Order (Editable) */}
                      <Box sx={{ flex: '1 1 45%', minWidth: '200px' }}>
                        <Typography
                          variant='subtitle2'
                          color='textSecondary'
                          fontWeight={500}
                        >
                          Catalogue Order
                        </Typography>
                        <TextField
                          name='catalogue_order'
                          variant='outlined'
                          fullWidth
                          value={editableFields.catalogue_order}
                          onChange={handleEditableFieldChange}
                          size='small'
                          sx={{ mt: 0.5 }}
                        />
                      </Box>

                      {/* Catalogue Page (Editable) */}
                      <Box sx={{ flex: '1 1 45%', minWidth: '200px' }}>
                        <Typography
                          variant='subtitle2'
                          color='textSecondary'
                          fontWeight={500}
                        >
                          Catalogue Page
                        </Typography>
                        <TextField
                          name='catalogue_page'
                          variant='outlined'
                          fullWidth
                          value={editableFields.catalogue_page}
                          onChange={handleEditableFieldChange}
                          size='small'
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    </Box>
                  </Box>
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
