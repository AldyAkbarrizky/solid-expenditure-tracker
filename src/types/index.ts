export interface User {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string;
  familyId?: number;
}

export interface Family {
  id: number;
  name: string;
  inviteCode: string;
  adminId: number;
}

export interface FamilyMembersResponse {
  family: Family;
  members: User[];
}

export interface Category {
  id: number;
  name: string;
  icon?: string;
  color?: string;
  isDefault: boolean;
}

export interface TransactionFee {
  id?: number;
  transactionId?: number;
  name: string;
  amount: number;
}

export interface TransactionDiscount {
  id?: number;
  transactionId?: number;
  name: string;
  amount: number;
  type: 'PERCENT' | 'NOMINAL';
  value: number;
}

export interface TransactionItem {
  id?: number;
  transactionId?: number;
  categoryId?: number;
  category?: Category;
  name: string;
  price: number;
  qty: number;
  basePrice?: number | null;
  discountType?: 'PERCENT' | 'NOMINAL' | null;
  discountValue?: number | null;
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
  fees?: TransactionFee[];
  discounts?: TransactionDiscount[];
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
