import React from "react";
import {
  Box,
  Typography,
  Slider,
  FormControlLabel,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  IconButton,
  Drawer,
  useMediaQuery,
  useTheme,
  Button,
  Switch,
} from "@mui/material";
import { ExpandMore, Close, FilterList } from "@mui/icons-material";

interface CatalogueFiltersProps {
  priceRange: [number, number];
  maxPrice: number;
  onPriceChange: (range: [number, number]) => void;
  selectedCategories: string[];
  allCategories: string[];
  onCategoryChange: (category: string) => void;
  selectedBrands: string[];
  allBrands: string[];
  onBrandChange: (brand: string) => void;
  showNewOnly: boolean;
  onNewOnlyChange: (value: boolean) => void;
  hideOutOfStock: boolean;
  onHideOutOfStockChange: (value: boolean) => void;
  onClearFilters: () => void;
  activeBrand?: string;
  open?: boolean;
  onClose?: () => void;
}

const CatalogueFilters: React.FC<CatalogueFiltersProps> = ({
  priceRange,
  maxPrice,
  onPriceChange,
  selectedCategories,
  allCategories,
  onCategoryChange,
  selectedBrands,
  allBrands,
  onBrandChange,
  showNewOnly,
  onNewOnlyChange,
  hideOutOfStock,
  onHideOutOfStockChange,
  onClearFilters,
  activeBrand = '',
  open = true,
  onClose,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const isNewArrivals = activeBrand === 'New Arrivals';
  const hasActiveBrand = activeBrand && activeBrand !== '' && activeBrand !== 'all' && activeBrand !== 'New Arrivals';

  const activeFilterCount =
    selectedCategories.length +
    selectedBrands.length +
    (showNewOnly ? 1 : 0) +
    (!hideOutOfStock ? 1 : 0) +
    (priceRange[0] > 0 || priceRange[1] < maxPrice ? 1 : 0);

  const sectionHeaderSx = {
    '& .MuiAccordionSummary-content': { my: 1.25 },
    bgcolor: theme.palette.mode === 'dark'
      ? 'rgba(255,255,255,0.03)'
      : 'rgba(70,51,184,0.04)',
    '&.Mui-expanded': { minHeight: 'unset' },
  };

  const accordionSx = {
    '&:before': { display: 'none' },
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: '8px !important',
    mb: 1.5,
    transition: 'box-shadow 0.2s ease',
    '&:hover': { boxShadow: 1 },
  };

  const filterContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterList color="primary" fontSize="small" />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Filters
          </Typography>
          {activeFilterCount > 0 && (
            <Chip
              label={activeFilterCount}
              size="small"
              color="primary"
              sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, '& .MuiChip-label': { px: 0.75 } }}
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Button
            size="small"
            onClick={onClearFilters}
            disabled={activeFilterCount === 0}
            sx={{ fontSize: '0.7rem', textTransform: 'none', fontWeight: 600, minWidth: 0, px: 1 }}
          >
            Clear all
          </Button>
          {isMobile && onClose && (
            <IconButton onClick={onClose} size="small">
              <Close fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Filters scroll area */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1.5, minHeight: 0 }}>

        {/* Special — New Arrivals & Out of Stock */}
        {!isNewArrivals && (
          <Accordion defaultExpanded elevation={0} sx={accordionSx}>
            <AccordionSummary expandIcon={<ExpandMore />} sx={sectionHeaderSx}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.82rem' }}>
                Special
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0.5, pb: 1.25 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showNewOnly}
                    onChange={(e) => onNewOnlyChange(e.target.checked)}
                    color="primary"
                    size="small"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                      New Arrivals Only
                    </Typography>
                    <Chip
                      label="NEW"
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #4633B8 0%, #6A5AD1 100%)',
                        color: 'white',
                        '& .MuiChip-label': { px: 0.75 },
                      }}
                    />
                  </Box>
                }
              />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.75, pr: 0.5 }}>
                <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                  Show Out of Stock
                </Typography>
                <Switch
                  checked={!hideOutOfStock}
                  onChange={(e) => onHideOutOfStockChange(!e.target.checked)}
                  color="secondary"
                  size="small"
                />
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Price Range */}
        <Accordion defaultExpanded elevation={0} sx={accordionSx}>
          <AccordionSummary expandIcon={<ExpandMore />} sx={sectionHeaderSx}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.82rem' }}>
              Price Range
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0.5, pb: 1.5 }}>
            <Box sx={{ px: 1 }}>
              <Slider
                value={priceRange}
                onChange={(_, newValue) => onPriceChange(newValue as [number, number])}
                valueLabelDisplay="auto"
                min={0}
                max={maxPrice}
                valueLabelFormat={(value) => `₹${value.toLocaleString('en-IN')}`}
                sx={{
                  '& .MuiSlider-thumb': { width: 18, height: 18 },
                  '& .MuiSlider-rail': { opacity: 0.3 },
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem', fontWeight: 600 }}>
                  ₹{priceRange[0].toLocaleString('en-IN')}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem', fontWeight: 600 }}>
                  ₹{priceRange[1].toLocaleString('en-IN')}
                </Typography>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Categories */}
        {!hasActiveBrand && allCategories.length > 0 && (
          <Accordion elevation={0} sx={accordionSx}>
            <AccordionSummary expandIcon={<ExpandMore />} sx={sectionHeaderSx}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', pr: 1, alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.82rem' }}>
                  Categories
                </Typography>
                {selectedCategories.length > 0 && (
                  <Chip
                    label={selectedCategories.length}
                    size="small"
                    color="primary"
                    sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, '& .MuiChip-label': { px: 0.75 } }}
                  />
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0.5, pb: 1, maxHeight: 200, overflowY: 'auto' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                {allCategories.map((category) => (
                  <FormControlLabel
                    key={category}
                    control={
                      <Checkbox
                        checked={selectedCategories.includes(category)}
                        onChange={() => onCategoryChange(category)}
                        size="small"
                        color="primary"
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ fontSize: '0.83rem' }}>
                        {category}
                      </Typography>
                    }
                  />
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Brands */}
        {!hasActiveBrand && allBrands.length > 0 && (
          <Accordion elevation={0} sx={{ ...accordionSx, mb: 0 }}>
            <AccordionSummary expandIcon={<ExpandMore />} sx={sectionHeaderSx}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', pr: 1, alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.82rem' }}>
                  Brands
                </Typography>
                {selectedBrands.length > 0 && (
                  <Chip
                    label={selectedBrands.length}
                    size="small"
                    color="primary"
                    sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600, '& .MuiChip-label': { px: 0.75 } }}
                  />
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0.5, pb: 1, maxHeight: 200, overflowY: 'auto' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                {allBrands.map((brand) => (
                  <FormControlLabel
                    key={brand}
                    control={
                      <Checkbox
                        checked={selectedBrands.includes(brand)}
                        onChange={() => onBrandChange(brand)}
                        size="small"
                        color="primary"
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ fontSize: '0.83rem' }}>
                        {brand}
                      </Typography>
                    }
                  />
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        )}
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        anchor="left"
        open={open}
        onClose={onClose}
        PaperProps={{ sx: { width: '85%', maxWidth: 360 } }}
      >
        {filterContent}
      </Drawer>
    );
  }

  return (
    <Box
      sx={{
        width: 268,
        flexShrink: 0,
        bgcolor: 'background.paper',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        height: 'fit-content',
        maxHeight: 'calc(100vh - 180px)',
        position: 'sticky',
        top: 88,
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        overflow: 'hidden',
      }}
    >
      {filterContent}
    </Box>
  );
};

export default CatalogueFilters;
