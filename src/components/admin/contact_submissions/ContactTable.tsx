import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  TablePagination,
  TextField,
  Switch,
  Button,
} from '@mui/material';
import { toast } from 'react-toastify';

const ContactTable = ({
  contacts,
  loading,
  handleImageClick,
  handleOpenEditModal,
}: any) => {
  return (
    <>
      {loading ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '200px',
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer
            component={Paper}
            sx={{
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              overflowX: 'auto',
            }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>S. No.</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Business Type</TableCell>
                  <TableCell>City</TableCell>
                  <TableCell>Company Name</TableCell>
                  <TableCell>Message</TableCell>
                  <TableCell>Created At</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contacts?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} align='center'>
                      No contacts found.
                    </TableCell>
                  </TableRow>
                ) : (
                  contacts?.map((contact: any, index: number) => (
                    <TableRow key={contact._id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{contact.name}</TableCell>
                      <TableCell>{contact.email}</TableCell>
                      <TableCell>{contact.phone}</TableCell>
                      <TableCell>{contact.business_type.join(', ')}</TableCell>
                      <TableCell>{contact.city}</TableCell>
                      <TableCell>{contact.company_name}</TableCell>
                      <TableCell>{contact.message}</TableCell>
                      <TableCell>
                        {new Date(contact.created_at).toLocaleString("en-IN", {
                          timeZone: "Asia/Kolkata",
                          year: "numeric",
                          month: "short",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          hour12: true,
                        })}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </>
  );
};

export default ContactTable;
