import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Checkbox,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  TablePagination,
  Typography,
  InputAdornment,
} from '@mui/material';
import { toast } from 'react-toastify';
import axiosInstance from '../../../util/axios';

interface SpecialMargin {
  product_id: string;
  margin: string;
  name: string;
}

interface AddSpecialMarginDialogProps {
  open: boolean;
  onClose: () => void;
  customer: any;
  onMarginsUpdated?: () => void;
  existingSpecialMargins?: SpecialMargin[];
}

const AddSpecialMarginDialog: React.FC<AddSpecialMarginDialogProps> = ({
  open,
  onClose,
  customer,
  onMarginsUpdated,
  existingSpecialMargins = [],
}) => {
  const [brands, setBrands] = useState<string[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [dialogProducts, setDialogProducts] = useState<any[]>([]);
  const [dialogLoading, setDialogLoading] = useState(true);
  const [dialogPage, setDialogPage] = useState(0);
  const [dialogRowsPerPage, setDialogRowsPerPage] = useState(25);
  const [dialogSearchQuery, setDialogSearchQuery] = useState('');
  // globalSelections stores per-product selection, current margin, original margin, and name.
  const [globalSelections, setGlobalSelections] = useState<Record<string, any>>(
    {}
  );
  // allSelected means “all products matching this query” are selected (across pages)
  const [allSelected, setAllSelected] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  // Global margin value used for brand-level updates.
  // This state will store just the numeric portion (e.g. "40") without the "%" sign.
  const [globalMargin, setGlobalMargin] = useState('');
  const [saving, setSaving] = useState(false);

  // When dialog opens, prefill globalSelections from existing special margins.
  useEffect(() => {
    if (open && existingSpecialMargins.length > 0) {
      const prefill: Record<string, any> = {};
      existingSpecialMargins.forEach((item) => {
        prefill[item.product_id] = {
          selected: true,
          margin: item.margin, // assumes margin is stored as a string with "%" already
          originalMargin: item.margin,
          name: item.name,
        };
      });
      setGlobalSelections(prefill);
    }
  }, [open, existingSpecialMargins]);

  // Fetch brands when dialog opens.
  useEffect(() => {
    if (open) {
      (async () => {
        try {
          const response = await axiosInstance.get(`/admin/brands`);
          setBrands(response.data.brands || []);
        } catch (error) {
          toast.error('Error fetching brands');
        }
      })();
    }
  }, [open]);

  // Fetch paginated products for the dialog.
  // Note: We removed globalMargin from dependencies so that typing in it doesn't re-fetch products.
  const fetchDialogProducts = async (brand?: string) => {
    setDialogLoading(true);
    try {
      const effectiveBrand = brand || selectedBrand;
      const response = await axiosInstance.get(
        `/admin/products?search=${dialogSearchQuery}&page=${dialogPage}&limit=${dialogRowsPerPage}&brand=${effectiveBrand}&status=active`
      );
      const { products, total_count } = response.data;
      setTotalCount(total_count);
      // Merge products with selection info from globalSelections.
      const mapped = products.map((p: any) => ({
        ...p,
        selected: allSelected || globalSelections[p._id]?.selected || false,
        customMargin: allSelected
          ? `${globalMargin}%`
          : globalSelections[p._id]?.margin || '',
      }));
      setDialogProducts(mapped);
    } catch (error) {
      toast.error('Error fetching products');
    } finally {
      setDialogLoading(false);
    }
  };

  // Re-fetch products on dependency changes.
  useEffect(() => {
    if (open) {
      fetchDialogProducts();
    }
  }, [
    open,
    dialogPage,
    dialogRowsPerPage,
    dialogSearchQuery,
    selectedBrand,
    allSelected,
    // globalMargin removed from dependency array to avoid re-fetch on every key stroke
  ]);

  // When the user toggles "Select All", update the global flag.
  const handleSelectAll = (isChecked: boolean) => {
    setAllSelected(isChecked);
    const updated = { ...globalSelections };
    dialogProducts.forEach((p) => {
      updated[p._id] = {
        ...updated[p._id],
        selected: isChecked,
        name: updated[p._id]?.name || p.name,
        margin: isChecked ? `${globalMargin}%` : updated[p._id]?.margin || '',
      };
    });
    setGlobalSelections(updated);
  };

  // Handler for individual product selection.
  const handleSelectProduct = (prodId: string, newSelected: boolean) => {
    if (allSelected && !newSelected) {
      setAllSelected(false);
    }
    setGlobalSelections((prev) => ({
      ...prev,
      [prodId]: {
        ...prev[prodId],
        selected: newSelected,
      },
    }));
    setDialogProducts((prev) =>
      prev.map((p) => (p._id === prodId ? { ...p, selected: newSelected } : p))
    );
  };

  // Handler for margin change on an individual product.
  const handleMarginChange = (prodId: string, value: string) => {
    // Remove any "%" that the user may type and then append it.
    const numericValue = value.replace('%', '').trim();
    const marginWithPercent = numericValue + '%';
    setAllSelected(false);
    setGlobalSelections((prev) => ({
      ...prev,
      [prodId]: {
        ...prev[prodId],
        selected: true,
        margin: marginWithPercent,
        name: prev[prodId]?.name || '',
        originalMargin: prev[prodId]?.originalMargin || marginWithPercent,
      },
    }));
    setDialogProducts((prev) =>
      prev.map((p) =>
        p._id === prodId ? { ...p, customMargin: marginWithPercent } : p
      )
    );
  };

  // Bulk save margins to backend.
  const handleBulkSaveMargins = async () => {
    if (!customer?._id) return;
    setSaving(true);
    try {
      if (allSelected && selectedBrand && globalMargin.trim() !== '') {
        const marginWithPercent = `${globalMargin.trim()}%`;
        await axiosInstance.post(
          `/admin/customer/special_margins/brand/${customer._id}`,
          {
            brand: selectedBrand,
            margin: marginWithPercent,
          }
        );
      } else {
        const selectedItems = Object.entries(globalSelections)
          .filter(
            ([, value]) =>
              value.selected &&
              (!value.originalMargin || value.margin !== value.originalMargin)
          )
          .map(([key, value]) => ({
            product_id: key,
            name: value.name,
            margin: value.margin,
          }));

        if (selectedItems.length === 0) {
          toast.info('No changes to update.');
          setSaving(false);
          return;
        }

        if (selectedItems.length === 1) {
          const item = selectedItems[0];
          await axiosInstance.put(
            `/admin/customer/special_margins/${customer._id}/product/${item.product_id}`,
            {
              margin: item.margin,
              name: item.name,
            }
          );
        } else {
          const chunkSize = 100;
          const chunks = [];
          for (let i = 0; i < selectedItems.length; i += chunkSize) {
            chunks.push(selectedItems.slice(i, i + chunkSize));
          }
          await Promise.all(
            chunks.map((chunk) =>
              axiosInstance.post(
                `/admin/customer/special_margins/bulk/${customer._id}`,
                chunk
              )
            )
          );
        }
      }
      toast.success('Special margins updated successfully.');
      setSelectedBrand('');
      setGlobalSelections({});
      setAllSelected(false);
      setGlobalMargin('');
      onClose();
      if (onMarginsUpdated) onMarginsUpdated();
    } catch (error) {
      toast.error('Failed to update special margins.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='lg'>
      <DialogTitle>Add Special Margin to Products</DialogTitle>
      <DialogContent>
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Filter by Brand</InputLabel>
          <Select
            value={selectedBrand}
            onChange={(e) => {
              setSelectedBrand(e.target.value as string);
              setDialogPage(0);
              fetchDialogProducts(e.target.value as string);
            }}
          >
            <MenuItem value=''>All Brands</MenuItem>
            {brands.map((brand) => (
              <MenuItem key={brand} value={brand}>
                {brand}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label='Search by Name or SKU'
          variant='outlined'
          fullWidth
          value={dialogSearchQuery}
          onChange={(e) => setDialogSearchQuery(e.target.value)}
          sx={{ mb: 3 }}
        />
        {selectedBrand && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Checkbox
                checked={allSelected}
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
              <Typography>Select All (across pages)</Typography>
            </Box>
            <TextField
              label='Global Margin'
              placeholder='Enter margin'
              variant='outlined'
              size='small'
              disabled={!allSelected}
              value={globalMargin}
              onChange={(e) =>
                // Store only numeric value (remove % if present)
                setGlobalMargin(e.target.value.replace('%', ''))
              }
              InputProps={{
                endAdornment: <InputAdornment position='end'>%</InputAdornment>,
              }}
            />
          </Box>
        )}
        {dialogLoading ? (
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
            <TableContainer component={Paper} sx={{ borderRadius: '8px' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Select</TableCell>
                    <TableCell>Image</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>SKU</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Custom Margin</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dialogProducts.map((prod) => (
                    <TableRow key={prod._id}>
                      <TableCell>
                        <Checkbox
                          checked={
                            prod.selected ||
                            !!globalSelections[prod._id]?.margin
                          }
                          onChange={() =>
                            handleSelectProduct(prod._id, !prod.selected)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <img
                          src={prod.image_url || '/placeholder.png'}
                          alt={prod.name}
                          style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '4px',
                            objectFit: 'cover',
                          }}
                        />
                      </TableCell>
                      <TableCell>{prod.name}</TableCell>
                      <TableCell>{prod.cf_sku_code}</TableCell>
                      <TableCell>₹{prod.rate}</TableCell>
                      <TableCell>
                        <TextField
                          placeholder='e.g., 40%'
                          value={
                            !allSelected
                              ? prod.customMargin ||
                                globalSelections[prod._id]?.margin
                              : `${globalMargin}%`
                          }
                          onChange={(e) =>
                            handleMarginChange(prod._id, e.target.value)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Button variant='contained' size='small'>
                          Clear
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box display='flex' justifyContent='flex-end' mt={2}>
              <TablePagination
                component='div'
                count={totalCount}
                page={dialogPage}
                onPageChange={(e, newPage) => setDialogPage(newPage)}
                rowsPerPage={dialogRowsPerPage}
                onRowsPerPageChange={(e) =>
                  setDialogRowsPerPage(parseInt(e.target.value, 10))
                }
                rowsPerPageOptions={[25, 50, 100, 200]}
              />
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          variant='contained'
          color='secondary'
          onClick={onClose}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          variant='contained'
          onClick={handleBulkSaveMargins}
          disabled={saving}
        >
          {saving ? <CircularProgress size={24} /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddSpecialMarginDialog;
