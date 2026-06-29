import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import type { Order } from '@groundup/shared-types';
import CounterScreen from './components/CounterScreen';
import OrderStream from './components/OrderStream';
import { deleteOrder } from '../../api/orders';
import '../../app/App.layout.css';

type StartOrderState = {
  startOrderForCustomerId?: string;
};

export default function MainPage() {
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [recalledOrder, setRecalledOrder] = useState<Order | null>(null);
  const location = useLocation();

  // If the user navigated here from "Start order" on the Customers page,
  // pre-fill the cart's customer field via the same mechanism used for recalls.
  useEffect(() => {
    const state = location.state as StartOrderState | null;
    const customerId = state?.startOrderForCustomerId;
    if (customerId) {
      setRecalledOrder({
        id: '',
        customerId,
        customerName: '',
        items: [],
        total: 0,
        status: 'placed',
        source: 'counter',
        fulfillment: 'in_store',
        claimedBy: null,
        createdAt: Date.now(),
      });
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleRecall = async (order: Order) => {
    try {
      await deleteOrder(order.id);
      setRecalledOrder(order);
      setRefreshSignal((n) => n + 1);
    } catch (err) {
      console.error(err);
      alert('Could not send this order back — it may have already been claimed.');
    }
  };

  return (
    <div className="mkb-app">
      <div className="mkb-counter-pane">
        <CounterScreen
          onOrderSent={() => setRefreshSignal((n) => n + 1)}
          recalledOrder={recalledOrder}
          onRecallConsumed={() => setRecalledOrder(null)}
        />
      </div>
      <div className="mkb-stream-pane">
        <OrderStream refreshSignal={refreshSignal} onRecall={handleRecall} />
      </div>
    </div>
  );
}
