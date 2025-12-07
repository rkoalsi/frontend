import React, { useEffect, useState, useContext } from 'react';
import {
  Typography,
  Box,
  Paper,
  CircularProgress,
  Button,
  TextField,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  TablePagination,
} from '@mui/material';
import { toast } from 'react-toastify';
import { Search, Delete, Upload, Close, PhotoLibrary, ChevronLeft, ChevronRight, SwapHoriz } from '@mui/icons-material';
import axiosInstance from '../../src/util/axios';
import AuthContext from '../../src/components/Auth';
import { useDropzone } from 'react-dropzone';
import capitalize from '../../src/util/capitalize';

interface ShipmentImage {
  url: string;
  caption: string;
  uploaded_at: string;
  uploaded_by: string;
}

interface Shipment {
  _id: string;
  shipment_number: string;
  customer_name: string;
  status: string;
  date: string;
  images?: ShipmentImage[];
}

const AdminShipments = () => {
  const { user }: any = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagesToUpload, setImagesToUpload] = useState<File[]>([]);
  const [captions, setCaptions] = useState<{ [key: number]: string }>({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [carouselImages, setCarouselImages] = useState<ShipmentImage[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<number | null>(null);
  const [replacingImageIndex, setReplacingImageIndex] = useState<number | null>(null);

  const fetchShipments = async (search = '', pageNum = 0, perPage = 25) => {
    setLoading(true);
    try {
      const params: any = {
        created_by: user?.data?._id,
        role: 'admin',
        per_page: perPage,
        page: pageNum + 1, // API uses 1-based pagination
      };

      if (search.trim()) {
        params.search = search;
      }

      const response = await axiosInstance.get(`/shipments`, { params });
      setShipments(response.data.shipments || []);
      setTotalCount(response.data.total || 0);
      if (response.data.shipments.length === 0 && search) {
        toast.info('No shipments found');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error fetching shipments');
    } finally {
      setLoading(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    if (!user?.data?._id) return;

    const debounceTimer = setTimeout(() => {
      setPage(0); // Reset to first page on search
      fetchShipments(searchTerm, 0, rowsPerPage);
    }, 500); // 500ms debounce delay

    return () => clearTimeout(debounceTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, user?.data?._id]);

  // Load shipments when pagination changes
  useEffect(() => {
    if (user?.data?._id) {
      fetchShipments(searchTerm, page, rowsPerPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage]);

  const handleChangePage = (_event: any, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleShipmentClick = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setUploadDialogOpen(true);
  };

  const onDrop = (acceptedFiles: File[]) => {
    setImagesToUpload((prev) => [...prev, ...acceptedFiles]);
    // Initialize captions for new images
    acceptedFiles.forEach((_, index) => {
      const newIndex = imagesToUpload.length + index;
      if (!captions[newIndex]) {
        setCaptions((prev) => ({ ...prev, [newIndex]: '' }));
      }
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: true,
  });

  const handleUpload = async () => {
    if (!selectedShipment || imagesToUpload.length === 0) {
      toast.error('Please select images to upload');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      imagesToUpload.forEach((file) => {
        formData.append('images', file);
      });

      // Create captions array matching images order
      const captionsArray = imagesToUpload.map((_, index) => captions[index] || '');
      formData.append('captions', JSON.stringify(captionsArray));
      formData.append('uploaded_by', user?.data?._id);

      await axiosInstance.post(
        `/shipments/${selectedShipment._id}/images`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      toast.success('Images uploaded successfully');
      setImagesToUpload([]);
      setCaptions({});

      // Refresh the selected shipment
      const response = await axiosInstance.get(`/shipments/${selectedShipment._id}`);
      setSelectedShipment(response.data);

      // Update in list
      setShipments(prev => prev.map(s => s._id === selectedShipment._id ? response.data : s));
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.detail || 'Error uploading images');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageIndex: number) => {
    if (!selectedShipment) return;

    try {
      await axiosInstance.delete(
        `/shipments/${selectedShipment._id}/images/${imageIndex}`
      );
      toast.success('Image deleted successfully');

      // Refresh the selected shipment
      const response = await axiosInstance.get(`/shipments/${selectedShipment._id}`);
      setSelectedShipment(response.data);

      // Update in list
      setShipments(prev => prev.map(s => s._id === selectedShipment._id ? response.data : s));

      // Close confirmation dialog
      setDeleteConfirmOpen(false);
      setImageToDelete(null);
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.detail || 'Error deleting image');
    }
  };

  const confirmDeleteImage = (index: number) => {
    setImageToDelete(index);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteAllImages = async () => {
    if (!selectedShipment || !selectedShipment.images) return;

    try {
      // Delete all images by deleting from the last index to first
      for (let i = selectedShipment.images.length - 1; i >= 0; i--) {
        await axiosInstance.delete(
          `/shipments/${selectedShipment._id}/images/${i}`
        );
      }

      toast.success('All images deleted successfully');

      // Refresh the selected shipment
      const response = await axiosInstance.get(`/shipments/${selectedShipment._id}`);
      setSelectedShipment(response.data);

      // Update in list
      setShipments(prev => prev.map(s => s._id === selectedShipment._id ? response.data : s));

      // Close confirmation dialog
      setDeleteConfirmOpen(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.detail || 'Error deleting images');
    }
  };

  const handleReplaceImage = async (index: number, file: File) => {
    if (!selectedShipment) return;

    try {
      setUploading(true);

      // Get the existing caption
      const existingCaption = selectedShipment.images?.[index]?.caption || '';

      // First delete the old image
      await axiosInstance.delete(
        `/shipments/${selectedShipment._id}/images/${index}`
      );

      // Then upload the new image at the same position
      const formData = new FormData();
      formData.append('images', file);
      formData.append('captions', JSON.stringify([existingCaption]));
      formData.append('uploaded_by', user?.data?._id);

      await axiosInstance.post(
        `/shipments/${selectedShipment._id}/images`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      toast.success('Image replaced successfully');

      // Refresh the selected shipment
      const response = await axiosInstance.get(`/shipments/${selectedShipment._id}`);
      setSelectedShipment(response.data);

      // Update in list
      setShipments(prev => prev.map(s => s._id === selectedShipment._id ? response.data : s));

      setReplacingImageIndex(null);
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.detail || 'Error replacing image');
    } finally {
      setUploading(false);
    }
  };

  const triggerReplaceImage = (index: number) => {
    setReplacingImageIndex(index);
    // Create a hidden file input and trigger it
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        handleReplaceImage(index, file);
      }
    };
    input.click();
  };

  const removeImageFromUpload = (index: number) => {
    setImagesToUpload((prev) => prev.filter((_, i) => i !== index));
    const newCaptions = { ...captions };
    delete newCaptions[index];
    // Reindex captions
    const reindexedCaptions: { [key: number]: string } = {};
    Object.keys(newCaptions).forEach((key) => {
      const oldIndex = parseInt(key);
      const newIndex = oldIndex > index ? oldIndex - 1 : oldIndex;
      reindexedCaptions[newIndex] = newCaptions[oldIndex];
    });
    setCaptions(reindexedCaptions);
  };

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower === 'delivered') return 'success';
    if (statusLower === 'shipped') return 'primary';
    return 'default';
  };

  const handleImageClick = (images: ShipmentImage[], index: number) => {
    setCarouselImages(images);
    setCurrentImageIndex(index);
    setCarouselOpen(true);
  };

  const handleCarouselNext = () => {
    setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
  };

  const handleCarouselPrev = () => {
    setCurrentImageIndex((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  };

  // Keyboard navigation for carousel
  useEffect(() => {
    if (!carouselOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        handleCarouselPrev();
      } else if (event.key === 'ArrowRight') {
        handleCarouselNext();
      } else if (event.key === 'Escape') {
        setCarouselOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carouselOpen, carouselImages.length]);

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
        <Typography variant='h4' gutterBottom sx={{ fontWeight: 'bold' }}>
          Manage Shipment Images
        </Typography>
        <Typography variant='body1' sx={{ color: '#6B7280', marginBottom: 3 }}>
          Search for a shipment and upload images with optional captions.
        </Typography>

        {/* Search Box */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder='Search by shipment number, customer name, or tracking number...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <Search />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position='end'>
                  <IconButton
                    size='small'
                    onClick={() => setSearchTerm('')}
                  >
                    <Close />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Loading */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : shipments.length > 0 ? (
          /* Shipments Table */
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Shipment Number</TableCell>
                  <TableCell>Customer Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align='center'>Images</TableCell>
                  <TableCell align='center'>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {shipments.map((shipment) => (
                  <TableRow
                    key={shipment._id}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      },
                    }}
                  >
                    <TableCell>
                      <Typography variant='body2' fontWeight={500}>
                        {shipment.shipment_number}
                      </Typography>
                    </TableCell>
                    <TableCell>{shipment.customer_name}</TableCell>
                    <TableCell>
                      <Chip
                        label={capitalize(shipment.status)}
                        color={getStatusColor(shipment.status)}
                        size='small'
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(shipment.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell align='center'>
                      {shipment.images && shipment.images.length > 0 ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                          <PhotoLibrary fontSize='small' color='primary' />
                          <Typography variant='body2' color='primary'>
                            {shipment.images.length}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant='body2' color='text.secondary'>
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align='center'>
                      <Button
                        variant='outlined'
                        size='small'
                        onClick={() => handleShipmentClick(shipment)}
                      >
                        Manage Images
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component='div'
              count={totalCount}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </TableContainer>
        ) : (
          /* No shipments message */
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant='h6' color='text.secondary' gutterBottom>
              {searchTerm ? 'No shipments found matching your search' : 'No shipments found'}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {searchTerm ? 'Try a different search term' : 'Shipments will appear here once they are created'}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>
          Manage Images - {selectedShipment?.shipment_number}
          <IconButton
            onClick={() => setUploadDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {/* Existing Images */}
          {selectedShipment?.images && selectedShipment.images.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant='subtitle1' fontWeight={600}>
                  Existing Images ({selectedShipment.images.length})
                </Typography>
                <Button
                  variant='outlined'
                  color='error'
                  size='small'
                  startIcon={<Delete />}
                  onClick={() => {
                    setImageToDelete(-1); // -1 indicates delete all
                    setDeleteConfirmOpen(true);
                  }}
                >
                  Delete All
                </Button>
              </Box>
              <ImageList cols={3} gap={8}>
                {selectedShipment.images.map((image, index) => (
                  <ImageListItem key={index} sx={{ position: 'relative' }}>
                    <img
                      src={image.url}
                      alt={image.caption || `Image ${index + 1}`}
                      loading='lazy'
                      style={{ height: 150, objectFit: 'cover', cursor: 'pointer' }}
                      onClick={() => handleImageClick(selectedShipment.images || [], index)}
                    />
                    {/* Replace button on top left */}
                    <IconButton
                      sx={{
                        position: 'absolute',
                        top: 4,
                        left: 4,
                        backgroundColor: 'rgba(33, 150, 243, 0.9)',
                        color: 'white',
                        padding: '6px',
                        '&:hover': {
                          backgroundColor: 'rgba(25, 118, 210, 1)',
                        },
                      }}
                      size='small'
                      disabled={uploading && replacingImageIndex === index}
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerReplaceImage(index);
                      }}
                    >
                      <SwapHoriz fontSize='small' />
                    </IconButton>
                    {/* Delete button on top right */}
                    <IconButton
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        backgroundColor: 'rgba(244, 67, 54, 0.9)',
                        color: 'white',
                        padding: '6px',
                        '&:hover': {
                          backgroundColor: 'rgba(211, 47, 47, 1)',
                        },
                      }}
                      size='small'
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDeleteImage(index);
                      }}
                    >
                      <Delete fontSize='small' />
                    </IconButton>
                    {/* Caption only if exists */}
                    {image.caption && (
                      <ImageListItemBar
                        title={image.caption}
                      />
                    )}
                  </ImageListItem>
                ))}
              </ImageList>
            </Box>
          )}

          {/* Upload New Images */}
          <Typography variant='subtitle1' fontWeight={600} gutterBottom>
            Upload New Images
          </Typography>

          <Box
            {...getRootProps()}
            sx={{
              border: '2px dashed #cccccc',
              borderRadius: 2,
              padding: 4,
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: isDragActive ? '#f0f0f0' : 'transparent',
              mb: 2,
            }}
          >
            <input {...getInputProps()} />
            <Upload sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant='body1'>
              {isDragActive
                ? 'Drop the images here...'
                : 'Drag and drop images here, or click to select'}
            </Typography>
          </Box>

          {/* Images to Upload */}
          {imagesToUpload.length > 0 && (
            <Box>
              <Typography variant='subtitle2' gutterBottom>
                Images to Upload ({imagesToUpload.length})
              </Typography>
              {imagesToUpload.map((file, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    gap: 2,
                    mb: 2,
                    p: 2,
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                  }}
                >
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4 }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant='body2' fontWeight={500}>
                      {file.name}
                    </Typography>
                    <TextField
                      fullWidth
                      size='small'
                      placeholder='Add caption (optional)'
                      value={captions[index] || ''}
                      onChange={(e) =>
                        setCaptions((prev) => ({ ...prev, [index]: e.target.value }))
                      }
                      sx={{ mt: 1 }}
                    />
                  </Box>
                  <IconButton onClick={() => removeImageFromUpload(index)}>
                    <Close />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Close</Button>
          <Button
            variant='contained'
            onClick={handleUpload}
            disabled={uploading || imagesToUpload.length === 0}
            startIcon={uploading ? <CircularProgress size={20} /> : <Upload />}
          >
            {uploading ? 'Uploading...' : 'Upload Images'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Carousel Dialog */}
      <Dialog
        open={carouselOpen}
        onClose={() => setCarouselOpen(false)}
        maxWidth='lg'
        fullWidth
        slotProps={{
          paper: {
            sx: {
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              boxShadow: 'none',
            },
          },
        }}
      >
        <DialogContent sx={{ position: 'relative', p: 0, backgroundColor: 'black' }}>
          <IconButton
            onClick={() => setCarouselOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'white',
              zIndex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
              },
            }}
          >
            <Close />
          </IconButton>

          {carouselImages.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '70vh',
                position: 'relative',
              }}
            >
              {/* Image */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  flex: 1,
                }}
              >
                <img
                  src={carouselImages[currentImageIndex]?.url}
                  alt={carouselImages[currentImageIndex]?.caption || `Image ${currentImageIndex + 1}`}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '70vh',
                    objectFit: 'contain',
                  }}
                />
              </Box>

              {/* Caption */}
              {carouselImages[currentImageIndex]?.caption && (
                <Box
                  sx={{
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    padding: 2,
                    width: '100%',
                    textAlign: 'center',
                  }}
                >
                  <Typography variant='body1'>
                    {carouselImages[currentImageIndex].caption}
                  </Typography>
                </Box>
              )}

              {/* Navigation Buttons */}
              {carouselImages.length > 1 && (
                <>
                  <IconButton
                    onClick={handleCarouselPrev}
                    sx={{
                      position: 'absolute',
                      left: 16,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'white',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      },
                    }}
                  >
                    <ChevronLeft fontSize='large' />
                  </IconButton>
                  <IconButton
                    onClick={handleCarouselNext}
                    sx={{
                      position: 'absolute',
                      right: 16,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'white',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      },
                    }}
                  >
                    <ChevronRight fontSize='large' />
                  </IconButton>

                  {/* Image Counter */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 16,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant='body2'>
                      {currentImageIndex + 1} / {carouselImages.length}
                    </Typography>
                  </Box>
                </>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setImageToDelete(null);
        }}
        maxWidth='xs'
        fullWidth
      >
        <DialogTitle>
          {imageToDelete === -1 ? 'Delete All Images?' : 'Delete Image?'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {imageToDelete === -1
              ? `Are you sure you want to delete all ${selectedShipment?.images?.length || 0} images? This action cannot be undone.`
              : 'Are you sure you want to delete this image? This action cannot be undone.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDeleteConfirmOpen(false);
              setImageToDelete(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant='contained'
            color='error'
            onClick={() => {
              if (imageToDelete === -1) {
                handleDeleteAllImages();
              } else if (imageToDelete !== null) {
                handleDeleteImage(imageToDelete);
              }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminShipments;
