// ImageWithSkeleton.tsx
import React, { useState, useEffect } from 'react';
import { Box, CardMedia, Skeleton } from '@mui/material';

const ImageWithSkeleton = ({ src, alt }: { src: string; alt: string }) => {
  const [loaded, setLoaded] = React.useState(false);
  const [currentSrc, setCurrentSrc] = React.useState(src);

  useEffect(() => {
    if (src !== currentSrc) {
      setLoaded(false);
      setCurrentSrc(src);
    }
  }, [src, currentSrc]);

  const handleImageLoad = () => {
    setLoaded(true);
  };

  const handleImageError = () => {
    console.error(`Error loading image: ${src}`);
    setLoaded(true);
  };

  return (
    <Box
      sx={{
        width: '100%',
        maxHeight: { xs: 280, md: 440 },
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {!loaded && (
        <Skeleton
          variant='rectangular'
          width='100%'
          height='100%'
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1,
          }}
        />
      )}
      <CardMedia
        component='img'
        image={currentSrc}
        alt={alt}
        onLoad={handleImageLoad}
        onError={handleImageError}
        sx={{
          objectFit: 'contain',
          width: '100%',
          height: { xs: 240, sm: 320, md: 440 },
          transition: 'opacity 0.2s ease-in-out',
          opacity: loaded ? 1 : 0,
          zIndex: 2,
          display: loaded ? 'block' : 'none',
        }}
      />
    </Box>
  );
};

export default ImageWithSkeleton;
