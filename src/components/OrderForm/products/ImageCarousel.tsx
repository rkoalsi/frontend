import {
  ChevronLeft,
  ChevronRight,
  PlayCircleFilled,
} from '@mui/icons-material';
import { Box, IconButton, Tooltip, useMediaQuery, useTheme } from '@mui/material';
import React, { useState } from 'react';

interface Props {
  product: any;
  handleImageClick: any;
  small?: boolean;
}

interface MediaItem {
  type: 'image' | 'video';
  url: string;
}

function ImageCarousel(props: Props) {
  const { product, handleImageClick, small = false } = props;
  const images = (product.images && product.images.length > 0) ? product.images : [product.image_url];
  const videos = product.videos && Array.isArray(product.videos) ? product.videos : [];

  // Combine images and videos into a single media array
  const mediaItems: MediaItem[] = [
    ...images.map((url: string) => ({ type: 'image' as const, url })),
    ...videos.map((url: string) => ({ type: 'video' as const, url }))
  ];

  const hasMultipleImages = mediaItems.length > 1;
  // Index of the first video in the combined media list (-1 when the product
  // has none) — drives the "Video" badge and its jump-to-video shortcut.
  const firstVideoIndex = images.length > 0 && videos.length > 0 ? images.length : videos.length > 0 ? 0 : -1;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const theme = useTheme();

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? mediaItems.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === mediaItems.length - 1 ? 0 : prev + 1));
  };

  const handleDotClick = (index: number) => {
    setCurrentImageIndex(index);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });

    // Only prevent default if this is primarily a horizontal swipe
    if (hasMultipleImages && touchStart) {
      const deltaX = Math.abs(e.targetTouches[0].clientX - touchStart.x);
      const deltaY = Math.abs(e.targetTouches[0].clientY - touchStart.y);

      // If horizontal movement is greater than vertical, prevent scroll (it's a swipe)
      // Otherwise, allow scroll (it's a vertical scroll)
      if (deltaX > deltaY && deltaX > 10) {
        e.preventDefault();
      }
    }
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = Math.abs(touchStart.y - touchEnd.y);

    // Only process horizontal swipe if horizontal movement is greater than vertical
    if (Math.abs(distanceX) > distanceY) {
      const isLeftSwipe = distanceX > minSwipeDistance;
      const isRightSwipe = distanceX < -minSwipeDistance;

      if (isLeftSwipe) {
        // Swipe left - go to next image
        setCurrentImageIndex((prev) => (prev === mediaItems.length - 1 ? 0 : prev + 1));
      }
      if (isRightSwipe) {
        // Swipe right - go to previous image
        setCurrentImageIndex((prev) => (prev === 0 ? mediaItems.length - 1 : prev - 1));
      }
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
        touchAction: 'pan-y', // Allow vertical scrolling, prevent horizontal panning
      }}
      onTouchStart={hasMultipleImages ? onTouchStart : undefined}
      onTouchMove={hasMultipleImages ? onTouchMove : undefined}
      onTouchEnd={hasMultipleImages ? onTouchEnd : undefined}
    >
      {/* Main Image or Video */}
      {mediaItems[currentImageIndex]?.type === 'image' ? (
        <Box
          component='img'
          src={mediaItems[currentImageIndex].url}
          alt={`${product.name} - Image ${currentImageIndex + 1}`}
          loading="lazy"
          decoding="async"
          draggable={false}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            cursor: 'pointer',
            transition: isMobile || isTablet ? 'none' : 'transform 0.3s ease-in-out',
            userSelect: 'none',
            '&:hover': { transform: isMobile || isTablet ? 'none' : 'scale(1.05)' },
          }}
          onClick={() => handleImageClick(
            mediaItems.map(item => ({ src: item.url, type: item.type })),
            currentImageIndex
          )}
        />
      ) : (
        <Box
          component='video'
          src={mediaItems[currentImageIndex]?.url}
          controls
          preload='metadata'
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            userSelect: 'none',
          }}
        />
      )}
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
      {/* Top-left overlay row: media counter + "has video" indicator */}
      {(hasMultipleImages || firstVideoIndex >= 0) && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            zIndex: 2,
          }}
        >
          {hasMultipleImages && (
            <Box
              sx={{
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                padding: '2px 6px',
                borderRadius: 1,
                fontSize: '0.75rem',
                lineHeight: 1.4,
              }}
            >
              {currentImageIndex + 1} / {mediaItems.length}
            </Box>
          )}

          {firstVideoIndex >= 0 && (
            <Tooltip title={small ? 'Video available' : 'Watch product video'}>
              <Box
                role='button'
                tabIndex={0}
                aria-label='Jump to product video'
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  setCurrentImageIndex(firstVideoIndex);
                }}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentImageIndex(firstVideoIndex);
                  }
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.25,
                  cursor: 'pointer',
                  backgroundColor:
                    mediaItems[currentImageIndex]?.type === 'video'
                      ? theme.palette.primary.main
                      : 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  padding: small ? '2px 4px' : '2px 6px',
                  borderRadius: 1,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  lineHeight: 1.4,
                  letterSpacing: '0.02em',
                  '&:hover': { backgroundColor: theme.palette.primary.dark },
                }}
              >
                <PlayCircleFilled sx={{ fontSize: small ? 12 : 14 }} />
                {!small && 'Video'}
              </Box>
            </Tooltip>
          )}
        </Box>
      )}
    </Box>
  );
}

export default ImageCarousel;
