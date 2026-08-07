import { create } from 'zustand';
import {
  catalogApi,
  type CatalogBusinessType,
  type CatalogKind,
  type InfluencerCatalog,
} from '@/lib/catalog-api';

type PerKind<T> = { products: T; services: T };

interface CatalogBuilderState {
  catalogs: PerKind<InfluencerCatalog | null>;
  isLoading: PerKind<boolean>;
  isSaving: PerKind<boolean>;
  error: PerKind<string | null>;
  fetchMyCatalog: (kind: CatalogKind) => Promise<void>;
  setupCatalog: (
    kind: CatalogKind,
    data: {
      storeName: string;
      businessType: CatalogBusinessType;
      description?: string;
    }
  ) => Promise<void>;
  addCategory: (kind: CatalogKind, name: string) => Promise<void>;
  deleteCategory: (kind: CatalogKind, categoryId: string) => Promise<void>;
  addProduct: (
    kind: CatalogKind,
    categoryId: string,
    data: {
      name: string;
      price: number;
      description?: string;
      imageUrl?: string;
      durationMinutes?: number;
      visitType?: 'home' | 'salon' | 'center' | 'online' | 'virtual';
      priceUnit?: 'per_session' | 'per_hour';
    }
  ) => Promise<void>;
  updateProduct: (
    kind: CatalogKind,
    productId: string,
    data: Partial<{
      name: string;
      description: string;
      price: number;
      imageUrl: string | null;
      durationMinutes: number | null;
      visitType: 'home' | 'salon' | 'center' | 'online' | 'virtual' | null;
      priceUnit: 'per_session' | 'per_hour' | null;
    }>
  ) => Promise<void>;
  deleteProduct: (kind: CatalogKind, productId: string) => Promise<void>;
  uploadProductImage: (uri: string, fileName: string, mimeType: string) => Promise<string>;
  setCoverImage: (
    kind: CatalogKind,
    uri: string,
    fileName: string,
    mimeType: string
  ) => Promise<void>;
  submitForReview: (kind: CatalogKind) => Promise<boolean>;
  reopenCatalog: (kind: CatalogKind) => Promise<void>;
  clearError: (kind: CatalogKind) => void;
}

function extractCatalog(payload: unknown): InfluencerCatalog | null {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as { catalog?: InfluencerCatalog };
  return p.catalog ?? null;
}

export const useCatalogStore = create<CatalogBuilderState>((set, get) => ({
  catalogs: { products: null, services: null },
  isLoading: { products: false, services: false },
  isSaving: { products: false, services: false },
  error: { products: null, services: null },

  fetchMyCatalog: async (kind) => {
    set((s) => ({
      isLoading: { ...s.isLoading, [kind]: true },
      error: { ...s.error, [kind]: null },
    }));
    try {
      const catalog = await catalogApi.getMyCatalog(kind);
      set((s) => ({
        catalogs: { ...s.catalogs, [kind]: catalog },
        isLoading: { ...s.isLoading, [kind]: false },
      }));
    } catch (err) {
      set((s) => ({
        error: {
          ...s.error,
          [kind]: err instanceof Error ? err.message : 'Failed to load catalog',
        },
        isLoading: { ...s.isLoading, [kind]: false },
      }));
    }
  },

  setupCatalog: async (kind, data) => {
    set((s) => ({
      isSaving: { ...s.isSaving, [kind]: true },
      error: { ...s.error, [kind]: null },
    }));
    try {
      const res = await catalogApi.setupCatalog(kind, data);
      const catalog = extractCatalog(res) ?? (await catalogApi.getMyCatalog(kind));
      set((s) => ({
        catalogs: { ...s.catalogs, [kind]: catalog },
        isSaving: { ...s.isSaving, [kind]: false },
      }));
    } catch (err) {
      set((s) => ({
        error: {
          ...s.error,
          [kind]: err instanceof Error ? err.message : 'Failed to save catalog',
        },
        isSaving: { ...s.isSaving, [kind]: false },
      }));
      throw err;
    }
  },

  addCategory: async (kind, name) => {
    set((s) => ({
      isSaving: { ...s.isSaving, [kind]: true },
      error: { ...s.error, [kind]: null },
    }));
    try {
      const res = await catalogApi.addCategory(kind, { name });
      const catalog = extractCatalog(res) ?? get().catalogs[kind];
      if (catalog) set((s) => ({ catalogs: { ...s.catalogs, [kind]: catalog } }));
      else await get().fetchMyCatalog(kind);
      set((s) => ({ isSaving: { ...s.isSaving, [kind]: false } }));
    } catch (err) {
      set((s) => ({
        error: {
          ...s.error,
          [kind]: err instanceof Error ? err.message : 'Failed to add category',
        },
        isSaving: { ...s.isSaving, [kind]: false },
      }));
      throw err;
    }
  },

  deleteCategory: async (kind, categoryId) => {
    set((s) => ({
      isSaving: { ...s.isSaving, [kind]: true },
      error: { ...s.error, [kind]: null },
    }));
    try {
      const res = await catalogApi.deleteCategory(kind, categoryId);
      const catalog = extractCatalog(res);
      if (catalog) set((s) => ({ catalogs: { ...s.catalogs, [kind]: catalog } }));
      else await get().fetchMyCatalog(kind);
      set((s) => ({ isSaving: { ...s.isSaving, [kind]: false } }));
    } catch (err) {
      set((s) => ({
        error: {
          ...s.error,
          [kind]: err instanceof Error ? err.message : 'Failed to delete category',
        },
        isSaving: { ...s.isSaving, [kind]: false },
      }));
      throw err;
    }
  },

  addProduct: async (kind, categoryId, data) => {
    set((s) => ({
      isSaving: { ...s.isSaving, [kind]: true },
      error: { ...s.error, [kind]: null },
    }));
    try {
      const res = await catalogApi.addProduct(kind, { categoryId, ...data });
      const catalog = extractCatalog(res);
      if (catalog) set((s) => ({ catalogs: { ...s.catalogs, [kind]: catalog } }));
      else await get().fetchMyCatalog(kind);
      set((s) => ({ isSaving: { ...s.isSaving, [kind]: false } }));
    } catch (err) {
      set((s) => ({
        error: { ...s.error, [kind]: err instanceof Error ? err.message : 'Failed to add product' },
        isSaving: { ...s.isSaving, [kind]: false },
      }));
      throw err;
    }
  },

  updateProduct: async (kind, productId, data) => {
    set((s) => ({
      isSaving: { ...s.isSaving, [kind]: true },
      error: { ...s.error, [kind]: null },
    }));
    try {
      const res = await catalogApi.updateProduct(kind, productId, data);
      const catalog = extractCatalog(res);
      if (catalog) set((s) => ({ catalogs: { ...s.catalogs, [kind]: catalog } }));
      else await get().fetchMyCatalog(kind);
      set((s) => ({ isSaving: { ...s.isSaving, [kind]: false } }));
    } catch (err) {
      set((s) => ({
        error: {
          ...s.error,
          [kind]: err instanceof Error ? err.message : 'Failed to update product',
        },
        isSaving: { ...s.isSaving, [kind]: false },
      }));
      throw err;
    }
  },

  deleteProduct: async (kind, productId) => {
    set((s) => ({
      isSaving: { ...s.isSaving, [kind]: true },
      error: { ...s.error, [kind]: null },
    }));
    try {
      const res = await catalogApi.deleteProduct(kind, productId);
      const catalog = extractCatalog(res);
      if (catalog) set((s) => ({ catalogs: { ...s.catalogs, [kind]: catalog } }));
      else await get().fetchMyCatalog(kind);
      set((s) => ({ isSaving: { ...s.isSaving, [kind]: false } }));
    } catch (err) {
      set((s) => ({
        error: {
          ...s.error,
          [kind]: err instanceof Error ? err.message : 'Failed to delete product',
        },
        isSaving: { ...s.isSaving, [kind]: false },
      }));
      throw err;
    }
  },

  uploadProductImage: async (uri, fileName, mimeType) => {
    return catalogApi.uploadImage(uri, fileName, mimeType);
  },

  setCoverImage: async (kind, uri, fileName, mimeType) => {
    set((s) => ({
      isSaving: { ...s.isSaving, [kind]: true },
      error: { ...s.error, [kind]: null },
    }));
    try {
      const imageUrl = await catalogApi.uploadImage(uri, fileName, mimeType, 'cover');
      const res = await catalogApi.setCoverImage(kind, imageUrl);
      const catalog = extractCatalog(res) ?? (await catalogApi.getMyCatalog(kind));
      set((s) => ({
        catalogs: { ...s.catalogs, [kind]: catalog },
        isSaving: { ...s.isSaving, [kind]: false },
      }));
    } catch (err) {
      set((s) => ({
        error: {
          ...s.error,
          [kind]: err instanceof Error ? err.message : 'Failed to set cover image',
        },
        isSaving: { ...s.isSaving, [kind]: false },
      }));
      throw err;
    }
  },

  submitForReview: async (kind) => {
    set((s) => ({
      isSaving: { ...s.isSaving, [kind]: true },
      error: { ...s.error, [kind]: null },
    }));
    try {
      const res = await catalogApi.submitForReview(kind);
      set((s) => ({
        catalogs: { ...s.catalogs, [kind]: res.catalog },
        isSaving: { ...s.isSaving, [kind]: false },
      }));
      return true;
    } catch (err) {
      set((s) => ({
        error: { ...s.error, [kind]: err instanceof Error ? err.message : 'Submission failed' },
        isSaving: { ...s.isSaving, [kind]: false },
      }));
      return false;
    }
  },

  reopenCatalog: async (kind) => {
    set((s) => ({
      isSaving: { ...s.isSaving, [kind]: true },
      error: { ...s.error, [kind]: null },
    }));
    try {
      const res = await catalogApi.reopenCatalog(kind);
      const catalog = extractCatalog(res) ?? (await catalogApi.getMyCatalog(kind));
      set((s) => ({
        catalogs: { ...s.catalogs, [kind]: catalog },
        isSaving: { ...s.isSaving, [kind]: false },
      }));
    } catch (err) {
      set((s) => ({
        error: {
          ...s.error,
          [kind]: err instanceof Error ? err.message : 'Failed to reopen catalog',
        },
        isSaving: { ...s.isSaving, [kind]: false },
      }));
      throw err;
    }
  },

  clearError: (kind) => set((s) => ({ error: { ...s.error, [kind]: null } })),
}));
