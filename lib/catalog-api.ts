import { api } from './api';
import { formatInr } from './currency';

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
    if (!res?.catalog) throw new Error('Catalog not found');
    return normalizeCatalog(res.catalog);
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

/** @deprecated use `formatInr` from `@/lib/currency` directly — kept as an alias for existing callers. */
export const formatCatalogInr = formatInr;

export function catalogProductCount(catalog: InfluencerCatalog | null): number {
  if (!catalog) return 0;
  return catalog.categories.reduce((sum, c) => sum + c.products.length, 0);
}

/** All products across every category, in category order. No cap, no availability filter —
 *  callers that need a bounded preview (e.g. a 4-tile grid) should slice/filter the result. */
export function flattenCatalogProducts(catalog: InfluencerCatalog | null): CatalogProduct[] {
  if (!catalog?.categories?.length) return [];
  return catalog.categories.flatMap((c) => c.products ?? []);
}

/** Product id → owning category name, for rendering a product's category as a meta subtitle. */
export function buildCategoryByProductId(catalog: InfluencerCatalog | null): Map<string, string> {
  const map = new Map<string, string>();
  for (const cat of catalog?.categories ?? []) {
    for (const p of cat.products ?? []) {
      map.set(p.id, cat.name);
    }
  }
  return map;
}

export function isCatalogSetupComplete(catalog: InfluencerCatalog | null): boolean {
  if (!catalog) return false;
  return catalog.storeName !== 'My Catalog' || catalog.categories.length > 0;
}

function asHttpUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return null;
  return trimmed;
}

/** Uploaded product photo — never a bundled niche/onboarding fallback. */
export function productImageUrl(product: CatalogProduct | null | undefined): string | null {
  if (!product) return null;
  const raw = product as CatalogProduct & { image_url?: string | null; photoUrl?: string | null };
  return asHttpUrl(product.imageUrl) ?? asHttpUrl(raw.image_url) ?? asHttpUrl(raw.photoUrl);
}

export function catalogCoverUrl(catalog: InfluencerCatalog | null | undefined): string | null {
  if (!catalog) return null;
  const raw = catalog as InfluencerCatalog & { cover_image_url?: string | null };
  return asHttpUrl(catalog.coverImageUrl) ?? asHttpUrl(raw.cover_image_url);
}

/** Home/storefront hero: uploaded catalog cover only — never a product photo. */
export function catalogHeroImageUrl(catalog: InfluencerCatalog | null): string | null {
  return catalogCoverUrl(catalog);
}

export function catalogImageSource(url: string | null | undefined): { uri: string } | null {
  const resolved = asHttpUrl(url);
  return resolved ? { uri: resolved } : null;
}

/** Map snake_case upload fields so list UIs always read `imageUrl` / `coverImageUrl`. */
export function normalizeCatalog(catalog: InfluencerCatalog): InfluencerCatalog {
  return {
    ...catalog,
    coverImageUrl: catalogCoverUrl(catalog),
    categories: (catalog.categories ?? []).map((category) => ({
      ...category,
      products: (category.products ?? []).map((product) => ({
        ...product,
        imageUrl: productImageUrl(product),
      })),
    })),
  };
}
