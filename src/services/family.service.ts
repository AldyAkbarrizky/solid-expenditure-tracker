import api from "./api";
import { ApiResponse, User } from "../types";

export const familyService = {
  async createFamily(name: string) {
    const response = await api.post<ApiResponse<any>>("/families", { name });
    return response.data;
  },

  async joinFamily(inviteCode: string) {
    const response = await api.post<ApiResponse<any>>("/families/join", {
      inviteCode,
    });
    return response.data;
  },

  async getFamilyMembers() {
    const response = await api.get<ApiResponse<User[]>>("/families/members");
    return response.data;
  },
};
