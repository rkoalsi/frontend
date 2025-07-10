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
} from '@mui/material';
import { toast } from 'react-toastify';

const BrandTable = ({
  brands,
  loading,
  handleImageClick,
  handleOpenEditModal,
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
          <TableContainer
            component={Paper}
            sx={{
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              overflowX: 'auto',
            }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>S. No.</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Image</TableCell>
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
                        <img
                          onClick={() =>
                            handleImageClick(
                              brand.image_url || '/placeholder.png'
                            )
                          }
                          src={brand.image_url || '/placeholder.png'}
                          alt={brand.name}
                          style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '4px',
                            objectFit: 'cover',
                            cursor: 'pointer',
                          }}
                        />
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
        </>
      )}
    </>
  );
};

export default BrandTable;
