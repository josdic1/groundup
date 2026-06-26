import { useState } from 'react';
import type { Order } from '@groundup/shared-types';
import CounterScreen from './CounterScreen';
import OrderStream from './OrderStream';
import { deleteOrder } from '../api/orders';
import '../App.layout.css';

export default function MainPage() {
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [recalledOrder, setRecalledOrder] = useState<Order | null>(null);

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
