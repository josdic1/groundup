import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowDownUp,
  ChevronDown,
  ClipboardList,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import type { Order } from '@groundup/shared-types';
import { fetchOrders } from '../../api/orders';
import './OrdersPage.css';

type StatusFilter = 'all' | Order['status'];
type SourceFilter = 'all' | Order['source'];
type FulfillmentFilter = 'all' | Order['fulfillment'];
type DateFilter = 'all' | 'today' | 'last7' | 'last30';
type SortKey = 'newest' | 'oldest' | 'totalHigh' | 'totalLow' | 'customer' | 'status';

type PillOption<T extends string> = {
  value: T;
  label: string;
};

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

const STATUS_OPTIONS: PillOption<StatusFilter>[] = [
  { value: 'all', label: 'All' },
  { value: 'placed', label: 'Placed' },
  { value: 'in_prep', label: 'Prep' },
  { value: 'ready', label: 'Ready' },
  { value: 'completed', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
];

const SOURCE_OPTIONS: PillOption<SourceFilter>[] = [
  { value: 'all', label: 'All' },
  { value: 'counter', label: 'Counter' },
  { value: 'online', label: 'Online' },
];

const FULFILLMENT_OPTIONS: PillOption<FulfillmentFilter>[] = [
  { value: 'all', label: 'All' },
  { value: 'in_store', label: 'In-store' },
  { value: 'pickup', label: 'Pickup' },
  { value: 'delivery', label: 'Delivery' },
];

const DATE_OPTIONS: PillOption<DateFilter>[] = [
  { value: 'all', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: 'last7', label: '7 days' },
  { value: 'last30', label: '30 days' },
];

const SORT_OPTIONS: PillOption<SortKey>[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'totalHigh', label: 'Biggest' },
  { value: 'totalLow', label: 'Smallest' },
  { value: 'customer', label: 'Customer' },
  { value: 'status', label: 'Status' },
];

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

function FilterPills<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: PillOption<T>[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="orders-filter-group">
      <span className="orders-filter-label">{label}</span>
      <div className="orders-pill-row">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`orders-filter-pill ${value === option.value ? 'active' : ''}`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
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
  const [advancedOpen, setAdvancedOpen] = useState(false);

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

  const advancedFilterCount = [
    sourceFilter !== 'all',
    fulfillmentFilter !== 'all',
    dateFilter !== 'all',
    sort !== 'newest',
  ].filter(Boolean).length;

  const hasAnyFilter =
    query.trim() ||
    statusFilter !== 'all' ||
    sourceFilter !== 'all' ||
    fulfillmentFilter !== 'all' ||
    dateFilter !== 'all' ||
    sort !== 'newest';

  const activeViewLabel = [
    statusFilter !== 'all' ? STATUS_OPTIONS.find((option) => option.value === statusFilter)?.label : null,
    sourceFilter !== 'all' ? SOURCE_OPTIONS.find((option) => option.value === sourceFilter)?.label : null,
    fulfillmentFilter !== 'all'
      ? FULFILLMENT_OPTIONS.find((option) => option.value === fulfillmentFilter)?.label
      : null,
    dateFilter !== 'all' ? DATE_OPTIONS.find((option) => option.value === dateFilter)?.label : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const sortLabel = SORT_OPTIONS.find((option) => option.value === sort)?.label ?? 'Newest';

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

      <section className="orders-view-strip">
        <div>
          <span className="orders-view-label">Current view</span>
          <strong>{activeViewLabel || 'All orders'}</strong>
        </div>
        <span>Sorted by {sortLabel}</span>
      </section>

      <section className="orders-controls panel">
        <div className="orders-controls-main">
          <div className="orders-search orders-search-wide">
            <Search size={16} strokeWidth={2} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search customer, item, or order id…"
            />
            {query.trim() && (
              <button
                className="orders-search-clear"
                type="button"
                aria-label="Clear search"
                onClick={() => setQuery('')}
              >
                <X size={15} strokeWidth={2.2} />
              </button>
            )}
          </div>

          <button
            className={`orders-advanced-toggle ${advancedOpen ? 'open' : ''}`}
            type="button"
            aria-expanded={advancedOpen}
            onClick={() => setAdvancedOpen((value) => !value)}
          >
            <SlidersHorizontal size={15} strokeWidth={2.2} />
            Advanced
            {advancedFilterCount > 0 && (
              <span className="orders-advanced-count">{advancedFilterCount}</span>
            )}
            <ChevronDown size={15} strokeWidth={2.2} />
          </button>
        </div>

        <div className="orders-status-row">
          <FilterPills
            label="Status"
            value={statusFilter}
            options={STATUS_OPTIONS}
            onChange={setStatusFilter}
          />
        </div>

        {advancedOpen && (
          <div className="orders-advanced-panel">
            <div className="orders-advanced-grid">
              <FilterPills
                label="Source"
                value={sourceFilter}
                options={SOURCE_OPTIONS}
                onChange={setSourceFilter}
              />

              <FilterPills
                label="Fulfillment"
                value={fulfillmentFilter}
                options={FULFILLMENT_OPTIONS}
                onChange={setFulfillmentFilter}
              />

              <FilterPills
                label="Date"
                value={dateFilter}
                options={DATE_OPTIONS}
                onChange={setDateFilter}
              />

              <FilterPills
                label="Sort"
                value={sort}
                options={SORT_OPTIONS}
                onChange={setSort}
              />
            </div>

            <div className="orders-advanced-footer">
              <span>Advanced filters refine the table without changing order data.</span>

              {hasAnyFilter && (
                <button className="orders-clear-button" type="button" onClick={clearFilters}>
                  Clear filters
                </button>
              )}
            </div>
          </div>
        )}
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

          <div className="orders-table-actions">
            {hasAnyFilter && (
              <button className="btn btn-secondary" type="button" onClick={clearFilters}>
                Clear filters
              </button>
            )}

            <div className="orders-sort-chip">
              <ArrowDownUp size={13} strokeWidth={2} />
              {sortLabel}
            </div>
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
