import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  Box,
  TablePagination,
  Switch,
} from '@mui/material';
import capitalize from '../../../util/capitalize';

interface CustomerTableProps {
  customers: any[];
  totalCount: number;
  page: number;
  rowsPerPage: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
  onViewDetails: (cust: any) => void;
  handleToggle: any;
}

const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  totalCount,
  page,
  rowsPerPage,
  searchQuery,
  setSearchQuery,
  onPageChange,
  onRowsPerPageChange,
  onViewDetails,
  handleToggle,
}) => {
  return (
    <>
      <TextField
        label='Search by Name'
        variant='outlined'
        fullWidth
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ marginBottom: 3 }}
      />
      <Box sx={{ overflowX: 'auto', width: '100%' }}>
        <TableContainer component={Paper} sx={{ borderRadius: '8px', minWidth: { xs: '800px', md: '100%' } }}>
          <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Company Name</TableCell>
              <TableCell>Sales Person</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Tier</TableCell>
              <TableCell>Margin</TableCell>
              <TableCell>GST Treatment</TableCell>
              <TableCell>Whatsapp Group</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers.map((cust) => {
              const arrayOfCodes =
                typeof cust.cf_sales_person === 'string'
                  ? cust.cf_sales_person.split(',').map((s: string) => s.trim())
                  : Array.isArray(cust.cf_sales_person)
                  ? cust.cf_sales_person
                  : [];
              return (
                <TableRow key={cust._id}>
                  <TableCell>{cust.contact_name}</TableCell>
                  <TableCell>{cust.company_name}</TableCell>
                  <TableCell>{arrayOfCodes.join(', ') || 'N/A'}</TableCell>
                  <TableCell>
                    {cust.customer_sub_type
                      ? capitalize(cust.customer_sub_type)
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {String(cust?.cf_tier || '-').toUpperCase()}
                  </TableCell>
                  <TableCell>{cust.cf_margin || '40%'}</TableCell>
                  <TableCell>{cust.cf_in_ex || 'Exclusive'}</TableCell>
                  <TableCell>{cust.cf_whatsapp_group || '-'}</TableCell>
                  <TableCell>
                    <Switch
                      checked={cust.status === 'active'}
                      onChange={(e) => handleToggle(cust)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant='contained'
                      onClick={() => onViewDetails(cust)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      </Box>
      <Box display='flex' justifyContent='flex-end' mt={2}>
        <TablePagination
          component='div'
          count={totalCount}
          page={page}
          onPageChange={(e, newPage) => onPageChange(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) =>
            onRowsPerPageChange(parseInt(e.target.value, 10))
          }
          rowsPerPageOptions={[25, 50, 100, 200]}
        />
      </Box>
    </>
  );
};

export default CustomerTable;
