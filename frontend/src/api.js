import axios from 'axios';

export const API = import.meta.env.VITE_API_URL ;
// console.log(API, "API");


const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const resumeDownloadUrl = `${API}/resume/download`;
// console.log(resumeDownloadUrl, "resume");


export const errMsg = (e) => e?.response?.data?.message || e?.message || 'Something went wrong';

export default api;
