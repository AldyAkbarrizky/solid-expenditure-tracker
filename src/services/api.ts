import axios from "axios";
import * as SecureStore from "expo-secure-store";

// const BASE_URL = "https://expenditure-api.solidtechno.com/api";
const BASE_URL = "http://192.168.100.222:8000/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
