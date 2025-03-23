import {
  FormControl,
  FormControlLabel,
  FormLabel,
  Typography,
  List,
  ListItem,
  ListItemText,
  Checkbox,
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
  // Handle checkbox toggle
  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const spId = event.target.value;
    let updatedSalesPeople = [...selectedSalesPeople];

    if (event.target.checked) {
      // Add salesperson
      updatedSalesPeople.push(spId);
    } else {
      // Remove salesperson
      updatedSalesPeople = updatedSalesPeople.filter((id) => id !== spId);
    }

    handleSalesPeopleChange(updatedSalesPeople);
  };

  return (
    <FormControl component='fieldset' fullWidth>
      <FormLabel
        component='legend'
        sx={{ mb: 2, fontWeight: 'bold', fontSize: '1.2rem' }}
      >
        Select Sales People
      </FormLabel>
      {salesPeople.length > 0 ? (
        <List>
          {salesPeople.map((sp) => (
            <ListItem key={sp._id} sx={{ borderBottom: '1px solid #ddd' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedSalesPeople.includes(sp._id)}
                    onChange={handleCheckboxChange}
                    value={sp._id}
                  />
                }
                label={sp.name}
              />
              <ListItemText secondary={sp.code || 'N/A'} sx={{ ml: 2 }} />
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography color='textSecondary' sx={{ mt: 2 }}>
          No salespeople available.
        </Typography>
      )}
    </FormControl>
  );
};

export default SalesPersonSelection;
