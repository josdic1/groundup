import type { Order, OrderLineItem, Customer, FulfillmentType } from '@groundup/shared-types';
import { STORE_CONFIG } from '../config';

const BASE = STORE_CONFIG.apiBaseUrl;

export async function fetchOrders(): Promise<Order[]> {
  const res = await fetch(`${BASE}/orders`);
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
}

export async function createOrder(
  customerName: string,
  items: OrderLineItem[],
  customerId?: string | null,
  fulfillment?: FulfillmentType,
  notes?: string
): Promise<Order> {
  const res = await fetch(`${BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName,
      items,
      customerId: customerId ?? null,
      source: 'counter',
      fulfillment: fulfillment ?? 'in_store',
      notes,
    }),
  });
  if (!res.ok) throw new Error('Failed to create order');
  return res.json();
}

export async function updateOrder(
  id: string,
  changes: { status?: Order['status']; claimedBy?: string }
): Promise<Order> {
  const res = await fetch(`${BASE}/orders/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(changes),
  });
  if (!res.ok) throw new Error('Failed to update order');
  return res.json();
}

export async function deleteOrder(id: string): Promise<void> {
  const res = await fetch(`${BASE}/orders/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to delete order');
  }
}

export async function fetchCustomers(): Promise<Customer[]> {
  const res = await fetch(`${BASE}/customers`);
  if (!res.ok) throw new Error('Failed to fetch customers');
  return res.json();
}

export async function fetchCustomerOrders(customerId: string): Promise<Order[]> {
  const res = await fetch(`${BASE}/customers/${customerId}/orders`);
  if (!res.ok) throw new Error('Failed to fetch customer order history');
  return res.json();
}
