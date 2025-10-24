// ProductGroupCard.tsx - Component to display a group of product variants
import React, { memo, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Badge,
  Chip,
  Alert,
  Divider,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  AddShoppingCart,
  RemoveShoppingCart,
  ExpandMore,
} from "@mui/icons-material";
import QuantitySelector from "../QuantitySelector";
import ImageCarousel from "./ImageCarousel";
import { extractSize, extractWeight } from "../../../util/groupProducts";

interface SearchResult {
  _id: string;
  name: string;
  images?: string[];
  category?: string;
  sub_category?: string;
  series?: string;
  cf_sku_code?: string;
  rate: number;
  stock: number;
  new?: boolean;
  item_tax_preferences: any;
  upc_code?: string;
  dimensions?: {
    length?: number;
    breadth?: number;
    height?: number;
  };
}

interface ProductGroupCardProps {
  baseName: string;
  products: SearchResult[];
  primaryProduct: SearchResult;
  selectedProducts: SearchResult[];
  temporaryQuantities: { [key: string]: number };
  specialMargins: { [key: string]: string };
  customerMargin: string;
  orderStatus?: string;
  getSellingPrice: any;
  handleImageClick: any;
  handleQuantityChange: (id: string, newQuantity: number) => void;
  handleAddOrRemove: (product: SearchResult) => void;
  index: number;
  isShared: boolean;
}

const ProductGroupCard: React.FC<ProductGroupCardProps> = memo(
  ({
    baseName,
    products,
    primaryProduct,
    selectedProducts,
    temporaryQuantities,
    specialMargins,
    customerMargin,
    orderStatus,
    getSellingPrice,
    handleImageClick,
    handleQuantityChange,
    handleAddOrRemove,
    index,
    isShared = false,
  }) => {
    const [selectedVariantId, setSelectedVariantId] = useState<string>(
      primaryProduct._id
    );

    const isDisabled =
      orderStatus?.toLowerCase().includes("accepted") ||
      orderStatus?.toLowerCase().includes("declined");

    // Get the currently displayed variant
    const currentVariant =
      products.find((p) => p._id === selectedVariantId) || primaryProduct;

    const productId = currentVariant._id;
    const selectedProduct: any = selectedProducts.find(
      (p) => p._id === productId
    );
    const quantity =
      selectedProduct?.quantity || temporaryQuantities[productId] || "";
    const sellingPrice = getSellingPrice(currentVariant);
    const itemTotal = parseFloat((sellingPrice * quantity).toFixed(2));
    const isQuantityExceedingStock = quantity > currentVariant.stock;

    return (
      <Card
        sx={{
          display: "flex",
          flexDirection: "column",
          height: '100%',
          minHeight: '100%',
          borderRadius: 3,
          boxShadow: selectedProduct ? 4 : 2,
          overflow: "visible",
          backgroundColor: "background.paper",
          border: selectedProduct ? '2px solid' : '1px solid',
          borderColor: selectedProduct ? 'primary.main' : 'divider',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            boxShadow: 6,
            transform: 'translateY(-4px)',
            borderColor: 'primary.light',
          },
        }}
      >
        {/* Image Section */}
        <Box
          sx={{
            position: "relative",
            backgroundColor: 'grey.50',
            height: 280,
            width: '100%',
          }}
        >
          {currentVariant.new && (
            <Badge
              badgeContent="New"
              color="secondary"
              overlap="rectangular"
              sx={{
                position: "absolute",
                top: 20,
                right: 24,
                zIndex: 10,
                "& .MuiBadge-badge": {
                  fontSize: "0.65rem",
                  fontWeight: 600,
                  borderRadius: '12px',
                  padding: "6px 8px",
                  boxShadow: 2,
                },
              }}
            />
          )}

          <ImageCarousel
            product={currentVariant}
            handleImageClick={handleImageClick}
          />
        </Box>

        <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Product Name - matches ProductCard exactly */}
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mb: 2,
              color: 'text.primary',
              lineHeight: 1.3,
              wordWrap: 'break-word',
              wordBreak: 'break-word',
              minHeight: '48px',
            }}
          >
            {currentVariant.name}
          </Typography>

          {/* Variant Selector - compact to minimize height difference */}
          <Box sx={{ mb: 2, minHeight: '60px' }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                mb: 0.5,
                display: 'block',
                fontSize: '0.7rem',
              }}
            >
              Variants
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {(() => {
                // Extract only SIZE from each product
                const variantMap = new Map<string, typeof products[0]>();

                products.forEach((product) => {
                  // Extract only the SIZE, not the color
                  let sizeLabel = '';

                  // First, check for number-based sizes like #1, #2, #3, etc.
                  const numberSizeMatch = product.name.match(/#(\d+)/);
                  if (numberSizeMatch) {
                    sizeLabel = `#${numberSizeMatch[1]}`;
                  } else {
                    // Check for measurement-based sizes like 4.5mm, 6mm, etc.
                    const measurementMatch = product.name.match(/(\d+\.?\d*mm)/i);
                    if (measurementMatch) {
                      sizeLabel = measurementMatch[1];
                    } else {
                      // First try to extract full word sizes (Large, Medium, Small, etc.)
                      const fullWordPatterns = [
                        /-\s*(XXX-Large|XX-Large|X-Large|X-Small|Extra Large|Extra Small|Large|Medium|Small)$/i,  // " - Large", " - Medium" at end
                        /\s+(XXX-Large|XX-Large|X-Large|X-Small|Extra Large|Extra Small|Large|Medium|Small)$/i,  // " Large", " Medium" at end
                        /-(XXX-Large|XX-Large|X-Large|X-Small|Extra Large|Extra Small|Large|Medium|Small)$/i,     // "-Large", "-Medium" at end
                      ];

                      for (const pattern of fullWordPatterns) {
                        const match = product.name.match(pattern);
                        if (match) {
                          // Normalize the display
                          const size = match[1];
                          if (size.toLowerCase() === 'x-large') sizeLabel = 'XL';
                          else if (size.toLowerCase() === 'xx-large') sizeLabel = 'XXL';
                          else if (size.toLowerCase() === 'xxx-large') sizeLabel = 'XXXL';
                          else if (size.toLowerCase() === 'x-small') sizeLabel = 'XS';
                          else if (size.toLowerCase() === 'extra large') sizeLabel = 'XL';
                          else if (size.toLowerCase() === 'extra small') sizeLabel = 'XS';
                          else if (size.toLowerCase() === 'large') sizeLabel = 'L';
                          else if (size.toLowerCase() === 'medium') sizeLabel = 'M';
                          else if (size.toLowerCase() === 'small') sizeLabel = 'S';
                          break;
                        }
                      }

                      // If no full word size found, try abbreviated sizes
                      if (!sizeLabel) {
                        const patterns = [
                          /\s+(XXS|XS|S|M|L|XL|XXL|XXXL)-[A-Za-z]/i,  // "Product L-orange" (size before color with dash)
                          /\s+(XXS|XS|S|M|L|XL|XXL|XXXL)\s+-/i,  // "Product XS - color"
                          /-\s*(XXS|XS|S|M|L|XL|XXL|XXXL)\s+-/i,  // "Product - XS - color"
                          /-\s*(XXS|XS|S|M|L|XL|XXL|XXXL)\s+/i,   // "Product - XS color"
                          /-(XXS|XS|S|M|L|XL|XXL|XXXL)-/i,        // "Product-XS-color"
                          /-(XXS|XS|S|M|L|XL|XXL|XXXL)\s/i,       // "Product-XS color"
                          /\s+(XXS|XS|S|M|L|XL|XXL|XXXL)$/i,      // "Product XS"
                          /\(([SMLX]{1,3})\)$/i,                  // "Product (M)" or "Product (L)"
                        ];

                        for (const pattern of patterns) {
                          const match = product.name.match(pattern);
                          if (match) {
                            sizeLabel = match[1].toUpperCase();
                            break;
                          }
                        }

                        // Fallback: look for size anywhere in the name
                        if (!sizeLabel) {
                          const sizeMatch = product.name.match(/(XXS|XS|S|M|L|XL|XXL|XXXL)/i);
                          if (sizeMatch) {
                            sizeLabel = sizeMatch[1].toUpperCase();
                          }
                        }
                      }
                    }
                  }

                  // Only add if we found a size and it's not a duplicate
                  if (sizeLabel && !variantMap.has(sizeLabel)) {
                    variantMap.set(sizeLabel, product);
                  }
                });

                // Convert map to array for sorting
                return Array.from(variantMap.entries()).map(([sizeLabel, product]) => ({
                  product,
                  sizeLabel
                }));
              })()
                .sort((a, b) => {
                  // Check if both are number sizes (#1, #2, etc.)
                  const isNumberA = a.sizeLabel.startsWith('#');
                  const isNumberB = b.sizeLabel.startsWith('#');

                  // Check if both are measurement sizes (4.5mm, 6mm, etc.)
                  const isMeasurementA = a.sizeLabel.endsWith('mm');
                  const isMeasurementB = b.sizeLabel.endsWith('mm');

                  if (isNumberA && isNumberB) {
                    // Sort number sizes numerically
                    const numA = parseInt(a.sizeLabel.substring(1));
                    const numB = parseInt(b.sizeLabel.substring(1));
                    return numA - numB;
                  } else if (isMeasurementA && isMeasurementB) {
                    // Sort measurement sizes numerically
                    const numA = parseFloat(a.sizeLabel.replace('mm', ''));
                    const numB = parseFloat(b.sizeLabel.replace('mm', ''));
                    return numA - numB;
                  } else if (isNumberA || isMeasurementA) {
                    return 1; // Number/measurement sizes come after letter sizes
                  } else if (isNumberB || isMeasurementB) {
                    return -1; // Letter sizes come before number/measurement sizes
                  } else {
                    // Define letter size order
                    const sizeOrder = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
                    const indexA = sizeOrder.indexOf(a.sizeLabel);
                    const indexB = sizeOrder.indexOf(b.sizeLabel);
                    return indexA - indexB;
                  }
                })
                .map(({ product, sizeLabel }) => {
                  const isSelected = selectedVariantId === product._id;
                  const isInCart = selectedProducts.some((p) => p._id === product._id);

                  return (
                    <Chip
                      key={product._id}
                      label={sizeLabel}
                      onClick={() => setSelectedVariantId(product._id)}
                      color={isInCart ? "success" : isSelected ? "primary" : "default"}
                      variant={isSelected ? "filled" : "outlined"}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontSize: '0.7rem',
                        height: '24px',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: 2,
                        },
                      }}
                    />
                  );
                })}
            </Box>
          </Box>

          {/* Product Details Grid */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 2,
              mb: 2,
            }}
          >
            {/* Category */}
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
              >
                Category
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip
                  label={currentVariant.category || "-"}
                  variant="outlined"
                  size="small"
                  sx={{
                    borderRadius: 2,
                    fontSize: '0.78rem',
                    height: 'auto',
                    minHeight: 24,
                    maxWidth: '100%',
                    '& .MuiChip-label': {
                      display: 'block',
                      whiteSpace: 'normal',
                      wordWrap: 'break-word',
                      wordBreak: 'break-word',
                      padding: '6px',
                      lineHeight: 1.2,
                    },
                  }}
                />
              </Box>
            </Box>

            {/* Series */}
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
              >
                Series
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip
                  label={currentVariant.series || "-"}
                  variant="outlined"
                  size="small"
                  sx={{
                    borderRadius: 2,
                    fontSize: '0.78rem',
                    height: 'auto',
                    minHeight: 24,
                    maxWidth: '100%',
                    '& .MuiChip-label': {
                      display: 'block',
                      whiteSpace: 'normal',
                      wordWrap: 'break-word',
                      wordBreak: 'break-word',
                      padding: '6px',
                      lineHeight: 1.2,
                    },
                  }}
                />
              </Box>
            </Box>

            {/* SKU */}
            <Box display={'flex'} flexDirection={'column'} alignItems={'baseline'}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
              >
                SKU Code
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip
                  label={currentVariant.cf_sku_code || "-"}
                  variant="outlined"
                  size="small"
                  sx={{
                    borderRadius: 2,
                    fontSize: '0.78rem',
                    height: 'auto',
                    minHeight: 24,
                    maxWidth: '100%',
                    '& .MuiChip-label': {
                      display: 'block',
                      whiteSpace: 'normal',
                      wordWrap: 'break-word',
                      wordBreak: 'break-word',
                      padding: '6px',
                      lineHeight: 1.2,
                    },
                  }}
                />
              </Box>
            </Box>

            {/* UPC */}
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
              >
                UPC/EAN
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip
                  label={currentVariant.upc_code || "-"}
                  variant="outlined"
                  size="small"
                  sx={{
                    borderRadius: 2,
                    fontSize: '0.78rem',
                    height: 'auto',
                    minHeight: 24,
                    maxWidth: '100%',
                    '& .MuiChip-label': {
                      display: 'block',
                      whiteSpace: 'normal',
                      wordWrap: 'break-word',
                      wordBreak: 'break-word',
                      padding: '6px',
                      lineHeight: 1.2,
                    },
                  }}
                />
              </Box>
            </Box>
          </Box>

          {/* Dimensions Accordion */}
          {currentVariant.dimensions && (currentVariant.dimensions.length || currentVariant.dimensions.breadth || currentVariant.dimensions.height) && (
            <Box sx={{ mt: 2 }}>
              <Accordion
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '8px !important',
                  '&:before': {
                    display: 'none',
                  },
                  '& .MuiAccordionSummary-root': {
                    minHeight: '48px',
                    '&.Mui-expanded': {
                      minHeight: '48px',
                    },
                  },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore />}
                  sx={{
                    '& .MuiAccordionSummary-content': {
                      margin: '8px 0',
                    },
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      color: 'text.secondary',
                    }}
                  >
                    Dimensions
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {currentVariant.dimensions.length !== undefined && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          Length:
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {currentVariant.dimensions.length} cm
                        </Typography>
                      </Box>
                    )}
                    {currentVariant.dimensions.breadth !== undefined && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          Breadth:
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {currentVariant.dimensions.breadth} cm
                        </Typography>
                      </Box>
                    )}
                    {currentVariant.dimensions.height !== undefined && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          Height:
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {currentVariant.dimensions.height} cm
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Pricing Section */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
              >
                MRP
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: 'info',
                  fontSize: '1rem',
                }}
              >
                ₹{currentVariant.rate?.toLocaleString()}
              </Typography>
            </Box>

            {/* Stock Section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
              >
                Stock
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: currentVariant.stock > 10 ? 'success.main' : 'error.light',
                  fontSize: '1rem',
                }}
              >
                {currentVariant.stock}
              </Typography>
            </Box>

            {!isShared && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
                >
                  Margin
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: 'info',
                  }}
                >
                  {specialMargins[productId] || customerMargin}
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
              >
                Selling Price
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 700,
                  color: 'primary.main',
                  fontSize: '1rem',
                }}
              >
                ₹{sellingPrice?.toLocaleString()}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
              >
                GST
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: 500 }}
              >
                {currentVariant?.item_tax_preferences[currentVariant?.item_tax_preferences.length - 1].tax_percentage}%
              </Typography>
            </Box>

            {selectedProduct && (
              <>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 700,
                      color: 'success.dark',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                  >
                    Item Total
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 700,
                      color: 'success.dark',
                      fontSize: '1rem',
                    }}
                  >
                    ₹{itemTotal?.toLocaleString()}
                  </Typography>
                </Box>
              </>
            )}
          </Box>

          {/* Spacer to push content to bottom */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Quantity Selector */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                fontWeight: 600,
                mb: 1,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              Quantity
            </Typography>
            <QuantitySelector
              quantity={quantity}
              max={currentVariant.stock}
              onChange={(newQuantity) =>
                handleQuantityChange(productId, newQuantity)
              }
              disabled={isDisabled}
            />
            {isQuantityExceedingStock && (
              <Alert
                severity="error"
                sx={{
                  mt: 1,
                  py: 0,
                  px: 1,
                  fontSize: '0.65rem',
                  '& .MuiAlert-message': { py: 0 }
                }}
              >
                Exceeds stock!
              </Alert>
            )}
          </Box>

          {/* Action Button */}
          <Tooltip title={selectedProduct ? "Remove from cart" : "Add to cart"}>
            <span>
              <Button
                variant="contained"
                color={selectedProduct ? "error" : "primary"}
                startIcon={
                  selectedProduct ? <RemoveShoppingCart /> : <AddShoppingCart />
                }
                onClick={() => handleAddOrRemove(currentVariant)}
                disabled={isDisabled}
                fullWidth
                size="large"
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  fontWeight: 600,
                  py: 1.5,
                  fontSize: '0.9rem',
                  boxShadow: 2,
                  '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-1px)',
                  },
                  '&:disabled': {
                    backgroundColor: 'action.disabledBackground',
                    color: 'action.disabled',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                {selectedProduct ? "Remove from Cart" : "Add to Cart"}
              </Button>
            </span>
          </Tooltip>
        </CardContent>
      </Card>
    );
  }
);

export default ProductGroupCard;
