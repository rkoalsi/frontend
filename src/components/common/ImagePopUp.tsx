import React from 'react';
import {
  Dialog,
  DialogContent,
  IconButton,
  useMediaQuery,
  Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme } from '@mui/material/styles';
import ImageCarousel from './ImageCarousel';
interface ImagePopupDialogProps {
  open: boolean;
  onClose: () => void;
  imageSources: Array<{ src: string; alt?: string }>;
  initialSlide?: number;
  setIndex: (index: number) => void; // Make sure type is specific
}

const ImagePopupDialog: React.FC<ImagePopupDialogProps> = ({
  open,
  onClose,
  imageSources,
  initialSlide = 0,
  setIndex,
}) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Dialog
      open={open}
      onClose={(event, reason) => {
        // This handles both ESC and clicking the backdrop
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
          onClose();
        }
      }}
      fullScreen={fullScreen}
      maxWidth='md'
      fullWidth
      aria-labelledby='image-popup-dialog'
      PaperProps={{
        sx: {
          backgroundColor: 'rgba(0,0,0,0.92)',
          pointerEvents: 'auto',
        },
      }}
    >
      <DialogContent
        sx={{
          position: 'relative',
          minHeight: { xs: '70vh', md: 480 },
          minWidth: { xs: '90vw', md: 600 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            color: theme.palette.grey[50],
            zIndex: 3, // Ensure close button is always on top
            bgcolor: 'rgba(0,0,0,0.5)',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
          }}
          aria-label='close'
        >
          <CloseIcon />
        </IconButton>

        <ImageCarousel
          onClose={onClose}
          imageSources={imageSources}
          initialSlide={initialSlide}
          onIndexChange={setIndex} // Pass setIndex directly to onIndexChange
        />
      </DialogContent>
    </Dialog>
  );
};

export default ImagePopupDialog;
