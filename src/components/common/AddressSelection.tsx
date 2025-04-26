import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Typography,
  useTheme,
  useMediaQuery,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const AddressSelection = ({
  shop,
  selectedAddressId,
  handleAddressChange,
  hooks = [],
}: any) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  if (typeof shop.selectedCustomer !== 'object') return null;
  const hook = hooks?.filter(
    (h: any) => h.customer_id === shop.selectedCustomer._id
  );
  return (
    <FormControl component='fieldset' fullWidth>
      <FormLabel component='legend'>Select an Address</FormLabel>
      <RadioGroup
        name='address'
        value={selectedAddressId}
        onChange={handleAddressChange}
      >
        {Array.from(
          new Map(
            shop?.selectedCustomer?.addresses.map((addr: any) => [
              addr.address_id,
              addr,
            ])
          ).values()
        ).map((address: any) => (
          <Accordion key={address.address_id}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <FormControlLabel
                value={address.address_id}
                control={
                  <Radio
                    disabled={
                      hook && hook.length > 0
                        ? hook[0].customer_address?.address_id ===
                          address.address_id
                        : false
                    }
                    onClick={(event) => event.stopPropagation()}
                    onFocus={(event) => event.stopPropagation()}
                  />
                }
                label={address.attention || address.address}
              />
            </AccordionSummary>
            <AccordionDetails>
              {isMobile ? (
                <List>
                  <ListItem>
                    <ListItemText
                      primary='Address'
                      secondary={address.address}
                    />
                  </ListItem>
                  {address.street2 && (
                    <ListItem>
                      <ListItemText
                        primary='Street 2'
                        secondary={address.street2}
                      />
                    </ListItem>
                  )}
                  <ListItem>
                    <ListItemText primary='City' secondary={address.city} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary='State' secondary={address.state} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary='ZIP' secondary={address.zip} />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary='Country'
                      secondary={address.country}
                    />
                  </ListItem>
                  {address.phone && (
                    <ListItem>
                      <ListItemText primary='Phone' secondary={address.phone} />
                    </ListItem>
                  )}
                  {address.fax && (
                    <ListItem>
                      <ListItemText primary='Fax' secondary={address.fax} />
                    </ListItem>
                  )}
                  {address.tax_info_id && (
                    <ListItem>
                      <ListItemText
                        primary='Tax Info ID'
                        secondary={address.tax_info_id}
                      />
                    </ListItem>
                  )}
                </List>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 50%', padding: '8px' }}>
                    <Typography variant='body2'>
                      <strong>Address:</strong> {address.address}
                    </Typography>
                  </div>
                  {address.street2 && (
                    <div style={{ flex: '1 1 50%', padding: '8px' }}>
                      <Typography variant='body2'>
                        <strong>Street 2:</strong> {address.street2}
                      </Typography>
                    </div>
                  )}
                  <div style={{ flex: '1 1 50%', padding: '8px' }}>
                    <Typography variant='body2'>
                      <strong>City:</strong> {address.city}
                    </Typography>
                  </div>
                  <div style={{ flex: '1 1 50%', padding: '8px' }}>
                    <Typography variant='body2'>
                      <strong>State:</strong> {address.state}
                    </Typography>
                  </div>
                  <div style={{ flex: '1 1 50%', padding: '8px' }}>
                    <Typography variant='body2'>
                      <strong>ZIP:</strong> {address.zip}
                    </Typography>
                  </div>
                  <div style={{ flex: '1 1 50%', padding: '8px' }}>
                    <Typography variant='body2'>
                      <strong>Country:</strong> {address.country}
                    </Typography>
                  </div>
                  {address.phone && (
                    <div style={{ flex: '1 1 50%', padding: '8px' }}>
                      <Typography variant='body2'>
                        <strong>Phone:</strong> {address.phone}
                      </Typography>
                    </div>
                  )}
                  {address.fax && (
                    <div style={{ flex: '1 1 50%', padding: '8px' }}>
                      <Typography variant='body2'>
                        <strong>Fax:</strong> {address.fax}
                      </Typography>
                    </div>
                  )}
                  {address.tax_info_id && (
                    <div style={{ flex: '1 1 100%', padding: '8px' }}>
                      <Typography variant='body2'>
                        <strong>Tax Info ID:</strong> {address.tax_info_id}
                      </Typography>
                    </div>
                  )}
                </div>
              )}
            </AccordionDetails>
          </Accordion>
        ))}
      </RadioGroup>
    </FormControl>
  );
};

export default AddressSelection;
