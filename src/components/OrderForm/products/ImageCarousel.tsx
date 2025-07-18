import {
  ChevronLeft,
  ChevronRight,
  FiberManualRecord,
} from '@mui/icons-material';
import { Box, IconButton } from '@mui/material';
import React, { useState } from 'react';

interface Props {
  product: any;
  handleImageClick: any;
}

function ImageCarousel(props: Props) {
  const { product, handleImageClick } = props;
  const images = product.images || [product.image_url];
  const hasMultipleImages = images.length > 1;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleDotClick = (index: number) => {
    setCurrentImageIndex(index);
  };
  return (
    <Box
      sx={{
        position: 'relative',
        width: '180px',
        overflow: 'hidden',
      }}
    >
      {/* Main Image */}
      <Box
        component='img'
        src={images[currentImageIndex]}
        alt={`${product.name} - Image ${currentImageIndex + 1}`}
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          cursor: 'pointer',
          transition: 'transform 0.3s ease-in-out',
          '&:hover': { transform: 'scale(1.03)' },
        }}
        onClick={() => handleImageClick(images[currentImageIndex])}
      />

      {/* Navigation Arrows - Only show if multiple images */}
      {hasMultipleImages && (
        <>
          <IconButton
            onClick={handlePrevImage}
            sx={{
              position: 'absolute',
              left: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
              },
              zIndex: 2,
            }}
            size='small'
          >
            <ChevronLeft />
          </IconButton>

          <IconButton
            onClick={handleNextImage}
            sx={{
              position: 'absolute',
              right: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
              },
              zIndex: 2,
            }}
            size='small'
          >
            <ChevronRight />
          </IconButton>
        </>
      )}

      {/* Dots Indicator - Only show if multiple images */}
      {hasMultipleImages && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 0.5,
            zIndex: 2,
          }}
        >
          {images.map((_: any, index: number) => (
            <IconButton
              key={index}
              onClick={() => handleDotClick(index)}
              sx={{
                padding: 0.5,
                minWidth: 'auto',
                color:
                  index === currentImageIndex
                    ? 'white'
                    : 'rgba(255, 255, 255, 0.5)',
              }}
              size='small'
            >
              <FiberManualRecord sx={{ fontSize: 8 }} />
            </IconButton>
          ))}
        </Box>
      )}

      {/* Image Counter */}
      {hasMultipleImages && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '2px 6px',
            borderRadius: 1,
            fontSize: '0.75rem',
            zIndex: 2,
          }}
        >
          {currentImageIndex + 1} / {images.length}
        </Box>
      )}
    </Box>
  );
}

export default ImageCarousel;
