export type SoldBy = 'weight' | 'each';

export type MenuItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  soldBy: SoldBy;
  isActive: boolean;
};

export type Address = {
  street: string;
  city: string;
  state: string;
  zip: string;
};

export type Customer = {
  customerId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  loyaltyPoints: number;
  dietaryNotes: string;
  address: Address;
};

// Customer enriched with computed order stats, returned by GET /api/customers
export type CustomerWithStats = Customer & {
  totalSpent: number;
  orderCount: number;
  lastOrderAt: number | null;
};

export type OrderStatus = 'placed' | 'in_prep' | 'ready' | 'completed' | 'cancelled';
export type OrderSource = 'counter' | 'online';
export type FulfillmentType = 'in_store' | 'pickup' | 'delivery';

export type SizeTier = {
  label: string;
  weightLbs: number | null;
  price: number;
};

export type MenuItemTiers = {
  menuItemId: string;
  tiers: SizeTier[];
};

export type OrderLineItem = {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  notes?: string;
};

export type Order = {
  id: string;
  customerId: string | null;
  customerName: string;
  items: OrderLineItem[];
  total: number;
  status: OrderStatus;
  source: OrderSource;
  fulfillment: FulfillmentType;
  claimedBy: string | null;
  createdAt: number;
  notes?: string;
  deliveryAddress?: Address;
  scheduledFor?: number;
};
