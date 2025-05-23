import React, { useEffect, useState, useCallback } from 'react';
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

interface ProductSelection {
  selected: boolean;
  margin: string;
  originalMargin?: string;
  name: string;
  isModified: boolean;
}

interface AddSpecialMarginDialogProps {
  open: boolean;
  onClose: () => void;
  customer: any;
  onMarginsUpdated?: () => void;
  existingSpecialMargins?: SpecialMargin[];
}

// Utility functions for margin handling
const normalizeMargin = (margin: string): string => {
  if (!margin) return '';
  const numeric = margin.replace('%', '').trim();
  return numeric ? `${numeric}%` : '';
};

const getMarginNumeric = (margin: string): string => {
  return margin.replace('%', '').trim();
};

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

  // Single source of truth for all selections
  const [selections, setSelections] = useState<
    Record<string, ProductSelection>
  >({});

  // Bulk selection state
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkMargin, setBulkMargin] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [saving, setSaving] = useState(false);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      // Initialize selections from existing margins
      const initialSelections: Record<string, ProductSelection> = {};
      existingSpecialMargins.forEach((item) => {
        const normalizedMargin = normalizeMargin(item.margin);
        initialSelections[item.product_id] = {
          selected: true,
          margin: normalizedMargin,
          originalMargin: normalizedMargin,
          name: item.name,
          isModified: false,
        };
      });
      setSelections(initialSelections);
      setIsBulkMode(false);
      setBulkMargin('');
      setDialogPage(0);
    } else {
      // Reset state when closing
      setSelections({});
      setSelectedBrand('');
      setDialogSearchQuery('');
      setIsBulkMode(false);
      setBulkMargin('');
    }
  }, [open, existingSpecialMargins]);

  // Fetch brands when dialog opens
  useEffect(() => {
    if (open) {
      fetchBrands();
    }
  }, [open]);

  const fetchBrands = async () => {
    try {
      const response = await axiosInstance.get(`/admin/brands`);
      setBrands(response.data.brands || []);
    } catch (error) {
      toast.error('Error fetching brands');
    }
  };

  // Fetch products with proper dependency management
  const fetchDialogProducts = useCallback(async () => {
    if (!open) return;

    setDialogLoading(true);
    try {
      const response = await axiosInstance.get(
        `/admin/products?search=${dialogSearchQuery}&page=${dialogPage}&limit=${dialogRowsPerPage}&brand=${selectedBrand}&status=active`
      );
      const { products, total_count } = response.data;
      setTotalCount(total_count);
      setDialogProducts(products);
    } catch (error) {
      toast.error('Error fetching products');
    } finally {
      setDialogLoading(false);
    }
  }, [open, dialogPage, dialogRowsPerPage, dialogSearchQuery, selectedBrand]);

  useEffect(() => {
    fetchDialogProducts();
  }, [fetchDialogProducts]);

  // Get display data for a product
  const getProductDisplayData = (product: any) => {
    const selection = selections[product._id];

    if (isBulkMode) {
      return {
        selected: true,
        margin: normalizeMargin(bulkMargin),
      };
    }

    return {
      selected: selection?.selected || false,
      margin: selection?.margin || '',
    };
  };

  // Handle bulk mode toggle
  const handleBulkModeToggle = (enabled: boolean) => {
    setIsBulkMode(enabled);
    if (!enabled) {
      setBulkMargin('');
    }
  };

  // Handle individual product selection
  const handleProductSelection = (
    productId: string,
    selected: boolean,
    productName: string
  ) => {
    setSelections((prev) => {
      const current = prev[productId] || {
        selected: false,
        margin: '',
        name: productName,
        isModified: false,
      };

      const updated = {
        ...current,
        selected,
        name: productName,
        isModified: true,
      };

      // If deselecting, turn off bulk mode
      if (!selected && isBulkMode) {
        setIsBulkMode(false);
        setBulkMargin('');
      }

      return {
        ...prev,
        [productId]: updated,
      };
    });
  };

  // Handle margin change for individual product
  const handleMarginChange = (
    productId: string,
    value: string,
    productName: string
  ) => {
    const normalizedMargin = normalizeMargin(value);

    setSelections((prev) => {
      const current = prev[productId] || {
        selected: false,
        margin: '',
        name: productName,
        isModified: false,
      };

      return {
        ...prev,
        [productId]: {
          ...current,
          selected: true,
          margin: normalizedMargin,
          name: productName,
          isModified: true,
        },
      };
    });

    // Turn off bulk mode when individual margin is changed
    if (isBulkMode) {
      setIsBulkMode(false);
      setBulkMargin('');
    }
  };

  // Clear selection for a product
  const handleClearProduct = (productId: string) => {
    setSelections((prev) => {
      const newSelections = { ...prev };
      delete newSelections[productId];
      return newSelections;
    });
  };

  // Save margins to backend
  const handleSave = async () => {
    if (!customer?._id) return;

    setSaving(true);
    try {
      if (isBulkMode && selectedBrand && bulkMargin.trim()) {
        // Handle bulk brand update
        const normalizedMargin = normalizeMargin(bulkMargin);
        await axiosInstance.post(
          `/admin/customer/special_margins/brand/${customer._id}`,
          {
            brand: selectedBrand,
            margin: normalizedMargin,
          }
        );
        toast.success(
          `Special margins updated for all ${selectedBrand} products.`
        );
      } else {
        // Handle individual product updates
        const itemsToUpdate = Object.entries(selections)
          .filter(([_, selection]) => {
            return (
              selection.selected &&
              selection.isModified &&
              selection.margin &&
              selection.margin !== selection.originalMargin
            );
          })
          .map(([productId, selection]) => ({
            product_id: productId,
            name: selection.name,
            margin: selection.margin,
          }));

        if (itemsToUpdate.length === 0) {
          toast.info('No changes to save.');
          setSaving(false);
          return;
        }

        // Use appropriate endpoint based on number of items
        if (itemsToUpdate.length === 1) {
          const item = itemsToUpdate[0];
          await axiosInstance.put(
            `/admin/customer/special_margins/${customer._id}/product/${item.product_id}`,
            {
              margin: item.margin,
              name: item.name,
            }
          );
        } else {
          // Process in chunks to avoid overwhelming the server
          const chunkSize = 100;
          const chunks = [];
          for (let i = 0; i < itemsToUpdate.length; i += chunkSize) {
            chunks.push(itemsToUpdate.slice(i, i + chunkSize));
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

        toast.success(`Updated ${itemsToUpdate.length} special margin(s).`);
      }

      // Reset and close
      onClose();
      if (onMarginsUpdated) {
        onMarginsUpdated();
      }
    } catch (error) {
      console.error('Save error:', error);
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
              p: 2,
              border: '1px solid #e0e0e0',
              borderRadius: 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Checkbox
                checked={isBulkMode}
                onChange={(e) => handleBulkModeToggle(e.target.checked)}
              />
              <Typography>
                Apply same margin to all {selectedBrand} products
              </Typography>
            </Box>
            <TextField
              label='Margin for all products'
              placeholder='Enter margin'
              variant='outlined'
              size='small'
              disabled={!isBulkMode}
              value={getMarginNumeric(bulkMargin)}
              onChange={(e) => setBulkMargin(e.target.value)}
              InputProps={{
                endAdornment: <InputAdornment position='end'>%</InputAdornment>,
              }}
              sx={{ width: 200 }}
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
                  {dialogProducts.map((product) => {
                    const displayData = getProductDisplayData(product);
                    return (
                      <TableRow key={product._id}>
                        <TableCell>
                          <Checkbox
                            checked={displayData.selected}
                            disabled={isBulkMode}
                            onChange={(e) =>
                              handleProductSelection(
                                product._id,
                                e.target.checked,
                                product.name
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <img
                            src={product.image_url || '/placeholder.png'}
                            alt={product.name}
                            style={{
                              width: '60px',
                              height: '60px',
                              borderRadius: '4px',
                              objectFit: 'cover',
                            }}
                          />
                        </TableCell>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>{product.cf_sku_code}</TableCell>
                        <TableCell>₹{product.rate}</TableCell>
                        <TableCell>
                          <TextField
                            placeholder='e.g., 40'
                            disabled={isBulkMode}
                            value={getMarginNumeric(displayData.margin)}
                            onChange={(e) =>
                              handleMarginChange(
                                product._id,
                                e.target.value,
                                product.name
                              )
                            }
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position='end'>
                                  %
                                </InputAdornment>
                              ),
                            }}
                            size='small'
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant='outlined'
                            size='small'
                            onClick={() => handleClearProduct(product._id)}
                            disabled={isBulkMode}
                          >
                            Clear
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
        <Button variant='outlined' onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant='contained' onClick={handleSave} disabled={saving}>
          {saving ? <CircularProgress size={24} /> : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddSpecialMarginDialog;
