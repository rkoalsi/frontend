import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Checkbox,
  Button,
  Chip,
  Paper,
  Alert,
  Tooltip,
} from '@mui/material';
import { Inventory2Outlined, CheckCircleOutline, RadioButtonUnchecked } from '@mui/icons-material';
import { toast } from 'react-toastify';
import axiosInstance from '../../../util/axios';

interface Brand {
  name: string;
  vendor_id: string;
}

interface PurchaseOrder {
  purchaseorder_number: string;
  date: string;
  status: string;
  total: number;
}

interface LineItem {
  item_id: string;
  name: string;
  sku: string;
  quantity: number;
  quantity_received: number;
  upcoming_stock: number;
  pre_order: boolean;
  in_products: boolean;
  inward_date?: string;
  eta_port_date?: string;
}

const PreOrderManager = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [selectedPO, setSelectedPO] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [loadingBrands, setLoadingBrands] = useState(true);
  const [loadingPOs, setLoadingPOs] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axiosInstance
      .get('/admin/pre-order/brands')
      .then(({ data }) => setBrands(data))
      .catch(() => toast.error('Failed to load brands'))
      .finally(() => setLoadingBrands(false));
  }, []);

  const fetchPOs = useCallback((brand: string) => {
    setLoadingPOs(true);
    setPurchaseOrders([]);
    setSelectedPO('');
    setLineItems([]);
    setSelected(new Set());
    axiosInstance
      .get('/admin/pre-order/purchase-orders', { params: { brand } })
      .then(({ data }) => setPurchaseOrders(data))
      .catch(() => toast.error('Failed to load purchase orders'))
      .finally(() => setLoadingPOs(false));
  }, []);

  const fetchLineItems = useCallback((poNumber: string) => {
    setLoadingItems(true);
    setLineItems([]);
    setSelected(new Set());
    axiosInstance
      .get('/admin/pre-order/line-items', { params: { po_number: poNumber } })
      .then(({ data }: { data: LineItem[] }) => {
        setLineItems(data);
        setSelected(new Set(data.filter((i) => i.pre_order).map((i) => i.item_id)));
      })
      .catch(() => toast.error('Failed to load line items'))
      .finally(() => setLoadingItems(false));
  }, []);

  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand);
    fetchPOs(brand);
  };

  const handlePOChange = (po: string) => {
    setSelectedPO(po);
    fetchLineItems(po);
  };

  const toggleItem = (itemId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(lineItems.filter((i) => i.in_products).map((i) => i.item_id)));
  const deselectAll = () => setSelected(new Set());

  const handleSave = async (overrideItemIds?: string[]) => {
    if (!selectedPO) return;
    setSaving(true);
    const itemIds = overrideItemIds ?? [...selected];
    try {
      const { data } = await axiosInstance.post('/admin/pre-order/mark', {
        po_number: selectedPO,
        item_ids: itemIds,
        unmark_others: true,
      });
      toast.success(`${data.marked} product${data.marked !== 1 ? 's' : ''} marked as pre-order, ${data.unmarked} unmarked.`);
      fetchLineItems(selectedPO);
    } catch {
      toast.error('Failed to save pre-order settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleUnmarkAll = async () => {
    deselectAll();
    await handleSave([]);
  };

  // Merge Dogfest + Catfest into a single "Petfest" entry in the dropdown.
  // The API value is comma-separated so the backend looks up both vendors.
  const PETFEST_BRANDS = ['Dogfest', 'Catfest'];
  const displayBrands = useMemo(() => {
    const hasPetfest = brands.some((b) => PETFEST_BRANDS.includes(b.name));
    const others = brands
      .filter((b) => !PETFEST_BRANDS.includes(b.name))
      .map((b) => ({ label: b.name, value: b.name }));
    if (hasPetfest) others.push({ label: 'Petfest', value: PETFEST_BRANDS.join(',') });
    return others.sort((a, b) => a.label.localeCompare(b.label));
  }, [brands]);

  const eligibleItems = lineItems.filter((i) => i.in_products);
  const allSelected = eligibleItems.length > 0 && eligibleItems.every((i) => selected.has(i.item_id));
  const someSelected = eligibleItems.some((i) => selected.has(i.item_id));
  const preOrderCount = eligibleItems.filter((i) => i.pre_order).length;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1000, mx: 'auto' }}>
      <Typography variant='h5' fontWeight={700} mb={1}>
        Pre-Order Bulk Manager
      </Typography>
      <Typography variant='body2' color='text.secondary' mb={3}>
        Select a brand and purchase order to view its line items. Check products to mark them as pre-order; uncheck to unmark them.
        Clicking <strong>Apply</strong> saves the current selection — unchecked items from this PO will be unmarked. Products not in the catalogue cannot be toggled.
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <FormControl sx={{ minWidth: 220 }} size='small'>
          <InputLabel>Brand</InputLabel>
          <Select
            value={selectedBrand}
            label='Brand'
            onChange={(e) => handleBrandChange(e.target.value)}
            disabled={loadingBrands}
          >
            {displayBrands.map((b) => (
              <MenuItem key={b.value} value={b.value}>
                {b.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 260 }} size='small' disabled={!selectedBrand || loadingPOs}>
          <InputLabel>Purchase Order</InputLabel>
          <Select
            value={selectedPO}
            label='Purchase Order'
            onChange={(e) => handlePOChange(e.target.value)}
          >
            {purchaseOrders.map((po) => (
              <MenuItem key={po.purchaseorder_number} value={po.purchaseorder_number}>
                {po.purchaseorder_number}
                {po.date ? ` · ${po.date}` : ''}
                {po.status ? ` · ${po.status}` : ''}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {loadingPOs && <CircularProgress size={24} sx={{ alignSelf: 'center' }} />}
      </Box>

      {loadingItems && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {!loadingItems && lineItems.length > 0 && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <Typography variant='body2' color='text.secondary'>
              {selected.size} of {eligibleItems.length} products selected as pre-order
            </Typography>
            <Button size='small' onClick={selectAll} disabled={allSelected || saving}>
              Select All
            </Button>
            <Button size='small' onClick={deselectAll} disabled={!someSelected || saving}>
              Deselect All
            </Button>
            {preOrderCount > 0 && (
              <Button
                size='small'
                color='error'
                onClick={handleUnmarkAll}
                disabled={saving}
              >
                Unmark All Pre-Orders
              </Button>
            )}
            <Box sx={{ flex: 1 }} />
            <Button
              variant='contained'
              size='small'
              onClick={() => handleSave()}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={14} color='inherit' /> : undefined}
            >
              {saving ? 'Saving…' : selected.size === 0 ? 'Unmark All & Apply' : 'Apply Pre-Order Settings'}
            </Button>
          </Box>

          {(lineItems[0]?.inward_date || lineItems[0]?.eta_port_date) && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
              {lineItems[0]?.eta_port_date && (
                <Chip
                  size='small'
                  variant='outlined'
                  label={`ETA at Port: ${new Date(lineItems[0].eta_port_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                />
              )}
              {lineItems[0]?.inward_date && (
                <Chip
                  size='small'
                  color='warning'
                  variant='outlined'
                  label={`Inward: ${new Date(lineItems[0].inward_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                />
              )}
            </Box>
          )}

          <Paper variant='outlined' sx={{ overflow: 'hidden' }}>
            <Table size='small'>
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell padding='checkbox'>
                    <Checkbox
                      indeterminate={someSelected && !allSelected}
                      checked={allSelected}
                      onChange={() => (allSelected ? deselectAll() : selectAll())}
                    />
                  </TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell align='right'>PO Qty</TableCell>
                  <TableCell align='right'>Received</TableCell>
                  <TableCell align='right'>
                    <Tooltip title='Quantity ordered minus quantity received'>
                      <span>Upcoming Stock</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell align='center'>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lineItems.map((item) => {
                  const isChecked = selected.has(item.item_id);
                  const disabled = !item.in_products;
                  return (
                    <TableRow
                      key={item.item_id}
                      hover={!disabled}
                      onClick={() => !disabled && toggleItem(item.item_id)}
                      sx={{ cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1 }}
                    >
                      <TableCell padding='checkbox'>
                        <Checkbox checked={isChecked} disabled={disabled} onClick={(e) => e.stopPropagation()} onChange={() => toggleItem(item.item_id)} />
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2' fontWeight={500} noWrap>
                          {item.name}
                        </Typography>
                        {item.sku && (
                          <Typography variant='caption' color='text.secondary'>
                            {item.sku}
                          </Typography>
                        )}
                        {disabled && (
                          <Chip label='Not in catalogue' size='small' sx={{ ml: 1, fontSize: '0.65rem' }} />
                        )}
                      </TableCell>
                      <TableCell align='right'>
                        <Typography variant='body2'>{item.quantity}</Typography>
                      </TableCell>
                      <TableCell align='right'>
                        <Typography variant='body2'>{item.quantity_received}</Typography>
                      </TableCell>
                      <TableCell align='right'>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                          <Inventory2Outlined sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant='body2' fontWeight={600} color={item.upcoming_stock > 0 ? 'warning.main' : 'text.secondary'}>
                            {item.upcoming_stock}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align='center'>
                        {isChecked ? (
                          <Chip
                            icon={<CheckCircleOutline sx={{ fontSize: 14 }} />}
                            label='Pre-Order'
                            size='small'
                            color='warning'
                            variant='outlined'
                            sx={{ fontSize: '0.7rem' }}
                          />
                        ) : (
                          <Chip
                            icon={<RadioButtonUnchecked sx={{ fontSize: 14 }} />}
                            label='In Stock'
                            size='small'
                            variant='outlined'
                            sx={{ fontSize: '0.7rem' }}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Paper>

          {lineItems.some((i) => !i.in_products) && (
            <Alert severity='info' sx={{ mt: 2 }}>
              Some PO line items are not in the product catalogue and cannot be toggled.
            </Alert>
          )}
        </>
      )}

      {!loadingItems && selectedPO && lineItems.length === 0 && (
        <Alert severity='warning'>No line items found for this purchase order.</Alert>
      )}
    </Box>
  );
};

export default PreOrderManager;
