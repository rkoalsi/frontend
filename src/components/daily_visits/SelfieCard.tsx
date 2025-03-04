import { Box, Card, CardHeader, CardContent, Typography } from '@mui/material';

interface SelfieCardProps {
  selfieUrl: string;
  onClickImage: any;
}

const SelfieCard = ({ selfieUrl, onClickImage }: SelfieCardProps) => {
  return (
    <Box
      sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}
      onClick={onClickImage}
    >
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardHeader
          title='Visit Selfie'
          titleTypographyProps={{ variant: 'h6' }}
        />
        <CardContent sx={{ pt: 0, textAlign: 'center' }}>
          <Box
            component='img'
            src={selfieUrl}
            alt='Selfie'
            sx={{
              borderRadius: '8px',
              width: '100%',
              maxWidth: '300px',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'scale(1.02)' },
            }}
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default SelfieCard;
