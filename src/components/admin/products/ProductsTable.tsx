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
  Chip,
  Tooltip,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Edit as EditIcon, Collections } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { formatCurrency, formatNumber } from '../../../util/format';

type MediaItem = { src: string; type: 'image' | 'video' };

const getMedia = (product: any): MediaItem[] => {
  const images =
    product.images && product.images.length > 0
      ? product.images
      : product.image_url
      ? [product.image_url]
      : [];
  const videos =
    product.videos && Array.isArray(product.videos) ? product.videos : [];
  return [
    ...images.map((url: string) => ({ src: url, type: 'image' as const })),
    ...videos.map((url: string) => ({ src: url, type: 'video' as const })),
  ];
};

const THUMB = 72;

/**
 * Fixed-size thumbnail. No inline carousel — clicking opens the existing
 * lightbox with every image/video for the product, so the arrows can't
 * cover the (small) table image any more.
 */
const ProductThumb = ({
  product,
  handleImageClick,
  size = THUMB,
}: {
  product: any;
  handleImageClick: any;
  size?: number;
}) => {
  const media = getMedia(product);
  const first = media[0];

  return (
    <Box
      onClick={() => media.length > 0 && handleImageClick(media, 0)}
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        position: 'relative',
        borderRadius: 1.5,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: media.length > 0 ? 'pointer' : 'default',
      }}
    >
      {first ? (
        first.type === 'image' ? (
          <Box
            component='img'
            src={first.src}
            alt={product.name}
            loading='lazy'
            decoding='async'
            draggable={false}
            sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        ) : (
          <Box
            component='video'
            src={first.src}
            preload='metadata'
            sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        )
      ) : (
        <Typography variant='caption' color='text.disabled'>
          No image
        </Typography>
      )}

      {media.length > 1 && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 2,
            right: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 0.25,
            backgroundColor: 'rgba(0,0,0,0.65)',
            color: 'white',
            borderRadius: 0.75,
            px: 0.5,
            fontSize: '0.65rem',
            lineHeight: 1.6,
          }}
        >
          <Collections sx={{ fontSize: 11 }} />
          {media.length}
        </Box>
      )}
    </Box>
  );
};

const TaxonomyLine = ({ product }: { product: any }) => {
  const parts = [product.category, product.sub_category, product.series].filter(
    Boolean
  );
  if (parts.length === 0) return null;
  return (
    <Typography
      variant='caption'
      color='text.secondary'
      sx={{
        display: 'block',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {parts.join(' › ')}
    </Typography>
  );
};

const CodesLine = ({ product }: { product: any }) => (
  <Typography
    variant='caption'
    color='text.secondary'
    sx={{
      display: 'block',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    }}
  >
    {product.cf_sku_code ? `SKU ${product.cf_sku_code}` : 'No SKU'}
    {product.upc_code ? ` · UPC ${product.upc_code}` : ''}
  </Typography>
);

const StockText = ({ product }: { product: any }) => {
  const stock = Number(product.stock ?? 0);
  return (
    <Typography
      variant='body2'
      sx={{ fontWeight: 600 }}
      color={stock > 0 ? 'success.main' : 'error.main'}
    >
      {formatNumber(stock)}
    </Typography>
  );
};

const PreOrderCell = ({ product, handleTogglePreOrder }: any) => (
  <Box>
    <Switch
      checked={!!product.pre_order}
      onChange={() => handleTogglePreOrder(product)}
      color='warning'
      size='small'
    />
    {product.pre_order && (
      <Typography
        variant='caption'
        display='block'
        color={product.upcoming_stock > 0 ? 'warning.main' : 'text.disabled'}
      >
        {product.upcoming_stock > 0
          ? `Upcoming: ${formatNumber(product.upcoming_stock)}`
          : 'No PO found'}
      </Typography>
    )}
  </Box>
);

const SpecialOffersCell = ({
  product,
  handleToggleClearance,
  handleUpdateClearanceMargin,
}: any) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: 0.5,
    }}
  >
    <Switch
      checked={!!product.clearance}
      onChange={() => handleToggleClearance(product)}
      color='error'
      size='small'
    />
    {product.clearance && (
      <TextField
        key={`${product._id}-${product.clearance_margin ?? 0}`}
        type='number'
        size='small'
        label='Add. margin %'
        defaultValue={product.clearance_margin ?? 0}
        onBlur={(e) => {
          const val = Math.max(0, Math.min(100, Number(e.target.value) || 0));
          if (val !== (product.clearance_margin ?? 0)) {
            handleUpdateClearanceMargin(product, val);
          }
        }}
        inputProps={{ min: 0, max: 100 }}
        sx={{ width: 108 }}
      />
    )}
  </Box>
);

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
  handleTogglePreOrder,
  handleToggleClearance,
  handleUpdateClearanceMargin,
}: any) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (loading) {
    return (
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
    );
  }

  const pagination = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { xs: 'stretch', md: 'flex-end' },
        justifyContent: 'space-between',
        gap: 1,
        mt: 2,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <TablePagination
          rowsPerPageOptions={[25, 50, 100, 200]}
          component='div'
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
  );

  // ---------- Mobile: cards instead of a horizontally scrolling table ----------
  if (isMobile) {
    return (
      <>
        {products.length === 0 ? (
          <Typography align='center' color='text.secondary' sx={{ py: 4 }}>
            No products found.
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {products.map((product: any, index: number) => (
              <Paper
                key={product._id}
                variant='outlined'
                sx={{ p: 1.5, borderRadius: 2 }}
              >
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <ProductThumb
                    product={product}
                    handleImageClick={handleImageClick}
                    size={84}
                  />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                      variant='subtitle2'
                      sx={{ fontWeight: 600, lineHeight: 1.3 }}
                    >
                      {product.name}
                    </Typography>
                    <TaxonomyLine product={product} />
                    <CodesLine product={product} />
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mt: 0.5,
                      }}
                    >
                      <Typography variant='body2' sx={{ fontWeight: 700 }}>
                        {formatCurrency(product.rate, 2)}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        Stock:
                      </Typography>
                      <StockText product={product} />
                      <Chip
                        size='small'
                        label={
                          product.status === 'active' ? 'Active' : 'Inactive'
                        }
                        color={
                          product.status === 'active' ? 'success' : 'default'
                        }
                        variant='outlined'
                      />
                    </Box>
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 1,
                    mt: 1.5,
                    pt: 1.5,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Box>
                    <Typography variant='caption' color='text.secondary'>
                      Active
                    </Typography>
                    <Box>
                      <Switch
                        checked={product.status === 'active'}
                        onChange={() => handleToggleActive(product)}
                        size='small'
                      />
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant='caption' color='text.secondary'>
                      Pre Order
                    </Typography>
                    <PreOrderCell
                      product={product}
                      handleTogglePreOrder={handleTogglePreOrder}
                    />
                  </Box>
                  <Box>
                    <Typography variant='caption' color='text.secondary'>
                      Special Offers
                    </Typography>
                    <SpecialOffersCell
                      product={product}
                      handleToggleClearance={handleToggleClearance}
                      handleUpdateClearanceMargin={handleUpdateClearanceMargin}
                    />
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mt: 1,
                  }}
                >
                  <Typography variant='caption' color='text.secondary'>
                    {filterSortBy === 'catalogue'
                      ? `Order: ${product.catalogue_order}`
                      : `#${index + 1}`}
                  </Typography>
                  <Button
                    variant='contained'
                    size='small'
                    startIcon={<EditIcon fontSize='small' />}
                    onClick={() => handleOpenEditModal(product)}
                  >
                    Edit
                  </Button>
                </Box>
              </Paper>
            ))}
          </Box>
        )}
        {pagination}
      </>
    );
  }

  // ---------- Desktop: fixed-layout table, vertical scroll only ----------
  return (
    <>
      <TableContainer
        component={Paper}
        sx={{
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          width: '100%',
          // No inner scroll container — the page is the only scroller.
          // `tableLayout: fixed` + width 100% makes x-overflow impossible,
          // and `overflow: visible` keeps the sticky header pinned to the
          // viewport (below the AdminLayout AppBar) as the page scrolls.
          overflow: 'visible',
        }}
      >
        <Table
          stickyHeader
          size='small'
          sx={{
            tableLayout: 'fixed',
            '& thead th': {
              top: { xs: 56, sm: 64 },
            },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 56 }}>
                {filterSortBy === 'catalogue' ? 'Order' : '#'}
              </TableCell>
              <TableCell>Product</TableCell>
              <TableCell sx={{ width: 100 }} align='right'>
                Price
              </TableCell>
              <TableCell sx={{ width: 80 }} align='right'>
                Stock
              </TableCell>
              <TableCell sx={{ width: 90 }} align='center'>
                Active
              </TableCell>
              <TableCell sx={{ width: 120 }} align='center'>
                Pre Order
              </TableCell>
              <TableCell sx={{ width: 150 }}>Special Offers</TableCell>
              <TableCell sx={{ width: 72 }} align='center'>
                Edit
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align='center'>
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product: any, index: number) => (
                <TableRow key={product._id} hover>
                  <TableCell>
                    {filterSortBy === 'catalogue'
                      ? product.catalogue_order
                      : `${index + 1}`}
                  </TableCell>

                  <TableCell>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        minWidth: 0,
                      }}
                    >
                      <ProductThumb
                        product={product}
                        handleImageClick={handleImageClick}
                      />
                      <Box sx={{ minWidth: 0 }}>
                        <Tooltip title={product.name || ''} placement='top-start'>
                          <Typography
                            variant='body2'
                            sx={{
                              fontWeight: 600,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {product.name}
                          </Typography>
                        </Tooltip>
                        <TaxonomyLine product={product} />
                        <CodesLine product={product} />
                      </Box>
                    </Box>
                  </TableCell>

                  <TableCell align='right'>
                    <Typography variant='body2' sx={{ fontWeight: 600 }}>
                      {formatCurrency(product.rate, 2)}
                    </Typography>
                  </TableCell>

                  <TableCell align='right'>
                    <StockText product={product} />
                  </TableCell>

                  <TableCell align='center'>
                    <Switch
                      checked={product.status === 'active'}
                      onChange={() => handleToggleActive(product)}
                      size='small'
                    />
                  </TableCell>

                  <TableCell align='center'>
                    <PreOrderCell
                      product={product}
                      handleTogglePreOrder={handleTogglePreOrder}
                    />
                  </TableCell>

                  <TableCell>
                    <SpecialOffersCell
                      product={product}
                      handleToggleClearance={handleToggleClearance}
                      handleUpdateClearanceMargin={handleUpdateClearanceMargin}
                    />
                  </TableCell>

                  <TableCell align='center'>
                    <Tooltip title='Edit product'>
                      <IconButton
                        color='primary'
                        size='small'
                        onClick={() => handleOpenEditModal(product)}
                      >
                        <EditIcon fontSize='small' />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {pagination}
    </>
  );
};

export default ProductTable;
