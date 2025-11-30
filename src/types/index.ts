export interface User {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string;
  familyId?: number;
}

export interface Category {
  id: number;
  name: string;
  icon?: string;
  color?: string;
  isDefault: boolean;
}

export interface TransactionItem {
  id?: number;
  transactionId?: number;
  categoryId?: number;
  category?: Category;
  name: string;
  price: number;
  qty: number;
}

export interface Transaction {
  id: number;
  userId: number;
  user?: User;
  totalAmount: number;
  transactionDate: string;
  type: 'RECEIPT' | 'QRIS' | 'MANUAL';
  imageUrl?: string;
  rawOcrText?: string;
  items?: TransactionItem[];
  createdAt: string;
}

export interface MonthlyStats {
  month: string;
  totalExpense: number;
  lineChart: {
    date: string;
    total: number;
  }[];
  pieChart: {
    categoryName: string;
    total: number;
    color: string;
    icon: string;
  }[];
}

export interface ApiResponse<T> {
  status: string;
  message?: string;
  data: T;
}
