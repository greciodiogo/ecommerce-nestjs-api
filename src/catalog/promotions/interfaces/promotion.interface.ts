export interface PromotionSummary {
  id: number;
  name: string;
  description: string;
  discount: number;
  isActive: boolean;
  startDate: Date;
  endDate: Date;
  categoryCount: number;
}

export interface ActivePromotion {
  id: number;
  name: string;
  description: string;
  discount: number;
  endDate: Date;
  products: Array<{
    id: number;
    name: string;
  }>;
} 