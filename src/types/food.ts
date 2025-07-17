export interface FoodItem {
  id: string;
  name: string;
  type: string;
  quantity: number;
  initialQuantity?: number;
  unit: string;
  position: 'fridge' | 'thawing' | 'freezer';
  expiryDate: string;
  image?: string;
  status?: 'normal' | 'warning' | 'danger';
  isBatch?: boolean;
  batchItems?: FoodItem[];
}

export interface MealRecommendation {
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  meals: {
    type: 'breakfast' | 'lunch' | 'dinner';
    name: string;
    items: {
      name: string;
      ingredients: string[];
    }[];
  }[];
}