import { useInfiniteQuery } from '@tanstack/react-query';
import axios from 'axios';

interface Product {
  _id: string;
  name: string;
  brand: string;
  category?: string;
  sub_category?: string;
  series?: string;
  cf_sku_code?: string;
  rate: number;
  stock: number;
  images?: string[];
  image_url?: string;
  new?: boolean;
  item_tax_preferences: any;
  upc_code?: string;
}

interface ProductsResponse {
  products?: Product[];
  items?: any[];
  page: number;
  per_page: number;
  total: number;
  has_more: boolean;
}

interface UseProductsParams {
  brand?: string;
  category?: string;
  search?: string;
  sort?: string;
  cataloguePage?: number;
  groupByName?: boolean;
  enabled?: boolean;
}

export const useProducts = ({
  brand,
  category,
  search,
  sort = 'default',
  cataloguePage,
  groupByName = true,
  enabled = true,
}: UseProductsParams) => {
  return useInfiniteQuery<ProductsResponse>({
    queryKey: ['products', brand, category, search, sort, cataloguePage, groupByName],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await axios.get(`${process.env.api_url}/products`, {
        params: {
          brand,
          category,
          search,
          page: pageParam,
          per_page: 100,
          sort,
          catalogue_page: sort === 'catalogue' ? cataloguePage : undefined,
          group_by_name: groupByName,
        },
      });

      // Calculate if there are more pages
      const products = response.data.products || [];
      const items = response.data.items || [];
      const totalFetched = groupByName && items.length > 0
        ? items.reduce((count: number, item: any) => {
            if (item.type === 'group') {
              return count + (item.products?.length || 0);
            }
            return count + 1;
          }, 0)
        : products.length;

      return {
        ...response.data,
        has_more: totalFetched >= 100,
        page: pageParam as number,
      };
    },
    getNextPageParam: (lastPage) => {
      return lastPage.has_more ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useBrands = () => {
  return useInfiniteQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const response = await axios.get(`${process.env.api_url}/products/brands`);
      return response.data;
    },
    getNextPageParam: () => undefined,
    initialPageParam: 1,
    staleTime: 10 * 60 * 1000, // Brands don't change often, cache for 10 minutes
  });
};

export const useCategories = (brand?: string, enabled = true) => {
  return useInfiniteQuery({
    queryKey: ['categories', brand],
    queryFn: async () => {
      const response = await axios.get(`${process.env.api_url}/products/categories`, {
        params: { brand },
      });
      return response.data;
    },
    getNextPageParam: () => undefined,
    initialPageParam: 1,
    enabled: enabled && !!brand,
    staleTime: 10 * 60 * 1000,
  });
};

export const useAllCategories = (enabled = true) => {
  return useInfiniteQuery({
    queryKey: ['allCategories'],
    queryFn: async () => {
      const response = await axios.get(`${process.env.api_url}/products/all_categories`);
      return response.data;
    },
    getNextPageParam: () => undefined,
    initialPageParam: 1,
    enabled,
    staleTime: 10 * 60 * 1000,
  });
};

export const useProductCounts = () => {
  return useInfiniteQuery({
    queryKey: ['productCounts'],
    queryFn: async () => {
      const response = await axios.get(`${process.env.api_url}/products/counts`);
      return response.data;
    },
    getNextPageParam: () => undefined,
    initialPageParam: 1,
    staleTime: 10 * 60 * 1000,
  });
};
