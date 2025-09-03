import axios from 'axios';

// Works in dev with Vite proxy (`/api`), and allows overriding with an env for prod
const base = import.meta.env.VITE_API_BASE || '/api';

export const api = axios.create({ baseURL: base });
