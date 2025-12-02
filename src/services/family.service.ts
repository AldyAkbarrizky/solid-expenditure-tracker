import api from "./api";
import { ApiResponse, User, FamilyMembersResponse, Family } from "../types";

export const familyService = {
  async createFamily(name: string) {
    const response = await api.post<ApiResponse<Family>>("/families", { name });
    return response.data;
  },

  async joinFamily(inviteCode: string) {
    const response = await api.post<ApiResponse<Family>>("/families/join", {
      inviteCode,
    });
    return response.data;
  },

  async getFamilyMembers() {
    const response = await api.get<ApiResponse<FamilyMembersResponse>>("/families/members");
    return response.data;
  },
};
