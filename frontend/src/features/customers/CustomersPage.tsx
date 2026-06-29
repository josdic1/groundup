import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  History,
  Pencil,
  PieChart,
  Search,
  ShoppingCart,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import type { CustomerWithStats, Order } from '@groundup/shared-types';
import {
  fetchCustomersWithStats,
  fetchCustomerOrderHistory,
  createCustomer,
  updateCustomer,
} from '../../api/customers';
import { invalidateCustomersCache } from '../../hooks/useCustomers';
import CustomerEditModal from './components/CustomerEditModal';
import CustomerInsightsModal from './components/CustomerInsightsModal';

type SortKey = 'name' | 'loyaltyPoints' | 'totalSpent' | 'orderCount' | 'lastOrderAt';
type SortDir = 'asc' | 'desc';
type FocusFilter = 'all' | 'vip' | 'needsFollowup' | 'noOrders';

function formatDate(ts: number | null): string {
  if (!ts) return 'Never';
  return new Date(ts).toLocaleDateString();
}

function getFullName(customer: CustomerWithStats): string {
  return `${customer.firstName} ${customer.lastName}`.trim();
}

function needsFollowup(customer: CustomerWithStats): boolean {
  if (!customer.lastOrderAt) return true;

  const sixtyDaysAgo = Date.now() - 60 * 24 * 60 * 60 * 1000;
  return customer.lastOrderAt < sixtyDaysAgo;
}

export default function CustomersPage() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [focus, setFocus] = useState<FocusFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const [editTarget, setEditTarget] = useState<CustomerWithStats | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInsights, setShowInsights] = useState(false);

  const [historyTarget, setHistoryTarget] = useState<CustomerWithStats | null>(null);
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const load = async () => {
    setLoading(true);

    try {
      const data = await fetchCustomersWithStats();
      setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    let rows = customers.filter((customer) => {
      const name = getFullName(customer).toLowerCase();
      const searchable = [
        name,
        customer.email,
        customer.phone,
        customer.dietaryNotes,
      ]
        .join(' ')
        .toLowerCase();

      return !q || searchable.includes(q);
    });

    if (focus === 'vip') {
      rows = rows.filter((customer) => customer.totalSpent >= 200 || customer.loyaltyPoints >= 100);
    }

    if (focus === 'needsFollowup') {
      rows = rows.filter(needsFollowup);
    }

    if (focus === 'noOrders') {
      rows = rows.filter((customer) => customer.orderCount === 0);
    }

    return [...rows].sort((a, b) => {
      let cmp = 0;

      switch (sortKey) {
        case 'name':
          cmp = getFullName(a).localeCompare(getFullName(b));
          break;
        case 'loyaltyPoints':
          cmp = a.loyaltyPoints - b.loyaltyPoints;
          break;
        case 'totalSpent':
          cmp = a.totalSpent - b.totalSpent;
          break;
        case 'orderCount':
          cmp = a.orderCount - b.orderCount;
          break;
        case 'lastOrderAt':
          cmp = (a.lastOrderAt ?? 0) - (b.lastOrderAt ?? 0);
          break;
      }

      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [customers, search, focus, sortKey, sortDir]);

  const vipCount = customers.filter(
    (customer) => customer.totalSpent >= 200 || customer.loyaltyPoints >= 100,
  ).length;
  const followupCount = customers.filter(needsFollowup).length;
  const totalRevenue = customers.reduce((sum, customer) => sum + customer.totalSpent, 0);
  const totalOrders = customers.reduce((sum, customer) => sum + customer.orderCount, 0);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortKey(key);
    setSortDir('asc');
  };

  const SortIcon = ({ active, dir }: { active: boolean; dir: SortDir }) => {
    if (!active) {
      return <ArrowUpDown size={13} strokeWidth={2} className="sort-icon idle" />;
    }

    return dir === 'asc' ? (
      <ArrowUp size={13} strokeWidth={2.5} className="sort-icon active" />
    ) : (
      <ArrowDown size={13} strokeWidth={2.5} className="sort-icon active" />
    );
  };

  const startOrder = (customer: CustomerWithStats) => {
    navigate('/', { state: { startOrderForCustomerId: customer.customerId } });
  };

  const openHistory = async (customer: CustomerWithStats) => {
    setHistoryTarget(customer);
    setHistoryLoading(true);

    try {
      const orders = await fetchCustomerOrderHistory(customer.customerId);
      setHistoryOrders(orders);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSaveEdit = async (data: Partial<CustomerWithStats>) => {
    if (!editTarget) return;

    await updateCustomer(editTarget.customerId, data);
    invalidateCustomersCache();
    setEditTarget(null);
    load();
  };

  const handleSaveNew = async (data: Partial<CustomerWithStats>) => {
    await createCustomer({
      firstName: data.firstName ?? '',
      lastName: data.lastName ?? '',
      phone: data.phone ?? '',
      email: data.email ?? '',
      loyaltyPoints: data.loyaltyPoints ?? 0,
      dietaryNotes: data.dietaryNotes ?? '',
      address: data.address ?? { street: '', city: '', state: 'NJ', zip: '' },
    });

    invalidateCustomersCache();
    setShowAddModal(false);
    load();
  };

  return (
    <div className="customers-page">
      <header className="customers-header">
        <div>
          <span className="customers-eyebrow">Maple Kosher Meats</span>
          <h1>Customers</h1>
        </div>

        <div className="customers-header-actions">
          <button className="insights-btn" onClick={() => setShowInsights(true)}>
            <PieChart size={15} strokeWidth={2} />
            Insights
          </button>

          <button className="add-customer-btn" onClick={() => setShowAddModal(true)}>
            <UserPlus size={15} strokeWidth={2} />
            Add customer
          </button>
        </div>
      </header>

      <div className="glance-cards">
        <div className="glance-card">
          <div className="glance-icon">
            <Users size={16} strokeWidth={2} />
          </div>
          <span className="glance-label">Customers</span>
          <span className="glance-value">{customers.length}</span>
        </div>

        <div className="glance-card">
          <div className="glance-icon">
            <ShoppingCart size={16} strokeWidth={2} />
          </div>
          <span className="glance-label">Orders</span>
          <span className="glance-value">{totalOrders}</span>
        </div>

        <div className="glance-card">
          <div className="glance-icon">
            <PieChart size={16} strokeWidth={2} />
          </div>
          <span className="glance-label">VIPs</span>
          <span className="glance-value">{vipCount}</span>
        </div>

        <div className="glance-card">
          <div className="glance-icon">
            <History size={16} strokeWidth={2} />
          </div>
          <span className="glance-label">Follow up</span>
          <span className="glance-value">{followupCount}</span>
        </div>
      </div>

      <section className="panel stack customer-filter-panel">
        <div className="customer-filter-top">
          <div className="customers-search-wrap">
            <Search size={16} strokeWidth={2} className="search-icon" />
            <input
              className="customers-search-input"
              placeholder="Search name, email, phone, or notes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {search.trim() && (
              <button
                className="customers-search-clear"
                type="button"
                aria-label="Clear search"
                onClick={() => setSearch('')}
              >
                <X size={15} strokeWidth={2.4} />
              </button>
            )}
          </div>

          <div className="customer-filter-chips">
            <button
              className={`customer-filter-chip ${focus === 'all' ? 'active' : ''}`}
              type="button"
              onClick={() => setFocus('all')}
            >
              All
            </button>

            <button
              className={`customer-filter-chip ${focus === 'vip' ? 'active' : ''}`}
              type="button"
              onClick={() => setFocus('vip')}
            >
              VIP
            </button>

            <button
              className={`customer-filter-chip ${focus === 'needsFollowup' ? 'active' : ''}`}
              type="button"
              onClick={() => setFocus('needsFollowup')}
            >
              Follow up
            </button>

            <button
              className={`customer-filter-chip ${focus === 'noOrders' ? 'active' : ''}`}
              type="button"
              onClick={() => setFocus('noOrders')}
            >
              No orders
            </button>
          </div>
        </div>

        <div className="customer-filter-summary">
          <span>
            Showing <strong>{filtered.length}</strong> customer{filtered.length === 1 ? '' : 's'}
          </span>
          <span className="customer-filter-dot">•</span>
          <span>
            <strong>${totalRevenue.toFixed(2)}</strong> lifetime revenue
          </span>
        </div>
      </section>

      <div className="customers-table-wrap">
        {loading ? (
          <p className="customers-loading">Loading customers…</p>
        ) : filtered.length === 0 ? (
          <p className="customers-loading">No customers match this view.</p>
        ) : (
          <table className="customers-table">
            <thead>
              <tr>
                <th onClick={() => toggleSort('name')}>
                  <span>Name</span>
                  <SortIcon active={sortKey === 'name'} dir={sortDir} />
                </th>

                <th className="hide-sm">Contact</th>

                <th onClick={() => toggleSort('loyaltyPoints')}>
                  <span>Points</span>
                  <SortIcon active={sortKey === 'loyaltyPoints'} dir={sortDir} />
                </th>

                <th onClick={() => toggleSort('orderCount')}>
                  <span>Orders</span>
                  <SortIcon active={sortKey === 'orderCount'} dir={sortDir} />
                </th>

                <th onClick={() => toggleSort('totalSpent')}>
                  <span>Total spent</span>
                  <SortIcon active={sortKey === 'totalSpent'} dir={sortDir} />
                </th>

                <th onClick={() => toggleSort('lastOrderAt')} className="hide-sm">
                  <span>Last order</span>
                  <SortIcon active={sortKey === 'lastOrderAt'} dir={sortDir} />
                </th>

                <th className="actions-col"></th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((customer) => (
                <tr key={customer.customerId}>
                  <td className="customer-name-cell">
                    {getFullName(customer)}
                    {customer.dietaryNotes && (
                      <span className="dietary-tag">{customer.dietaryNotes}</span>
                    )}
                  </td>

                  <td className="hide-sm contact-cell">
                    <span>{customer.email || 'No email'}</span>
                    <span className="contact-phone">{customer.phone || 'No phone'}</span>
                  </td>

                  <td>{customer.loyaltyPoints}</td>
                  <td>{customer.orderCount ?? 0}</td>
                  <td>${(customer.totalSpent ?? 0).toFixed(2)}</td>
                  <td className="hide-sm">{formatDate(customer.lastOrderAt ?? null)}</td>

                  <td className="actions-cell">
                    <button
                      className="row-action-btn"
                      title="Start order"
                      onClick={() => startOrder(customer)}
                    >
                      <ShoppingCart size={15} strokeWidth={2} />
                    </button>

                    <button
                      className="row-action-btn"
                      title="Order history"
                      onClick={() => openHistory(customer)}
                    >
                      <History size={15} strokeWidth={2} />
                    </button>

                    <button
                      className="row-action-btn"
                      title="Edit"
                      onClick={() => setEditTarget(customer)}
                    >
                      <Pencil size={15} strokeWidth={2} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {historyTarget && (
        <div className="history-modal-backdrop" onClick={() => setHistoryTarget(null)}>
          <div className="history-modal" onClick={(e) => e.stopPropagation()}>
            <div className="history-modal-head">
              <h2>{getFullName(historyTarget)}</h2>

              <button className="modal-close-btn" onClick={() => setHistoryTarget(null)}>
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            <p className="history-modal-meta">
              {historyTarget.loyaltyPoints} pts · ${historyTarget.totalSpent.toFixed(2)} lifetime
            </p>

            <div className="history-modal-orders">
              {historyLoading && <p className="history-empty">Loading…</p>}

              {!historyLoading && historyOrders.length === 0 && (
                <p className="history-empty">No past orders yet.</p>
              )}

              {!historyLoading &&
                historyOrders.map((order) => (
                  <div className="history-order" key={order.id}>
                    <div className="history-order-top">
                      <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                      <span>${order.total.toFixed(2)}</span>
                    </div>

                    <p className="history-order-items">
                      {order.items.map((item) => item.name).join(', ')}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {editTarget && (
        <CustomerEditModal
          customer={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleSaveEdit}
        />
      )}

      {showAddModal && (
        <CustomerEditModal
          customer={null}
          onClose={() => setShowAddModal(false)}
          onSave={handleSaveNew}
        />
      )}

      {showInsights && <CustomerInsightsModal onClose={() => setShowInsights(false)} />}
    </div>
  );
}
