'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TablePagination,
} from '@mui/material';
import { toast } from 'react-toastify';
import axiosInstance from '../../src/util/axios';
import ProductCard from '../../src/components/OrderForm/products/ProductCard';
import { getEffectiveMarginPct } from '../../src/util/margin';

// Retailers see different prices depending on the margin on their account, so
// the preview lets the brand switch margin to see what each tier looks like.
const MARGIN_OPTIONS = ['30%', '35%', '40%', '45%', '50%'];

const noop = () => {};

const DistributorPreview = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [margin, setMargin] = useState('40%');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  const [totalCount, setTotalCount] = useState(0);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/distributor_portal/products', {
        params: {
          page,
          limit: rowsPerPage,
          search: search || undefined,
          status: 'active',
        },
      });
      setRows(res.data.products || []);
      setTotalCount(res.data.total_count || 0);
    } catch {
      toast.error('Could not load the preview.');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search]);

  useEffect(() => {
    const t = setTimeout(fetchProducts, 300);
    return () => clearTimeout(t);
  }, [fetchProducts]);

  // Mirrors the order form's own pricing: rate less the effective margin,
  // including any clearance bonus on the product.
  const getSellingPrice = useCallback(
    (product: any) => {
      const rate = parseFloat(product?.rate?.toString() || '0') || 0;
      const pct = getEffectiveMarginPct(margin, product);
      return rate - rate * (pct / 100);
    },
    [margin]
  );

  // The real ProductCard is driven entirely by props, so passing empty
  // selection state and no-op handlers gives a faithful, inert copy of the
  // Products step rather than a lookalike that can drift from it.
  const inertProps = useMemo(
    () => ({
      selectedProducts: [] as any[],
      temporaryQuantities: {},
      specialMargins: {},
      customerMargin: margin,
      orderStatus: 'draft',
      getSellingPrice,
      handleImageClick: noop,
      handleQuantityChange: noop,
      handleAddOrRemove: noop,
      isShared: false,
    }),
    [margin, getSellingPrice]
  );

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Typography variant='h5' sx={{ fontWeight: 700, mb: 0.5 }}>
        Order Form Preview
      </Typography>
      <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
        How your products appear to a retailer at the Products step of the order form.
      </Typography>

      <Alert severity='info' sx={{ mb: 2.5 }}>
        This is a preview only — quantity and add-to-cart controls do nothing here.
        Prices shown are at a <b>{margin}</b> retailer margin; the actual margin depends
        on the retailer&apos;s account.
      </Alert>

      <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexWrap: 'wrap' }}>
        <TextField
          label='Search by name or SKU'
          size='small'
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          sx={{ flex: '1 1 260px' }}
        />
        <FormControl size='small' sx={{ minWidth: 190 }}>
          <InputLabel>Preview at margin</InputLabel>
          <Select
            value={margin}
            label='Preview at margin'
            onChange={(e) => setMargin(e.target.value)}
          >
            {MARGIN_OPTIONS.map((m) => (
              <MenuItem key={m} value={m}>
                {m}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : rows.length === 0 ? (
        <Paper
          elevation={0}
          sx={{ p: 6, textAlign: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
        >
          <Typography color='text.secondary'>
            No active products to preview.
          </Typography>
        </Paper>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)',
            },
            gap: 2,
            // Controls are inert; the cursor shouldn't suggest otherwise.
            '& button, & input': { pointerEvents: 'none' },
          }}
        >
          {rows.map((product, index) => (
            <ProductCard
              key={product._id}
              product={product}
              index={index}
              {...inertProps}
            />
          ))}
        </Box>
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
          rowsPerPageOptions={[12, 24, 48]}
        />
      )}
    </Box>
  );
};

export default DistributorPreview;
