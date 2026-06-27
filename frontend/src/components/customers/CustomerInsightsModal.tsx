import { useState, useEffect } from 'react';
import { X, Crown, TrendingUp, UserMinus } from 'lucide-react';
import { fetchCustomerInsights, type CustomerInsights } from '../../api/customers';
import './CustomerInsightsModal.css';

type Props = {
  onClose: () => void;
};

function formatDate(ts: number | null): string {
  if (!ts) return 'Never ordered';
  return new Date(ts).toLocaleDateString();
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

  return (
    <div className="insights-modal-backdrop" onClick={onClose}>
      <div className="insights-modal" onClick={(e) => e.stopPropagation()}>
        <div className="insights-modal-head">
          <h2>Customer insights</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {loading && <p className="insights-loading">Loading…</p>}

        {insights && (
          <div className="insights-panels">
            <section className="insights-panel">
              <div className="insights-panel-title">
                <Crown size={15} strokeWidth={2} />
                Most loyal
              </div>
              <ol className="insights-list">
                {insights.mostLoyal.map((c, i) => (
                  <li key={c.customerId}>
                    <span className="insights-rank">{i + 1}</span>
                    <span className="insights-name">{c.firstName} {c.lastName}</span>
                    <span className="insights-value">{c.loyaltyPoints} pts</span>
                  </li>
                ))}
              </ol>
            </section>

            <section className="insights-panel">
              <div className="insights-panel-title">
                <TrendingUp size={15} strokeWidth={2} />
                Highest spend
              </div>
              <ol className="insights-list">
                {insights.highestSpend.map((c, i) => (
                  <li key={c.customerId}>
                    <span className="insights-rank">{i + 1}</span>
                    <span className="insights-name">{c.firstName} {c.lastName}</span>
                    <span className="insights-value">${c.totalSpent.toFixed(2)}</span>
                  </li>
                ))}
              </ol>
            </section>

            <section className="insights-panel">
              <div className="insights-panel-title">
                <UserMinus size={15} strokeWidth={2} />
                Need reconnect
              </div>
              <ol className="insights-list">
                {insights.needReconnect.length === 0 && (
                  <p className="insights-empty">Everyone's been in recently.</p>
                )}
                {insights.needReconnect.map((c, i) => (
                  <li key={c.customerId}>
                    <span className="insights-rank">{i + 1}</span>
                    <span className="insights-name">{c.firstName} {c.lastName}</span>
                    <span className="insights-value">{formatDate(c.lastOrderAt)}</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
