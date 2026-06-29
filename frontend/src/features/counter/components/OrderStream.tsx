import { useEffect, useState, useCallback } from 'react';
import { X, Undo2, Store, Truck, RotateCcw } from 'lucide-react';
import type { Order, OrderStatus } from '@groundup/shared-types';
import { fetchOrders, updateOrder } from '../../../api/orders';
import { STORE_CONFIG } from '../../../config';

const COLUMNS: { status: OrderStatus; label: string }[] = [
  { status: 'placed', label: 'Placed' },
  { status: 'in_prep', label: 'In prep' },
  { status: 'ready', label: 'Ready' },
];

function timeAgo(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return 'just now';
  if (mins === 1) return '1 min ago';
  return `${mins} min ago`;
}

type Props = {
  refreshSignal: number;
  onRecall: (order: Order) => void;
};

export default function OrderStream({ refreshSignal, onRecall }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);

  const load = useCallback(async () => {
    try {
      const data = await fetchOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to load orders', err);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, STORE_CONFIG.orderStreamPollIntervalMs);
    return () => clearInterval(interval);
  }, [load, refreshSignal]);

  const handleClaim = async (orderId: string, staff: string) => {
    await updateOrder(orderId, { status: 'in_prep', claimedBy: staff });
    load();
  };

  const handleAdvance = async (order: Order) => {
    const next = order.status === 'in_prep' ? 'ready' : 'completed';
    await updateOrder(order.id, { status: next });
    load();
  };

  const handleUnclaim = async (order: Order) => {
    await updateOrder(order.id, { status: 'placed', claimedBy: '' });
    load();
  };

  const handleCancel = async (order: Order) => {
    if (!window.confirm(`Cancel order for ${order.customerName}?`)) return;
    await updateOrder(order.id, { status: 'cancelled' });
    load();
  };

  const visibleOrders = orders.filter(
    (o) => o.status !== 'completed' && o.status !== 'cancelled'
  );

  return (
    <div className="order-stream">
      <header className="stream-header">
        <h1>Order stream</h1>
        <span className="stream-count">{visibleOrders.length} active</span>
      </header>
      <div className="stream-columns">
        {COLUMNS.map((col) => {
          const colOrders = visibleOrders
            .filter((o) => o.status === col.status)
            .sort((a, b) => b.createdAt - a.createdAt);
          return (
            <div className="stream-column" key={col.status}>
              <div className="stream-column-header">
                <span>{col.label}</span>
                <span className="stream-column-count">{colOrders.length}</span>
              </div>
              <div className="stream-column-body">
                {colOrders.length === 0 && (
                  <p className="stream-empty">Nothing here right now.</p>
                )}
                {colOrders.map((order) => (
                  <div className={`order-ticket ticket-${order.status}`} key={order.id}>
                    <div className="ticket-notch" />
                    <button
                      className="ticket-cancel"
                      onClick={() => handleCancel(order)}
                      aria-label="Cancel order"
                      title="Cancel order"
                    >
                      <X size={14} strokeWidth={2.5} />
                    </button>
                    <div className="ticket-top">
                      <span className="ticket-id">#{order.id.replace('ord-', '').replace('hist-', '')}</span>
                      {order.fulfillment !== 'in_store' && (
                        <span className={`fulfillment-pill fulfillment-${order.fulfillment}`}>
                          {order.fulfillment === 'delivery' ? (
                            <Truck size={11} strokeWidth={2.5} />
                          ) : (
                            <Store size={11} strokeWidth={2.5} />
                          )}
                          {order.fulfillment}
                        </span>
                      )}
                      <span className="ticket-time">{timeAgo(order.createdAt)}</span>
                    </div>
                    <h3 className="ticket-customer">{order.customerName}</h3>
                    <ul className="ticket-items">
                      {order.items.map((item, i) => (
                        <li key={i}>
                          <div className="ticket-item-line">
                            <span>{item.name}</span>
                            <span className="ticket-item-weight">{item.quantity}</span>
                          </div>
                          {item.notes && <p className="ticket-item-note">"{item.notes}"</p>}
                        </li>
                      ))}
                    </ul>
                    {order.notes && <p className="ticket-order-note">{order.notes}</p>}
                    <div className="ticket-footer">
                      <span className="ticket-total">${order.total.toFixed(2)}</span>
                      {order.claimedBy && (
                        <span className="ticket-claimed">{order.claimedBy}</span>
                      )}
                    </div>

                    {order.status === 'placed' && (
                      <div className="ticket-actions">
                        {STORE_CONFIG.staff.map((staff) => (
                          <button
                            key={staff.id}
                            className="claim-btn"
                            onClick={() => handleClaim(order.id, staff.name)}
                          >
                            Claim — {staff.name}
                          </button>
                        ))}
                        <button
                          className="recall-btn"
                          onClick={() => onRecall(order)}
                          title="Send back to register to edit"
                        >
                          <RotateCcw size={13} strokeWidth={2} />
                          Send back to register
                        </button>
                      </div>
                    )}
                    {order.status === 'in_prep' && (
                      <div className="ticket-actions-row">
                        <button
                          className="unclaim-btn"
                          onClick={() => handleUnclaim(order)}
                          title="Send back to Placed"
                        >
                          <Undo2 size={14} strokeWidth={2} />
                        </button>
                        <button className="advance-btn" onClick={() => handleAdvance(order)}>
                          Mark ready
                        </button>
                      </div>
                    )}
                    {order.status === 'ready' && (
                      <button
                        className="advance-btn complete"
                        onClick={() => handleAdvance(order)}
                      >
                        Picked up
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
