import {
  Box,
  RadioGroup,
  Drawer,
  FormControl,
  FormControlLabel,
  Radio,
  Checkbox,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Button,
} from '@mui/material';

const FilterDrawerComponent = ({
  open,
  onClose,
  filterStatus,
  setFilterStatus,
  filterStock,
  setFilterStock,
  filterNewArrivals,
  setFilterNewArrivals,
  missingInfoProducts,
  setMissingInfoProducts,
  filterBrand,
  setFilterBrand,
  filterCategory,
  setFilterCategory,
  filterSubCategory,
  setFilterSubCategory,
  filterSortBy,
  setFilterSortBy,
  brandOptions,
  categoryOptions,
  subCategoryOptions,
  applyFilters,
  resetFilters,
}: any) => {
  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 300,
          padding: 3,
        },
      }}
    >
      <Typography variant='h6' gutterBottom>
        Filter Products
      </Typography>

      {/* Status Filter */}
      <Typography variant='subtitle2'>Status</Typography>
      <RadioGroup
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
      >
        <FormControlLabel value='' control={<Radio />} label='All' />
        <FormControlLabel value='active' control={<Radio />} label='Active' />
        <FormControlLabel
          value='inactive'
          control={<Radio />}
          label='Inactive'
        />
      </RadioGroup>

      {/* Stock Filter */}
      <Typography variant='subtitle2'>Stock</Typography>
      <RadioGroup
        value={filterStock}
        onChange={(e) => setFilterStock(e.target.value)}
      >
        <FormControlLabel value='' control={<Radio />} label='All' />
        <FormControlLabel value='zero' control={<Radio />} label='Zero Stock' />
        <FormControlLabel
          value='gt_zero'
          control={<Radio />}
          label='&gt; 0 Stock'
        />
      </RadioGroup>

      {/* New Arrivals and Missing Info */}
      <FormControlLabel
        control={
          <Checkbox
            checked={filterNewArrivals}
            onChange={(e) => {
              setFilterNewArrivals(e.target.checked);
              setFilterStatus('');
            }}
          />
        }
        label='New Arrivals Only'
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={missingInfoProducts}
            onChange={(e) => {
              setMissingInfoProducts(e.target.checked);
              setFilterStatus('');
            }}
          />
        }
        label='Missing Information Products'
      />

      {/* Brand Filter */}
      <FormControl fullWidth sx={{ mt: 2 }}>
        <InputLabel id='brand-filter-label'>Brand</InputLabel>
        <Select
          labelId='brand-filter-label'
          label='Brand'
          value={filterBrand}
          onChange={(e) => setFilterBrand(e.target.value)}
        >
          <MenuItem value=''>
            <em>All</em>
          </MenuItem>
          {brandOptions.map((brand: any) => (
            <MenuItem key={brand} value={brand}>
              {brand}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Category Filter */}
      <FormControl fullWidth sx={{ mt: 2 }}>
        <InputLabel id='category-filter-label'>Category</InputLabel>
        <Select
          labelId='category-filter-label'
          label='Category'
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <MenuItem value=''>
            <em>All</em>
          </MenuItem>
          {categoryOptions.map((cat: any) => (
            <MenuItem key={cat} value={cat}>
              {cat}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Sub Category Filter */}
      <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
        <InputLabel id='sub-category-filter-label'>Sub Category</InputLabel>
        <Select
          labelId='sub-category-filter-label'
          label='Sub Category'
          value={filterSubCategory}
          onChange={(e) => setFilterSubCategory(e.target.value)}
        >
          <MenuItem value=''>
            <em>All</em>
          </MenuItem>
          {subCategoryOptions.map((subCat: any) => (
            <MenuItem key={subCat} value={subCat}>
              {subCat}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Typography variant='subtitle2'>Sort By</Typography>
      <RadioGroup
        value={filterSortBy}
        onChange={(e) => setFilterSortBy(e.target.value)}
      >
        <FormControlLabel value='' control={<Radio />} label='Default' />
        <FormControlLabel
          value='catalogue'
          control={<Radio />}
          label='Catalogue Order'
        />
      </RadioGroup>

      <Box sx={{ mt: 3 }} display='flex' flexDirection='row' gap='16px'>
        <Button variant='contained' onClick={applyFilters}>
          Apply
        </Button>
        <Button color='secondary' variant='contained' onClick={resetFilters}>
          Reset
        </Button>
      </Box>
    </Drawer>
  );
};

export default FilterDrawerComponent;
