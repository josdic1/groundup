import type { CustomerWithStats, Customer, Order } from '@groundup/shared-types';
import { STORE_CONFIG } from '../config';

const BASE = STORE_CONFIG.apiBaseUrl;

export async function fetchCustomersWithStats(): Promise<CustomerWithStats[]> {
  const res = await fetch(`${BASE}/customers`);
  if (!res.ok) throw new Error('Failed to fetch customers');
  return res.json();
}

export async function fetchCustomerOrderHistory(customerId: string): Promise<Order[]> {
  const res = await fetch(`${BASE}/customers/${customerId}/orders`);
  if (!res.ok) throw new Error('Failed to fetch customer order history');
  return res.json();
}

export async function createCustomer(
  data: Omit<Customer, 'customerId'>
): Promise<CustomerWithStats> {
  const res = await fetch(`${BASE}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create customer');
  return res.json();
}

export async function updateCustomer(
  customerId: string,
  data: Partial<Customer>
): Promise<CustomerWithStats> {
  const res = await fetch(`${BASE}/customers/${customerId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update customer');
  return res.json();
}

export async function deleteCustomer(customerId: string): Promise<void> {
  const res = await fetch(`${BASE}/customers/${customerId}`, {
    method: 'DELETE',
  });

  if (!res.ok) throw new Error('Failed to delete customer');
}

export type CustomerInsights = {
  mostLoyal: CustomerWithStats[];
  highestSpend: CustomerWithStats[];
  needReconnect: CustomerWithStats[];
};

export async function fetchCustomerInsights(): Promise<CustomerInsights> {
  const res = await fetch(`${BASE}/customers/insights`);
  if (!res.ok) throw new Error('Failed to fetch customer insights');
  return res.json();
}
