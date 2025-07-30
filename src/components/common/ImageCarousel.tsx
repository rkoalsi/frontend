import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  IconButton,
  Card,
  useTheme,
  Typography,
  Fade,
  Skeleton,
  useMediaQuery,
} from '@mui/material';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

interface ImageCarouselProps {
  imageSources: Array<{ src: string; alt?: string }>;
  initialSlide?: number;
  onIndexChange?: (index: number) => void;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showCounter?: boolean;
  showIndicators?: boolean;
  onClose: any;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({
  imageSources,
  initialSlide = 0,
  onIndexChange,
  autoPlay = false,
  autoPlayInterval = 3000,
  showCounter = true,
  showIndicators = true,
  onClose,
}) => {
  const theme = useTheme();
  const [activeIndex, setActiveIndex] = useState(initialSlide);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const maxSteps = imageSources.length;
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  // Update activeIndex if initialSlide prop changes
  useEffect(() => {
    setActiveIndex(initialSlide);
  }, [initialSlide]);

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || maxSteps <= 1) return;

    const interval = setInterval(() => {
      handleNext();
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, maxSteps, activeIndex]);

  const handleNext = useCallback(() => {
    setActiveIndex((prevActiveStep) => {
      const newIndex = (prevActiveStep + 1) % maxSteps;
      onIndexChange?.(newIndex);
      return newIndex;
    });
  }, [maxSteps, onIndexChange]);

  const handleBack = useCallback(() => {
    setActiveIndex((prevActiveStep) => {
      const newIndex = (prevActiveStep - 1 + maxSteps) % maxSteps;
      onIndexChange?.(newIndex);
      return newIndex;
    });
  }, [maxSteps, onIndexChange]);

  const handleStepChange = useCallback(
    (step: number) => {
      setActiveIndex(step);
      onIndexChange?.(step);
    },
    [onIndexChange]
  );

  // Ensure activeIndex is within bounds if imageSources change dynamically
  useEffect(() => {
    if (activeIndex >= maxSteps && maxSteps > 0) {
      setActiveIndex(maxSteps - 1);
      onIndexChange?.(maxSteps - 1);
    } else if (maxSteps === 0) {
      setActiveIndex(0);
      onIndexChange?.(0);
    }
  }, [maxSteps, activeIndex, onIndexChange]);

  if (maxSteps === 0) {
    return (
      <Box
        sx={{
          height: { xs: 240, sm: 320, md: 480 },
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'grey.100',
          borderRadius: 2,
        }}
      >
        <Typography variant='body1' color='text.secondary'>
          No images to display
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        position: 'relative',
        borderRadius: 3,
        overflow: 'hidden',
        boxShadow: theme.shadows[8],
      }}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <Card
        elevation={0}
        sx={{
          bgcolor: 'transparent',
          position: 'relative',
          aspectRatio: { xs: '4/3', sm: '16/10', md: '16/9' },
          overflow: 'hidden',
          borderRadius: 3,
        }}
      >
        {/* Main Image Container */}
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: '100%',
            bgcolor: 'grey.900',
          }}
        >
          {/* Loading Skeleton */}
          {isLoading && (
            <Skeleton
              variant='rectangular'
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 1,
              }}
              animation='wave'
            />
          )}

          {/* Main Image */}
          <Box
            component='img'
            src={imageSources[activeIndex].src}
            alt={imageSources[activeIndex].alt || `Image ${activeIndex + 1}`}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'contain', // Changed from "cover" to "contain"
              transition: 'opacity 0.3s ease-in-out',
              opacity: isLoading ? 0 : 1,
            }}
            onLoad={() => setIsLoading(false)}
            onError={() => setIsLoading(false)}
          />

          {/* Gradient Overlays for Better Button Visibility */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 80,
              height: '100%',
              background:
                'linear-gradient(to right, rgba(0,0,0,0.3), transparent)',
              pointerEvents: 'none',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 80,
              height: '100%',
              background:
                'linear-gradient(to left, rgba(0,0,0,0.3), transparent)',
              pointerEvents: 'none',
            }}
          />
        </Box>

        {/* Navigation Buttons */}
        {maxSteps > 1 && (
          <>
            <Fade in={showControls} timeout={200}>
              <IconButton
                onClick={handleBack}
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: { xs: 8, sm: 16 },
                  transform: 'translateY(-50%)',
                  color: 'white',
                  bgcolor: 'rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(8px)',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.8)',
                    transform: 'translateY(-50%) scale(1.1)',
                  },
                  transition: 'all 0.2s ease-in-out',
                  width: { xs: 40, sm: 48 },
                  height: { xs: 40, sm: 48 },
                  zIndex: 2,
                }}
                aria-label='Previous image'
              >
                <KeyboardArrowLeft sx={{ fontSize: { xs: 20, sm: 24 } }} />
              </IconButton>
            </Fade>

            <Fade in={showControls} timeout={200}>
              <IconButton
                onClick={handleNext}
                sx={{
                  position: 'absolute',
                  top: '50%',
                  right: { xs: 8, sm: 16 },
                  transform: 'translateY(-50%)',
                  color: 'white',
                  bgcolor: 'rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(8px)',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.8)',
                    transform: 'translateY(-50%) scale(1.1)',
                  },
                  transition: 'all 0.2s ease-in-out',
                  width: { xs: 40, sm: 48 },
                  height: { xs: 40, sm: 48 },
                  zIndex: 2,
                }}
                aria-label='Next image'
              >
                <KeyboardArrowRight sx={{ fontSize: { xs: 20, sm: 24 } }} />
              </IconButton>
            </Fade>
          </>
        )}

        {/* Image Counter */}
        {showCounter && maxSteps > 1 && (
          <Box
            sx={{
              position: 'absolute',
              top: { xs: 12, sm: 16 },
              left: { xs: 12, sm: 16 },
              zIndex: 2,
              bgcolor: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(8px)',
              color: 'white',
              px: { xs: 1.5, sm: 2 },
              py: { xs: 0.5, sm: 1 },
              borderRadius: 20,
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              fontWeight: 600,
              letterSpacing: 0.5,
            }}
          >
            <Typography
              variant='caption'
              sx={{
                fontSize: 'inherit',
                fontWeight: 'inherit',
                color: 'inherit',
              }}
            >
              {activeIndex + 1} / {maxSteps}
            </Typography>
          </Box>
        )}

        {/* Indicators */}
        {showIndicators && maxSteps > 1 && (
          <Box
            sx={{
              position: 'absolute',
              bottom: { xs: 12, sm: 16 },
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 2,
              display: 'flex',
              gap: { xs: 0.5, sm: 1 },
              bgcolor: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(8px)',
              px: { xs: 1, sm: 1.5 },
              py: { xs: 0.5, sm: 1 },
              borderRadius: 20,
            }}
          >
            {imageSources.map((_, index) => (
              <IconButton
                key={index}
                onClick={() => handleStepChange(index)}
                size='small'
                sx={{
                  p: 0,
                  minWidth: 'auto',
                  width: { xs: 24, sm: 28 },
                  height: { xs: 24, sm: 28 },
                  color:
                    activeIndex === index
                      ? theme.palette.primary.main
                      : 'rgba(255,255,255,0.6)',
                  '&:hover': {
                    color:
                      activeIndex === index
                        ? theme.palette.primary.light
                        : 'rgba(255,255,255,0.9)',
                    transform: 'scale(1.2)',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
                aria-label={`Go to slide ${index + 1}`}
              >
                <FiberManualRecordIcon sx={{ fontSize: { xs: 8, sm: 10 } }} />
              </IconButton>
            ))}
          </Box>
        )}
      </Card>
    </Box>
  );
};

export default ImageCarousel;
