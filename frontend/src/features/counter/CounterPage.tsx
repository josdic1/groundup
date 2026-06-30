import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { MoveHorizontal, ReceiptText, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
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
    title: "Take an in-store order",
    body: "Choose items, enter weight or quantity, add notes, then send the order to the stream.",
    to: "/",
    cta: "Open Register",
  },
  {
    title: "Check order status",
    body: "Review active, ready, completed, counter, and online orders.",
    to: "/orders",
    cta: "Open Orders",
  },
  {
    title: "Place a test online order",
    body: "Use the customer-facing flow to build a cart and submit pickup or delivery orders.",
    to: "/online",
    cta: "Open Online",
  },
  {
    title: "Review or update the menu",
    body: "See the active items available to staff and customers.",
    to: "/menu",
    cta: "Open Menu",
  },
  {
    title: "Look up a customer",
    body: "Find customer profiles, contact info, loyalty points, notes, and order history.",
    to: "/customers",
    cta: "Open Customers",
  },
  {
    title: "View sales and activity",
    body: "Check order volume, revenue, daily trends, and business summaries.",
    to: "/reports",
    cta: "Open Reports",
  },
  {
    title: "Load demo data or restart the tour",
    body: "Use the Admin menu for sample data, clearing active orders, and launching the walkthrough.",
    action: "tutorial",
    cta: "Start Walkthrough",
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
          className={`mkb-quick-help-trigger ${helpPulseActive ? "is-pulsing" : "is-resize-mode"}`}
          type="button"
          aria-label={helpPulseActive ? "Open quick help" : "Resize counter and order stream panes"}
          title={helpPulseActive ? "Open quick help" : "Drag to resize. Double-click to reset."}
          style={{ left: `calc(${counterWidth}% - 24px)` }}
          onPointerDown={helpPulseActive ? undefined : startResize}
          onDoubleClick={helpPulseActive ? undefined : resetWidth}
          onClick={() => {
            if (helpPulseActive) {
              setShowQuickHelp(true);
            }
          }}
        >
          {helpPulseActive ? (
            <ReceiptText size={18} strokeWidth={2.25} />
          ) : (
            <MoveHorizontal size={17} strokeWidth={2.45} />
          )}
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
                  <div key={item.title} className="mkb-help-line">
                    <div className="mkb-help-copy">
                      <strong>{item.title}</strong>
                      <span>{item.body}</span>
                    </div>

                    {item.to ? (
                      <Link
                        className="mkb-help-link"
                        to={item.to}
                        onClick={() => setShowQuickHelp(false)}
                      >
                        {item.cta}
                      </Link>
                    ) : (
                      <button
                        className="mkb-help-link"
                        type="button"
                        onClick={() => {
                          setShowQuickHelp(false);
                          window.dispatchEvent(new Event("groundup:start-tutorial"));
                        }}
                      >
                        {item.cta}
                      </button>
                    )}
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
