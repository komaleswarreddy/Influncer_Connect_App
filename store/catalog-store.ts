import { create } from 'zustand';
import {
  catalogApi,
  type CatalogBusinessType,
  type InfluencerCatalog,
} from '@/lib/catalog-api';

interface CatalogBuilderState {
  catalog: InfluencerCatalog | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  fetchMyCatalog: () => Promise<void>;
  setupCatalog: (data: {
    storeName: string;
    businessType: CatalogBusinessType;
    description?: string;
  }) => Promise<void>;
  addCategory: (name: string) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  addProduct: (
    categoryId: string,
    data: { name: string; price: number; description?: string; imageUrl?: string }
  ) => Promise<void>;
  updateProduct: (
    productId: string,
    data: Partial<{
      name: string;
      description: string;
      price: number;
      imageUrl: string | null;
    }>
  ) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  uploadProductImage: (uri: string, fileName: string, mimeType: string) => Promise<string>;
  submitForReview: () => Promise<boolean>;
  reopenCatalog: () => Promise<void>;
  clearError: () => void;
}

function extractCatalog(payload: unknown): InfluencerCatalog | null {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as { catalog?: InfluencerCatalog };
  return p.catalog ?? null;
}

export const useCatalogStore = create<CatalogBuilderState>((set, get) => ({
  catalog: null,
  isLoading: false,
  isSaving: false,
  error: null,

  fetchMyCatalog: async () => {
    set({ isLoading: true, error: null });
    try {
      const catalog = await catalogApi.getMyCatalog();
      set({ catalog, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load catalog',
        isLoading: false,
      });
    }
  },

  setupCatalog: async (data) => {
    set({ isSaving: true, error: null });
    try {
      const res = await catalogApi.setupCatalog(data);
      const catalog = extractCatalog(res) ?? (await catalogApi.getMyCatalog());
      set({ catalog, isSaving: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to save catalog',
        isSaving: false,
      });
      throw err;
    }
  },

  addCategory: async (name) => {
    set({ isSaving: true, error: null });
    try {
      const res = await catalogApi.addCategory({ name });
      const catalog = extractCatalog(res) ?? get().catalog;
      if (catalog) set({ catalog, isSaving: false });
      else await get().fetchMyCatalog();
      set({ isSaving: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to add category',
        isSaving: false,
      });
      throw err;
    }
  },

  deleteCategory: async (categoryId) => {
    set({ isSaving: true, error: null });
    try {
      const res = await catalogApi.deleteCategory(categoryId);
      const catalog = extractCatalog(res);
      if (catalog) set({ catalog, isSaving: false });
      else await get().fetchMyCatalog();
      set({ isSaving: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to delete category',
        isSaving: false,
      });
      throw err;
    }
  },

  addProduct: async (categoryId, data) => {
    set({ isSaving: true, error: null });
    try {
      const res = await catalogApi.addProduct({ categoryId, ...data });
      const catalog = extractCatalog(res);
      if (catalog) set({ catalog, isSaving: false });
      else await get().fetchMyCatalog();
      set({ isSaving: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to add product',
        isSaving: false,
      });
      throw err;
    }
  },

  updateProduct: async (productId, data) => {
    set({ isSaving: true, error: null });
    try {
      const res = await catalogApi.updateProduct(productId, data);
      const catalog = extractCatalog(res);
      if (catalog) set({ catalog, isSaving: false });
      else await get().fetchMyCatalog();
      set({ isSaving: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to update product',
        isSaving: false,
      });
      throw err;
    }
  },

  deleteProduct: async (productId) => {
    set({ isSaving: true, error: null });
    try {
      const res = await catalogApi.deleteProduct(productId);
      const catalog = extractCatalog(res);
      if (catalog) set({ catalog, isSaving: false });
      else await get().fetchMyCatalog();
      set({ isSaving: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to delete product',
        isSaving: false,
      });
      throw err;
    }
  },

  uploadProductImage: async (uri, fileName, mimeType) => {
    return catalogApi.uploadImage(uri, fileName, mimeType);
  },

  submitForReview: async () => {
    set({ isSaving: true, error: null });
    try {
      const res = await catalogApi.submitForReview();
      set({ catalog: res.catalog, isSaving: false });
      return true;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Submission failed',
        isSaving: false,
      });
      return false;
    }
  },

  reopenCatalog: async () => {
    set({ isSaving: true, error: null });
    try {
      const res = await catalogApi.reopenCatalog();
      const catalog = extractCatalog(res) ?? (await catalogApi.getMyCatalog());
      set({ catalog, isSaving: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to reopen catalog',
        isSaving: false,
      });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
