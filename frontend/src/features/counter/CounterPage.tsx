import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { ReceiptText, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import type { Order } from "@groundup/shared-types";
import CounterScreen from "./components/CounterScreen";
import OrderStream from "./components/OrderStream";
import { deleteOrder } from "../../api/orders";

type StartOrderState = {
  startOrderForCustomerId?: string;
};

const MIN_COUNTER_WIDTH = 360;
const MIN_STREAM_WIDTH = 420;
const DEFAULT_COUNTER_PERCENT = 52;
const STORAGE_KEY = "groundup-counter-width";
const HELP_PULSE_MS = 10000;

const QUICK_HELP_LINES = [
  {
    want: "I want to ring up a counter order",
    go: "Stay on Register",
  },
  {
    want: "I want to see all active and completed orders",
    go: "Go to Orders",
  },
  {
    want: "I want to test the customer-facing site",
    go: "Go to Online",
  },
  {
    want: "I want customer details and loyalty info",
    go: "Go to Customers",
  },
  {
    want: "I want business totals and trends",
    go: "Go to Reports",
  },
  {
    want: "I want demo data or the walkthrough",
    go: "Open Admin",
  },
];

export default function CounterPage() {
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [recalledOrder, setRecalledOrder] = useState<Order | null>(null);
  const [counterWidth, setCounterWidth] = useState(() => {
    const saved = Number(localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(saved) && saved > 0
      ? saved
      : DEFAULT_COUNTER_PERCENT;
  });
  const [showQuickHelp, setShowQuickHelp] = useState(false);
  const [helpPulseActive, setHelpPulseActive] = useState(true);

  const appRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();

  useEffect(() => {
    const state = location.state as StartOrderState | null;
    const customerId = state?.startOrderForCustomerId;

    if (customerId) {
      setRecalledOrder({
        id: "",
        customerId,
        customerName: "",
        items: [],
        total: 0,
        status: "placed",
        source: "counter",
        fulfillment: "in_store",
        claimedBy: null,
        createdAt: Date.now(),
      });

      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setHelpPulseActive(false);
    }, HELP_PULSE_MS);

    return () => window.clearTimeout(timer);
  }, []);

  const handleRecall = async (order: Order) => {
    try {
      await deleteOrder(order.id);
      setRecalledOrder(order);
      setRefreshSignal((n) => n + 1);
    } catch (err) {
      console.error(err);
      alert(
        "Could not send this order back — it may have already been claimed.",
      );
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
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  const resetWidth = () => {
    setCounterWidth(DEFAULT_COUNTER_PERCENT);
    localStorage.setItem(STORAGE_KEY, String(DEFAULT_COUNTER_PERCENT));
  };

  return (
    <>
      <div
        ref={appRef}
        className="mkb-app"
        style={{ "--counter-width": `${counterWidth}%` } as CSSProperties}
      >
        <div className="mkb-counter-pane">
          <CounterScreen
            onOrderSent={() => setRefreshSignal((n) => n + 1)}
            recalledOrder={recalledOrder}
            onRecallConsumed={() => setRecalledOrder(null)}
          />
        </div>

        <button
          className={`mkb-quick-help-trigger ${helpPulseActive ? "is-pulsing" : ""}`}
          type="button"
          aria-label="Open quick help"
          title="Open quick help"
          style={{ left: `calc(${counterWidth}% - 24px)` }}
          onClick={() => setShowQuickHelp(true)}
        >
          <ReceiptText size={18} strokeWidth={2.25} />
        </button>

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

      {showQuickHelp && (
        <div
          className="mkb-help-backdrop"
          onClick={() => setShowQuickHelp(false)}
        >
          <div
            className="mkb-help-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mkb-help-title"
          >
            <button
              type="button"
              className="mkb-help-close"
              aria-label="Close quick help"
              onClick={() => setShowQuickHelp(false)}
            >
              <X size={18} strokeWidth={2.25} />
            </button>

            <div className="mkb-help-ticket">
              <div className="mkb-help-ticket-top">
                <span className="mkb-help-chip">Quick help</span>
                <span className="mkb-help-chip">Maple guide</span>
              </div>

              <h2 id="mkb-help-title" className="mkb-help-title">
                Butcher counter cheat sheet
              </h2>

              <p className="mkb-help-subtitle">Quick and dirty instructions:</p>

              <div className="mkb-help-lines">
                {QUICK_HELP_LINES.map((item) => (
                  <div key={item.want} className="mkb-help-line">
                    <span className="mkb-help-want">
                      I want to… {item.want}
                    </span>
                    <span className="mkb-help-go">Go here: {item.go}</span>
                  </div>
                ))}
              </div>

              <div className="mkb-help-footer">
                Tip: Register is for ringing up orders. Everything else is
                lookup, testing, or reporting.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
