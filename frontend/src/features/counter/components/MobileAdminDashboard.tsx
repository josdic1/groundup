import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  ClipboardList,
  Globe,
  LayoutList,
  RefreshCw,
  ShoppingCart,
  Users,
  WandSparkles,
} from 'lucide-react';
import type { Order } from '@groundup/shared-types';
import { fetchOrders } from '../../../api/orders';
import { resetToDemoData } from '../../../api/demo';
import { useCustomers } from '../../../hooks/useCustomers';
import { useMenu } from '../../../hooks/useMenu';

function isActive(order: Order) {
  return order.status === 'placed' || order.status === 'in_prep' || order.status === 'ready';
}

function isToday(ts: number) {
  const date = new Date(ts);
  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function money(value: number) {
  return `$${value.toFixed(2)}`;
}

export default function MobileAdminDashboard() {
  const navigate = useNavigate();
  const { customers } = useCustomers();
  const { menu } = useMenu();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  const loadOrders = async () => {
    setLoading(true);

    try {
      const data = await fetchOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const stats = useMemo(() => {
    const active = orders.filter(isActive);
    const today = orders.filter((order) => isToday(order.createdAt) && order.status !== 'cancelled');

    return {
      active,
      placed: active.filter((order) => order.status === 'placed').length,
      inPrep: active.filter((order) => order.status === 'in_prep').length,
      ready: active.filter((order) => order.status === 'ready').length,
      todayRevenue: today.reduce((sum, order) => sum + order.total, 0),
      todayOrders: today.length,
    };
  }, [orders]);

  const recentActive = useMemo(() => {
    return stats.active
      .slice()
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5);
  }, [stats.active]);

  const loadDemoData = async () => {
    setWorking(true);

    try {
      await resetToDemoData();
      await loadOrders();
    } catch (err) {
      console.error(err);
      alert('Could not load demo data — is the server running?');
    } finally {
      setWorking(false);
    }
  };

  return (
    <main className="mobile-admin-dashboard">
      <header className="mobile-admin-hero">
        <span>Mobile admin</span>
        <h1>Today</h1>
        <p>Orders, customers, menu, and reports in one mobile view.</p>

        <button type="button" onClick={loadOrders}>
          <RefreshCw size={15} />
          Refresh
        </button>
      </header>

      <section className="mobile-admin-main-card">
        <div className="mobile-admin-main-top">
          <span>Active orders</span>
          <strong>{stats.active.length}</strong>
        </div>

        <div className="mobile-admin-status-grid">
          <button type="button" onClick={() => navigate('/orders')}>
            <span>Placed</span>
            <strong>{stats.placed}</strong>
          </button>

          <button type="button" onClick={() => navigate('/orders')}>
            <span>In prep</span>
            <strong>{stats.inPrep}</strong>
          </button>

          <button type="button" onClick={() => navigate('/orders')}>
            <span>Ready</span>
            <strong>{stats.ready}</strong>
          </button>
        </div>
      </section>

      <section className="mobile-admin-kpis">
        <div>
          <span>Today revenue</span>
          <strong>{money(stats.todayRevenue)}</strong>
        </div>

        <div>
          <span>Today orders</span>
          <strong>{stats.todayOrders}</strong>
        </div>

        <div>
          <span>Customers</span>
          <strong>{customers.length}</strong>
        </div>

        <div>
          <span>Menu items</span>
          <strong>{menu.length}</strong>
        </div>
      </section>

      <section className="mobile-admin-actions">
        <button type="button" onClick={loadDemoData} disabled={working}>
          <WandSparkles size={16} />
          {working ? 'Loading…' : 'Load demo data'}
        </button>

        <button type="button" onClick={() => navigate('/online')}>
          <ShoppingCart size={16} />
          Test online order
        </button>
      </section>

      <section className="mobile-admin-section">
        <h2>Quick access</h2>

        <div className="mobile-admin-links">
          <button type="button" onClick={() => navigate('/orders')}>
            <ClipboardList size={17} />
            <span>
              <strong>Orders</strong>
              <small>Search and manage orders</small>
            </span>
          </button>

          <button type="button" onClick={() => navigate('/online')}>
            <Globe size={17} />
            <span>
              <strong>Online</strong>
              <small>Test customer ordering</small>
            </span>
          </button>

          <button type="button" onClick={() => navigate('/customers')}>
            <Users size={17} />
            <span>
              <strong>Customers</strong>
              <small>Profiles and history</small>
            </span>
          </button>

          <button type="button" onClick={() => navigate('/menu')}>
            <LayoutList size={17} />
            <span>
              <strong>Menu</strong>
              <small>Items and prices</small>
            </span>
          </button>

          <button type="button" onClick={() => navigate('/reports')}>
            <BarChart3 size={17} />
            <span>
              <strong>Reports</strong>
              <small>Sales dashboard</small>
            </span>
          </button>
        </div>
      </section>

      <section className="mobile-admin-section">
        <h2>Live order pulse</h2>

        <div className="mobile-admin-orders">
          {loading && <p>Loading orders…</p>}

          {!loading && recentActive.length === 0 && <p>No active orders right now.</p>}

          {!loading &&
            recentActive.map((order) => (
              <button key={order.id} type="button" onClick={() => navigate('/orders')}>
                <span>{order.status.replace('_', ' ')}</span>
                <strong>{order.customerName || 'Walk-in'}</strong>
                <small>{money(order.total)} · {order.items.length} item{order.items.length === 1 ? '' : 's'}</small>
              </button>
            ))}
        </div>
      </section>
    </main>
  );
}
