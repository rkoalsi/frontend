import {
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
import { Box, IconButton, useMediaQuery, useTheme } from '@mui/material';
import React, { useState } from 'react';

interface Props {
  product: any;
  handleImageClick: any;
  small?: boolean;
}

function ImageCarousel(props: Props) {
  const { product, handleImageClick, small = false } = props;
  const images = product.images || [product.image_url];
  const hasMultipleImages = images.length > 1;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const theme = useTheme();

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

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

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      // Swipe left - go to next image
      setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }
    if (isRightSwipe) {
      // Swipe right - go to previous image
      setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    }
  };

  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
      onTouchStart={hasMultipleImages ? onTouchStart : undefined}
      onTouchMove={hasMultipleImages ? onTouchMove : undefined}
      onTouchEnd={hasMultipleImages ? onTouchEnd : undefined}
    >
      {/* Main Image */}
      <Box
        component='img'
        src={images[currentImageIndex]}
        alt={`${product.name} - Image ${currentImageIndex + 1}`}
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          cursor: 'pointer',
          transition: 'transform 0.3s ease-in-out',
          userSelect: 'none',
          '&:hover': { transform: 'scale(1.05)' },
        }}
        onClick={() => handleImageClick(images, currentImageIndex)}
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
      {/* Dots Indicator - Only show if multiple images
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
      )} */}
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
