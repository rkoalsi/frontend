// types.ts

export interface Customer {
  _id: string;
  contact_name: string;
  cf_sales_person?: string;
  customer_sub_type?: string;
  cf_margin?: string;
  cf_in_ex?: string;
  status: 'active' | 'inactive';
  gst_no?: string;
  created_at?: string;
  created_time?: string;
}

export interface Product {
  _id: string;
  product_id: string;
  name: string;
  cf_sku_code: string;
  rate: number;
  image_url?: string;
  margin?: string;
}

export interface GlobalSelection {
  selected: boolean;
  margin: string;
  name: string;
}
