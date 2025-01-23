// api.ts

import axios from 'axios';
import { Customer, Product } from '../types/types';

const baseApiUrl = process.env.api_url;

// Fetch customers with search and pagination
export const fetchCustomers = async (
  searchQuery: string,
  page: number,
  limit: number
): Promise<{ customers: Customer[]; total_count: number }> => {
  const response = await axios.get(`${baseApiUrl}/admin/customers`, {
    params: {
      name: searchQuery,
      page,
      limit,
    },
  });
  return response.data;
};

// Update customer status
export const updateCustomerStatus = async (
  customerId: string,
  status: 'active' | 'inactive'
): Promise<void> => {
  await axios.put(`${baseApiUrl}/customers/${customerId}`, { status });
};

// Update customer details
export const updateCustomerDetails = async (
  customerId: string,
  data: Partial<Customer>
): Promise<void> => {
  await axios.put(`${baseApiUrl}/customers/${customerId}`, data);
};

// Fetch special margin products for a customer
export const fetchSpecialMargins = async (
  customerId: string
): Promise<Product[]> => {
  const response = await axios.get(
    `${baseApiUrl}/admin/customer/special_margins/${customerId}`
  );
  return response.data.products || [];
};

// Delete a special margin product
export const deleteSpecialMargin = async (
  customerId: string,
  specialMarginId: string
): Promise<void> => {
  await axios.delete(
    `${baseApiUrl}/admin/customer/special_margins/${customerId}/${specialMarginId}`
  );
};

// Fetch products for the dialog with search and pagination
export const fetchProducts = async (
  searchQuery: string,
  page: number,
  limit: number
): Promise<{ products: Product[]; total_count: number }> => {
  const response = await axios.get(`${baseApiUrl}/admin/products`, {
    params: {
      search: searchQuery,
      page,
      limit,
    },
  });
  return response.data;
};

// Add a special margin to a product for a customer
export const addSpecialMargin = async (
  customerId: string,
  product: Product,
  margin: string
): Promise<void> => {
  const payload = {
    product_id: product.product_id,
    name: product.name,
    margin,
  };
  await axios.post(
    `${baseApiUrl}/admin/customer/special_margins/${customerId}`,
    payload
  );
};
