import { useEffect, useMemo, useState } from 'react';
import {
  Beef,
  Bird,
  Drumstick,
  Flame,
  Sandwich,
  CupSoda,
  Store,
  Truck,
  ShoppingCart,
  Check,
  History,
  LogOut,
  UserRound,
  AlertCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import type {
  MenuItem,
  OrderLineItem,
  SizeTier,
  MenuItemTiers,
  Address,
  Order,
  CustomerWithStats,
} from '@groundup/shared-types';
import { MENU_TIERS } from '../../data/menuTiers';
import { createOnlineOrder } from '../../api/online-orders';
import { fetchCustomerOrders } from '../../api/orders';
import { updateCustomer, deleteCustomer } from '../../api/customers';
import { useMenu } from '../../hooks/useMenu';
import { useCustomers } from '../../hooks/useCustomers';

const CATEGORY_META: Record<string, { label: string; icon: typeof Beef }> = {
  'Glatt Kosher Beef (Fresh Cuts)': { label: 'Beef', icon: Beef },
  'Fresh Poultry (Chicken & Turkey)': { label: 'Poultry', icon: Bird },
  'Premium Lamb & Veal': { label: 'Lamb & Veal', icon: Drumstick },
  "Marinated & Oven-Ready Specials (Butcher's Prep)": { label: 'Prepared', icon: Flame },
  'Prepared Deli, Provisions & Shabbos Takeout': { label: 'Deli', icon: Sandwich },
  Beverages: { label: 'Drinks', icon: CupSoda },
};

const tiersByItemId = new Map<string, SizeTier[]>(
  MENU_TIERS.map((t: MenuItemTiers) => [t.menuItemId, t.tiers])
);

type Step = 'browse' | 'checkout' | 'confirmed';

const emptyAddress: Address = {
  street: '',
  city: '',
  state: 'NJ',
  zip: '',
};

export default function OnlineOrder() {
  const { menu } = useMenu();
  const { customers } = useCustomers();

  const [step, setStep] = useState<Step>('browse');
  const [activeCategory, setActiveCategory] = useState('');
  const [cart, setCart] = useState<OrderLineItem[]>([]);
  const [pendingItem, setPendingItem] = useState<MenuItem | null>(null);
  const [selectedTier, setSelectedTier] = useState<SizeTier | null>(null);
  const [itemNoteInput, setItemNoteInput] = useState('');

  const [identified, setIdentified] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [matchedCustomer, setMatchedCustomer] = useState<CustomerWithStats | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [savingContact, setSavingContact] = useState(false);
  const [deletedCustomerIds, setDeletedCustomerIds] = useState<Set<string>>(() => new Set());
  const [contactForm, setContactForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dietaryNotes: '',
    street: '',
    city: '',
    state: 'NJ',
    zip: '',
  });
  const [showHistory, setShowHistory] = useState(false);
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [fulfillment, setFulfillment] = useState<'pickup' | 'delivery'>('pickup');
  const [address, setAddress] = useState<Address>(emptyAddress);
  const [orderNote, setOrderNote] = useState('');
  const [placing, setPlacing] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState('');

  const categories = useMemo(() => Array.from(new Set(menu.map((m) => m.category))), [menu]);

  const sampleCustomers = useMemo(() => {
    return [...customers]
      .filter((customer) => !deletedCustomerIds.has(customer.customerId))
      .sort((a, b) => {
      const aName = `${a.firstName} ${a.lastName}`.toLowerCase();
      const bName = `${b.firstName} ${b.lastName}`.toLowerCase();
      return aName.localeCompare(bName);
    });
  }, [customers, deletedCustomerIds]);

  useEffect(() => {
    if (!activeCategory && categories.length > 0) {
      setActiveCategory(categories[0]);
    }
  }, [activeCategory, categories]);

  const itemsInCategory = menu.filter((m) => m.category === activeCategory && m.isActive);
  const cartTotal = Math.round(cart.reduce((sum, line) => sum + line.lineTotal, 0) * 100) / 100;

  const pendingTiers: SizeTier[] = useMemo(() => {
    if (!pendingItem) return [];
    return tiersByItemId.get(pendingItem.id) ?? [];
  }, [pendingItem]);

  const loggedInLabel = matchedCustomer
    ? `${matchedCustomer.firstName} ${matchedCustomer.lastName}`
    : emailInput.trim() || 'Online Guest';

  const resetOrderSession = () => {
    setStep('browse');
    setCart([]);
    setPendingItem(null);
    setSelectedTier(null);
    setItemNoteInput('');
    setFulfillment('pickup');
    setAddress(emptyAddress);
    setOrderNote('');
    setPlacing(false);
    setConfirmedOrderId('');
    setShowHistory(false);
    setHistoryOrders([]);
    setHistoryLoading(false);
  };

  const loginAsCustomer = (customer: CustomerWithStats) => {
    resetOrderSession();
    setMatchedCustomer(customer);
    setEmailInput(customer.email);
    setIdentified(true);
  };

  const handleManualIdentify = () => {
    const cleanEmail = emailInput.trim().toLowerCase();
    const match = customers.find((customer) => customer.email.toLowerCase() === cleanEmail);

    resetOrderSession();
    setMatchedCustomer(match ?? null);
    setIdentified(true);
  };

  const logoutTester = () => {
    resetOrderSession();
    setAccountOpen(false);
    setShowContactModal(false);
    setMatchedCustomer(null);
    setEmailInput('');
    setIdentified(false);
  };

  const openContactModal = () => {
    if (!matchedCustomer) return;

    setAccountOpen(false);
    setContactForm({
      firstName: matchedCustomer.firstName,
      lastName: matchedCustomer.lastName,
      email: matchedCustomer.email,
      phone: matchedCustomer.phone,
      dietaryNotes: matchedCustomer.dietaryNotes ?? '',
      street: matchedCustomer.address?.street ?? '',
      city: matchedCustomer.address?.city ?? '',
      state: matchedCustomer.address?.state ?? 'NJ',
      zip: matchedCustomer.address?.zip ?? '',
    });
    setShowContactModal(true);
  };

  const saveContactInfo = async () => {
    if (!matchedCustomer) return;

    setSavingContact(true);

    try {
      const updated = await updateCustomer(matchedCustomer.customerId, {
        firstName: contactForm.firstName.trim(),
        lastName: contactForm.lastName.trim(),
        email: contactForm.email.trim(),
        phone: contactForm.phone.trim(),
        dietaryNotes: contactForm.dietaryNotes.trim(),
        address: {
          street: contactForm.street.trim(),
          city: contactForm.city.trim(),
          state: contactForm.state.trim() || 'NJ',
          zip: contactForm.zip.trim(),
        },
      });

      setMatchedCustomer(updated);
      setEmailInput(updated.email);
      setShowContactModal(false);
    } catch (err) {
      console.error(err);
      alert('Could not update contact info — is the server running?');
    } finally {
      setSavingContact(false);
    }
  };

  const deleteContactInfo = async () => {
    if (!matchedCustomer) return;

    const confirmed = window.confirm(
      `Delete ${matchedCustomer.firstName} ${matchedCustomer.lastName} from the sample customer list?`
    );

    if (!confirmed) return;

    setSavingContact(true);

    try {
      await deleteCustomer(matchedCustomer.customerId);
      setDeletedCustomerIds((prev) => new Set(prev).add(matchedCustomer.customerId));
      logoutTester();
    } catch (err) {
      console.error(err);
      alert('Could not delete customer — is the server running?');
    } finally {
      setSavingContact(false);
    }
  };

  const openAccountHistory = () => {
    setAccountOpen(false);
    openHistory();
  };

  const renderAccountMenu = () => (
    <div className="online-account-wrap">
      <button
        className="online-account-button"
        type="button"
        onClick={() => setAccountOpen((open) => !open)}
      >
        <span>Logged in as</span>
        <strong>{loggedInLabel}</strong>
        <MoreHorizontal size={16} strokeWidth={2} />
      </button>

      {accountOpen && (
        <div className="online-account-menu">
          {matchedCustomer && (
            <>
              <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={openAccountHistory}>
                <History size={14} strokeWidth={2} />
                Past orders
              </button>
              <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={openContactModal}>
                <Pencil size={14} strokeWidth={2} />
                Contact info
              </button>
            </>
          )}

          <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={logoutTester}>
            <LogOut size={14} strokeWidth={2} />
            Switch customer
          </button>
        </div>
      )}
    </div>
  );

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
      const order = await createOnlineOrder({
        customerName: loggedInLabel,
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
          <div className="confirm-icon">
            <Check size={32} strokeWidth={2.5} />
          </div>
          <h1>Order placed</h1>
          <p>
            Order #{confirmedOrderId.replace('ord-', '')} — we&apos;ll have it ready for {fulfillment}.
          </p>

          <div className="online-session-card compact">
            <span>Logged in as</span>
            <strong>{loggedInLabel}</strong>
          </div>

          <div className="confirm-actions">
            <button
              className="confirm-new-order-btn"
              onClick={() => {
                resetOrderSession();
                setIdentified(true);
              }}
            >
              Place another order
            </button>

            <button className="btn-secondary" onClick={logoutTester}>
              New test customer
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!identified) {
    return (
      <div className="online-order">
        <div className="sample-login-screen">
          <div className="sample-login-card">
            <span className="online-eyebrow">Online ordering preview</span>
            <h1>Choose a test customer</h1>
            <p>
              Click any sample customer to view the ordering page exactly as that customer.
            </p>

            {sampleCustomers.length === 0 ? (
              <div className="sample-data-warning">
                <AlertCircle size={20} strokeWidth={2} />
                <div>
                  <strong>Load sample data first</strong>
                  <span>
                    Use Admin → Load demo data, then come back here to pick a customer.
                  </span>
                </div>
              </div>
            ) : (
              <div className="sample-customer-grid">
                {sampleCustomers.map((customer) => (
                  <button
                    key={customer.customerId}
                    className="sample-customer-card"
                    onClick={() => loginAsCustomer(customer)}
                  >
                    <div className="sample-customer-avatar">
                      <UserRound size={18} strokeWidth={2} />
                    </div>

                    <div className="sample-customer-copy">
                      <strong>
                        {customer.firstName} {customer.lastName}
                      </strong>
                      <span>{customer.email}</span>
                      <small>{customer.loyaltyPoints} loyalty pts</small>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="manual-login-panel">
              <span>Or test a guest email</span>
              <div className="manual-login-row">
                <input
                  type="email"
                  placeholder="guest@example.com"
                  value={emailInput}
                  onChange={(event) => setEmailInput(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && handleManualIdentify()}
                />
                <button className="identify-btn" onClick={handleManualIdentify}>
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'checkout') {
    return (
      <div className="online-order">
        <div className="checkout-screen">
          <div className="checkout-header-row">
            <div>
              <h1>Checkout</h1>
              <p className="checkout-greeting">Logged in as {loggedInLabel}</p>
            </div>

            {renderAccountMenu()}
          </div>

          {matchedCustomer && (
            <div className="online-session-card">
              <span>Customer profile</span>
              <strong>
                {matchedCustomer.firstName} {matchedCustomer.lastName}
              </strong>
              <small>{matchedCustomer.loyaltyPoints} loyalty pts</small>
            </div>
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
                onChange={(event) => setAddress({ ...address, street: event.target.value })}
              />
              <div className="address-row">
                <input
                  placeholder="City"
                  value={address.city}
                  onChange={(event) => setAddress({ ...address, city: event.target.value })}
                />
                <input
                  placeholder="Zip"
                  value={address.zip}
                  onChange={(event) => setAddress({ ...address, zip: event.target.value })}
                />
              </div>
            </div>
          )}

          <input
            className="checkout-note-input"
            placeholder="Order note (optional)"
            value={orderNote}
            onChange={(event) => setOrderNote(event.target.value)}
          />

          <div className="checkout-summary">
            {cart.map((line, index) => (
              <div className="checkout-line" key={`${line.menuItemId}-${index}`}>
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

          {renderAccountMenu()}
        </header>

        <div className="category-tabs">
          {categories.map((category) => {
            const meta = CATEGORY_META[category] ?? { label: category, icon: Beef };
            const Icon = meta.icon;

            return (
              <button
                key={category}
                className={`category-tab ${activeCategory === category ? 'active' : ''}`}
                onClick={() => setActiveCategory(category)}
                title={category}
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
            const lowPrice = tiers.length > 0 ? Math.min(...tiers.map((tier) => tier.price)) : item.price;

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
          <div className="tier-modal" onClick={(event) => event.stopPropagation()}>
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
                onChange={(event) => setItemNoteInput(event.target.value)}
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

      {showContactModal && matchedCustomer && (
        <div className="contact-modal-backdrop" onClick={() => setShowContactModal(false)}>
          <div className="contact-modal" onClick={(event) => event.stopPropagation()}>
            <div className="contact-modal-header">
              <div>
                <span className="online-eyebrow">Customer profile</span>
                <h2>Contact info</h2>
                <p>Logged in as {matchedCustomer.firstName} {matchedCustomer.lastName}</p>
              </div>
              <button className="contact-modal-close" onClick={() => setShowContactModal(false)} aria-label="Close">
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            <div className="contact-form-grid">
              <label>
                First name
                <input
                  value={contactForm.firstName}
                  onChange={(event) => setContactForm({ ...contactForm, firstName: event.target.value })}
                />
              </label>

              <label>
                Last name
                <input
                  value={contactForm.lastName}
                  onChange={(event) => setContactForm({ ...contactForm, lastName: event.target.value })}
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  value={contactForm.email}
                  onChange={(event) => setContactForm({ ...contactForm, email: event.target.value })}
                />
              </label>

              <label>
                Phone
                <input
                  value={contactForm.phone}
                  onChange={(event) => setContactForm({ ...contactForm, phone: event.target.value })}
                />
              </label>

              <label className="contact-form-wide">
                Street address
                <input
                  value={contactForm.street}
                  onChange={(event) => setContactForm({ ...contactForm, street: event.target.value })}
                />
              </label>

              <label>
                City
                <input
                  value={contactForm.city}
                  onChange={(event) => setContactForm({ ...contactForm, city: event.target.value })}
                />
              </label>

              <label>
                State
                <input
                  value={contactForm.state}
                  onChange={(event) => setContactForm({ ...contactForm, state: event.target.value })}
                />
              </label>

              <label>
                Zip
                <input
                  value={contactForm.zip}
                  onChange={(event) => setContactForm({ ...contactForm, zip: event.target.value })}
                />
              </label>

              <label className="contact-form-wide">
                Notes
                <input
                  value={contactForm.dietaryNotes}
                  onChange={(event) => setContactForm({ ...contactForm, dietaryNotes: event.target.value })}
                  placeholder="Dietary notes, delivery notes, preferences"
                />
              </label>
            </div>

            <div className="contact-modal-actions">
              <button className="contact-delete-btn" disabled={savingContact} onClick={deleteContactInfo}>
                <Trash2 size={14} strokeWidth={2} />
                Delete sample customer
              </button>

              <div>
                <button className="btn-secondary" disabled={savingContact} onClick={() => setShowContactModal(false)}>
                  Cancel
                </button>
                <button className="btn-primary" disabled={savingContact} onClick={saveContactInfo}>
                  {savingContact ? 'Saving…' : 'Save contact info'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showHistory && matchedCustomer && (
        <div className="history-modal-backdrop" onClick={() => setShowHistory(false)}>
          <div className="history-modal" onClick={(event) => event.stopPropagation()}>
            <h2>
              {matchedCustomer.firstName} {matchedCustomer.lastName}
            </h2>
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
                historyOrders.map((order) => (
                  <div className="history-order" key={order.id}>
                    <div className="history-order-top">
                      <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                      <span>${order.total.toFixed(2)}</span>
                    </div>
                    <p className="history-order-items">
                      {order.items.map((item) => item.name).join(', ')}
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
          {cart.map((line, index) => (
            <div className="online-cart-line" key={`${line.menuItemId}-${index}`}>
              <div className="online-cart-line-info">
                <span className="online-cart-line-name">{line.name}</span>
                {line.notes && <span className="online-cart-line-note">&quot;{line.notes}&quot;</span>}
              </div>
              <span className="online-cart-line-total">${line.lineTotal.toFixed(2)}</span>
              <button onClick={() => removeLine(index)} aria-label="Remove">
                ×
              </button>
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
