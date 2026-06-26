import { useEffect, useState } from 'react';
import { Printer, TrendingUp, ShoppingBag, Receipt, Activity } from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { fetchStats, type Stats } from '../api/stats';
import './Dashboard.css';

const SHORT_CATEGORY: Record<string, string> = {
  'Glatt Kosher Beef (Fresh Cuts)': 'Beef',
  'Fresh Poultry (Chicken & Turkey)': 'Poultry',
  'Premium Lamb & Veal': 'Lamb & Veal',
  "Marinated & Oven-Ready Specials (Butcher's Prep)": 'Prepared',
  'Prepared Deli, Provisions & Shabbos Takeout': 'Deli',
  Beverages: 'Drinks',
};

const CATEGORY_COLORS = ['#a23b2e', '#5c6b47', '#d4a24c', '#6b5a8e'];

function shortCategory(name: string): string {
  return SHORT_CATEGORY[name] ?? name;
}

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatHourLabel(hour: number): string {
  if (hour === 0) return '12am';
  if (hour === 12) return '12pm';
  return hour < 12 ? `${hour}am` : `${hour - 12}pm`;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="dashboard-loading">
        <img src="/maple-logo.png" alt="" className="dashboard-loading-logo" />
        Loading reports…
      </div>
    );
  }

  if (!stats) {
    return <div className="dashboard-loading">Could not load dashboard data.</div>;
  }

  const peakHour = stats.busiestHours.reduce(
    (best, h) => (h.count > best.count ? h : best),
    stats.busiestHours[0]
  );

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <span className="dashboard-eyebrow">Maple Kosher Meats</span>
          <h1>Dashboard</h1>
        </div>
        <button className="print-btn" onClick={handlePrint}>
          <Printer size={15} strokeWidth={2} />
          Print report
        </button>
      </header>

      <div className="glance-cards">
        <div className="glance-card">
          <div className="glance-icon"><Receipt size={16} strokeWidth={2} /></div>
          <span className="glance-label">Today's revenue</span>
          <span className="glance-value">${stats.todayRevenue.toFixed(2)}</span>
        </div>
        <div className="glance-card">
          <div className="glance-icon"><ShoppingBag size={16} strokeWidth={2} /></div>
          <span className="glance-label">Orders today</span>
          <span className="glance-value">{stats.todayOrderCount}</span>
        </div>
        <div className="glance-card">
          <div className="glance-icon"><TrendingUp size={16} strokeWidth={2} /></div>
          <span className="glance-label">Avg ticket</span>
          <span className="glance-value">${stats.avgTicket.toFixed(2)}</span>
        </div>
        <div className="glance-card">
          <div className="glance-icon"><Activity size={16} strokeWidth={2} /></div>
          <span className="glance-label">Active orders</span>
          <span className="glance-value">{stats.activeOrders}</span>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-panel panel-wide">
          <h2>Revenue — last 30 days</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.revenueByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(28,20,16,0.08)" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDayLabel}
                tick={{ fontSize: 11, fill: 'rgba(28,20,16,0.5)' }}
                interval={Math.ceil(stats.revenueByDay.length / 10)}
              />
              <YAxis tick={{ fontSize: 11, fill: 'rgba(28,20,16,0.5)' }} width={50} />
              <Tooltip
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                labelFormatter={(label) => formatDayLabel(label as string)}
              />
              <Bar dataKey="revenue" fill="#a23b2e" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section className="dashboard-panel panel-wide">
          <h2>Category trend — last 30 days</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={stats.categoryTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(28,20,16,0.08)" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDayLabel}
                tick={{ fontSize: 11, fill: 'rgba(28,20,16,0.5)' }}
                interval={Math.ceil(stats.categoryTrend.length / 10)}
              />
              <YAxis tick={{ fontSize: 11, fill: 'rgba(28,20,16,0.5)' }} width={50} />
              <Tooltip
                formatter={(value: number) => `$${Number(value).toFixed(2)}`}
                labelFormatter={(label) => formatDayLabel(label as string)}
              />
              <Legend
                formatter={(value) => shortCategory(value as string)}
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                iconType="line"
                iconSize={14}
              />
              {stats.topCategoryNames.map((cat, i) => (
                <Line
                  key={cat}
                  type="monotone"
                  dataKey={cat}
                  name={cat}
                  stroke={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </section>

        <section className="dashboard-panel">
          <h2>Top items — by revenue</h2>
          <ol className="ranked-list">
            {stats.topByRevenue.map((item, i) => (
              <li key={item.name}>
                <span className="rank-num">{i + 1}</span>
                <span className="rank-name">{item.name}</span>
                <span className="rank-value">${item.revenue.toFixed(2)}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="dashboard-panel">
          <h2>Top items — by units sold</h2>
          <ol className="ranked-list">
            {stats.topByUnits.map((item, i) => (
              <li key={item.name}>
                <span className="rank-num">{i + 1}</span>
                <span className="rank-name">{item.name}</span>
                <span className="rank-value">{item.unitsSold}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="dashboard-panel">
          <h2>Revenue by category</h2>
          <ol className="ranked-list">
            {stats.revenueByCategory.map((c, i) => (
              <li key={c.category}>
                <span className="rank-num">{i + 1}</span>
                <span className="rank-name">{c.category}</span>
                <span className="rank-value">${c.revenue.toFixed(2)}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="dashboard-panel">
          <h2>Busiest hours</h2>
          <p className="dashboard-subnote">
            Peak: {formatHourLabel(peakHour.hour)} ({peakHour.count} orders)
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={stats.busiestHours}>
              <XAxis
                dataKey="hour"
                tickFormatter={formatHourLabel}
                tick={{ fontSize: 10, fill: 'rgba(28,20,16,0.5)' }}
                interval={2}
              />
              <YAxis tick={{ fontSize: 10, fill: 'rgba(28,20,16,0.5)' }} width={30} />
              <Tooltip
                formatter={(value: number) => [value, 'Orders']}
                labelFormatter={(label) => formatHourLabel(label as number)}
              />
              <Bar dataKey="count" fill="#5c6b47" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>
    </div>
  );
}
