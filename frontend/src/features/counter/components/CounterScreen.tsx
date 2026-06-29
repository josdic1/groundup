import { useState, useEffect, useMemo } from "react";
import {
  Beef,
  Bird,
  Drumstick,
  Flame,
  Sandwich,
  CupSoda,
  History,
  Store,
  Truck,
} from "lucide-react";
import type {
  MenuItem,
  OrderLineItem,
  Order,
  FulfillmentType,
  CustomerWithStats,
} from "@groundup/shared-types";
import { createOrder, fetchCustomerOrders } from "../../../api/orders";
import { useMenu } from "../../../hooks/useMenu";
import { useCustomers } from "../../../hooks/useCustomers";
import "./CounterScreen.css";

const CATEGORY_META: Record<string, { label: string; icon: typeof Beef }> = {
  "Glatt Kosher Beef (Fresh Cuts)": { label: "Beef", icon: Beef },
  "Fresh Poultry (Chicken & Turkey)": { label: "Poultry", icon: Bird },
  "Premium Lamb & Veal": { label: "Lamb & Veal", icon: Drumstick },
  "Marinated & Oven-Ready Specials (Butcher's Prep)": {
    label: "Prepared",
    icon: Flame,
  },
  "Prepared Deli, Provisions & Shabbos Takeout": {
    label: "Deli",
    icon: Sandwich,
  },
  Beverages: { label: "Drinks", icon: CupSoda },
};

let walkInCounter = 1;

type Props = {
  onOrderSent: () => void;
  recalledOrder: Order | null;
  onRecallConsumed: () => void;
};

export default function CounterScreen({
  onOrderSent,
  recalledOrder,
  onRecallConsumed,
}: Props) {
  const { menu } = useMenu();
  const { customers } = useCustomers();
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [cart, setCart] = useState<OrderLineItem[]>([]);
  const [pendingItem, setPendingItem] = useState<MenuItem | null>(null);
  const [amountInput, setAmountInput] = useState("");
  const [sending, setSending] = useState(false);

  const [nameInput, setNameInput] = useState("");
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerWithStats | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [fulfillment, setFulfillment] = useState<FulfillmentType>("in_store");
  const [itemNoteInput, setItemNoteInput] = useState("");
  const [orderNote, setOrderNote] = useState("");

  const categories = useMemo(
    () => Array.from(new Set(menu.map((m) => m.category))),
    [menu],
  );

  useEffect(() => {
    if (menu.length > 0 && !activeCategory) {
      setActiveCategory(menu[0].category);
    }
  }, [menu, activeCategory]);

  // When an order is sent back from the stream, load it into the cart for editing.
  // Only consume the recall once customers have loaded, so we don't clear it
  // before we've had a real chance to match the customer by ID.
  useEffect(() => {
    if (!recalledOrder) return;
    if (recalledOrder.customerId && customers.length === 0) return;

    setCart(recalledOrder.items);
    setFulfillment(recalledOrder.fulfillment);
    setOrderNote(recalledOrder.notes ?? "");
    if (recalledOrder.customerId) {
      const match = customers.find(
        (c) => c.customerId === recalledOrder.customerId,
      );
      if (match) {
        setSelectedCustomer(match);
        setNameInput(`${match.firstName} ${match.lastName}`);
      } else {
        setNameInput(recalledOrder.customerName);
      }
    } else {
      setNameInput(recalledOrder.customerName);
    }
    onRecallConsumed();
  }, [recalledOrder, customers, onRecallConsumed]);

  const itemsInCategory = menu.filter(
    (m) => m.category === activeCategory && m.isActive,
  );

  const suggestions = useMemo(() => {
    const q = nameInput.trim().toLowerCase();
    if (!q || selectedCustomer) return [];
    return customers
      .filter((c) => `${c.firstName} ${c.lastName}`.toLowerCase().includes(q))
      .slice(0, 6);
  }, [nameInput, customers, selectedCustomer]);

  const startAdd = (item: MenuItem) => {
    setPendingItem(item);
    setAmountInput("");
    setItemNoteInput("");
  };

  const confirmAdd = () => {
    if (!pendingItem) return;
    const amount = parseFloat(amountInput);
    if (!amount || amount <= 0) return;

    const lineTotal = Math.round(pendingItem.price * amount * 100) / 100;
    setCart((prev) => [
      ...prev,
      {
        menuItemId: pendingItem.id,
        name: pendingItem.name,
        quantity: amount,
        unitPrice: pendingItem.price,
        lineTotal,
        notes: itemNoteInput.trim() || undefined,
      },
    ]);
    setPendingItem(null);
    setAmountInput("");
    setItemNoteInput("");
  };

  const removeLine = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const cartTotal =
    Math.round(cart.reduce((sum, l) => sum + l.lineTotal, 0) * 100) / 100;

  const selectCustomer = (c: CustomerWithStats) => {
    setSelectedCustomer(c);
    setNameInput(`${c.firstName} ${c.lastName}`);
    setShowSuggestions(false);
  };

  const clearCustomer = () => {
    setSelectedCustomer(null);
    setNameInput("");
  };

  const openHistory = async () => {
    if (!selectedCustomer) return;
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const orders = await fetchCustomerOrders(selectedCustomer.customerId);
      setHistoryOrders(orders);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const sendOrder = async () => {
    if (cart.length === 0 || sending) return;
    setSending(true);
    try {
      const name = selectedCustomer
        ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}`
        : nameInput.trim() || `Order #${walkInCounter++}`;
      await createOrder(
        name,
        cart,
        selectedCustomer?.customerId ?? null,
        fulfillment,
        orderNote.trim() || undefined,
      );
      setCart([]);
      clearCustomer();
      setFulfillment("in_store");
      setOrderNote("");
      onOrderSent();
    } catch (err) {
      console.error(err);
      alert("Could not send order — is the server running?");
    } finally {
      setSending(false);
    }
  };

  const amountLabel =
    pendingItem?.soldBy === "weight" ? "Weight (lbs)" : "Quantity";
  const amountValue = parseFloat(amountInput);
  const previewTotal =
    pendingItem && amountValue > 0 ? pendingItem.price * amountValue : null;

  return (
    <div className="counter-screen">
      <header className="counter-header">
        <span className="counter-eyebrow">Maple Kosher Meats</span>
        <h1>Counter</h1>
      </header>

      <div className="category-tabs">
        {categories.map((cat) => {
          const meta = CATEGORY_META[cat] ?? { label: cat, icon: Beef };
          const Icon = meta.icon;
          return (
            <button
              key={cat}
              className={`category-tab ${activeCategory === cat ? "active" : ""}`}
              onClick={() => setActiveCategory(cat)}
              title={cat}
            >
              <Icon size={16} strokeWidth={2} />
              <span>{meta.label}</span>
            </button>
          );
        })}
      </div>

      <div className="item-grid">
        {itemsInCategory.map((item) => (
          <button
            key={item.id}
            className="item-tile"
            onClick={() => startAdd(item)}
          >
            <span className="item-name">{item.name}</span>
            <span className="item-price">
              ${item.price.toFixed(2)} {item.unit}
            </span>
          </button>
        ))}
      </div>

      {pendingItem && (
        <div
          className="amount-modal-backdrop"
          onClick={() => setPendingItem(null)}
        >
          <div className="amount-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{pendingItem.name}</h2>
            <p className="amount-modal-price">
              ${pendingItem.price.toFixed(2)} {pendingItem.unit}
            </p>
            <input
              type="number"
              inputMode="decimal"
              autoFocus
              placeholder={amountLabel}
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirmAdd()}
            />
            {previewTotal !== null && (
              <p className="amount-modal-total">= ${previewTotal.toFixed(2)}</p>
            )}
            <input
              type="text"
              className="amount-modal-note"
              placeholder="Note (e.g. cut thin, extra fatty)"
              value={itemNoteInput}
              onChange={(e) => setItemNoteInput(e.target.value)}
            />
            <div className="amount-modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setPendingItem(null)}
              >
                Cancel
              </button>
              <button className="btn-primary" onClick={confirmAdd}>
                Add to order
              </button>
            </div>
          </div>
        </div>
      )}

      {historyOpen && selectedCustomer && (
        <div
          className="history-modal-backdrop"
          onClick={() => setHistoryOpen(false)}
        >
          <div className="history-modal" onClick={(e) => e.stopPropagation()}>
            <h2>
              {selectedCustomer.firstName} {selectedCustomer.lastName}
            </h2>
            <p className="history-modal-meta">
              {selectedCustomer.loyaltyPoints} pts
              {selectedCustomer.dietaryNotes &&
                ` · ${selectedCustomer.dietaryNotes}`}
            </p>
            <div className="history-modal-orders">
              {historyLoading && <p className="history-empty">Loading…</p>}
              {!historyLoading && historyOrders.length === 0 && (
                <p className="history-empty">No past orders yet.</p>
              )}
              {!historyLoading &&
                historyOrders.map((o) => (
                  <div className="history-order" key={o.id}>
                    <div className="history-order-top">
                      <span>{new Date(o.createdAt).toLocaleDateString()}</span>
                      <span>${o.total.toFixed(2)}</span>
                    </div>
                    <p className="history-order-items">
                      {o.items.map((i) => i.name).join(", ")}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      <div className="cart-panel">
        <div className="fulfillment-toggle">
          <button
            className={`fulfillment-option ${fulfillment === "in_store" ? "active" : ""}`}
            onClick={() => setFulfillment("in_store")}
          >
            In-Store
          </button>
          <button
            className={`fulfillment-option ${fulfillment === "pickup" ? "active" : ""}`}
            onClick={() => setFulfillment("pickup")}
          >
            <Store size={13} strokeWidth={2} />
            Pickup
          </button>
          <button
            className={`fulfillment-option ${fulfillment === "delivery" ? "active" : ""}`}
            onClick={() => setFulfillment("delivery")}
          >
            <Truck size={13} strokeWidth={2} />
            Delivery
          </button>
        </div>
        <div className="customer-input-wrap">
          <input
            className="customer-name-input"
            placeholder="Customer name"
            value={nameInput}
            onChange={(e) => {
              setNameInput(e.target.value);
              setSelectedCustomer(null);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
          {selectedCustomer && (
            <button className="history-pill" onClick={openHistory}>
              <History size={13} strokeWidth={2} />
              History
            </button>
          )}
          {showSuggestions && suggestions.length > 0 && (
            <div className="customer-suggestions">
              {suggestions.map((c) => (
                <button
                  key={c.customerId}
                  className="customer-suggestion"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectCustomer(c);
                  }}
                >
                  {c.firstName} {c.lastName}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="cart-lines">
          {cart.length === 0 && (
            <p className="cart-empty">No items yet — tap a product above.</p>
          )}
          {cart.map((line, i) => (
            <div className="cart-line" key={i}>
              <div className="cart-line-info">
                <span className="cart-line-name">{line.name}</span>
                <span className="cart-line-weight">{line.quantity}</span>
                {line.notes && (
                  <span className="cart-line-note">"{line.notes}"</span>
                )}
              </div>
              <span className="cart-line-total">
                ${line.lineTotal.toFixed(2)}
              </span>
              <button
                className="cart-line-remove"
                onClick={() => removeLine(i)}
                aria-label="Remove"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <input
          type="text"
          className="order-note-input"
          placeholder="Order note (e.g. call when ready)"
          value={orderNote}
          onChange={(e) => setOrderNote(e.target.value)}
        />
        <div className="cart-footer">
          <span className="cart-total-label">Total</span>
          <span className="cart-total-amount">${cartTotal.toFixed(2)}</span>
        </div>
        <button
          className="send-order-btn"
          disabled={cart.length === 0 || sending}
          onClick={sendOrder}
        >
          {sending ? "Sending…" : "Send order"}
        </button>
      </div>
    </div>
  );
}
