import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

export const getApiError = (error, fallback = "Request failed") =>
  error.response?.data?.message || error.message || fallback;

export default api;
