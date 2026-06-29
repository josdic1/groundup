import { STORE_CONFIG } from "../config";

const BASE = STORE_CONFIG.apiBaseUrl;
export type ItemStat = { name: string; revenue: number; unitsSold: number };
export type DayRevenue = { date: string; revenue: number };
export type CategoryRevenue = { category: string; revenue: number };
export type HourCount = { hour: number; count: number };
export type CategoryTrendRow = { date: string } & Record<
  string,
  number | string
>;

export type Stats = {
  todayRevenue: number;
  todayOrderCount: number;
  avgTicket: number;
  activeOrders: number;
  topByRevenue: ItemStat[];
  topByUnits: ItemStat[];
  revenueByDay: DayRevenue[];
  revenueByCategory: CategoryRevenue[];
  categoryTrend: CategoryTrendRow[];
  topCategoryNames: string[];
  busiestHours: HourCount[];
};

export async function fetchStats(): Promise<Stats> {
  const res = await fetch(`${BASE}/stats`);
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}
