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
  IconButton,
} from '@mui/material';
import ImageDropzone from '../../common/ImageDropzone';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'; // Changed import

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
  handleImageReorder,
  handleImageDelete,
  handleMakePrimary,
}: any) => {
  const onDragEnd = (result: any) => {
    // Check if drop was successful
    if (!result.destination) return;

    // Don't do anything if dropped in same position
    if (result.destination.index === result.source.index) return;

    // Create a copy of the images array
    const items = Array.from(selectedProduct.images || []);

    // Remove the item from source position
    const [reorderedItem] = items.splice(result.source.index, 1);

    // Insert the item at destination position
    items.splice(result.destination.index, 0, reorderedItem);

    // Call the handler with reordered items
    handleImageReorder(items);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth='xl'
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          height: { xs: '95vh', sm: '90vh', md: '85vh' },
          maxHeight: '95vh',
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
      <DialogContent sx={{ py: 3, height: '100%', overflow: 'auto' }}>
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
              {/* Images Section */}
              <Box sx={{ flex: { xs: '1 1 100%', md: '0 0 35%' } }}>
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
                    Product Images ({selectedProduct.images?.length || 0})
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  {/* Image List */}
                  {selectedProduct.images &&
                  selectedProduct.images.length > 0 ? (
                    <DragDropContext onDragEnd={onDragEnd}>
                      <Droppable droppableId='product-images' type='image'>
                        {(provided: any, snapshot: any) => (
                          <Box
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            sx={{
                              mb: 2,
                              minHeight: snapshot.isDraggingOver
                                ? '100px'
                                : 'auto',
                              backgroundColor: snapshot.isDraggingOver
                                ? '#f5f5f5'
                                : 'transparent',
                              borderRadius: 1,
                              transition: 'background-color 0.2s ease',
                            }}
                          >
                            {selectedProduct.images.map(
                              (imageUrl: string, index: number) => (
                                <Draggable
                                  key={`image-${index}-${imageUrl.slice(-10)}`}
                                  draggableId={`image-${index}-${imageUrl.slice(
                                    -10
                                  )}`}
                                  index={index}
                                >
                                  {(provided: any, snapshot: any) => (
                                    <Paper
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      elevation={snapshot.isDragging ? 4 : 1}
                                      sx={{
                                        mb: 1,
                                        p: 1.5,
                                        borderRadius: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1.5,
                                        backgroundColor: snapshot.isDragging
                                          ? '#e3f2fd'
                                          : '#fff',
                                        border:
                                          index === 0
                                            ? '2px solid #1976d2'
                                            : '1px solid #e0e0e0',
                                        position: 'relative',
                                        minHeight: 80,
                                        transform: snapshot.isDragging
                                          ? 'rotate(5deg)'
                                          : 'none',
                                        transition: snapshot.isDragging
                                          ? 'none'
                                          : 'transform 0.2s ease',
                                        cursor: snapshot.isDragging
                                          ? 'grabbing'
                                          : 'default',
                                      }}
                                    >
                                      {/* Drag Handle */}
                                      <Box
                                        {...provided.dragHandleProps}
                                        sx={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          cursor: 'grab',
                                          color: snapshot.isDragging
                                            ? '#1976d2'
                                            : '#666',
                                          '&:hover': {
                                            color: '#1976d2',
                                            backgroundColor: '#f5f5f5',
                                          },
                                          '&:active': {
                                            cursor: 'grabbing',
                                            color: '#1565c0',
                                          },
                                          padding: '4px',
                                          borderRadius: '4px',
                                        }}
                                      >
                                        <DragIndicatorIcon fontSize='small' />
                                      </Box>

                                      {/* Image */}
                                      <Box
                                        onClick={() =>
                                          handleImageClick(
                                            selectedProduct.images,
                                            index
                                          )
                                        }
                                        sx={{
                                          width: 70,
                                          height: 70,
                                          borderRadius: 1,
                                          overflow: 'hidden',
                                          cursor: 'pointer',
                                          backgroundColor: '#f5f5f5',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          flexShrink: 0,
                                          '&:hover': {
                                            transform: 'scale(1.02)',
                                            transition: 'transform 0.2s ease',
                                          },
                                        }}
                                      >
                                        <img
                                          src={imageUrl || '/placeholder.png'}
                                          alt={`${selectedProduct.item_name} ${
                                            index + 1
                                          }`}
                                          style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                          }}
                                          draggable={false} // Prevent native drag
                                        />
                                      </Box>

                                      {/* Image Info and Actions */}
                                      <Box
                                        sx={{
                                          flex: 1,
                                          minWidth: 0,
                                          display: 'flex',
                                          flexDirection: 'column',
                                          gap: 1,
                                        }}
                                      >
                                        <Box
                                          sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            flexWrap: 'wrap',
                                          }}
                                        >
                                          <Typography
                                            variant='caption'
                                            color='textSecondary'
                                            sx={{
                                              fontWeight: 500,
                                            }}
                                          >
                                            Image {index + 1}
                                          </Typography>
                                          {index === 0 && (
                                            <Chip
                                              size='small'
                                              label='Primary'
                                              color='primary'
                                              variant='filled'
                                              icon={
                                                <StarIcon
                                                  sx={{ fontSize: 12 }}
                                                />
                                              }
                                              sx={{
                                                fontSize: '0.65rem',
                                                height: 20,
                                                fontWeight: 600,
                                              }}
                                            />
                                          )}
                                        </Box>

                                        {/* Action Buttons */}
                                        <Box
                                          sx={{
                                            display: 'flex',
                                            gap: 0.5,
                                            alignItems: 'center',
                                          }}
                                        >
                                          {index !== 0 && (
                                            <Button
                                              size='small'
                                              variant='outlined'
                                              startIcon={
                                                <StarBorderIcon
                                                  sx={{ fontSize: 14 }}
                                                />
                                              }
                                              onClick={() =>
                                                handleMakePrimary(index)
                                              }
                                              sx={{
                                                fontSize: '0.65rem',
                                                py: 0.25,
                                                px: 1,
                                                minWidth: 'auto',
                                                height: 24,
                                                borderRadius: 3,
                                                textTransform: 'none',
                                                fontWeight: 500,
                                              }}
                                            >
                                              Make Primary
                                            </Button>
                                          )}
                                          <IconButton
                                            size='small'
                                            onClick={() =>
                                              handleImageDelete(index)
                                            }
                                            sx={{
                                              color: '#f44336',
                                              width: 28,
                                              height: 28,
                                              '&:hover': {
                                                backgroundColor: '#ffebee',
                                              },
                                            }}
                                          >
                                            <DeleteIcon sx={{ fontSize: 16 }} />
                                          </IconButton>
                                        </Box>
                                      </Box>
                                    </Paper>
                                  )}
                                </Draggable>
                              )
                            )}
                            {provided.placeholder}
                          </Box>
                        )}
                      </Droppable>
                    </DragDropContext>
                  ) : (
                    <Box sx={{ mb: 2, textAlign: 'center', py: 2 }}>
                      <Typography variant='body2' color='textSecondary'>
                        No images available
                      </Typography>
                    </Box>
                  )}

                  {/* Upload Section */}
                  <ImageDropzone
                    onImageUpload={handleImageUpload}
                    updating={updating}
                  />
                  <Typography
                    variant='caption'
                    color='textSecondary'
                    sx={{ mt: 1, display: 'block', textAlign: 'center' }}
                  >
                    Drag images to reorder • Click "Make Primary" to set main
                    image • First image is always primary
                  </Typography>
                </Paper>
              </Box>

              {/* Details Section */}
              <Box sx={{ flex: { xs: '1 1 100%', md: '0 0 65%' } }}>
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
                    <Typography fontWeight={500}>
                      {selectedProduct.name}
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
                      {/* Item GST */}
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant='subtitle2'
                          color='textSecondary'
                          fontWeight={500}
                        >
                          GST
                        </Typography>
                        <Typography variant='body1' sx={{ mt: 0.5 }}>
                          {selectedProduct?.item_tax_preferences?.[0]?.tax_percentage || 'N/A'}
                                  %
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  {/* Manufacturer  */}
                  {selectedProduct.manufacturer && (
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant='subtitle2'
                        color='textSecondary'
                        fontWeight={500}
                      >
                        Manufacturer
                      </Typography>
                      <Typography variant='body1' sx={{ mt: 0.5 }}>
                        {selectedProduct.manufacturer}
                      </Typography>
                    </Box>
                  )}

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
