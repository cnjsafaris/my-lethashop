export const config = {
  apiUrl: import.meta.env.VITE_API_URL || '/.netlify/functions/api',
  appUrl: import.meta.env.VITE_APP_URL || 'http://localhost:5173',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};