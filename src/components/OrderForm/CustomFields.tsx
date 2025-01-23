// components/CustomFields.tsx
import React from 'react';
import { Grid, TextField } from '@mui/material';

interface CustomFieldsProps {
  fields: any[];
  onChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string,
    subField: string
  ) => void;
}

const CustomFields: React.FC<CustomFieldsProps> = ({ fields, onChange }) => (
  <>
    {fields.map((field) => (
      <Grid item xs={12} md={6} key={field.customfield_id}>
        <TextField
          label={field.name}
          name={field.customfield_id}
          type={field.data_type === 'date' ? 'date' : 'text'}
          onChange={(e: any) =>
            onChange(e, 'custom_fields', field.customfield_id)
          }
          fullWidth
        />
      </Grid>
    ))}
  </>
);

export default CustomFields;
