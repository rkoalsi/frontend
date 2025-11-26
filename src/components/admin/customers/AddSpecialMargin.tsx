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
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Divider,
  Card,
  CardContent,
  Skeleton,
} from '@mui/material';
import {
  Clear as ClearIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axiosInstance from '../../../util/axios';
import useDebounce from '../../../util/useDebounce';

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

const validateMargin = (margin: string): boolean => {
  const numeric = parseFloat(margin.replace('%', '').trim());
  return !isNaN(numeric) && numeric >= 0 && numeric <= 100;
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
  const debouncedSearchQuery = useDebounce(dialogSearchQuery, 500);

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
        `/admin/products?search=${debouncedSearchQuery}&page=${dialogPage}&limit=${dialogRowsPerPage}&brand=${selectedBrand}&status=active`
      );
      const { products, total_count } = response.data;
      setTotalCount(total_count);
      setDialogProducts(products);
    } catch (error) {
      toast.error('Error fetching products');
    } finally {
      setDialogLoading(false);
    }
  }, [open, dialogPage, dialogRowsPerPage, debouncedSearchQuery, selectedBrand]);

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

  // Count modified products
  const getModifiedCount = (): number => {
    if (isBulkMode && bulkMargin.trim()) {
      if (selectedBrand) {
        return totalCount; // All products of selected brand
      } else {
        return dialogProducts.length; // Products in current page view
      }
    }
    return Object.values(selections).filter(
      (selection) =>
        selection.selected &&
        selection.isModified &&
        selection.margin &&
        selection.margin !== selection.originalMargin
    ).length;
  };

  // Save margins to backend
  const handleSave = async () => {
    if (!customer?._id) return;

    // Validate bulk margin if in bulk mode
    if (isBulkMode) {
      if (!bulkMargin.trim()) {
        toast.error('Please enter a margin value for bulk update.');
        return;
      }
      if (!validateMargin(bulkMargin)) {
        toast.error('Margin must be a number between 0 and 100.');
        return;
      }
    }

    // Validate individual margins
    const invalidMargins = Object.values(selections).filter(
      (selection) =>
        selection.selected &&
        selection.margin &&
        !validateMargin(selection.margin)
    );

    if (invalidMargins.length > 0) {
      toast.error('All margins must be numbers between 0 and 100.');
      return;
    }

    setSaving(true);
    try {
      if (isBulkMode && bulkMargin.trim()) {
        const normalizedMargin = normalizeMargin(bulkMargin);

        if (selectedBrand) {
          // Handle bulk brand update via brand endpoint
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
          // Handle bulk update for all products in current view (no brand filter)
          // Get all products from the current page and create bulk update
          const itemsToUpdate = dialogProducts.map((product) => ({
            product_id: product._id,
            name: product.name,
            margin: normalizedMargin,
          }));

          if (itemsToUpdate.length === 0) {
            toast.info('No products to update.');
            setSaving(false);
            return;
          }

          // Process in chunks
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

          toast.success(
            `Special margins updated for ${itemsToUpdate.length} products in current view.`
          );
        }
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

  const modifiedCount = getModifiedCount();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth='lg'
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <Box>
            <Typography variant='h5' component='div' fontWeight='bold'>
              Manage Special Margins
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
              {customer?.contact_name || 'Customer'}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size='small'>
            <ClearIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 3 }}>
        {/* Filters Section */}
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="brand-filter-label">Filter by Brand</InputLabel>
            <Select
              id="brand-filter-label"
              labelId="brand-filter-label"
              label="Filter by Brand"
              value={selectedBrand}
              onChange={(e) => {
                setSelectedBrand(e.target.value as string);
                setDialogPage(0);
                setIsBulkMode(false);
                setBulkMargin('');
              }}
              MenuProps={{
                PaperProps: {
                  style: {
                    zIndex: 1500,
                    maxHeight: 300,
                  },
                },
                anchorOrigin: {
                  vertical: 'bottom',
                  horizontal: 'left',
                },
                transformOrigin: {
                  vertical: 'top',
                  horizontal: 'left',
                },
              }}
            >
              <MenuItem value="">All Brands</MenuItem>
              {brands && brands.length > 0 && brands.map((brand) => (
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
            onChange={(e) => {
              setDialogSearchQuery(e.target.value);
              setDialogPage(0);
            }}
            placeholder='Type to search products...'
            InputProps={{
              endAdornment: dialogSearchQuery && (
                <InputAdornment position='end'>
                  <IconButton
                    size='small'
                    onClick={() => setDialogSearchQuery('')}
                    edge='end'
                  >
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

        </Box>

        {/* Bulk Mode Card */}
        <Card
          sx={{
            mb: 3,
            mt: 3,
            border: isBulkMode ? '2px solid #1976d2' : '1px solid #e0e0e0',
            boxShadow: isBulkMode ? 3 : 1,
            transition: 'all 0.3s ease',
          }}
        >
          <CardContent>
            <Box display='flex' alignItems='center' justifyContent='space-between'>
              <Box display='flex' alignItems='center' gap={1}>
                <Checkbox
                  checked={isBulkMode}
                  onChange={(e) => handleBulkModeToggle(e.target.checked)}
                  color='primary'
                />
                <Box>
                  <Typography variant='subtitle1' fontWeight='bold'>
                    Bulk Update Mode
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {selectedBrand ? (
                      <>Apply same margin to all {selectedBrand} products ({totalCount} total)</>
                    ) : (
                      <>Apply same margin to all products in current view ({totalCount} total)</>
                    )}
                  </Typography>
                </Box>
              </Box>
              <TextField
                label='Margin for all products'
                placeholder='e.g., 45'
                variant='outlined'
                size='small'
                disabled={!isBulkMode}
                value={getMarginNumeric(bulkMargin)}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow only numbers and decimal point
                  if (/^\d*\.?\d*$/.test(value)) {
                    setBulkMargin(value);
                  }
                }}
                InputProps={{
                  endAdornment: <InputAdornment position='end'>%</InputAdornment>,
                }}
                sx={{ width: 200 }}
                error={!!(isBulkMode && bulkMargin && !validateMargin(bulkMargin))}
                helperText={
                  isBulkMode && bulkMargin && !validateMargin(bulkMargin)
                    ? 'Must be 0-100'
                    : ''
                }
              />
            </Box>
            {isBulkMode && (
              <Alert severity='info' sx={{ mt: 2 }}>
                <strong>Bulk mode is active:</strong> This will update margins for{' '}
                {selectedBrand ? (
                  <>all {totalCount} {selectedBrand} products</>
                ) : (
                  <>all {totalCount} products matching your search criteria</>
                )} in the database.
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Selection Summary */}
        {!isBulkMode && modifiedCount > 0 && (
          <Alert severity='success' sx={{ mb: 2 }} icon={<CheckCircleIcon />}>
            <strong>{modifiedCount}</strong> product{modifiedCount !== 1 ? 's' : ''}{' '}
            will be updated
          </Alert>
        )}

        {dialogLoading ? (
          <Box sx={{ mb: 2 }}>
            {[1, 2, 3, 4, 5].map((index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  gap: 2,
                  mb: 2,
                  p: 2,
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                }}
              >
                <Skeleton variant='rectangular' width={60} height={60} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant='text' width='60%' />
                  <Skeleton variant='text' width='40%' />
                </Box>
                <Skeleton variant='rectangular' width={120} height={40} />
              </Box>
            ))}
          </Box>
        ) : (
          <>
            <TableContainer
              component={Paper}
              sx={{
                borderRadius: 2,
                boxShadow: 2,
                maxHeight: '60vh',
              }}
            >
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        backgroundColor: '#f5f5f5',
                        width: '80px',
                      }}
                    >
                      Select
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        backgroundColor: '#f5f5f5',
                        width: '100px',
                      }}
                    >
                      Image
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}
                    >
                      Product Details
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        backgroundColor: '#f5f5f5',
                        width: '150px',
                      }}
                    >
                      Price
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        backgroundColor: '#f5f5f5',
                        width: '180px',
                      }}
                    >
                      Custom Margin
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        backgroundColor: '#f5f5f5',
                        width: '100px',
                      }}
                    >
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dialogProducts.map((product) => {
                    const displayData = getProductDisplayData(product);
                    const hasExistingMargin =
                      selections[product._id]?.originalMargin;
                    const isModified =
                      selections[product._id]?.isModified &&
                      displayData.margin !== selections[product._id]?.originalMargin;

                    return (
                      <TableRow
                        key={product._id}
                        sx={{
                          '&:hover': {
                            backgroundColor: '#f9f9f9',
                          },
                          backgroundColor: displayData.selected
                            ? '#f0f7ff'
                            : 'inherit',
                        }}
                      >
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
                            color='primary'
                          />
                        </TableCell>
                        <TableCell>
                          <Box
                            component='img'
                            src={product.image_url || '/placeholder.png'}
                            alt={product.name}
                            sx={{
                              width: 70,
                              height: 70,
                              borderRadius: 1,
                              objectFit: 'cover',
                              border: '1px solid #e0e0e0',
                            }}
                            onError={(e: any) => {
                              e.target.src = '/placeholder.png';
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant='body1' fontWeight='medium'>
                              {product.name}
                            </Typography>
                            <Typography variant='body2' color='text.secondary'>
                              SKU: {product.cf_sku_code}
                            </Typography>
                            {hasExistingMargin && (
                              <Chip
                                label={`Current: ${selections[product._id]?.originalMargin}`}
                                size='small'
                                color='primary'
                                variant='outlined'
                                sx={{ mt: 0.5 }}
                              />
                            )}
                            {isModified && (
                              <Chip
                                label='Modified'
                                size='small'
                                color='warning'
                                sx={{ mt: 0.5, ml: 0.5 }}
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant='body1' fontWeight='medium'>
                            ₹{product.rate}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <TextField
                            placeholder='e.g., 40'
                            disabled={isBulkMode}
                            value={getMarginNumeric(displayData.margin)}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (/^\d*\.?\d*$/.test(value)) {
                                handleMarginChange(
                                  product._id,
                                  value,
                                  product.name
                                );
                              }
                            }}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position='end'>%</InputAdornment>
                              ),
                            }}
                            size='small'
                            fullWidth
                            error={
                              !!(displayData.margin &&
                              !validateMargin(displayData.margin))
                            }
                            helperText={
                              displayData.margin &&
                              !validateMargin(displayData.margin)
                                ? '0-100'
                                : ''
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title='Clear margin for this product'>
                            <Button
                              variant='outlined'
                              size='small'
                              onClick={() => handleClearProduct(product._id)}
                              disabled={isBulkMode || !displayData.selected}
                              color='error'
                            >
                              Clear
                            </Button>
                          </Tooltip>
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
                onPageChange={(_, newPage) => setDialogPage(newPage)}
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
      <Divider />
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Box display='flex' alignItems='center' gap={1} flex={1}>
          {modifiedCount > 0 && (
            <Chip
              icon={<InfoIcon />}
              label={`${modifiedCount} product${
                modifiedCount !== 1 ? 's' : ''
              } to update`}
              color='primary'
              variant='outlined'
            />
          )}
        </Box>
        <Button
          variant='outlined'
          onClick={onClose}
          disabled={saving}
          size='large'
        >
          Cancel
        </Button>
        <Button
          variant='contained'
          onClick={handleSave}
          disabled={saving || modifiedCount === 0}
          size='large'
          startIcon={saving ? <CircularProgress size={20} /> : null}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddSpecialMarginDialog;
