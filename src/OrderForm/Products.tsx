import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  TextField,
  Autocomplete,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Box,
  Button,
  Tabs,
  Tab,
  Badge,
  Dialog,
  DialogContent,
  useMediaQuery,
  useTheme,
  Snackbar,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useRouter } from 'next/router';
import {
  AddShoppingCart,
  Close,
  ClosedCaption,
  RemoveShoppingCart,
  ShoppingCart,
} from '@mui/icons-material';

interface SearchResult {
  id: number;
  name: string;
  brand: string;
  _id: { $oid: string };
  cf_sku_code?: string;
  item_tax_preferences?: { tax_percentage: number }[];
  quantity?: number;
  rate: number;
  stock: number;
  image_url?: string; // Placeholder for image URL
}

interface SearchBarProps {
  label: string;
  selectedProducts: SearchResult[];
  setSelectedProducts: any;
  updateOrder: any;
  customer: any; // Key to determine GST type
  totals: any;
}

const Products: React.FC<SearchBarProps> = ({
  label = 'Search',
  selectedProducts = [],
  setSelectedProducts = () => {},
  updateOrder = () => {},
  customer = {},
  totals = {},
}) => {
  const [query, setQuery] = useState('');
  const [temporaryQuantities, setTemporaryQuantities] = useState<{
    [key: string]: number;
  }>({});
  const [openImagePopup, setOpenImagePopup] = useState(false);
  const [popupImageSrc, setPopupImageSrc] = useState('');
  const [options, setOptions] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { id = '' } = useRouter().query;
  const calculateLocalTotals = (products: SearchResult[]) => {
    return products.reduce(
      (acc, product) => {
        const taxPercentage =
          product?.item_tax_preferences?.[0]?.tax_percentage || 0;
        const rate = product?.rate || 0;
        const quantity = product?.quantity || 1;
        const margin = parseInt(customer?.cf_margin || '40') / 100; // Default to 40% if not defined

        // Calculate Selling Price
        const sellingPrice = rate - rate * margin;

        let gstAmount = 0;
        let totalAmount = 0;

        if (customer?.cf_in_ex === 'Inclusive') {
          const basePrice = sellingPrice / (1 + taxPercentage / 100);
          gstAmount = (sellingPrice - basePrice) * quantity;
          totalAmount = sellingPrice * quantity;
        } else {
          gstAmount = sellingPrice * (taxPercentage / 100) * quantity;
          totalAmount =
            (sellingPrice + sellingPrice * (taxPercentage / 100)) * quantity;
        }
        totalAmount =
          totalAmount % 1 === 0.5
            ? Math.ceil(totalAmount)
            : Math.floor(totalAmount);
        acc.totalGST += gstAmount;
        acc.totalAmount += totalAmount;

        return acc;
      },
      { totalGST: 0, totalAmount: 0 }
    );
  };

  const [products, setProducts] = useState<SearchResult[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };
  const handleSnackbarClose = (
    event?: React.SyntheticEvent,
    reason?: string
  ) => {
    if (reason === 'clickaway') {
      return; // Don't close on clickaway
    }
    setSnackbarOpen(false);
  };

  /**
   * Fetch products based on query
   */
  const handleSearch = async () => {
    setLoading(true);
    try {
      const base = `${process.env.api_url}`;
      const response = await axios.get(`${base}/products`);
      const filteredOptions = response.data.products.filter(
        (product: SearchResult) =>
          !selectedProducts.some(
            (selected: SearchResult) => selected._id === product._id
          )
      );
      setOptions(filteredOptions);
      setProducts(response.data.products);
      if (response.data.products.length > 0) {
        setActiveTab(response.data.products[0].brand); // Default to first brand
      }
    } catch (error) {
      console.error('Error fetching search results:', error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (!customer || options.length > 0) return; // Prevent redundant fetch
    handleSearch();
  }, [customer, options.length]);

  const selectedProductsRef = useRef(selectedProducts);

  useEffect(() => {
    selectedProductsRef.current = selectedProducts;
  }, [selectedProducts]);
  /**
   * Add products to selected list
   */
  const handleAddProducts = (event: any, values: any | null) => {
    if (!values) return;

    const isAlreadySelected = selectedProducts.some(
      (product: any) => product._id === values._id
    );

    const quantity = temporaryQuantities[values._id] || values.quantity || 1; // Use temporary quantity if available

    if (!isAlreadySelected) {
      const updatedProducts = [
        ...selectedProductsRef.current,
        { ...values, product_id: values._id, quantity },
      ];

      setSelectedProducts(updatedProducts);
      selectedProductsRef.current = updatedProducts;
      const newTotals = calculateLocalTotals(updatedProducts); // Recalculate totals

      updateOrder({
        products: updatedProducts,
        total_gst: parseFloat(newTotals.totalGST.toFixed(2)),
        total_amount: parseFloat(newTotals.totalAmount.toFixed(2)),
      });

      // Show Snackbar for added product with quantity
      showSnackbar(`Added ${values.name} (x${quantity}) to cart.`);

      // Clear temporary quantity for the added product
      setTemporaryQuantities((prev) => {
        const updated = { ...prev };
        delete updated[values._id];
        return updated;
      });
    } else {
      // Product already in cart
      showSnackbar(`${values.name} is already in the cart.`);
    }

    // Remove the product from options
    setOptions((prevOptions) =>
      prevOptions.filter((option) => option._id !== values._id)
    );
  };

  /**
   * Remove product by ID
   */
  const handleRemoveProduct = (id: any) => {
    // Find the product to be removed before filtering
    const removedProduct = selectedProductsRef.current.find(
      (product: any) => product._id === id
    );

    // If the product is found, proceed with removal
    if (removedProduct) {
      const updatedProducts = selectedProductsRef.current.filter(
        (product: any) => product._id !== id
      );

      setSelectedProducts(updatedProducts);
      selectedProductsRef.current = updatedProducts;
      const newTotals = calculateLocalTotals(updatedProducts); // Recalculate totals

      updateOrder({
        products: updatedProducts,
        total_gst: parseFloat(newTotals.totalGST.toFixed(2)),
        total_amount: parseFloat(newTotals.totalAmount.toFixed(2)),
      });

      // Re-add the removed product to options
      setOptions((prevOptions) => [...prevOptions, removedProduct]);

      // Show the Snackbar with the removed product's name
      showSnackbar(`Removed ${removedProduct.name} from cart`);
    }
  };

  /**
   * Update quantity for a specific product
   */
  const handleQuantityChange = (id: string, newQuantity: number) => {
    const updatedProducts = selectedProducts.map((product: any) => {
      if (product._id === id) {
        return {
          ...product,
          quantity: Math.max(1, Math.min(newQuantity, product.stock)), // Ensure valid bounds
        };
      }
      return product;
    });

    setSelectedProducts(updatedProducts); // Update state
    const newTotals = calculateLocalTotals(updatedProducts); // Recalculate totals

    updateOrder({
      products: updatedProducts,
      total_gst: parseFloat(newTotals.totalGST.toFixed(2)),
      total_amount: parseFloat(newTotals.totalAmount.toFixed(2)),
    });
    const updatedProduct = updatedProducts.find((p) => p._id === id);

    if (updatedProduct) {
      showSnackbar(
        `Updated ${updatedProduct.name} to quantity ${updatedProduct.quantity}`
      );
    }
    // showSnackbar(`Updated ${values.name} (x${values.quantity || 1}) to cart.`);
  };

  const handleClearCart = async () => {
    try {
      // Clear on backend
      const base = `${process.env.api_url}`;
      await axios.put(`${base}/orders/clear/${id}`);
      // Clear on frontend
      setSelectedProducts([]);
      const newTotals = calculateLocalTotals([]); // Recalculate totals

      updateOrder({
        products: [],
        total_gst: parseFloat(newTotals.totalGST.toFixed(2)),
        total_amount: parseFloat(newTotals.totalAmount.toFixed(2)),
      });
      setOptions([]);
      console.log('✅ Cart cleared successfully');
    } catch (error) {
      console.error('❌ Failed to clear the cart:', error);
    }
  };
  const handleImageClick = (src: any) => {
    setPopupImageSrc(src);
    setOpenImagePopup(true);
  };

  const handleClosePopup = () => {
    setOpenImagePopup(false);
  };

  // Group products by brand
  const brands = Array.from(new Set(products.map((p) => p.brand)));

  if (!customer) {
    return <Typography>This is content for Products</Typography>;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 2,
        width: '100%',
        padding: 2,
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      {/* Left Section: Products */}
      <Box sx={{ flex: 3 }}>
        {/* Header with Clear Cart Button */}
        <Box display='flex' justifyContent='space-between' alignItems='center'>
          <Typography variant='h5' sx={{ mb: 1, fontWeight: 'bold' }}>
            Add Products
          </Typography>
          <Button
            variant='outlined'
            color='secondary'
            onClick={handleClearCart}
            disabled={selectedProducts.length === 0}
            sx={{
              textTransform: 'none',
              fontWeight: 'bold',
              borderRadius: '24px',
            }}
          >
            Clear Cart
          </Button>
        </Box>

        {/* Search Bar */}
        <Autocomplete
          options={options}
          getOptionLabel={(option: any) => option?.name || 'Unknown Name'}
          isOptionEqualToValue={(option: any, value: any) =>
            option?._id?.$oid === value?._id?.$oid
          }
          onInputChange={(event, value) => {
            setQuery(value);
            handleSearch();
          }}
          onChange={(event, value) => handleAddProducts(event, value)}
          value={null}
          loading={loading}
          renderInput={(params) => (
            <TextField
              {...params}
              label={label}
              variant='outlined'
              fullWidth
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading ? (
                      <CircularProgress color='inherit' size={20} />
                    ) : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant='scrollable'
          scrollButtons='auto'
          sx={{
            mt: 2,
            '.MuiTab-root': {
              textTransform: 'none',
              fontWeight: 'bold',
              padding: '10px 20px',
            },
            '.Mui-selected': { color: 'primary.main' },
          }}
        >
          {brands.map((brand) => (
            <Tab key={brand} label={brand} value={brand} />
          ))}
        </Tabs>

        {/* Product Table */}
        <TableContainer
          component={Paper}
          sx={{
            mt: 2,
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            overflowX: 'auto',
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Image</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Margin</TableCell>
                <TableCell>Selling Price</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Total</TableCell>{' '}
                {/* New Column for Item-Level Total */}
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products
                .filter((product) => product.brand === activeTab)
                .map((product: any) => {
                  const selectedProduct = selectedProducts.find(
                    (p) => p._id === product._id
                  );

                  // Calculate selling price
                  const sellingPrice = parseFloat(
                    (
                      product.rate -
                      (parseInt(customer.cf_margin || '40%') / 100) *
                        product.rate
                    ).toFixed(2)
                  );

                  // Calculate item-level total
                  const itemTotal =
                    selectedProduct?.quantity && selectedProduct?.quantity > 0
                      ? (selectedProduct.quantity * sellingPrice).toFixed(2)
                      : null;

                  return (
                    <TableRow key={product?._id?.$oid || (product?._id as any)}>
                      <TableCell>
                        <img
                          src={product.image_url || '/placeholder.png'}
                          alt={product.name}
                          style={{
                            width: '140px',
                            height: '140px',
                            borderRadius: '4px',
                            objectFit: 'cover',
                            cursor: 'pointer',
                          }}
                          onClick={() =>
                            handleImageClick(
                              product.image_url || '/placeholder.png'
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.cf_sku_code}</TableCell>
                      <TableCell>₹{product.rate}</TableCell>
                      <TableCell>{product.stock}</TableCell>
                      <TableCell>{customer.cf_margin || '40%'}</TableCell>
                      <TableCell>₹{sellingPrice}</TableCell>
                      <TableCell>
                        <TextField
                          type='number'
                          value={
                            selectedProducts.find((p) => p._id === product._id)
                              ?.quantity ||
                            temporaryQuantities[product?._id] ||
                            1
                          }
                          onChange={(e) => {
                            const newQuantity = Math.max(
                              1,
                              parseInt(e.target.value) || 1
                            );

                            if (
                              selectedProducts.find(
                                (p) => p._id === product._id
                              )
                            ) {
                              // If the product is in the cart, update its quantity
                              handleQuantityChange(product?._id, newQuantity);
                            } else {
                              // If the product is not in the cart, update the temporary quantity
                              setTemporaryQuantities((prev) => ({
                                ...prev,
                                [product?._id]: newQuantity,
                              }));
                              showSnackbar(
                                `Set quantity to ${newQuantity}. Add product to cart to confirm.`
                              );
                            }
                          }}
                          inputProps={{
                            min: 1,
                            max: product.stock, // Restrict max value to available stock
                          }}
                          size='small'
                          sx={{ width: '80px' }}
                        />
                      </TableCell>
                      <TableCell>
                        {/* Display total if the product is in the cart */}
                        {itemTotal ? `₹${itemTotal}` : '-'}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          color='primary'
                          onClick={() =>
                            selectedProducts.some(
                              (prod: any) => prod._id === product._id
                            )
                              ? handleRemoveProduct(product._id)
                              : handleAddProducts(null, product)
                          }
                          sx={{
                            textTransform: 'none',
                            fontWeight: 'bold',
                            borderRadius: '24px',
                          }}
                        >
                          {selectedProducts.some(
                            (prod: any) => prod._id === product._id
                          ) ? (
                            <RemoveShoppingCart />
                          ) : (
                            <AddShoppingCart />
                          )}
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Right Section: Cart */}
      <Box>
        {/* Totals Section */}
        <Box
          sx={{
            position: 'fixed',
            top: '70px', // Adjust as needed
            right: '8px', // Stick to the right of the screen
            padding: 2,
            backgroundColor: '#fff',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 10,
            maxWidth: '300px', // Optional, to limit the width
          }}
        >
          <Typography
            variant='h6'
            sx={{
              mb: 2,
              fontWeight: 'bold',
              borderBottom: '1px solid #e0e0e0',
              paddingBottom: '8px',
            }}
          >
            Total
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              fontSize: '16px',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ fontWeight: 500 }}>
                Total GST ({customer?.cf_in_ex || 'Exclusive'}):
              </Typography>
              <Typography sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                ₹{calculateLocalTotals(selectedProducts).totalGST.toFixed(2)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ fontWeight: 500 }}>Total Amount:</Typography>
              <Typography
                sx={{
                  fontWeight: 'bold',
                  fontSize: '18px',
                  color: 'secondary.main',
                }}
              >
                ₹{calculateLocalTotals(selectedProducts).totalAmount.toFixed(2)}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
      <Dialog
        open={openImagePopup}
        onClose={handleClosePopup}
        sx={{ zIndex: 1300 }}
      >
        <DialogContent
          sx={{
            position: 'relative',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
          }}
        >
          <IconButton
            onClick={handleClosePopup}
            sx={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              color: 'white',
              zIndex: 1400,
            }}
          >
            <Close />
          </IconButton>
          <img
            src={popupImageSrc}
            alt='Full screen'
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
            }}
          />
        </DialogContent>
      </Dialog>
      <Snackbar
        open={snackbarOpen}
        onClose={(e: any, r: any) => handleSnackbarClose(e, r)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        action={
          <IconButton
            size='small'
            aria-label='close'
            color='inherit'
            onClick={handleSnackbarClose}
          >
            <Close fontSize='small' />
          </IconButton>
        }
      />
    </Box>
  );
};

export default Products;
