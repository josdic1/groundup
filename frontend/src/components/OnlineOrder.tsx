import { useState, useMemo } from 'react';
import { Beef, Bird, Drumstick, Flame, Sandwich, CupSoda, Store, Truck, ShoppingCart, Check, History } from 'lucide-react';
import type { MenuItem, OrderLineItem, SizeTier, Address, Order, CustomerWithStats } from '@groundup/shared-types';
import { MENU_TIERS } from '../data/menuTiers';
import { createOnlineOrder } from '../api/online-orders';
import { fetchCustomerOrders } from '../api/orders';
import { useMenu } from '../hooks/useMenu';
import { useCustomers } from '../hooks/useCustomers';
import './OnlineOrder.css';

const CATEGORY_META: Record<string, { label: string; icon: typeof Beef }> = {
  'Glatt Kosher Beef (Fresh Cuts)': { label: 'Beef', icon: Beef },
  'Fresh Poultry (Chicken & Turkey)': { label: 'Poultry', icon: Bird },
  'Premium Lamb & Veal': { label: 'Lamb & Veal', icon: Drumstick },
  "Marinated & Oven-Ready Specials (Butcher's Prep)": { label: 'Prepared', icon: Flame },
  'Prepared Deli, Provisions & Shabbos Takeout': { label: 'Deli', icon: Sandwich },
  Beverages: { label: 'Drinks', icon: CupSoda },
};

const tiersByItemId = new Map(MENU_TIERS.map((t) => [t.menuItemId, t.tiers]));

type Step = 'browse' | 'checkout' | 'confirmed';

export default function OnlineOrder() {
  const { menu } = useMenu();
  const { customers } = useCustomers();
  const [step, setStep] = useState<Step>('browse');
  const [activeCategory, setActiveCategory] = useState<string>(menu[0]?.category ?? '');
  const [cart, setCart] = useState<OrderLineItem[]>([]);
  const [pendingItem, setPendingItem] = useState<MenuItem | null>(null);
  const [selectedTier, setSelectedTier] = useState<SizeTier | null>(null);
  const [itemNoteInput, setItemNoteInput] = useState('');

  const categories = useMemo(() => Array.from(new Set(menu.map((m) => m.category))), [menu]);

  // Set the initial active category once the menu has loaded, without
  // needing a separate fetch effect — the shared hook handles fetching.
  useMemo(() => {
    if (menu.length > 0 && !activeCategory) {
      setActiveCategory(menu[0].category);
    }
  }, [menu, activeCategory]);

  const [identified, setIdentified] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [matchedCustomer, setMatchedCustomer] = useState<CustomerWithStats | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const openHistory = async () => {
    if (!matchedCustomer) return;
    setShowHistory(true);
    setHistoryLoading(true);
    try {
      const orders = await fetchCustomerOrders(matchedCustomer.customerId);
      setHistoryOrders(orders);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const [fulfillment, setFulfillment] = useState<'pickup' | 'delivery'>('pickup');
  const [address, setAddress] = useState<Address>({ street: '', city: '', state: 'NJ', zip: '' });
  const [orderNote, setOrderNote] = useState('');
  const [placing, setPlacing] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState('');

  const itemsInCategory = menu.filter((m) => m.category === activeCategory && m.isActive);
  const cartTotal = Math.round(cart.reduce((s, l) => s + l.lineTotal, 0) * 100) / 100;

  const pendingTiers: SizeTier[] = useMemo(() => {
    if (!pendingItem) return [];
    return tiersByItemId.get(pendingItem.id) ?? [];
  }, [pendingItem]);

  const handleIdentify = () => {
    const match = customers.find((c) => c.email.toLowerCase() === emailInput.trim().toLowerCase());
    setMatchedCustomer(match ?? null);
    setIdentified(true);
  };

  const openItem = (item: MenuItem) => {
    setPendingItem(item);
    setSelectedTier(null);
    setItemNoteInput('');
  };

  const confirmAddToCart = () => {
    if (!pendingItem || !selectedTier) return;
    setCart((prev) => [
      ...prev,
      {
        menuItemId: pendingItem.id,
        name: `${pendingItem.name} (${selectedTier.label})`,
        quantity: 1,
        unitPrice: selectedTier.price,
        lineTotal: selectedTier.price,
        notes: itemNoteInput.trim() || undefined,
      },
    ]);
    setPendingItem(null);
    setSelectedTier(null);
    setItemNoteInput('');
  };

  const removeLine = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const placeOrder = async () => {
    setPlacing(true);
    try {
      const customerName = matchedCustomer
        ? `${matchedCustomer.firstName} ${matchedCustomer.lastName}`
        : emailInput.trim() || 'Online Guest';
      const order = await createOnlineOrder({
        customerName,
        customerId: matchedCustomer?.customerId ?? null,
        items: cart,
        fulfillment,
        deliveryAddress: fulfillment === 'delivery' ? address : undefined,
        notes: orderNote.trim() || undefined,
      });
      setConfirmedOrderId(order.id);
      setStep('confirmed');
    } catch (err) {
      console.error(err);
      alert('Could not place order — is the server running?');
    } finally {
      setPlacing(false);
    }
  };

  if (step === 'confirmed') {
    return (
      <div className="online-order">
        <div className="confirm-screen">
          <div className="confirm-icon"><Check size={32} strokeWidth={2.5} /></div>
          <h1>Order placed</h1>
          <p>Order #{confirmedOrderId.replace('ord-', '')} — we'll have it ready for {fulfillment}.</p>
          <button
            className="confirm-new-order-btn"
            onClick={() => {
              setStep('browse');
              setCart([]);
              setOrderNote('');
            }}
          >
            Place another order
          </button>
        </div>
      </div>
    );
  }

  if (!identified) {
    return (
      <div className="online-order">
        <div className="identify-screen">
          <h1>Maple Kosher Meats</h1>
          <p>Enter your email to continue, or check out as a guest.</p>
          <input
            type="email"
            placeholder="you@example.com"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleIdentify()}
          />
          <button className="identify-btn" onClick={handleIdentify}>
            Continue
          </button>
        </div>
      </div>
    );
  }

  if (step === 'checkout') {
    return (
      <div className="online-order">
        <div className="checkout-screen">
          <h1>Checkout</h1>
          {matchedCustomer && (
            <p className="checkout-greeting">
              Welcome back, {matchedCustomer.firstName} — {matchedCustomer.loyaltyPoints} pts
            </p>
          )}

          <div className="fulfillment-toggle">
            <button
              className={`fulfillment-option ${fulfillment === 'pickup' ? 'active' : ''}`}
              onClick={() => setFulfillment('pickup')}
            >
              <Store size={14} strokeWidth={2} /> Pickup
            </button>
            <button
              className={`fulfillment-option ${fulfillment === 'delivery' ? 'active' : ''}`}
              onClick={() => setFulfillment('delivery')}
            >
              <Truck size={14} strokeWidth={2} /> Delivery
            </button>
          </div>

          {fulfillment === 'delivery' && (
            <div className="address-fields">
              <input
                placeholder="Street address"
                value={address.street}
                onChange={(e) => setAddress({ ...address, street: e.target.value })}
              />
              <div className="address-row">
                <input
                  placeholder="City"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                />
                <input
                  placeholder="Zip"
                  value={address.zip}
                  onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                />
              </div>
            </div>
          )}

          <input
            className="checkout-note-input"
            placeholder="Order note (optional)"
            value={orderNote}
            onChange={(e) => setOrderNote(e.target.value)}
          />

          <div className="checkout-summary">
            {cart.map((line, i) => (
              <div className="checkout-line" key={i}>
                <span>{line.name}</span>
                <span>${line.lineTotal.toFixed(2)}</span>
              </div>
            ))}
            <div className="checkout-total-row">
              <span>Total</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="checkout-actions">
            <button className="btn-secondary" onClick={() => setStep('browse')}>
              Back to menu
            </button>
            <button
              className="btn-primary"
              disabled={placing || (fulfillment === 'delivery' && !address.street)}
              onClick={placeOrder}
            >
              {placing ? 'Placing order…' : `Place order — $${cartTotal.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="online-order">
      <div className="online-browse-pane">
        <header className="online-header">
          <div>
            <span className="online-eyebrow">Maple Kosher Meats</span>
            <h1>Order Online</h1>
          </div>
          {matchedCustomer && (
            <div className="customer-badge">
              <div className="customer-badge-info">
                <span className="customer-badge-name">{matchedCustomer.firstName} {matchedCustomer.lastName}</span>
                <span className="customer-badge-points">{matchedCustomer.loyaltyPoints} pts</span>
              </div>
              <button className="history-pill" onClick={openHistory}>
                <History size={13} strokeWidth={2} />
                Past orders
              </button>
            </div>
          )}
        </header>
        <div className="category-tabs">
          {categories.map((cat) => {
            const meta = CATEGORY_META[cat] ?? { label: cat, icon: Beef };
            const Icon = meta.icon;
            return (
              <button
                key={cat}
                className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
                title={cat}
              >
                <Icon size={16} strokeWidth={2} />
                <span>{meta.label}</span>
              </button>
            );
          })}
        </div>
        <div className="online-item-grid">
          {itemsInCategory.map((item) => {
            const tiers = tiersByItemId.get(item.id) ?? [];
            const lowPrice = tiers.length > 0 ? Math.min(...tiers.map((t) => t.price)) : item.price;
            return (
              <button key={item.id} className="online-item-tile" onClick={() => openItem(item)}>
                <span className="online-item-name">{item.name}</span>
                <span className="online-item-price">From ${lowPrice.toFixed(2)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {pendingItem && (
        <div className="tier-modal-backdrop" onClick={() => setPendingItem(null)}>
          <div className="tier-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{pendingItem.name}</h2>
            <div className="tier-options">
              {pendingTiers.map((tier) => (
                <button
                  key={tier.label}
                  className={`tier-option ${selectedTier?.label === tier.label ? 'selected' : ''}`}
                  onClick={() => setSelectedTier(tier)}
                >
                  <span className="tier-label">{tier.label}</span>
                  {tier.weightLbs && <span className="tier-weight">~{tier.weightLbs} lb</span>}
                  <span className="tier-price">${tier.price.toFixed(2)}</span>
                </button>
              ))}
            </div>
            {selectedTier && (
              <input
                type="text"
                className="tier-note-input"
                placeholder="Note (e.g. cut thin, extra fatty)"
                value={itemNoteInput}
                onChange={(e) => setItemNoteInput(e.target.value)}
              />
            )}
            <div className="tier-modal-actions">
              <button className="btn-secondary" onClick={() => setPendingItem(null)}>
                Cancel
              </button>
              <button className="btn-primary" disabled={!selectedTier} onClick={confirmAddToCart}>
                Add to cart
              </button>
            </div>
          </div>
        </div>
      )}

      {showHistory && matchedCustomer && (
        <div className="history-modal-backdrop" onClick={() => setShowHistory(false)}>
          <div className="history-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{matchedCustomer.firstName} {matchedCustomer.lastName}</h2>
            <p className="history-modal-meta">
              {matchedCustomer.loyaltyPoints} pts
              {matchedCustomer.dietaryNotes && ` · ${matchedCustomer.dietaryNotes}`}
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
                      {o.items.map((i) => i.name).join(', ')}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      <div className="online-cart-pane">
        <h2>
          <ShoppingCart size={16} strokeWidth={2} /> Your order
        </h2>
        <div className="online-cart-lines">
          {cart.length === 0 && <p className="cart-empty">Nothing in your cart yet.</p>}
          {cart.map((line, i) => (
            <div className="online-cart-line" key={i}>
              <div className="online-cart-line-info">
                <span className="online-cart-line-name">{line.name}</span>
                {line.notes && <span className="online-cart-line-note">"{line.notes}"</span>}
              </div>
              <span className="online-cart-line-total">${line.lineTotal.toFixed(2)}</span>
              <button onClick={() => removeLine(i)} aria-label="Remove">×</button>
            </div>
          ))}
        </div>
        <div className="online-cart-footer">
          <span>Total</span>
          <span>${cartTotal.toFixed(2)}</span>
        </div>
        <button
          className="online-checkout-btn"
          disabled={cart.length === 0}
          onClick={() => setStep('checkout')}
        >
          Checkout
        </button>
      </div>
    </div>
  );
}
