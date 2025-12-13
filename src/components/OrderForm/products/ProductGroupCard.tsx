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

        <CardContent sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Product Name */}
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mb: 1.5,
              color: 'text.primary',
              lineHeight: 1.3,
              wordWrap: 'break-word',
              wordBreak: 'break-word',
              minHeight: '40px',
              fontSize: '1rem',
            }}
          >
            {currentVariant.name}
          </Typography>

          {/* Variant Selector - Compact */}
          <Box sx={{ mb: 1.5 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                fontWeight: 600,
                mb: 0.5,
                display: 'block',
                fontSize: '0.7rem',
              }}
            >
              Variants
            </Typography>
            <Box sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1.5,
            }}>
              {(() => {
                // Extract only SIZE from each product
                const variantMap = new Map<string, typeof products[0]>();
                let parentProduct: typeof products[0] | null = null;

                products.forEach((product) => {
                  // Extract only the SIZE, not the color
                  let sizeLabel = '';

                  // First, check for (SIZE/measurement) format like (XXL/62CM), (M/32CM), （XL/48CM）
                  const sizeMeasurementMatch = product.name.match(/[（(]\s*(XXXXL|XXXL|XXL|XL|XXS|XS|S|M|L)\s*\/\s*\d+\s*[Cc]?[Mm]\s*[)）]/i);
                  if (sizeMeasurementMatch) {
                    sizeLabel = sizeMeasurementMatch[1].toUpperCase();
                  } else if (product.name.match(/#(\d+)/)) {
                    // Check for number-based sizes like #1, #2, #3, etc.
                    const numberSizeMatch = product.name.match(/#(\d+)/);
                    sizeLabel = `#${numberSizeMatch![1]}`;
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
                          /-\s*(XXXXL|XXXL|XXL|XL|XXS|XS|L|M|S)$/i,    // "Product - XL" or "Product-XL" at end (check longer sizes first)
                          /\s+(XXXXL|XXXL|XXL|XL|XXS|XS|L|M|S)$/i,      // "Product XL" at end (check longer sizes first)
                          /\s+(XXXXL|XXXL|XXL|XL|XXS|XS|L|M|S)-[A-Za-z]/i,  // "Product L-orange" (size before color with dash)
                          /\s+(XXXXL|XXXL|XXL|XL|XXS|XS|L|M|S)\s+-/i,  // "Product XS - color"
                          /-\s*(XXXXL|XXXL|XXL|XL|XXS|XS|L|M|S)\s+-/i,  // "Product - XS - color"
                          /-\s*(XXXXL|XXXL|XXL|XL|XXS|XS|L|M|S)\s+/i,   // "Product - XS color"
                          /-(XXXXL|XXXL|XXL|XL|XXS|XS|L|M|S)-/i,        // "Product-XS-color"
                          /-(XXXXL|XXXL|XXL|XL|XXS|XS|L|M|S)\s/i,       // "Product-XS color"
                          /\(([SMLX]{1,4})\)$/i,                  // "Product (M)" or "Product (L)" or "Product (XXXXL)"
                        ];

                        for (const pattern of patterns) {
                          const match = product.name.match(pattern);
                          if (match) {
                            sizeLabel = match[1].toUpperCase();
                            break;
                          }
                        }
                      }
                    }
                  }

                  // If no size was found, this is a parent product
                  if (!sizeLabel) {
                    parentProduct = product;
                  } else {
                    // Only add if we found a size and it's not a duplicate
                    if (!variantMap.has(sizeLabel)) {
                      variantMap.set(sizeLabel, product);
                    }
                  }
                });

                // Convert map to array for sorting
                return Array.from(variantMap.entries()).map(([sizeLabel, product]) => ({
                  product,
                  sizeLabel,
                  parentProduct
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
                    const sizeOrder = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL'];
                    const indexA = sizeOrder.indexOf(a.sizeLabel);
                    const indexB = sizeOrder.indexOf(b.sizeLabel);
                    return indexA - indexB;
                  }
                })
                .map(({ product, sizeLabel, parentProduct }) => {
                  const isSelected = selectedVariantId === product._id;
                  const isInCart = selectedProducts.some((p) => p._id === product._id);

                  return (
                    <Chip
                      key={product._id}
                      label={sizeLabel}
                      onClick={() => {
                        // If clicking on already selected chip and parent product exists, deselect
                        if (isSelected && parentProduct) {
                          setSelectedVariantId(parentProduct._id);
                        } else {
                          setSelectedVariantId(product._id);
                        }
                      }}
                      color={isInCart ? "success" : isSelected ? "primary" : "default"}
                      variant={isSelected ? "filled" : "outlined"}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontSize: '0.8rem',
                        height: '28px',
                        minWidth: '44px',
                        '& .MuiChip-label': {
                          px: 1.5,
                        },
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

          {/* Product Details - Enhanced Design */}
          <Box sx={{ mb: 1.5 }}>
            {/* Category & Series in one row */}
            <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
              {currentVariant.category && (
                <Chip
                  label={currentVariant.category}
                  variant="filled"
                  size="small"
                  sx={{
                    borderRadius: 1.5,
                    fontSize: '0.7rem',
                    height: '24px',
                    fontWeight: 600,
                    bgcolor: 'primary.50',
                    color: 'primary.dark',
                    '& .MuiChip-label': { px: 1.5 },
                  }}
                />
              )}
              {currentVariant.series && (
                <Chip
                  label={currentVariant.series}
                  variant="filled"
                  size="small"
                  sx={{
                    borderRadius: 1.5,
                    fontSize: '0.7rem',
                    height: '24px',
                    fontWeight: 600,
                    bgcolor: 'secondary.50',
                    color: 'secondary.dark',
                    '& .MuiChip-label': { px: 1.5 },
                  }}
                />
              )}
            </Box>

            {/* SKU & UPC in enhanced grid */}
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 2,
            }}>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                    display: 'block',
                    mb: 0.5,
                  }}
                >
                  SKU
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    fontFamily: 'monospace',
                    color: 'text.primary',
                  }}
                >
                  {currentVariant.cf_sku_code || "-"}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                    display: 'block',
                    mb: 0.5,
                  }}
                >
                  UPC
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    fontFamily: 'monospace',
                    color: 'text.primary',
                  }}
                >
                  {currentVariant.upc_code || "-"}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Dimensions Accordion - Compact */}
          {currentVariant.dimensions && (currentVariant.dimensions.length || currentVariant.dimensions.breadth || currentVariant.dimensions.height) && (
            <Box sx={{ mb: 1.5 }}>
              <Accordion
                elevation={0}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '6px !important',
                  '&:before': { display: 'none' },
                  '& .MuiAccordionSummary-root': {
                    minHeight: '36px',
                    '&.Mui-expanded': { minHeight: '36px' },
                  },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore sx={{ fontSize: '1.2rem' }} />}
                  sx={{ '& .MuiAccordionSummary-content': { margin: '6px 0' } }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      color: 'text.secondary',
                    }}
                  >
                    Dimensions
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0, pb: 1 }}>
                  <Box sx={{ display: 'flex', gap: 2, fontSize: '0.75rem' }}>
                    {currentVariant.dimensions.length !== undefined && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>L:</Typography>
                        <Typography variant="body2" component="span" sx={{ ml: 0.5, fontSize: '0.75rem' }}>{currentVariant.dimensions.length}cm</Typography>
                      </Box>
                    )}
                    {currentVariant.dimensions.breadth !== undefined && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>B:</Typography>
                        <Typography variant="body2" component="span" sx={{ ml: 0.5, fontSize: '0.75rem' }}>{currentVariant.dimensions.breadth}cm</Typography>
                      </Box>
                    )}
                    {currentVariant.dimensions.height !== undefined && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>H:</Typography>
                        <Typography variant="body2" component="span" sx={{ ml: 0.5, fontSize: '0.75rem' }}>{currentVariant.dimensions.height}cm</Typography>
                      </Box>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Box>
          )}

          <Divider sx={{ my: 1.5 }} />

          {/* Pricing Section - Enhanced */}
          <Box sx={{ mb: 1.5 }}>
            {/* Price Information Grid */}
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 2,
              mb: 1.5,
            }}>
              {/* MRP */}
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                    display: 'block',
                    mb: 0.5,
                  }}
                >
                  MRP
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    fontFamily: 'system-ui',
                    color: 'text.primary',
                    letterSpacing: '-0.3px',
                  }}
                >
                  ₹{currentVariant.rate?.toLocaleString('en-IN')}
                </Typography>
              </Box>

              {/* Stock - Hidden when isShared */}
              {!isShared && (
                <Box sx={{ textAlign: 'right' }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px',
                      display: 'block',
                      mb: 0.5,
                    }}
                  >
                    Stock
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'end', gap: 0.5, justifyContent: 'flex-end' }}>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        fontFamily: 'system-ui',
                        color: currentVariant.stock > 10 ? 'success.main' : currentVariant.stock > 0 ? 'error.main' : 'error.main',
                        letterSpacing: '-0.3px',
                      }}
                    >
                      {currentVariant.stock.toLocaleString('en-IN')}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Selling Price - Hidden when isShared */}
              {!isShared && (
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px',
                      display: 'block',
                      mb: 0.5,
                    }}
                  >
                    Selling Price
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 800,
                      fontSize: '1.05rem',
                      fontFamily: 'system-ui',
                      color: 'primary.main',
                      letterSpacing: '-0.5px',
                    }}
                  >
                    ₹{sellingPrice?.toLocaleString('en-IN')}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.65rem',
                      color: 'text.secondary',
                      fontStyle: 'italic',
                    }}
                  >
                    {specialMargins[productId] || customerMargin} margin
                  </Typography>
                </Box>
              )}

              {/* GST */}
              <Box sx={{ textAlign: 'right' }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                    display: 'block',
                    mb: 0.5,
                  }}
                >
                  GST
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    fontFamily: 'system-ui',
                    color: 'text.primary',
                    letterSpacing: '-0.3px',
                  }}
                >
                  {currentVariant?.item_tax_preferences[currentVariant?.item_tax_preferences.length - 1].tax_percentage}%
                </Typography>
              </Box>
            </Box>

            {selectedProduct && (
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: 'success.50',
                  borderRadius: 1.5,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: '2px solid',
                  borderColor: 'success.main',
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                    color: 'success.dark',
                    fontSize: '0.85rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Item Total
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    color: 'success.dark',
                    fontSize: '1.15rem',
                    fontFamily: 'system-ui',
                    letterSpacing: '-0.5px',
                  }}
                >
                  ₹{itemTotal?.toLocaleString('en-IN')}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Spacer to push content to bottom */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Quantity Selector - Hidden when isShared */}
          {!isShared && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                mb: 1.5,
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  fontWeight: 600,
                  mb: 0.75,
                  fontSize: '0.7rem',
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
                    mt: 0.75,
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
          )}

          {/* Action Button - Hidden when isShared */}
          {!isShared && (
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
                  size="medium"
                  sx={{
                    textTransform: "none",
                    borderRadius: 2,
                    fontWeight: 600,
                    py: 1,
                    fontSize: '0.85rem',
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
          )}
        </CardContent>
      </Card>
    );
  }
);

export default ProductGroupCard;
