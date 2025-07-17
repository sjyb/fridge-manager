export interface ConsumptionData {
  date: string;
  consumed: number;
  wasted: number;
}

export interface ShoppingSuggestion {
  category: string;
  items: string[];
  completed: boolean;
}
