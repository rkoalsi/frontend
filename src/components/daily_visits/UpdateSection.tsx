import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

interface UpdateSectionProps {
  updates: any[];
  onAddUpdate: () => void;
  onEditUpdate: (update: any) => void;
  onDeleteUpdate: (update: any) => void;
  onClickImage: any;
}

const UpdateSection = ({
  updates,
  onAddUpdate,
  onEditUpdate,
  onDeleteUpdate,
  onClickImage,
}: UpdateSectionProps) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
          pb: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant='h6'>Updates & Information</Typography>
        <Button
          variant='contained'
          color='primary'
          startIcon={<AddIcon />}
          onClick={onAddUpdate}
          size='small'
        >
          Add Update
        </Button>
      </Box>
      {updates && updates.length > 0 ? (
        updates.map((upd: any, index: number) => (
          <Paper
            key={upd._id}
            sx={{
              p: 2,
              mb: 2,
              borderLeft: '4px solid',
              borderColor: 'secondary.main',
            }}
            elevation={2}
          >
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
            >
              <Typography variant='subtitle1' sx={{ fontWeight: 'medium' }}>
                Shop {index + 1} Update:
                {upd.created_at && (
                  <Typography
                    component='span'
                    variant='body2'
                    color='text.secondary'
                    sx={{ ml: 1 }}
                  >
                    ({new Date(upd.created_at).toLocaleString()})
                  </Typography>
                )}
              </Typography>
              <Box>
                <Tooltip title='Edit Update'>
                  <IconButton
                    onClick={() => onEditUpdate(upd)}
                    size='small'
                    color='primary'
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title='Delete Update'>
                  <IconButton
                    onClick={() => onDeleteUpdate(upd._id)}
                    size='small'
                    color='error'
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            {console.log(upd)}
            {/* Display customer information if available */}
            {upd.potential_customer ? (
              <Typography variant='subtitle2' sx={{ mb: 1 }}>
                Customer: {upd.potential_customer_name}
              </Typography>
            ) : (
              <Typography variant='subtitle2' sx={{ mb: 1 }}>
                Customer: {upd.customer_name}
              </Typography>
            )}
            <Typography variant='body1' sx={{ mb: 2, whiteSpace: 'pre-line' }}>
              {upd.text}
            </Typography>
            {upd.images && upd.images.length > 0 && (
              <Grid container spacing={2}>
                {upd.images.map((img: any, idx: number) => (
                  <Grid item xs={6} sm={4} md={3} key={idx}>
                    <Box
                      onClick={() => onClickImage(img.url)}
                      sx={{
                        position: 'relative',
                        paddingTop: '75%',
                        overflow: 'hidden',
                        borderRadius: 1,
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                        '&:hover': { transform: 'scale(1.05)' },
                      }}
                    >
                      <Box
                        component='img'
                        src={img.url}
                        alt={`Update Image ${idx + 1}`}
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        ))
      ) : (
        <Alert severity='info'>
          No updates yet. Click the "Add Update" button to add information about
          the shops above.
        </Alert>
      )}
    </Box>
  );
};

export default UpdateSection;
