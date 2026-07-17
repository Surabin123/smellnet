import axios from "axios";

const api = axios.create({ baseURL: "/api" });

export const getOverview = () => api.get("/overview").then((r) => r.data);
export const getHeatmap = () => api.get("/heatmap").then((r) => r.data);
export const getHotspots = (days = 7, limit = 10) =>
  api.get(`/hotspots?days=${days}&limit=${limit}`).then((r) => r.data);
export const getCities = (params = {}) =>
  api.get("/cities", { params }).then((r) => r.data);
export const getCityDetail = (id) => api.get(`/city/${id}`).then((r) => r.data);
export const getCityTrend = (id, days = 14) =>
  api.get(`/city/${id}/trend?days=${days}`).then((r) => r.data);
export const getCityPeakHours = (id) =>
  api.get(`/city/${id}/peak-hours`).then((r) => r.data);

export default api;
