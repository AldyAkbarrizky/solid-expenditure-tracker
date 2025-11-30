import api from "./api";
import { ApiResponse, Category } from "../types";

export const categoryService = {
  async getCategories() {
    const response = await api.get<ApiResponse<Category[]>>("/categories");
    return response.data;
  },

  async createCategory(data: { name: string; icon?: string; color?: string }) {
    const response = await api.post<ApiResponse<Category>>("/categories", data);
    return response.data;
  },
};
