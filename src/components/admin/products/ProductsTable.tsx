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
import ImageCarousel from '../../OrderForm/products/ImageCarousel';

const ProductTable = ({
  products,
  loading,
  filterSortBy,
  totalCount,
  totalPageCount,
  page,
  rowsPerPage,
  skipPage,
  setSkipPage,
  handleChangePage,
  handleChangeRowsPerPage,
  handleSkipPage,
  handleImageClick,
  handleOpenEditModal,
  handleToggleActive,
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
                  <TableCell>
                    {filterSortBy === 'catalogue' ? 'Order' : 'S. No.'}
                  </TableCell>
                  <TableCell>Image</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Sub Category</TableCell>
                  <TableCell>Series</TableCell>
                  <TableCell>SKU</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Stock</TableCell>
                  <TableCell>UPC Code</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} align='center'>
                      No products found.
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product: any, index: number) => (
                    <TableRow key={product._id}>
                      <TableCell>
                        {filterSortBy === 'catalogue'
                          ? product.catalogue_order
                          : `${index + 1}`}
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            width: '100%',
                            height: 200,
                            position: 'relative',
                            mb: 2,
                            borderRadius: 2,
                            overflow: 'hidden',
                            border: '1px solid',
                            borderColor: 'divider',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <ImageCarousel
                            handleImageClick={handleImageClick}
                            product={product}
                            small={true}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>{product.sub_category}</TableCell>
                      <TableCell>{product.series}</TableCell>
                      <TableCell>{product.cf_sku_code}</TableCell>
                      <TableCell>₹{product.rate}</TableCell>
                      <TableCell>{product.stock}</TableCell>
                      <TableCell>{product.upc_code}</TableCell>
                      <TableCell>
                        <Switch
                          checked={product.status === 'active'}
                          onChange={() => handleToggleActive(product)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant='contained'
                          size='small'
                          onClick={() => handleOpenEditModal(product)}
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

          <Box
            display='flex'
            flexDirection='row'
            alignItems='end'
            justifyContent='space-between'
            mt={2}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TablePagination
                rowsPerPageOptions={[25, 50, 100, 200]}
                component='div'
                count={totalCount}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
              <Box sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
                <TextField
                  label='Go to page'
                  type='number'
                  variant='outlined'
                  size='small'
                  sx={{ width: 100, mr: 1 }}
                  value={skipPage !== '' ? skipPage : page + 1}
                  onChange={(e) =>
                    parseInt(e.target.value) <= totalPageCount
                      ? setSkipPage(e.target.value)
                      : toast.error('Invalid Page Number')
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSkipPage();
                    }
                  }}
                />
                <Button variant='contained' onClick={handleSkipPage}>
                  Go
                </Button>
              </Box>
            </Box>
            <Typography variant='subtitle1'>
              Total Pages: {totalPageCount}
            </Typography>
          </Box>
        </>
      )}
    </>
  );
};

export default ProductTable;
