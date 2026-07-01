import express from "express";
import cors from "cors";
import type {
  Order,
  OrderLineItem,
  OrderSource,
  FulfillmentType,
  Address,
  Customer,
  MenuItem,
} from "@groundup/shared-types";
import { CUSTOMERS } from "./data/customers.js";
import { HISTORICAL_ORDERS } from "./data/historicalOrders.js";
import { MENU } from "./data/menu.js";
import { MENU_TIERS } from "./data/menuTiers.js";
import { STAFF } from "./data/staff.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "groundup-backend",
    status: "healthy",
  });
});

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "groundup-backend",
    status: "healthy",
  });
});



// --- Helpers ---
const formatCurrency = (num: number) => Math.round(num * 100) / 100;
const formatDecimal = (num: number) => Math.round(num * 10) / 10;

let orders: Order[] = [];
let orderCounter = 1001;
let customers: Customer[] = [...CUSTOMERS];
let customerCounter = customers.length + 1;
let menu: MenuItem[] = [...MENU];

const menuCategoryById = new Map(MENU.map((m) => [m.id, m.category]));

function computeCustomerStats(customerId: string) {
  const customerOrders = orders.filter(
    (o) => o.customerId === customerId && o.status !== "cancelled",
  );
  const totalSpent = formatCurrency(
    customerOrders.reduce((sum, o) => sum + o.total, 0),
  );
  const orderCount = customerOrders.length;
  const lastOrderAt =
    customerOrders.length > 0
      ? Math.max(...customerOrders.map((o) => o.createdAt))
      : null;
  return { totalSpent, orderCount, lastOrderAt };
}

// ----- Staff -----

app.get("/api/staff", (_req, res) => {
  res.json(STAFF.filter((staff) => staff.isActive));
});

// ----- Menu tiers -----

app.get("/api/menu-tiers", (_req, res) => {
  res.json(MENU_TIERS);
});

// ----- Orders -----

app.get("/api/orders", (req, res) => {
  res.json(orders);
});

app.post("/api/orders", (req, res) => {
  const {
    customerName,
    customerId,
    items,
    source,
    fulfillment,
    notes,
    deliveryAddress,
  } = req.body as {
    customerName: string;
    customerId?: string | null;
    items: OrderLineItem[];
    source?: OrderSource;
    fulfillment?: FulfillmentType;
    notes?: string;
    deliveryAddress?: Address;
  };

  if (!items || items.length === 0) {
    return res.status(400).json({ error: "Order must have at least one item" });
  }

  const total = formatCurrency(items.reduce((sum, i) => sum + i.lineTotal, 0));

  const newOrder: Order = {
    id: `ord-${orderCounter++}`,
    customerId: customerId ?? null,
    customerName: customerName || "Walk-in",
    items,
    total,
    status: "placed",
    source: source ?? "counter",
    fulfillment: fulfillment ?? "in_store",
    claimedBy: null,
    createdAt: Date.now(),
    notes,
    deliveryAddress,
  };

  orders = [newOrder, ...orders];
  res.status(201).json(newOrder);
});

app.patch("/api/orders/:id", (req, res) => {
  const { id } = req.params;
  const { status, claimedBy } = req.body as {
    status?: Order["status"];
    claimedBy?: string;
  };

  const order = orders.find((o) => o.id === id);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  if (status) order.status = status;
  if (claimedBy !== undefined) order.claimedBy = claimedBy;

  res.json(order);
});

app.delete("/api/orders/:id", (req, res) => {
  const { id } = req.params;
  const order = orders.find((o) => o.id === id);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  if (order.status !== "placed") {
    return res.status(400).json({
      error: "Only unclaimed orders can be sent back to the register",
    });
  }
  orders = orders.filter((o) => o.id !== id);
  res.json({ ok: true });
});

// ----- Menu -----

app.get("/api/menu", (req, res) => {
  res.json(menu.filter((item) => item.isActive));
});

app.get("/api/menu/admin", (req, res) => {
  res.json(menu);
});

app.get("/api/menu", (req, res) => {
  const activeMenu = menu.filter((item) => item.isActive);

  const enrichedMenu = activeMenu.map((item) => {
    const tiers = MENU_TIERS.find((t) => t.menuItemId === item.id)?.tiers || [];
    return { ...item, tiers };
  });

  res.json(enrichedMenu);
});

app.patch("/api/menu/:id", (req, res) => {
  const { id } = req.params;
  const item = menu.find((m) => m.id === id);
  if (!item) return res.status(404).json({ error: "Menu item not found" });

  Object.assign(item, req.body, { id: item.id });
  res.json(item);
});

app.post("/api/menu", (req, res) => {
  const body = req.body as Partial<MenuItem>;

  if (
    !body.name ||
    !body.category ||
    body.price === undefined ||
    !body.unit ||
    !body.soldBy
  ) {
    return res.status(400).json({ error: "Missing required menu fields" });
  }

  const id =
    body.id ||
    body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  if (menu.some((m) => m.id === id)) {
    return res.status(400).json({ error: "Menu item already exists" });
  }

  const item: MenuItem = {
    id,
    name: body.name,
    category: body.category,
    price: Number(body.price),
    unit: body.unit,
    soldBy: body.soldBy,
    isActive: body.isActive ?? true,
  };

  menu = [item, ...menu];
  res.status(201).json(item);
});

// ----- Customers -----

app.get("/api/customers", (req, res) => {
  const enriched = customers.map((c) => ({
    ...c,
    ...computeCustomerStats(c.customerId),
  }));
  res.json(enriched);
});

app.get("/api/customers/:id/orders", (req, res) => {
  const { id } = req.params;
  const customerOrders = orders
    .filter((o) => o.customerId === id)
    .sort((a, b) => b.createdAt - a.createdAt);
  res.json(customerOrders);
});

app.post("/api/customers", (req, res) => {
  const body = req.body as Omit<Customer, "customerId">;
  if (!body.firstName || !body.lastName) {
    return res.status(400).json({ error: "First and last name are required" });
  }
  const newCustomer: Customer = {
    customerId: `cust-new-${customerCounter++}`,
    firstName: body.firstName,
    lastName: body.lastName,
    phone: body.phone ?? "",
    email: body.email ?? "",
    loyaltyPoints: body.loyaltyPoints ?? 0,
    dietaryNotes: body.dietaryNotes ?? "",
    address: body.address ?? { street: "", city: "", state: "NJ", zip: "" },
  };
  customers = [newCustomer, ...customers];
  res
    .status(201)
    .json({ ...newCustomer, ...computeCustomerStats(newCustomer.customerId) });
});

app.patch("/api/customers/:id", (req, res) => {
  const { id } = req.params;
  const customer = customers.find((c) => c.customerId === id);
  if (!customer) {
    return res.status(404).json({ error: "Customer not found" });
  }
  const body = req.body as Partial<Customer>;
  Object.assign(customer, body, { customerId: customer.customerId });
  res.json({ ...customer, ...computeCustomerStats(customer.customerId) });
});


app.delete("/api/customers/:id", (req, res) => {
  const { id } = req.params;
  const customer = customers.find((c) => c.customerId === id);

  if (!customer) {
    return res.status(404).json({ error: "Customer not found" });
  }

  const customerName = `${customer.firstName} ${customer.lastName}`.trim();

  const detachedOrders = orders.filter((o) => o.customerId === id).length;

  orders = orders.map((order) =>
    order.customerId === id
      ? {
          ...order,
          customerId: null,
          customerName: order.customerName || customerName || "Deleted customer",
        }
      : order,
  );

  customers = customers.filter((c) => c.customerId !== id);

  res.json({
    ok: true,
    deletedCustomerId: id,
    detachedOrders,
  });
});

app.get("/api/customers/insights", (req, res) => {
  const now = Date.now();
  const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;

  const withStats = customers.map((c) => ({
    ...c,
    ...computeCustomerStats(c.customerId),
  }));

  const mostLoyal = [...withStats]
    .sort((a, b) => b.loyaltyPoints - a.loyaltyPoints)
    .slice(0, 5);

  const highestSpend = [...withStats]
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5);

  const needReconnect = withStats
    .filter((c) => c.lastOrderAt === null || c.lastOrderAt < sixtyDaysAgo)
    .sort((a, b) => (a.lastOrderAt ?? 0) - (b.lastOrderAt ?? 0))
    .slice(0, 5);

  res.json({ mostLoyal, highestSpend, needReconnect });
});

// ----- Stats / Dashboard -----

app.get("/api/stats", (req, res) => {
  const now = Date.now();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  const revenueOrders = orders.filter((o) => o.status !== "cancelled");
  const last30Days = revenueOrders.filter((o) => o.createdAt >= thirtyDaysAgo);
  const todayOrders = revenueOrders.filter(
    (o) => o.createdAt >= startOfToday.getTime(),
  );

  // At-a-glance
  const todayRevenue = formatCurrency(
    todayOrders.reduce((s, o) => s + o.total, 0),
  );
  const todayOrderCount = todayOrders.length;
  const avgTicket =
    todayOrderCount > 0 ? formatCurrency(todayRevenue / todayOrderCount) : 0;
  const activeOrders = orders.filter(
    (o) =>
      o.status === "placed" || o.status === "in_prep" || o.status === "ready",
  ).length;

  // Top-selling items (last 30 days), by revenue and by quantity
  const itemStats = new Map<
    string,
    { name: string; revenue: number; unitsSold: number }
  >();
  for (const o of last30Days) {
    for (const item of o.items) {
      const existing = itemStats.get(item.menuItemId) ?? {
        name: item.name,
        revenue: 0,
        unitsSold: 0,
      };
      existing.revenue += item.lineTotal;
      existing.unitsSold += item.quantity;
      itemStats.set(item.menuItemId, existing);
    }
  }
  const topByRevenue = Array.from(itemStats.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8)
    .map((i) => ({ ...i, revenue: formatCurrency(i.revenue) }));
  const topByUnits = Array.from(itemStats.values())
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, 8)
    .map((i) => ({ ...i, unitsSold: formatDecimal(i.unitsSold) }));

  // Revenue by day (last 30 days)
  const revenueByDayMap = new Map<string, number>();
  for (const o of last30Days) {
    const day = new Date(o.createdAt).toISOString().slice(0, 10);
    revenueByDayMap.set(day, (revenueByDayMap.get(day) ?? 0) + o.total);
  }
  const revenueByDay = Array.from(revenueByDayMap.entries())
    .map(([date, revenue]) => ({ date, revenue: formatCurrency(revenue) }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  // Revenue by category (last 30 days)
  const categoryMap = new Map<string, number>();
  for (const o of last30Days) {
    for (const item of o.items) {
      const category = menuCategoryById.get(item.menuItemId) ?? "Other";
      categoryMap.set(
        category,
        (categoryMap.get(category) ?? 0) + item.lineTotal,
      );
    }
  }
  const revenueByCategory = Array.from(categoryMap.entries())
    .map(([category, revenue]) => ({
      category,
      revenue: formatCurrency(revenue),
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // Revenue by category, per day
  const topCategoryNames = revenueByCategory.slice(0, 4).map((c) => c.category);
  const categoryByDayMap = new Map<string, Record<string, number>>();
  for (const o of last30Days) {
    const day = new Date(o.createdAt).toISOString().slice(0, 10);
    if (!categoryByDayMap.has(day)) categoryByDayMap.set(day, {});
    const dayBucket = categoryByDayMap.get(day)!;
    for (const item of o.items) {
      const category = menuCategoryById.get(item.menuItemId) ?? "Other";
      if (!topCategoryNames.includes(category)) continue;
      dayBucket[category] = (dayBucket[category] ?? 0) + item.lineTotal;
    }
  }
  const categoryTrend = Array.from(categoryByDayMap.entries())
    .map(([date, categories]) => {
      const row: Record<string, number | string> = { date };
      for (const cat of topCategoryNames) {
        row[cat] = formatCurrency(categories[cat] ?? 0);
      }
      return row;
    })
    .sort((a, b) => ((a.date as string) < (b.date as string) ? -1 : 1));

  // Busiest hours (last 30 days), 0-23
  const hourCounts = new Array(24).fill(0);
  for (const o of last30Days) {
    const hour = new Date(o.createdAt).getHours();
    hourCounts[hour]++;
  }
  const busiestHours = hourCounts.map((count, hour) => ({ hour, count }));

  res.json({
    todayRevenue,
    todayOrderCount,
    avgTicket,
    activeOrders,
    topByRevenue,
    topByUnits,
    revenueByDay,
    revenueByCategory,
    categoryTrend,
    topCategoryNames,
    busiestHours,
  });
});

// ----- Demo controls -----

function generateFreshLiveOrders(): Order[] {
  const customersWithData = customers.slice(0, 8);
  const sampleItems: OrderLineItem[] = [
    {
      menuItemId: "beef-brisket-first-cut",
      name: "First Cut Beef Brisket",
      quantity: 3.2,
      unitPrice: 15.49,
      lineTotal: 49.57,
    },
    {
      menuItemId: "poultry-chicken-cutlets-family-pack",
      name: "Chicken Cutlets (Family Pack)",
      quantity: 2.4,
      unitPrice: 7.99,
      lineTotal: 19.18,
    },
    {
      menuItemId: "beef-pepper-steak-fajita",
      name: "Premium Pepper Steak (Fajita Strips)",
      quantity: 1.8,
      unitPrice: 13.99,
      lineTotal: 25.18,
    },
    {
      menuItemId: "deli-sweet-noodle-kugel-24oz",
      name: "Sweet Noodle Kugel (24 oz)",
      quantity: 2,
      unitPrice: 10.99,
      lineTotal: 21.98,
    },
    {
      menuItemId: "lamb-shoulder-chops",
      name: "Tevya's Ranch Shoulder Lamb Chops",
      quantity: 1.3,
      unitPrice: 17.99,
      lineTotal: 23.39,
    },
  ];

  const specs: {
    status: Order["status"];
    claimedBy: string | null;
    minutesAgo: number;
  }[] = [
    { status: "placed", claimedBy: null, minutesAgo: 2 },
    { status: "placed", claimedBy: null, minutesAgo: 8 },
    { status: "in_prep", claimedBy: "Mike", minutesAgo: 12 },
    { status: "in_prep", claimedBy: "Dani", minutesAgo: 18 },
    { status: "ready", claimedBy: "Sam", minutesAgo: 25 },
  ];

  const now = Date.now();
  return specs.map((spec, i) => {
    const customer =
      Math.random() < 0.6
        ? customersWithData[i % customersWithData.length]
        : null;
    const items = [sampleItems[i % sampleItems.length]];
    const total = formatCurrency(items.reduce((s, it) => s + it.lineTotal, 0));
    return {
      id: `live-${i + 1}`,
      customerId: customer?.customerId ?? null,
      customerName: customer
        ? `${customer.firstName} ${customer.lastName}`
        : "Walk-in",
      items,
      total,
      status: spec.status,
      source: "counter",
      fulfillment: "in_store",
      claimedBy: spec.claimedBy,
      createdAt: now - spec.minutesAgo * 60 * 1000,
    };
  });
}

app.post("/api/demo/empty", (req, res) => {
  orders = [];
  res.json({ ok: true, message: "All orders cleared" });
});

app.post("/api/demo/seed", (req, res) => {
  orders = [...HISTORICAL_ORDERS, ...generateFreshLiveOrders()];
  res.json({ ok: true, message: "Demo data loaded" });
});

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(
    `Starting empty. ${HISTORICAL_ORDERS.length} historical orders available via the Data menu.`,
  );
});
