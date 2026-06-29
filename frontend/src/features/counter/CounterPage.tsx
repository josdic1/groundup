import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import type { Order } from '@groundup/shared-types';
import CounterScreen from './components/CounterScreen';
import OrderStream from './components/OrderStream';
import { deleteOrder } from '../../api/orders';
import '../../app/App.layout.css';

type StartOrderState = {
  startOrderForCustomerId?: string;
};

const MIN_COUNTER_WIDTH = 360;
const MIN_STREAM_WIDTH = 420;
const DEFAULT_COUNTER_PERCENT = 52;

export default function MainPage() {
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [recalledOrder, setRecalledOrder] = useState<Order | null>(null);
  const [counterWidth, setCounterWidth] = useState(DEFAULT_COUNTER_PERCENT);
  const appRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();

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

  const startResize = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();

    const container = appRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const pointerId = event.pointerId;

    event.currentTarget.setPointerCapture(pointerId);

    const handleMove = (moveEvent: PointerEvent) => {
      const rawLeftWidth = moveEvent.clientX - rect.left;
      const minLeftPercent = (MIN_COUNTER_WIDTH / rect.width) * 100;
      const maxLeftPercent = ((rect.width - MIN_STREAM_WIDTH) / rect.width) * 100;
      const nextWidth = (rawLeftWidth / rect.width) * 100;

      setCounterWidth(Math.min(Math.max(nextWidth, minLeftPercent), maxLeftPercent));
    };

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  return (
    <div
      ref={appRef}
      className="mkb-app"
      style={{ '--counter-width': `${counterWidth}%` } as React.CSSProperties}
    >
      <div className="mkb-counter-pane">
        <CounterScreen
          onOrderSent={() => setRefreshSignal((n) => n + 1)}
          recalledOrder={recalledOrder}
          onRecallConsumed={() => setRecalledOrder(null)}
        />
      </div>

      <button
        className="mkb-resize-handle"
        type="button"
        aria-label="Resize counter and order stream panes"
        onPointerDown={startResize}
      />

      <div className="mkb-stream-pane">
        <OrderStream refreshSignal={refreshSignal} onRecall={handleRecall} />
      </div>
    </div>
  );
}
