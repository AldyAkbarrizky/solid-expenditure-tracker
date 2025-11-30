import api from "./api";
import { ApiResponse, MonthlyStats } from "../types";

export const statsService = {
  async getMonthlyStats() {
    const response = await api.get<ApiResponse<MonthlyStats>>("/stats/dashboard");
    return response.data;
  },
};
