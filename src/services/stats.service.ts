import api from "./api";
import { ApiResponse, MonthlyStats } from "../types";

export const statsService = {
  async getMonthlyStats(family: boolean = false) {
    const response = await api.get<ApiResponse<MonthlyStats>>("/stats/dashboard", {
      params: { family },
    });
    return response.data;
  },

  async getReport(startDate: string, endDate: string, family: boolean = false) {
    const response = await api.get<ApiResponse<any>>("/stats/report", {
      params: { startDate, endDate, family },
    });
    return response.data;
  },
};
