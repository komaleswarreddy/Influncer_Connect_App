import type { CatalogBusinessType } from './catalog-api';

/** Suggested category names shown as quick-select chips on the builder screen. Last entry is always "Other". */
const RECOMMENDED_CATEGORIES: Record<CatalogBusinessType, string[]> = {
  restaurant: ['Starters', 'Main Course', 'Desserts', 'Beverages', 'Combos', 'Other'],
  food: ['Meals', 'Snacks', 'Beverages', 'Combos', 'Specials', 'Other'],
  clothing: ['Men', 'Women', 'Kids', 'Accessories', 'New Arrivals', 'Other'],
  shoes: ["Men's Shoes", "Women's Shoes", "Kids' Shoes", 'Sports', 'Accessories', 'Other'],
  beauty: ['Skincare', 'Makeup', 'Haircare', 'Fragrances', 'Tools & Accessories', 'Other'],
  digital: ['Courses', 'Templates', 'E-books', 'Subscriptions', 'Bundles', 'Other'],
  services: ['Consultations', 'Packages', 'Add-ons', 'Home Visits', 'Online Sessions', 'Other'],
  other: ['Featured', 'Bestsellers', 'New Arrivals', 'Combos', 'Deals', 'Other'],
};

export function getRecommendedCategories(businessType?: CatalogBusinessType | null): string[] {
  if (!businessType) return RECOMMENDED_CATEGORIES.other;
  return RECOMMENDED_CATEGORIES[businessType] ?? RECOMMENDED_CATEGORIES.other;
}
