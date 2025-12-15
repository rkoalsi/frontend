// CatalogueFilters.tsx - Filter sidebar for catalogue page
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
  onClearFilters,
  activeBrand = '',
  open = true,
  onClose,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Determine which filters to show based on active brand
  const isNewArrivals = activeBrand === 'New Arrivals';
  const hasActiveBrand = activeBrand && activeBrand !== '' && activeBrand !== 'all' && activeBrand !== 'New Arrivals';

  const filterContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterList color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
            Filters
          </Typography>
        </Box>
        {isMobile && onClose && (
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        )}
      </Box>

      {/* Active Filters Count & Clear */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
            {selectedCategories.length + selectedBrands.length + (showNewOnly ? 1 : 0)} active filters
          </Typography>
          <Button
            size="small"
            onClick={onClearFilters}
            disabled={selectedCategories.length === 0 && selectedBrands.length === 0 && !showNewOnly && priceRange[0] === 0 && priceRange[1] === maxPrice}
            sx={{ fontSize: '0.7rem', textTransform: 'none', fontWeight: 600 }}
          >
            Clear All
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, minHeight: 0 }}>
        {/* New Arrivals Toggle - Hidden when on New Arrivals brand page */}
        {!isNewArrivals && (
          <Accordion
            defaultExpanded
            elevation={0}
            sx={{
              '&:before': { display: 'none' },
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '8px !important',
              mb: 2,
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMore />}
              sx={{
                '& .MuiAccordionSummary-content': {
                  my: 1.5,
                },
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
                Special
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showNewOnly}
                    onChange={(e) => onNewOnlyChange(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                      New Arrivals Only
                    </Typography>
                    <Chip
                      label="NEW"
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #3F51B5 0%, #2196F3 100%)',
                        color: 'white',
                      }}
                    />
                  </Box>
                }
              />
            </AccordionDetails>
          </Accordion>
        )}

        {/* Price Range */}
        <Accordion
          defaultExpanded
          elevation={0}
          sx={{
            '&:before': { display: 'none' },
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '8px !important',
            mb: 2,
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMore />}
            sx={{
              '& .MuiAccordionSummary-content': {
                my: 1.5,
              },
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
              Price Range
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <Box sx={{ px: 1 }}>
              <Slider
                value={priceRange}
                onChange={(_, newValue) => onPriceChange(newValue as [number, number])}
                valueLabelDisplay="auto"
                min={0}
                max={maxPrice}
                valueLabelFormat={(value) => `₹${value.toLocaleString('en-IN')}`}
                sx={{
                  '& .MuiSlider-thumb': {
                    width: 20,
                    height: 20,
                  },
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  ₹{priceRange[0].toLocaleString('en-IN')}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  ₹{priceRange[1].toLocaleString('en-IN')}
                </Typography>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Categories */}
        {!hasActiveBrand && allBrands.length > 0 && (
          <Accordion
            elevation={0}
            sx={{
              '&:before': { display: 'none' },
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '8px !important',
              mb: 2,
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMore />}
              sx={{
                '& .MuiAccordionSummary-content': {
                  my: 1.5,
                },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', pr: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
                  Categories
                </Typography>
                {selectedCategories.length > 0 && (
                  <Chip
                    label={selectedCategories.length}
                    size="small"
                    color="primary"
                    sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                  />
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0, maxHeight: 200, overflowY: 'auto' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
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
                      <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                        {category}
                      </Typography>
                    }
                  />
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Brands - Hidden when a specific brand is already selected */}
        {!hasActiveBrand && allBrands.length > 0 && (
          <Accordion
            elevation={0}
            sx={{
              '&:before': { display: 'none' },
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '8px !important',
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMore />}
              sx={{
                '& .MuiAccordionSummary-content': {
                  my: 1.5,
                },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', pr: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
                  Brands
                </Typography>
                {selectedBrands.length > 0 && (
                  <Chip
                    label={selectedBrands.length}
                    size="small"
                    color="primary"
                    sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                  />
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0, maxHeight: 200, overflowY: 'auto' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
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
                      <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
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
        PaperProps={{
          sx: {
            width: '85%',
            maxWidth: 360,
          },
        }}
      >
        {filterContent}
      </Drawer>
    );
  }

  return (
    <Box
      sx={{
        width: 280,
        bgcolor: 'background.paper',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        height: 'fit-content',
        maxHeight: 'calc(100vh - 200px)',
        position: 'sticky',
        top: 100,
        boxShadow: 2,
      }}
    >
      {filterContent}
    </Box>
  );
};

export default CatalogueFilters;
