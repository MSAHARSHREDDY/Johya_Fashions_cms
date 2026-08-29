export type Category = 'Women' | 'Men' | 'Boys' | 'Girls';

export interface Customer {
  _id: string;
  name: string;
  phoneNumber: string;
  lastPurchaseDate: string;
  categories: Category[];
  price: number;
  rewards: number;
  visits: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerFormData {
  name: string;
  phoneNumber: string;
  lastPurchaseDate: Date;
  categories: Category[];
  price: number;
  rewards: number;
}

export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CustomersResponse {
  success: boolean;
  data: Customer[];
  pagination: PaginationData;
}

export interface DashboardStats {
  totalCustomers: number;
  totalPurchaseValue: number;
  totalRewards: number;
  categories: Record<Category, number>;
  revenueData?: { date: string; revenue: number }[];
  customerGrowth?: number;
  rewardsRedeemedPercentage?: number;
}

export interface StatsResponse {
  success: boolean;
  data: DashboardStats;
}

export interface SingleCustomerResponse {
  success: boolean;
  data: Customer;
}
