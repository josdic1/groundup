import { useEffect, useMemo, useState } from 'react';
import { Crown, TrendingUp, UserMinus, Users, X } from 'lucide-react';
import { fetchCustomerInsights, type CustomerInsights } from '../../../api/customers';

type Props = {
  onClose: () => void;
};

type InsightCustomer = CustomerInsights['mostLoyal'][number];

function formatDate(ts: number | null): string {
  if (!ts) return 'Never ordered';

  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function fullName(customer: InsightCustomer): string {
  return `${customer.firstName} ${customer.lastName}`.trim();
}

export default function CustomerInsightsModal({ onClose }: Props) {
  const [insights, setInsights] = useState<CustomerInsights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomerInsights()
      .then(setInsights)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const topLoyal = insights?.mostLoyal[0] ?? null;
  const topSpender = insights?.highestSpend[0] ?? null;
  const reconnectCount = insights?.needReconnect.length ?? 0;

  const totalFeaturedCustomers = useMemo(() => {
    if (!insights) return 0;

    const ids = new Set<string>();

    for (const customer of insights.mostLoyal) ids.add(customer.customerId);
    for (const customer of insights.highestSpend) ids.add(customer.customerId);
    for (const customer of insights.needReconnect) ids.add(customer.customerId);

    return ids.size;
  }, [insights]);

  return (
    <div className="modal-backdrop customer-insights-backdrop" onClick={onClose}>
      <section className="modal modal-wide customer-insights-modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-head customer-insights-head">
          <div>
            <span className="page-eyebrow">Customer intelligence</span>
            <h2 className="modal-title">Customer insights</h2>
            <p className="customer-insights-subtitle">
              Simple signals for who matters, who spends, and who needs a reason to come back.
            </p>
          </div>

          <button className="btn btn-ghost icon-btn" type="button" onClick={onClose} aria-label="Close">
            <X size={17} strokeWidth={2} />
          </button>
        </header>

        {loading && (
          <div className="customer-insights-loading">
            <Users size={26} strokeWidth={1.8} />
            Loading customer insights…
          </div>
        )}

        {!loading && insights && (
          <>
            <div className="customer-insights-summary">
              <div className="customer-insights-stat">
                <span className="customer-insights-stat-label">Top loyal</span>
                <strong>{topLoyal ? fullName(topLoyal) : 'None yet'}</strong>
                <small>{topLoyal ? `${topLoyal.loyaltyPoints} points` : 'No loyalty data'}</small>
              </div>

              <div className="customer-insights-stat">
                <span className="customer-insights-stat-label">Top spender</span>
                <strong>{topSpender ? fullName(topSpender) : 'None yet'}</strong>
                <small>{topSpender ? `$${topSpender.totalSpent.toFixed(2)} lifetime` : 'No spend data'}</small>
              </div>

              <div className="customer-insights-stat">
                <span className="customer-insights-stat-label">Follow up</span>
                <strong>{reconnectCount}</strong>
                <small>{reconnectCount === 1 ? 'customer needs attention' : 'customers need attention'}</small>
              </div>
            </div>

            <div className="customer-insights-grid">
              <section className="customer-insights-panel">
                <div className="customer-insights-panel-title">
                  <Crown size={16} strokeWidth={2} />
                  <span>Most loyal</span>
                </div>

                <ol className="customer-insights-list">
                  {insights.mostLoyal.map((customer, index) => (
                    <li key={customer.customerId}>
                      <span className="customer-insights-rank">{index + 1}</span>
                      <span className="customer-insights-name">{fullName(customer)}</span>
                      <span className="customer-insights-value">{customer.loyaltyPoints} pts</span>
                    </li>
                  ))}
                </ol>
              </section>

              <section className="customer-insights-panel">
                <div className="customer-insights-panel-title">
                  <TrendingUp size={16} strokeWidth={2} />
                  <span>Highest spend</span>
                </div>

                <ol className="customer-insights-list">
                  {insights.highestSpend.map((customer, index) => (
                    <li key={customer.customerId}>
                      <span className="customer-insights-rank">{index + 1}</span>
                      <span className="customer-insights-name">{fullName(customer)}</span>
                      <span className="customer-insights-value">${customer.totalSpent.toFixed(2)}</span>
                    </li>
                  ))}
                </ol>
              </section>

              <section className="customer-insights-panel customer-insights-panel-alert">
                <div className="customer-insights-panel-title">
                  <UserMinus size={16} strokeWidth={2} />
                  <span>Need reconnect</span>
                </div>

                {insights.needReconnect.length === 0 ? (
                  <p className="customer-insights-empty">Everyone has ordered recently.</p>
                ) : (
                  <ol className="customer-insights-list">
                    {insights.needReconnect.map((customer, index) => (
                      <li key={customer.customerId}>
                        <span className="customer-insights-rank">{index + 1}</span>
                        <span className="customer-insights-name">{fullName(customer)}</span>
                        <span className="customer-insights-value">{formatDate(customer.lastOrderAt)}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </div>

            <p className="customer-insights-footer-note">
              Showing {totalFeaturedCustomers} featured customer{totalFeaturedCustomers === 1 ? '' : 's'} across loyalty,
              spend, and reconnect signals.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
