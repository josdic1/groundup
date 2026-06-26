import type { Order, OrderLineItem, Address } from '@groundup/shared-types';
import { STORE_CONFIG } from '../config';

const BASE = STORE_CONFIG.apiBaseUrl;

export async function createOnlineOrder(params: {
  customerName: string;
  customerId: string | null;
  items: OrderLineItem[];
  fulfillment: 'pickup' | 'delivery';
  deliveryAddress?: Address;
  notes?: string;
}): Promise<Order> {
  const res = await fetch(`${BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: params.customerName,
      customerId: params.customerId,
      items: params.items,
      source: 'online',
      fulfillment: params.fulfillment,
      deliveryAddress: params.deliveryAddress,
      notes: params.notes,
    }),
  });
  if (!res.ok) throw new Error('Failed to place order');
  return res.json();
}
