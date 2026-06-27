import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  History,
  ShoppingCart,
  Pencil,
  UserPlus,
  PieChart,
  X,
} from 'lucide-react';
import type { CustomerWithStats, Order } from '@groundup/shared-types';
import {
  fetchCustomersWithStats,
  fetchCustomerOrderHistory,
  createCustomer,
  updateCustomer,
} from '../api/customers';
import { invalidateCustomersCache } from '../hooks/useCustomers';
import CustomerEditModal from '../components/customers/CustomerEditModal';
import CustomerInsightsModal from '../components/customers/CustomerInsightsModal';
import './CustomersPage.css';

type SortKey = 'name' | 'loyaltyPoints' | 'totalSpent' | 'orderCount' | 'lastOrderAt';
type SortDir = 'asc' | 'desc';

function formatDate(ts: number | null): string {
  if (!ts) return 'Never';
  return new Date(ts).toLocaleDateString();
}

export default function CustomersPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
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
    let rows = customers;
    if (q) {
      rows = rows.filter((c) => {
        const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
        return (
          fullName.includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q)
        );
      });
    }
    const sorted = [...rows].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
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
    return sorted;
  }, [customers, search, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ active, dir }: { active: boolean; dir: SortDir }) => {
    if (!active) return <ArrowUpDown size={13} strokeWidth={2} className="sort-icon idle" />;
    return dir === 'asc' ? (
      <ArrowUp size={13} strokeWidth={2.5} className="sort-icon active" />
    ) : (
      <ArrowDown size={13} strokeWidth={2.5} className="sort-icon active" />
    );
  };

  const startOrder = (c: CustomerWithStats) => {
    navigate('/', { state: { startOrderForCustomerId: c.customerId } });
  };

  const openHistory = async (c: CustomerWithStats) => {
    setHistoryTarget(c);
    setHistoryLoading(true);
    try {
      const orders = await fetchCustomerOrderHistory(c.customerId);
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

      <div className="customers-search-wrap">
        <Search size={16} strokeWidth={2} className="search-icon" />
        <input
          className="customers-search-input"
          placeholder="Search by name, email, or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="customers-table-wrap">
        {loading ? (
          <p className="customers-loading">Loading customers…</p>
        ) : filtered.length === 0 ? (
          <p className="customers-loading">No customers match your search.</p>
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
              {filtered.map((c) => (
                <tr key={c.customerId}>
                  <td className="customer-name-cell">
                    {c.firstName} {c.lastName}
                    {c.dietaryNotes && <span className="dietary-tag">{c.dietaryNotes}</span>}
                  </td>
                  <td className="hide-sm contact-cell">
                    <span>{c.email}</span>
                    <span className="contact-phone">{c.phone}</span>
                  </td>
                  <td>{c.loyaltyPoints}</td>
                  <td>{c.orderCount ?? 0}</td>
                  <td>${(c.totalSpent ?? 0).toFixed(2)}</td>
                  <td className="hide-sm">{formatDate(c.lastOrderAt ?? null)}</td>
                  <td className="actions-cell">
                    <button
                      className="row-action-btn"
                      title="Start order"
                      onClick={() => startOrder(c)}
                    >
                      <ShoppingCart size={15} strokeWidth={2} />
                    </button>
                    <button
                      className="row-action-btn"
                      title="Order history"
                      onClick={() => openHistory(c)}
                    >
                      <History size={15} strokeWidth={2} />
                    </button>
                    <button
                      className="row-action-btn"
                      title="Edit"
                      onClick={() => setEditTarget(c)}
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
              <h2>{historyTarget.firstName} {historyTarget.lastName}</h2>
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
                historyOrders.map((o) => (
                  <div className="history-order" key={o.id}>
                    <div className="history-order-top">
                      <span>{new Date(o.createdAt).toLocaleDateString()}</span>
                      <span>${o.total.toFixed(2)}</span>
                    </div>
                    <p className="history-order-items">
                      {o.items.map((i) => i.name).join(', ')}
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
