import api from "./api";
import { ApiResponse, Transaction } from "../types";

export const transactionService = {
  async getTransactions(params?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
    family?: boolean;
    itemName?: string;
    categoryId?: number;
    filterUserId?: number;
  }) {
    const response = await api.get<ApiResponse<Transaction[]> & { results: number }>(
      "/transactions",
      { params }
    );
    return response.data;
  },

  async getRecentTransactions() {
    const response = await api.get<ApiResponse<Transaction[]>>(
      "/transactions/recent"
    );
    return response.data;
  },

  async createTransaction(data: FormData) {
    const response = await api.post<ApiResponse<Transaction>>(
      "/transactions",
      data,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  async getTransactionById(id: number) {
    const response = await api.get<ApiResponse<Transaction>>(`/transactions/${id}`);
    return response.data;
  },

  async deleteTransaction(id: number) {
    const response = await api.delete<ApiResponse<null>>(`/transactions/${id}`);
    return response.data;
  },

  async updateTransaction(id: number, data: FormData) {
    const response = await api.put<ApiResponse<Transaction>>(
      `/transactions/${id}`,
      data,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  async scanReceipt(imageUris: string[]) {
    const formData = new FormData();
    imageUris.forEach((uri, index) => {
      formData.append("images", {
        uri: uri,
        name: `receipt_${index}.jpg`,
        type: "image/jpeg",
      } as any);
    });

    const response = await api.post("/ocr/scan", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};
