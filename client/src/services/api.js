import axios from 'axios';

const base = import.meta.env.VITE_API_BASE || 'https://grading-system-s5p0.onrender.com';

export const api = axios.create({ baseURL: base });
