import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
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
const STORAGE_KEY = 'groundup-counter-width';

export default function MainPage() {
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [recalledOrder, setRecalledOrder] = useState<Order | null>(null);
  const [counterWidth, setCounterWidth] = useState(() => {
    const saved = Number(localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(saved) && saved > 0 ? saved : DEFAULT_COUNTER_PERCENT;
  });

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

  const updateCounterWidth = (clientX: number) => {
    const container = appRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const rawPercent = ((clientX - rect.left) / rect.width) * 100;
    const minPercent = (MIN_COUNTER_WIDTH / rect.width) * 100;
    const maxPercent = ((rect.width - MIN_STREAM_WIDTH) / rect.width) * 100;
    const nextWidth = Math.min(Math.max(rawPercent, minPercent), maxPercent);

    setCounterWidth(nextWidth);
    localStorage.setItem(STORAGE_KEY, String(nextWidth));
  };

  const startResize = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    const handleMove = (moveEvent: globalThis.PointerEvent) => {
      updateCounterWidth(moveEvent.clientX);
    };

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  const resetWidth = () => {
    setCounterWidth(DEFAULT_COUNTER_PERCENT);
    localStorage.setItem(STORAGE_KEY, String(DEFAULT_COUNTER_PERCENT));
  };

  return (
    <div
      ref={appRef}
      className="mkb-app"
      style={{ '--counter-width': `${counterWidth}%` } as CSSProperties}
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
        title="Drag to resize. Double-click to reset."
        onPointerDown={startResize}
        onDoubleClick={resetWidth}
      />

      <div className="mkb-stream-pane">
        <OrderStream refreshSignal={refreshSignal} onRecall={handleRecall} />
      </div>
    </div>
  );
}
