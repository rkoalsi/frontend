import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  FormControlLabel,
  Grid,
  Typography,
  Button,
  TextField,
  DialogActions,
  Switch,
} from '@mui/material';
import ImageDropzone from '../../common/ImageDropzone';

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
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='md'>
      <DialogTitle>Edit Product Details</DialogTitle>
      <DialogContent>
        {selectedProduct && (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              {/* Image Section */}
              <Box>
                <Typography
                  variant='subtitle2'
                  color='textSecondary'
                  gutterBottom
                >
                  Product Image
                </Typography>
                <Box
                  sx={{
                    mb: 2,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
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
                      maxWidth: '200px',
                      height: 'auto',
                      borderRadius: '4px',
                      objectFit: 'cover',
                      cursor: 'pointer',
                    }}
                  />
                </Box>
                <ImageDropzone
                  onImageUpload={handleImageUpload}
                  updating={updating}
                />
              </Box>

              {/* Details Section */}
              <Grid>
                <Grid container spacing={2}>
                  {/* Item Name (Read-only) */}
                  <Grid>
                    <Typography variant='subtitle2' color='textSecondary'>
                      Item Name
                    </Typography>
                    <Typography variant='body1'>
                      {selectedProduct.item_name}
                    </Typography>
                  </Grid>

                  {/* Category (Editable) */}
                  <Grid>
                    <Typography variant='subtitle2' color='textSecondary'>
                      Category
                    </Typography>
                    <TextField
                      name='category'
                      variant='outlined'
                      fullWidth
                      value={editableFields.category}
                      onChange={handleEditableFieldChange}
                      size='small'
                    />
                  </Grid>

                  {/* Sub Category (Editable) */}
                  <Grid>
                    <Typography variant='subtitle2' color='textSecondary'>
                      Sub Category
                    </Typography>
                    <TextField
                      name='sub_category'
                      variant='outlined'
                      fullWidth
                      value={editableFields.sub_category}
                      onChange={handleEditableFieldChange}
                      size='small'
                    />
                  </Grid>

                  {/* Series (Editable) */}
                  <Grid>
                    <Typography variant='subtitle2' color='textSecondary'>
                      Series
                    </Typography>
                    <TextField
                      name='series'
                      variant='outlined'
                      fullWidth
                      value={editableFields.series}
                      onChange={handleEditableFieldChange}
                      size='small'
                    />
                  </Grid>

                  {/* UPC/EAN (Read-only) */}
                  <Grid>
                    <Typography variant='subtitle2' color='textSecondary'>
                      UPC/EAN
                    </Typography>
                    <TextField
                      name='upc_code'
                      variant='outlined'
                      fullWidth
                      value={editableFields?.upc_code}
                      onChange={handleEditableFieldChange}
                      size='small'
                    />
                  </Grid>

                  {/* SKU (Read-only) */}
                  <Grid>
                    <Typography variant='subtitle2' color='textSecondary'>
                      SKU
                    </Typography>
                    <Typography variant='body1'>
                      {selectedProduct.cf_sku_code}
                    </Typography>
                  </Grid>

                  {/* Manufacture Code (Read-only) */}
                  <Grid>
                    <Typography variant='subtitle2' color='textSecondary'>
                      Manufacture Code
                    </Typography>
                    <Typography variant='body1'>
                      {selectedProduct.cf_item_code}
                    </Typography>
                  </Grid>

                  {/* Price (Read-only) */}
                  <Grid>
                    <Typography variant='subtitle2' color='textSecondary'>
                      Price
                    </Typography>
                    <Typography variant='body1'>
                      ₹{selectedProduct.rate}
                    </Typography>
                  </Grid>

                  {/* Stock (Read-only) */}
                  <Grid>
                    <Typography variant='subtitle2' color='textSecondary'>
                      Stock
                    </Typography>
                    <Typography variant='body1'>
                      {selectedProduct.stock}
                    </Typography>
                  </Grid>

                  {/* Status (Read-only) */}
                  <Grid>
                    <Typography variant='subtitle2' color='textSecondary'>
                      Status
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
                        selectedProduct?.status === 'active'
                          ? 'Active'
                          : 'Inactive'
                      }
                    />
                  </Grid>

                  {/* Brand (Editable) */}
                  <Grid>
                    <Typography variant='subtitle2' color='textSecondary'>
                      Brand
                    </Typography>
                    <TextField
                      name='brand'
                      variant='outlined'
                      fullWidth
                      value={editableFields.brand}
                      onChange={handleEditableFieldChange}
                      size='small'
                    />
                  </Grid>

                  {/* Catalogue Order (Editable) */}
                  <Grid>
                    <Typography variant='subtitle2' color='textSecondary'>
                      Catalogue Order
                    </Typography>
                    <TextField
                      name='catalogue_order'
                      variant='outlined'
                      fullWidth
                      value={editableFields.catalogue_order}
                      onChange={handleEditableFieldChange}
                      size='small'
                    />
                  </Grid>

                  {/* Catalogue Page (Editable) */}
                  <Grid>
                    <Typography variant='subtitle2' color='textSecondary'>
                      Catalogue Page
                    </Typography>
                    <TextField
                      name='catalogue_page'
                      variant='outlined'
                      fullWidth
                      value={editableFields.catalogue_page}
                      onChange={handleEditableFieldChange}
                      size='small'
                    />
                  </Grid>

                  {/* HSN/SAC (Read-only) */}
                  <Grid>
                    <Typography variant='subtitle2' color='textSecondary'>
                      HSN/SAC
                    </Typography>
                    <Typography variant='body1'>
                      {selectedProduct.hsn_or_sac}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color='primary' disabled={updating}>
          Cancel
        </Button>
        <Button
          onClick={handleSaveEdit}
          color='primary'
          variant='contained'
          disabled={updating}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};
export default ProductDialog;
