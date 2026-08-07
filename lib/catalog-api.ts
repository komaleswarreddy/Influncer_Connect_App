import { api } from './api';

export type CatalogKind = 'products' | 'services';

export type CatalogBusinessType =
  'restaurant' | 'clothing' | 'shoes' | 'services' | 'digital' | 'beauty' | 'food' | 'other';

export type CatalogStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected';

export interface CatalogProduct {
  id: string;
  categoryId: string;
  storeId: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  /** Service catalogs only */
  durationMinutes?: number | null;
  visitType?: 'home' | 'salon' | 'center' | 'online' | 'virtual' | null;
  priceUnit?: 'per_session' | 'per_hour' | null;
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
  catalogKind: CatalogKind;
  description?: string | null;
  /** Cover photo shown on the storefront + used as the Open Graph image when the link is shared. */
  coverImageUrl?: string | null;
  slug: string;
  status: CatalogStatus;
  adminFeedback?: string | null;
  publishedAt?: string | null;
  /** Ops public storefront URL (/menu/{slug}) once approved via bridge. */
  liveStoreUrl?: string | null;
  opsSlug?: string | null;
  categories: CatalogCategory[];
}

export interface CatalogStatusResponse {
  status: CatalogStatus;
  adminFeedback?: string | null;
  slug?: string | null;
  liveStoreUrl?: string | null;
  categoryCount: number;
  productCount: number;
}

type MyCatalogResponse = { catalog: InfluencerCatalog };

export const catalogApi = {
  getMyCatalog: async (kind: CatalogKind): Promise<InfluencerCatalog> => {
    const res = (await api.get(`/api/influencer-catalog/my?kind=${kind}`)) as MyCatalogResponse;
    return res.catalog;
  },

  getStatus: async (kind: CatalogKind): Promise<CatalogStatusResponse> => {
    return api.get(`/api/influencer-catalog/status?kind=${kind}`) as Promise<CatalogStatusResponse>;
  },

  setupCatalog: (
    kind: CatalogKind,
    data: {
      storeName: string;
      businessType: CatalogBusinessType;
      description?: string;
    }
  ) => api.post(`/api/influencer-catalog/setup?kind=${kind}`, data) as Promise<MyCatalogResponse>,

  setCoverImage: (kind: CatalogKind, imageUrl: string) =>
    api.post(`/api/influencer-catalog/cover-image?kind=${kind}`, {
      imageUrl,
    }) as Promise<MyCatalogResponse>,

  addCategory: (kind: CatalogKind, data: { name: string; description?: string }) =>
    api.post(`/api/influencer-catalog/categories?kind=${kind}`, data),

  updateCategory: (
    kind: CatalogKind,
    categoryId: string,
    data: { name?: string; description?: string }
  ) => api.put(`/api/influencer-catalog/categories/${categoryId}?kind=${kind}`, data),

  deleteCategory: (kind: CatalogKind, categoryId: string) =>
    api.delete(`/api/influencer-catalog/categories/${categoryId}?kind=${kind}`),

  addProduct: (
    kind: CatalogKind,
    data: {
      categoryId: string;
      name: string;
      price: number;
      description?: string;
      imageUrl?: string;
      durationMinutes?: number;
      visitType?: 'home' | 'salon' | 'center' | 'online' | 'virtual';
      priceUnit?: 'per_session' | 'per_hour';
    }
  ) => api.post(`/api/influencer-catalog/products?kind=${kind}`, data),

  updateProduct: (
    kind: CatalogKind,
    productId: string,
    data: Partial<{
      name: string;
      description: string;
      price: number;
      imageUrl: string | null;
      isAvailable: boolean;
      durationMinutes: number | null;
      visitType: 'home' | 'salon' | 'center' | 'online' | 'virtual' | null;
      priceUnit: 'per_session' | 'per_hour' | null;
    }>
  ) => api.put(`/api/influencer-catalog/products/${productId}?kind=${kind}`, data),

  deleteProduct: (kind: CatalogKind, productId: string) =>
    api.delete(`/api/influencer-catalog/products/${productId}?kind=${kind}`),

  uploadImage: async (
    uri: string,
    fileName: string,
    mimeType: string,
    purpose?: 'cover'
  ): Promise<string> => {
    const form = new FormData();
    form.append('file', {
      uri,
      name: fileName,
      type: mimeType,
    } as unknown as Blob);
    const endpoint = purpose
      ? `/api/influencer-catalog/upload-image?purpose=${purpose}`
      : '/api/influencer-catalog/upload-image';
    const res = (await api.post(endpoint, form)) as {
      imageUrl?: string;
    };
    if (!res.imageUrl) throw new Error('Upload succeeded but no image URL returned');
    return res.imageUrl;
  },

  submitForReview: (kind: CatalogKind) =>
    api.post(`/api/influencer-catalog/submit?kind=${kind}`, {}) as Promise<{
      success: boolean;
      message: string;
      catalog: InfluencerCatalog;
    }>,

  reopenCatalog: (kind: CatalogKind) =>
    api.post(`/api/influencer-catalog/reopen?kind=${kind}`, {}) as Promise<MyCatalogResponse>,
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
