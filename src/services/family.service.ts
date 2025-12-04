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

  async kickMember(userId: number) {
    const response = await api.delete<ApiResponse<void>>(`/families/members/${userId}`);
    return response.data;
  },

  async updateFamily(data: FormData) {
    const response = await api.put<ApiResponse<Family>>("/families/profile", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};
