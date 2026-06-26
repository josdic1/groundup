import { useState, useEffect } from 'react';
import type { CustomerWithStats } from '@groundup/shared-types';
import { fetchCustomersWithStats } from '../api/customers';

let cachedCustomers: CustomerWithStats[] | null = null;
let inFlight: Promise<CustomerWithStats[]> | null = null;

// Same pattern as useMenu — one fetch, shared cache, every screen reads
// from the same source instead of independently re-fetching.
export function useCustomers() {
  const [customers, setCustomers] = useState<CustomerWithStats[]>(cachedCustomers ?? []);
  const [loading, setLoading] = useState(cachedCustomers === null);

  useEffect(() => {
    if (cachedCustomers) {
      setCustomers(cachedCustomers);
      setLoading(false);
      return;
    }
    if (!inFlight) {
      inFlight = fetchCustomersWithStats();
    }
    inFlight
      .then((items) => {
        cachedCustomers = items;
        setCustomers(items);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { customers, loading };
}

// Call after any customer create/edit/order-placement so stats stay fresh.
export function invalidateCustomersCache() {
  cachedCustomers = null;
  inFlight = null;
}
