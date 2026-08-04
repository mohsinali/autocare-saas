import axios from "axios";
import { sessionStore } from "../auth/session";
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1",
  headers: { "Content-Type": "application/json" },
});
api.interceptors.request.use((config) => {
  const token = sessionStore.get()?.accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      typeof window !== "undefined"
    ) {
      sessionStore.clear();
      window.location.assign("/login");
    }
    return Promise.reject(error);
  },
);
