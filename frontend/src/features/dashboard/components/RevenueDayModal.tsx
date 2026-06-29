import { X } from 'lucide-react';
import type { Order } from '@groundup/shared-types';
import './RevenueDayModal.css';

type Props = {
  date: string;
  orders: Order[];
  onClose: () => void;
};

function formatDay(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
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

function formatStatus(status: Order['status']): string {
  return status.replaceAll('_', ' ').toUpperCase();
}

export default function RevenueDayModal({ date, orders, onClose }: Props) {
  const salesOrders = orders.filter((order) => order.status !== 'cancelled');
  const cancelledOrders = orders.length - salesOrders.length;

  const revenue = salesOrders.reduce((sum, order) => sum + order.total, 0);
  const itemCount = salesOrders.reduce((sum, order) => sum + order.items.length, 0);
  const avgTicket = salesOrders.length > 0 ? revenue / salesOrders.length : 0;

  return (
    <div className="modal-backdrop revenue-day-backdrop" onClick={onClose}>
      <section className="modal modal-wide revenue-day-modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <div>
            <span className="page-eyebrow">Daily sales detail</span>
            <h2 className="modal-title">{formatDay(date)}</h2>
          </div>
          <button className="btn btn-ghost icon-btn" type="button" onClick={onClose} aria-label="Close">
            <X size={17} strokeWidth={2} />
          </button>
        </header>

        <div className="revenue-day-summary">
          <div className="kpi-card">
            <span className="kpi-label">Revenue</span>
            <span className="kpi-value">${revenue.toFixed(2)}</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Orders</span>
            <span className="kpi-value">{salesOrders.length}</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Avg ticket</span>
            <span className="kpi-value">${avgTicket.toFixed(2)}</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Items</span>
            <span className="kpi-value">{itemCount}</span>
          </div>
        </div>

        {cancelledOrders > 0 && (
          <p className="revenue-day-note">
            {cancelledOrders} cancelled order{cancelledOrders === 1 ? '' : 's'} excluded from sales totals.
          </p>
        )}

        <div className="revenue-day-table-wrap">
          <table className="revenue-day-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Type</th>
                <th>Status</th>
                <th className="align-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {salesOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="revenue-day-empty">
                    No completed sales for this day.
                  </td>
                </tr>
              )}

              {salesOrders.map((order) => (
                <tr key={order.id}>
                  <td>{formatTime(order.createdAt)}</td>
                  <td>
                    <strong>{order.customerName || 'Walk-in'}</strong>
                    <span className="revenue-day-order-id">{order.id}</span>
                  </td>
                  <td>
                    <div className="revenue-day-items">
                      {order.items.map((item) => (
                        <span key={`${order.id}-${item.menuItemId}-${item.name}`}>
                          {item.name}
                          {item.quantity ? ` × ${item.quantity}` : ''}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className="table-pill">{order.source}</span>
                    <span className="table-pill muted-pill">{order.fulfillment.replaceAll('_', ' ')}</span>
                  </td>
                  <td>
                    <span className="table-pill status-pill">{formatStatus(order.status)}</span>
                  </td>
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
