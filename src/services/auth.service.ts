import api from "./api";
import { ApiResponse, User } from "../types";

export const authService = {
  async updateProfile(formData: FormData) {
    const response = await api.put<ApiResponse<User>>("/auth/profile", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};
