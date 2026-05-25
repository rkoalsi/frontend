import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  TablePagination,
  TextField,
  Switch,
  Button,
  Tooltip,
} from '@mui/material';
import { toast } from 'react-toastify';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const BrandTable = ({
  brands,
  loading,
  handleImageClick,
  handleOpenEditModal,
  handleToggleVisibility,
}: any) => {
  return (
    <>
      {loading ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '200px',
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box sx={{ overflowX: 'auto', width: '100%' }}>
          <TableContainer
            component={Paper}
            sx={{
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              overflowX: 'auto',
              minWidth: { xs: '800px', md: '100%' },
            }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>S. No.</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Image</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Secondary Image</TableCell>
                  <TableCell>Visible</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {brands?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} align='center'>
                      No brands found.
                    </TableCell>
                  </TableRow>
                ) : (
                  brands?.map((brand: any, index: number) => (
                    <TableRow key={brand._id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{brand.name}</TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 80,
                            height: 80,
                            borderRadius: '6px',
                            bgcolor: 'background.paper',
                            border: '1px solid rgba(0,0,0,0.1)',
                            overflow: 'hidden',
                            cursor: 'pointer',
                          }}
                          onClick={() => handleImageClick(brand.image_url || '/placeholder.png')}
                        >
                          <img
                            src={brand.image_url || '/placeholder.png'}
                            alt={brand.name}
                            style={{
                              width: '72px',
                              height: '72px',
                              objectFit: 'contain',
                            }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        {brand.description ? (
                          <Tooltip title={brand.description} placement='top'>
                            <CheckCircleIcon color='success' fontSize='small' />
                          </Tooltip>
                        ) : (
                          <CancelIcon color='disabled' fontSize='small' />
                        )}
                      </TableCell>
                      <TableCell>
                        {brand.secondary_image_url ? (
                          <Tooltip title='View secondary image' placement='top'>
                            <Box
                              sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 50,
                                height: 50,
                                borderRadius: '6px',
                                bgcolor: 'background.paper',
                                border: '1px solid rgba(0,0,0,0.1)',
                                overflow: 'hidden',
                                cursor: 'pointer',
                              }}
                              onClick={() => handleImageClick(brand.secondary_image_url)}
                            >
                              <img
                                src={brand.secondary_image_url}
                                alt={`${brand.name} secondary`}
                                style={{ width: '44px', height: '44px', objectFit: 'contain' }}
                              />
                            </Box>
                          </Tooltip>
                        ) : (
                          <CancelIcon color='disabled' fontSize='small' />
                        )}
                      </TableCell>
                      <TableCell>
                        <Tooltip title={brand.hidden ? 'Hidden from orders & catalogue' : 'Visible in orders & catalogue'}>
                          <Switch
                            checked={!brand.hidden}
                            onChange={() => handleToggleVisibility(brand)}
                            color='success'
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant='contained'
                          size='small'
                          onClick={() => handleOpenEditModal(brand)}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          </Box>
        </>
      )}
    </>
  );
};

export default BrandTable;
