export const STORE_CONFIG = {
  name: 'Maple Kosher Meats',
  staff: ['Mike', 'Dani', 'Sam'],
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  orderStreamPollIntervalMs: 3000,
  saturdayClosed: true,
};

export type StaffName = (typeof STORE_CONFIG.staff)[number];
