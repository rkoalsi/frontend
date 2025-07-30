import React from 'react';
import { Dialog, DialogContent, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface ImagePopupDialogProps {
  open: boolean;
  onClose: () => void;
  imageSrc: string;
}

const SingleImagePopupDialog: React.FC<ImagePopupDialogProps> = ({
  open,
  onClose,
  imageSrc,
}) => {
  return (
    <Dialog open={open} onClose={onClose} sx={{ zIndex: 1300 }}>
      <DialogContent
        sx={{
          position: 'relative',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            color: 'white',
            zIndex: 1400,
          }}
          aria-label='close'
        >
          <CloseIcon />
        </IconButton>
        <img
          src={imageSrc}
          alt='Full screen'
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default SingleImagePopupDialog;
