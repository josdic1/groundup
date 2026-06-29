import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowDownUp,
  CalendarDays,
  ClipboardList,
  PackageCheck,
  Receipt,
  Search,
  Store,
  Truck,
} from 'lucide-react';
import type { Order } from '@groundup/shared-types';
import { fetchOrders } from '../../api/orders';
import './OrdersPage.css';

type StatusFilter = 'all' | Order['status'];
type SourceFilter = 'all' | Order['source'];
type FulfillmentFilter = 'all' | Order['fulfillment'];
type DateFilter = 'all' | 'today' | 'last7' | 'last30';
type SortKey = 'newest' | 'oldest' | 'totalHigh' | 'totalLow' | 'customer' | 'status';

const STATUS_LABEL: Record<Order['status'], string> = {
  placed: 'Placed',
  in_prep: 'In prep',
  ready: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const SOURCE_LABEL: Record<Order['source'], string> = {
  counter: 'Counter',
  online: 'Online',
};

const FULFILLMENT_LABEL: Record<Order['fulfillment'], string> = {
  in_store: 'In-store',
  pickup: 'Pickup',
  delivery: 'Delivery',
};

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getOrderItems(order: Order): string {
  return order.items.map((item) => item.name).join(', ');
}

function matchesDate(order: Order, filter: DateFilter): boolean {
  if (filter === 'all') return true;

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  if (filter === 'today') {
    return order.createdAt >= start.getTime();
  }

  const days = filter === 'last7' ? 7 : 30;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  cutoff.setHours(0, 0, 0, 0);

  return order.createdAt >= cutoff.getTime();
}

function getFocusCopy(params: {
  status: StatusFilter;
  fulfillment: FulfillmentFilter;
  dateFilter: DateFilter;
  sort: SortKey;
}) {
  if (params.status !== 'all') {
    return {
      label: 'Current view',
      title: `${STATUS_LABEL[params.status]} orders`,
      body: 'Only this stage is shown. Use it to clear one operational lane at a time.',
      icon: PackageCheck,
      tone: 'rare',
    };
  }

  if (params.fulfillment === 'delivery') {
    return {
      label: 'Current view',
      title: 'Delivery orders',
      body: 'Delivery work is isolated so addresses, notes, and timing stay easy to review.',
      icon: Truck,
      tone: 'sage',
    };
  }

  if (params.fulfillment === 'pickup') {
    return {
      label: 'Current view',
      title: 'Pickup orders',
      body: 'Pickup work is grouped for faster handoff at the counter.',
      icon: Store,
      tone: 'ochre',
    };
  }

  if (params.sort === 'totalHigh') {
    return {
      label: 'Current view',
      title: 'Highest totals first',
      body: 'Large orders are surfaced first for review, prep priority, and follow-up.',
      icon: Receipt,
      tone: 'rare',
    };
  }

  if (params.dateFilter !== 'all') {
    return {
      label: 'Current view',
      title: params.dateFilter === 'today' ? "Today’s orders" : 'Recent orders',
      body: 'The table is narrowed to the selected time window.',
      icon: CalendarDays,
      tone: 'sage',
    };
  }

  return {
    label: 'Current view',
    title: 'All orders',
    body: 'Search, filter, and sort every order from one simple control page.',
    icon: ClipboardList,
    tone: 'ink',
  };
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [fulfillmentFilter, setFulfillmentFilter] = useState<FulfillmentFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [sort, setSort] = useState<SortKey>('newest');

  useEffect(() => {
    fetchOrders()
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredOrders = useMemo(() => {
    const q = query.trim().toLowerCase();

    const nextOrders = orders.filter((order) => {
      const searchable = [
        order.id,
        order.customerName,
        order.status,
        order.source,
        order.fulfillment,
        getOrderItems(order),
      ]
        .join(' ')
        .toLowerCase();

      return (
        (!q || searchable.includes(q)) &&
        (statusFilter === 'all' || order.status === statusFilter) &&
        (sourceFilter === 'all' || order.source === sourceFilter) &&
        (fulfillmentFilter === 'all' || order.fulfillment === fulfillmentFilter) &&
        matchesDate(order, dateFilter)
      );
    });

    return nextOrders.sort((a, b) => {
      if (sort === 'newest') return b.createdAt - a.createdAt;
      if (sort === 'oldest') return a.createdAt - b.createdAt;
      if (sort === 'totalHigh') return b.total - a.total;
      if (sort === 'totalLow') return a.total - b.total;
      if (sort === 'customer') return a.customerName.localeCompare(b.customerName);
      if (sort === 'status') return a.status.localeCompare(b.status);
      return 0;
    });
  }, [orders, query, statusFilter, sourceFilter, fulfillmentFilter, dateFilter, sort]);

  const activeOrders = filteredOrders.filter((order) =>
    ['placed', 'in_prep', 'ready'].includes(order.status),
  );
  const completedOrders = filteredOrders.filter((order) => order.status === 'completed');
  const revenueOrders = filteredOrders.filter((order) => order.status !== 'cancelled');

  const revenue = revenueOrders.reduce((sum, order) => sum + order.total, 0);
  const avgTicket = revenueOrders.length > 0 ? revenue / revenueOrders.length : 0;

  const focus = getFocusCopy({
    status: statusFilter,
    fulfillment: fulfillmentFilter,
    dateFilter,
    sort,
  });
  const FocusIcon = focus.icon;

  const clearFilters = () => {
    setQuery('');
    setStatusFilter('all');
    setSourceFilter('all');
    setFulfillmentFilter('all');
    setDateFilter('all');
    setSort('newest');
  };

  if (loading) {
    return (
      <div className="orders-loading">
        <ClipboardList size={30} strokeWidth={1.8} />
        Loading orders…
      </div>
    );
  }

  return (
    <div className="orders-page">
      <header className="orders-header">
        <div>
          <span className="page-eyebrow">Maple Kosher Meats</span>
          <h1 className="page-title">Orders</h1>
        </div>
      </header>

      <section className={`orders-hero orders-hero-${focus.tone}`}>
        <div className="orders-hero-copy">
          <span>{focus.label}</span>
          <h2>{focus.title}</h2>
          <p>{focus.body}</p>
        </div>

        <div className="orders-hero-graphic">
          <FocusIcon size={54} strokeWidth={1.6} />
          <div className="orders-hero-bars">
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>
      </section>

      <div className="orders-kpis">
        <div className="kpi-card">
          <span className="kpi-label">Shown</span>
          <span className="kpi-value">{filteredOrders.length}</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Active</span>
          <span className="kpi-value">{activeOrders.length}</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Completed</span>
          <span className="kpi-value">{completedOrders.length}</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Avg ticket</span>
          <span className="kpi-value">${avgTicket.toFixed(2)}</span>
        </div>
      </div>

      <section className="orders-controls panel">
        <div className="orders-search">
          <Search size={16} strokeWidth={2} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customer, item, or order id…"
          />
        </div>

        <label>
          Status
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}>
            <option value="all">All</option>
            <option value="placed">Placed</option>
            <option value="in_prep">In prep</option>
            <option value="ready">Ready</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>

        <label>
          Source
          <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value as SourceFilter)}>
            <option value="all">All</option>
            <option value="counter">Counter</option>
            <option value="online">Online</option>
          </select>
        </label>

        <label>
          Fulfillment
          <select
            value={fulfillmentFilter}
            onChange={(e) => setFulfillmentFilter(e.target.value as FulfillmentFilter)}
          >
            <option value="all">All</option>
            <option value="in_store">In-store</option>
            <option value="pickup">Pickup</option>
            <option value="delivery">Delivery</option>
          </select>
        </label>

        <label>
          Date
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value as DateFilter)}>
            <option value="all">All time</option>
            <option value="today">Today</option>
            <option value="last7">Last 7 days</option>
            <option value="last30">Last 30 days</option>
          </select>
        </label>

        <label>
          Sort
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="totalHigh">Total high</option>
            <option value="totalLow">Total low</option>
            <option value="customer">Customer</option>
            <option value="status">Status</option>
          </select>
        </label>
      </section>

      <section className="orders-table-card panel">
        <div className="orders-table-head">
          <div>
            <h2>Order table</h2>
            <p>
              <Activity size={13} strokeWidth={2} />
              ${revenue.toFixed(2)} revenue in this view
            </p>
          </div>

          <button className="btn btn-secondary" type="button" onClick={clearFilters}>
            Clear filters
          </button>

          <div className="orders-sort-chip">
            <ArrowDownUp size={13} strokeWidth={2} />
            {sort}
          </div>
        </div>

        <div className="orders-table-wrap">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Status</th>
                <th>Source</th>
                <th>Fulfillment</th>
                <th>Date</th>
                <th className="align-right">Total</th>
              </tr>
            </thead>

            <tbody>
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="orders-empty">
                    No orders match these filters.
                  </td>
                </tr>
              )}

              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <strong>{order.id}</strong>
                    <span>{formatTime(order.createdAt)}</span>
                  </td>

                  <td>{order.customerName || 'Walk-in'}</td>

                  <td>
                    <div className="orders-items">
                      {order.items.map((item) => (
                        <span key={`${order.id}-${item.menuItemId}-${item.name}`}>
                          {item.name}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td>
                    <span className={`orders-status orders-status-${order.status}`}>
                      {STATUS_LABEL[order.status]}
                    </span>
                  </td>

                  <td>{SOURCE_LABEL[order.source]}</td>
                  <td>{FULFILLMENT_LABEL[order.fulfillment]}</td>
                  <td>{formatDate(order.createdAt)}</td>
                  <td className="align-right money">${order.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
