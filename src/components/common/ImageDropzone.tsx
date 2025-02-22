import { Box, Typography, CircularProgress } from '@mui/material';
import { useDropzone } from 'react-dropzone';

const ImageDropzone = ({ onImageUpload, updating }: any) => {
  const onDrop = (acceptedFiles: any) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      onImageUpload(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
  });

  return (
    <Box
      {...getRootProps()}
      sx={{
        border: '2px dashed #cccccc',
        padding: 2,
        textAlign: 'center',
        cursor: 'pointer',
        backgroundColor: isDragActive ? '#f0f0f0' : 'transparent',
      }}
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <Typography>Drop the image here...</Typography>
      ) : (
        <Typography>
          Drag and drop an image here, or click to select an image
        </Typography>
      )}
      {updating && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}
    </Box>
  );
};

export default ImageDropzone;
