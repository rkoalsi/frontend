import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Chip,
  Box,
  Typography,
} from '@mui/material';

interface SalesPerson {
  _id: string;
  name: string;
  email?: string;
  code?: string;
}

const SalesPersonSelection = ({
  salesPeople,
  selectedSalesPeople,
  handleSalesPeopleChange,
}: {
  salesPeople: SalesPerson[];
  selectedSalesPeople: string[]; // Array of selected salesperson IDs
  handleSalesPeopleChange: (selectedIds: string[]) => void;
}) => {
  const handleChange = (event: any) => {
    const value = event.target.value;
    handleSalesPeopleChange(typeof value === 'string' ? value.split(',') : value);
  };

  const getLabel = (id: string) => {
    const sp = salesPeople.find((s) => s._id === id);
    if (!sp) return id;
    return sp.code ? `${sp.name} (${sp.code})` : sp.name;
  };

  return (
    <FormControl fullWidth>
      <InputLabel id='sales-people-label'>Sales People</InputLabel>
      <Select
        labelId='sales-people-label'
        multiple
        value={selectedSalesPeople}
        onChange={handleChange}
        input={<OutlinedInput label='Sales People' />}
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {(selected as string[]).map((id) => (
              <Chip key={id} label={getLabel(id)} size='small' />
            ))}
          </Box>
        )}
      >
        {salesPeople.length > 0 ? (
          salesPeople.map((sp) => (
            <MenuItem key={sp._id} value={sp._id}>
              {sp.name}{sp.code ? ` (${sp.code})` : ''}
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled>
            <Typography color='text.secondary'>No salespeople available.</Typography>
          </MenuItem>
        )}
      </Select>
    </FormControl>
  );
};

export default SalesPersonSelection;
