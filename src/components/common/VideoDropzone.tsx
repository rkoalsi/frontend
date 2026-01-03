import { Box, Typography, CircularProgress } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';

const VideoDropzone = ({ onVideoUpload, updating }: any) => {
  const onDrop = (acceptedFiles: any) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      onVideoUpload(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'video/*': [] },
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
        borderRadius: 1,
      }}
    >
      <input {...getInputProps()} />
      <VideoLibraryIcon sx={{ fontSize: 40, color: '#666', mb: 1 }} />
      {isDragActive ? (
        <Typography>Drop the video here...</Typography>
      ) : (
        <Typography variant='body2' color='textSecondary'>
          Drag and drop a video here, or click to select a video
          <br />
          <Typography variant='caption' color='textSecondary'>
            Max file size: 50MB
          </Typography>
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

export default VideoDropzone;
