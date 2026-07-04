import { api } from './api';

export type CatalogBusinessType =
  | 'restaurant'
  | 'clothing'
  | 'shoes'
  | 'services'
  | 'digital'
  | 'beauty'
  | 'food'
  | 'other';

export type CatalogStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected';

export interface CatalogProduct {
  id: string;
  categoryId: string;
  storeId: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  isAvailable: boolean;
  sortOrder: number;
}

export interface CatalogCategory {
  id: string;
  storeId: string;
  name: string;
  description?: string | null;
  sortOrder: number;
  products: CatalogProduct[];
}

export interface InfluencerCatalog {
  id: string;
  storeName: string;
  businessType: CatalogBusinessType;
  description?: string | null;
  slug: string;
  status: CatalogStatus;
  adminFeedback?: string | null;
  publishedAt?: string | null;
  categories: CatalogCategory[];
}

export interface CatalogStatusResponse {
  status: CatalogStatus;
  adminFeedback?: string | null;
  slug?: string | null;
  categoryCount: number;
  productCount: number;
}

type MyCatalogResponse = { catalog: InfluencerCatalog };

export const catalogApi = {
  getMyCatalog: async (): Promise<InfluencerCatalog> => {
    const res = (await api.get('/api/influencer-catalog/my')) as MyCatalogResponse;
    return res.catalog;
  },

  getStatus: async (): Promise<CatalogStatusResponse> => {
    return api.get('/api/influencer-catalog/status') as Promise<CatalogStatusResponse>;
  },

  setupCatalog: (data: {
    storeName: string;
    businessType: CatalogBusinessType;
    description?: string;
  }) => api.post('/api/influencer-catalog/setup', data) as Promise<MyCatalogResponse>,

  addCategory: (data: { name: string; description?: string }) =>
    api.post('/api/influencer-catalog/categories', data),

  updateCategory: (categoryId: string, data: { name?: string; description?: string }) =>
    api.put(`/api/influencer-catalog/categories/${categoryId}`, data),

  deleteCategory: (categoryId: string) =>
    api.delete(`/api/influencer-catalog/categories/${categoryId}`),

  addProduct: (data: {
    categoryId: string;
    name: string;
    price: number;
    description?: string;
    imageUrl?: string;
  }) => api.post('/api/influencer-catalog/products', data),

  updateProduct: (
    productId: string,
    data: Partial<{
      name: string;
      description: string;
      price: number;
      imageUrl: string | null;
      isAvailable: boolean;
    }>
  ) => api.put(`/api/influencer-catalog/products/${productId}`, data),

  deleteProduct: (productId: string) =>
    api.delete(`/api/influencer-catalog/products/${productId}`),

  uploadImage: async (uri: string, fileName: string, mimeType: string): Promise<string> => {
    const form = new FormData();
    form.append('file', {
      uri,
      name: fileName,
      type: mimeType,
    } as unknown as Blob);
    const res = (await api.post('/api/influencer-catalog/upload-image', form)) as {
      imageUrl?: string;
    };
    if (!res.imageUrl) throw new Error('Upload succeeded but no image URL returned');
    return res.imageUrl;
  },

  submitForReview: () =>
    api.post('/api/influencer-catalog/submit', {}) as Promise<{
      success: boolean;
      message: string;
      catalog: InfluencerCatalog;
    }>,

  reopenCatalog: () =>
    api.post('/api/influencer-catalog/reopen', {}) as Promise<MyCatalogResponse>,
};

export function formatCatalogInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function catalogProductCount(catalog: InfluencerCatalog | null): number {
  if (!catalog) return 0;
  return catalog.categories.reduce((sum, c) => sum + c.products.length, 0);
}

export function isCatalogSetupComplete(catalog: InfluencerCatalog | null): boolean {
  if (!catalog) return false;
  return catalog.storeName !== 'My Catalog' || catalog.categories.length > 0;
}
