'use client';
import { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  CircularProgress,
  Chip,
  TablePagination,
  Tooltip,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Inventory2 } from '@mui/icons-material';
import { toast } from 'react-toastify';
import axiosInstance from '../../src/util/axios';

const money = (v: any) =>
  `₹${Number(v || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// Mirrors the admin products table's thumbnail treatment so the two views read
// the same, without pulling in ProductsTable itself — that component is wired
// to the edit modal and the active/pre-order/clearance toggles, none of which a
// distributor may touch.
const ProductThumb = ({ product }: any) => {
  const src =
    product.image_url ||
    (Array.isArray(product.images) && product.images.length
      ? typeof product.images[0] === 'string'
        ? product.images[0]
        : product.images[0]?.url
      : '');
  return (
    <Avatar
      variant='rounded'
      src={src || undefined}
      alt=''
      sx={{ width: 44, height: 44, bgcolor: 'action.hover', flexShrink: 0 }}
    >
      <Inventory2 fontSize='small' color='disabled' />
    </Avatar>
  );
};

const StockText = ({ stock }: { stock: any }) => {
  const n = Number(stock ?? 0);
  const isOut = !Number.isFinite(n) || n <= 0;
  return (
    <Typography
      variant='body2'
      sx={{ fontWeight: 600, color: isOut ? 'error.main' : 'text.primary' }}
    >
      {stock ?? '—'}
    </Typography>
  );
};

const DistributorProducts = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [stock, setStock] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/distributor_portal/products', {
        params: {
          page,
          limit: rowsPerPage,
          search: search || undefined,
          status: status || undefined,
          stock: stock || undefined,
        },
      });
      setRows(res.data.products || []);
      setTotalCount(res.data.total_count || 0);
    } catch {
      toast.error('Could not load your products.');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, status, stock]);

  useEffect(() => {
    // Debounced so typing in the search box doesn't fire a request per keystroke.
    const t = setTimeout(fetchProducts, 300);
    return () => clearTimeout(t);
  }, [fetchProducts]);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Paper
        elevation={0}
        sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}
      >
        <Typography variant='h5' sx={{ fontWeight: 700 }}>
          My Products
        </Typography>
        <Typography variant='body1' color='text.secondary' sx={{ mb: 3 }}>
          Your catalogue as we currently hold it. To add or change a product, contact your
          Pupscribe account manager.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <TextField
            label='Search by Name or SKU'
            variant='outlined'
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            sx={{ flex: '1 1 280px' }}
          />
          <FormControl sx={{ minWidth: 160 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={status}
              label='Status'
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value=''>All</MenuItem>
              <MenuItem value='active'>Active</MenuItem>
              <MenuItem value='inactive'>Inactive</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 160 }}>
            <InputLabel>Stock</InputLabel>
            <Select
              value={stock}
              label='Stock'
              onChange={(e) => {
                setStock(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value=''>All</MenuItem>
              <MenuItem value='gt_zero'>In stock</MenuItem>
              <MenuItem value='zero'>Out of stock</MenuItem>
            </Select>
          </FormControl>
          {(search || status || stock) && (
            <Button
              onClick={() => {
                setSearch('');
                setStatus('');
                setStock('');
                setPage(0);
              }}
            >
              Clear
            </Button>
          )}
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : rows.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography color='text.secondary'>No products found.</Typography>
          </Box>
        ) : isMobile ? (
          // Tables don't survive a phone viewport — cards below md.
          <Box sx={{ display: 'grid', gap: 1.5 }}>
            {rows.map((p) => (
              <Paper
                key={p._id}
                elevation={0}
                sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
              >
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                  <ProductThumb product={p} />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
                      {p.name}
                    </Typography>
                    <Typography variant='caption' color='text.secondary' display='block'>
                      {[p.category, p.sub_category].filter(Boolean).join(' › ') || '—'}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      SKU {p.cf_sku_code || '—'} · HSN {p.hsn_or_sac || '—'}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 3, mt: 1.5, alignItems: 'center' }}>
                  <Box>
                    <Typography variant='caption' color='text.secondary'>Price</Typography>
                    <Typography variant='body2' sx={{ fontWeight: 600 }}>{money(p.rate)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant='caption' color='text.secondary'>Stock</Typography>
                    <StockText stock={p.stock} />
                  </Box>
                  <Chip
                    label={p.status === 'active' ? 'Active' : 'Inactive'}
                    size='small'
                    color={p.status === 'active' ? 'success' : 'default'}
                    sx={{ ml: 'auto' }}
                  />
                </Box>
              </Paper>
            ))}
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 56 }}>#</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell sx={{ width: 100 }} align='right'>Price</TableCell>
                  <TableCell sx={{ width: 80 }} align='right'>Stock</TableCell>
                  <TableCell sx={{ width: 110 }} align='center'>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((p, index) => (
                  <TableRow key={p._id} hover>
                    <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                        <ProductThumb product={p} />
                        <Box sx={{ minWidth: 0 }}>
                          <Tooltip title={p.name || ''} placement='top-start'>
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
                              {p.name}
                            </Typography>
                          </Tooltip>
                          <Typography variant='caption' color='text.secondary' display='block'>
                            {[p.category, p.sub_category].filter(Boolean).join(' › ') || '—'}
                          </Typography>
                          <Typography variant='caption' color='text.secondary'>
                            SKU {p.cf_sku_code || '—'} · HSN {p.hsn_or_sac || '—'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align='right'>
                      <Typography variant='body2' sx={{ fontWeight: 600 }}>
                        {money(p.rate)}
                      </Typography>
                    </TableCell>
                    <TableCell align='right'>
                      <StockText stock={p.stock} />
                    </TableCell>
                    <TableCell align='center'>
                      <Chip
                        label={p.status === 'active' ? 'Active' : 'Inactive'}
                        size='small'
                        color={p.status === 'active' ? 'success' : 'default'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {!loading && rows.length > 0 && (
          <TablePagination
            component='div'
            count={totalCount}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 20, 50, 100]}
          />
        )}
      </Paper>
    </Box>
  );
};

export default DistributorProducts;
