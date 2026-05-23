import React from "react";
import {
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
  useMediaQuery,
  useTheme,
  Tooltip,
  Chip,
} from "@mui/material";
import {
  ViewModule,
  ViewComfy,
  ViewCompact,
  FilterList,
  Sort,
} from "@mui/icons-material";

export type ViewDensity = '3x3' | '4x4' | '5x5';
export type SortOption = 'default' | 'price-low' | 'price-high' | 'name-asc' | 'name-desc' | 'newest';

interface CatalogueToolbarProps {
  totalProducts: number;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  viewDensity: ViewDensity;
  onViewDensityChange: (density: ViewDensity) => void;
  onToggleFilters?: () => void;
  showFilterButton?: boolean;
}

const CatalogueToolbar: React.FC<CatalogueToolbarProps> = ({
  totalProducts,
  sortBy,
  onSortChange,
  viewDensity,
  onViewDensityChange,
  onToggleFilters,
  showFilterButton = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('xl'));

  const getActualGridSize = (density: ViewDensity): string => {
    if (isDesktop) return density;
    if (density === '5x5') return '4×4';
    if (density === '4x4') return '3×3';
    return '2×2';
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'stretch', sm: 'center' },
        gap: 1.5,
        px: { xs: 2, md: 2.5 },
        py: { xs: 1.5, md: 2 },
        bgcolor: 'background.paper',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      }}
    >
      {/* Left — count + filter toggle */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {showFilterButton && onToggleFilters && (
          <IconButton
            onClick={onToggleFilters}
            color="primary"
            size="small"
            sx={{
              display: { xs: 'flex', md: 'none' },
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1.5,
            }}
          >
            <FilterList fontSize="small" />
          </IconButton>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem' }}>
            Showing
          </Typography>
          <Chip
            label={totalProducts.toLocaleString('en-IN')}
            size="small"
            color="primary"
            variant="outlined"
            sx={{
              height: 22,
              fontWeight: 700,
              fontSize: '0.78rem',
              '& .MuiChip-label': { px: 1 },
            }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem' }}>
            {totalProducts === 1 ? 'product' : 'products'}
          </Typography>
        </Box>
      </Box>

      {/* Right — sort + density */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 }, flexWrap: 'wrap' }}>
        {/* Sort */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Sort sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
          <FormControl size="small" sx={{ minWidth: { xs: 140, sm: 175 } }}>
            <Select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              sx={{
                fontSize: { xs: '0.8rem', sm: '0.85rem' },
                fontWeight: 600,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
              }}
            >
              <MenuItem value="default" sx={{ fontSize: '0.875rem' }}>Default</MenuItem>
              <MenuItem value="newest" sx={{ fontSize: '0.875rem' }}>Newest First</MenuItem>
              <MenuItem value="price-low" sx={{ fontSize: '0.875rem' }}>Price: Low to High</MenuItem>
              <MenuItem value="price-high" sx={{ fontSize: '0.875rem' }}>Price: High to Low</MenuItem>
              <MenuItem value="name-asc" sx={{ fontSize: '0.875rem' }}>Name: A–Z</MenuItem>
              <MenuItem value="name-desc" sx={{ fontSize: '0.875rem' }}>Name: Z–A</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* View Density — hidden on mobile */}
        {!isMobile && (
          <ToggleButtonGroup
            value={viewDensity}
            exclusive
            onChange={(_, newDensity) => { if (newDensity !== null) onViewDensityChange(newDensity); }}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                border: '1px solid',
                borderColor: 'divider',
                color: 'text.secondary',
                fontSize: '0.72rem',
                fontWeight: 600,
                px: 1.25,
                py: 0.5,
                transition: 'all 0.2s ease',
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' },
                },
                '&:hover:not(.Mui-selected)': { bgcolor: 'action.hover' },
              },
            }}
          >
            <ToggleButton value="3x3" aria-label="comfortable view">
              <Tooltip title="Comfortable">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ViewModule fontSize="small" />
                  <span>{getActualGridSize('3x3')}</span>
                </Box>
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="4x4" aria-label="cozy view">
              <Tooltip title="Cozy">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ViewComfy fontSize="small" />
                  <span>{getActualGridSize('4x4')}</span>
                </Box>
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="5x5" aria-label="compact view">
              <Tooltip title="Compact">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ViewCompact fontSize="small" />
                  <span>{getActualGridSize('5x5')}</span>
                </Box>
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        )}
      </Box>
    </Box>
  );
};

export default CatalogueToolbar;
