import { db } from './database';
import { prismaRuntime } from './prismaRuntime';

export type AdminAnalyticsDateRange = {
  range: 'today' | 'yesterday' | '7d' | '30d' | 'this_month' | 'custom';
  from: Date;
  to: Date;
};

function isBetweenDates(value: unknown, from: Date, to: Date) {
  if (!value) return false;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return false;
  return date >= from && date <= to;
}

function startOfDay(input: Date) {
  const value = new Date(input);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfDay(input: Date) {
  const value = new Date(input);
  value.setHours(23, 59, 59, 999);
  return value;
}

function startOfMonth(input: Date) {
  return new Date(input.getFullYear(), input.getMonth(), 1);
}

function normalizeValue(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

function sumBy<T>(items: T[], getter: (item: T) => number) {
  return items.reduce((sum, item) => sum + getter(item), 0);
}

function getOrderLineItems(order: any) {
  if (Array.isArray(order?.items) && order.items.length) return order.items;
  if (Array.isArray(order?.products) && order.products.length) return order.products;
  return [];
}

function resolveOrderProductId(item: any, order: any) {
  return String(item?.productId || item?.id || order?.productId || '').trim();
}

function resolveOrderProductTitle(item: any, order: any) {
  return String(item?.productTitle || item?.title || order?.productTitle || 'Marketplace Product').trim();
}

function resolveLineQuantity(item: any) {
  const value = Number(item?.quantity || 0);
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function resolveLineUnitPrice(item: any) {
  const value = Number(item?.unitPrice || item?.salePrice || item?.price || 0);
  return Number.isFinite(value) ? value : 0;
}

function resolveCanonicalCategory(product: any) {
  return String(
    product?.categorySlug ||
      product?.subcategorySlug ||
      product?.parentCategorySlug ||
      product?.category ||
      product?.subcategory ||
      'uncategorized'
  ).trim();
}

function normalizeChannel(value: string) {
  const raw = normalizeValue(value);
  if (!raw) return 'direct';
  if (raw.includes('organic')) return 'organic';
  if (raw.includes('social')) return 'social';
  if (raw.includes('referral')) return 'referral';
  if (raw.includes('email')) return 'email';
  if (raw.includes('paid')) return 'paid';
  return raw;
}

export async function buildStoreOperationsAnalytics(dateRange: AdminAnalyticsDateRange) {
  const [
    products,
    orders,
    sellers,
    payoutRequests,
    payouts,
    users,
    analyticsEvents,
  ] = await (prismaRuntime.enabled
    ? Promise.all([
        prismaRuntime.getAllProductsForAdmin(),
        prismaRuntime.getAllOrders(),
        prismaRuntime.getAllSellers(),
        prismaRuntime.getAllPayoutRequests(),
        prismaRuntime.getAllPayouts(),
        prismaRuntime.getAllUsers(),
        Promise.resolve(db.getAnalyticsEvents()),
      ])
    : Promise.all([
        Promise.resolve([
          ...db.getAllProducts(),
          ...db.getProductsByStatus('pending'),
          ...db.getProductsByStatus('rejected'),
        ].filter((product, index, collection) => collection.findIndex((entry) => entry.id === product.id) === index)),
        Promise.resolve(db.getAllOrders()),
        Promise.resolve(db.getAllSellers()),
        Promise.resolve(db.getAllPayoutRequests()),
        Promise.resolve(db.getAllPayouts()),
        Promise.resolve(db.getAllUsers()),
        Promise.resolve(db.getAnalyticsEvents()),
      ]));

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const monthStart = startOfMonth(now);

  const ordersInRange = orders.filter((order) => isBetweenDates(order.createdAt, dateRange.from, dateRange.to));
  const ordersToday = orders.filter((order) => isBetweenDates(order.createdAt, todayStart, todayEnd));
  const ordersThisMonth = orders.filter((order) => isBetweenDates(order.createdAt, monthStart, todayEnd));

  const revenueToday = sumBy(ordersToday, (order) => Number(order.totalAmount || order.subtotal || 0));
  const revenueThisMonth = sumBy(ordersThisMonth, (order) => Number(order.totalAmount || order.subtotal || 0));
  const revenueInRange = sumBy(ordersInRange, (order) => Number(order.totalAmount || order.subtotal || 0));
  const averageOrderValue = ordersInRange.length ? revenueInRange / ordersInRange.length : 0;

  const pendingOrders = ordersInRange.filter((order) =>
    ['pending_confirmation', 'placed', 'confirmed', 'preparing', 'packed', 'waiting_for_pickup'].includes(
      normalizeValue(order.status)
    )
  );
  const shippedOrders = ordersInRange.filter((order) =>
    ['picked_up', 'in_transit', 'out_for_delivery', 'shipped'].includes(normalizeValue(order.status))
  );
  const deliveredOrders = ordersInRange.filter((order) => normalizeValue(order.status) === 'delivered');
  const cancelledOrders = ordersInRange.filter((order) => normalizeValue(order.status) === 'cancelled');
  const returnedOrders = ordersInRange.filter((order) => normalizeValue(order.status) === 'returned');
  const returnRequestedOrders = ordersInRange.filter((order) => normalizeValue(order.status) === 'return_requested');
  const refundedOrders = ordersInRange.filter((order) => normalizeValue(order.refundStatus) === 'refunded');
  const codOrders = ordersInRange.filter((order) => normalizeValue(order.paymentMethod) === 'cod');

  const lowStockProducts = products
    .filter((product) => Number(product.stock || 0) <= 5)
    .sort((left, right) => Number(left.stock || 0) - Number(right.stock || 0))
    .slice(0, 12)
    .map((product) => ({
      id: product.id,
      title: product.title,
      stock: Number(product.stock || 0),
      price: Number(product.price || 0),
      slug: product.slug,
      status: product.status,
    }));

  const productMap = new Map(products.map((product) => [product.id, product]));
  const topProductsMap = new Map<
    string,
    {
      productId: string;
      title: string;
      unitsSold: number;
      revenue: number;
      categorySlug: string;
      stock: number;
      status: string;
    }
  >();

  ordersInRange.forEach((order) => {
    const lineItems = getOrderLineItems(order);

    if (!lineItems.length) {
      const fallbackProductId = String(order.productId || '').trim();
      const fallbackTitle = String((order as any).productTitle || 'Marketplace Product').trim();
      const fallbackProduct = productMap.get(fallbackProductId);
      const quantity = 1;
      const revenue = Number(order.totalAmount || order.subtotal || 0);
      const existing = topProductsMap.get(fallbackProductId || fallbackTitle) || {
        productId: fallbackProductId || fallbackTitle,
        title: fallbackProduct?.title || fallbackTitle,
        unitsSold: 0,
        revenue: 0,
        categorySlug: resolveCanonicalCategory(fallbackProduct),
        stock: Number(fallbackProduct?.stock || 0),
        status: String(fallbackProduct?.status || ''),
      };

      existing.unitsSold += quantity;
      existing.revenue += revenue;
      topProductsMap.set(existing.productId, existing);
      return;
    }

    lineItems.forEach((item: any) => {
      const productId = resolveOrderProductId(item, order) || resolveOrderProductTitle(item, order);
      const product = productMap.get(productId);
      const title = product?.title || resolveOrderProductTitle(item, order);
      const quantity = resolveLineQuantity(item);
      const unitPrice = resolveLineUnitPrice(item);
      const revenue = quantity * unitPrice;

      const existing = topProductsMap.get(productId) || {
        productId,
        title,
        unitsSold: 0,
        revenue: 0,
        categorySlug: resolveCanonicalCategory(product),
        stock: Number(product?.stock || 0),
        status: String(product?.status || ''),
      };

      existing.unitsSold += quantity;
      existing.revenue += revenue;
      topProductsMap.set(productId, existing);
    });
  });

  const topSellingProducts = Array.from(topProductsMap.values())
    .sort((left, right) => right.revenue - left.revenue)
    .slice(0, 10);

  const categoryAccumulator = new Map<
    string,
    { categorySlug: string; label: string; unitsSold: number; revenue: number }
  >();

  topSellingProducts.forEach((product) => {
    const key = product.categorySlug || 'uncategorized';
    const existing = categoryAccumulator.get(key) || {
      categorySlug: key,
      label: key.replace(/-/g, ' '),
      unitsSold: 0,
      revenue: 0,
    };

    existing.unitsSold += product.unitsSold;
    existing.revenue += product.revenue;
    categoryAccumulator.set(key, existing);
  });

  const topCategories = Array.from(categoryAccumulator.values())
    .sort((left, right) => right.revenue - left.revenue)
    .slice(0, 8);

  const sellerPerformance = sellers
    .map((seller) => {
      const sellerOrders = ordersInRange.filter((order) => String(order.sellerId || '') === seller.id);
      const grossSales = sumBy(sellerOrders, (order) => Number(order.totalAmount || order.subtotal || 0));
      const commission = sumBy(sellerOrders, (order) => Number(order.commission || 0));
      const delivered = sellerOrders.filter((order) => normalizeValue(order.status) === 'delivered').length;
      const returns = sellerOrders.filter((order) =>
        ['return_requested', 'returned', 'refunded'].includes(normalizeValue(order.status)) ||
        ['requested', 'refunded'].includes(normalizeValue(order.refundStatus))
      ).length;

      return {
        sellerId: seller.id,
        sellerName: seller.storeName,
        totalOrders: sellerOrders.length,
        grossSales,
        commission,
        deliveredOrders: delivered,
        returnRate: sellerOrders.length ? returns / sellerOrders.length : 0,
        payoutDue: sumBy(
          sellerOrders.filter((order) => normalizeValue(order.payoutStatus) !== 'paid'),
          (order) => Number(order.sellerAmount || 0)
        ),
      };
    })
    .sort((left, right) => right.grossSales - left.grossSales)
    .slice(0, 10);

  const payoutSummary = {
    pendingRequests: payoutRequests.filter((request) => normalizeValue(request.status) === 'pending').length,
    totalPendingAmount: sumBy(
      payoutRequests.filter((request) => normalizeValue(request.status) === 'pending'),
      (request) => Number(request.amount || 0)
    ),
    paidThisMonth: sumBy(
      payouts.filter((payout) => normalizeValue(payout.status) === 'paid' && isBetweenDates(payout.createdAt, monthStart, todayEnd)),
      (payout) => Number(payout.netAmount || 0)
    ),
    processedThisMonth: sumBy(
      payouts.filter((payout) => normalizeValue(payout.status) === 'processed' && isBetweenDates(payout.createdAt, monthStart, todayEnd)),
      (payout) => Number(payout.netAmount || 0)
    ),
    payoutDue: sumBy(
      orders.filter((order) => normalizeValue(order.payoutStatus) !== 'paid'),
      (order) => Number(order.sellerAmount || 0)
    ),
  };

  const topSearches = Object.entries(
    analyticsEvents
      .filter((event) => event.eventType === 'search' && isBetweenDates(event.createdAt, dateRange.from, dateRange.to))
      .reduce<Record<string, number>>((accumulator, event) => {
        const key = String(event.metadata?.query || '').trim().toLowerCase();
        if (!key) return accumulator;
        accumulator[key] = (accumulator[key] || 0) + 1;
        return accumulator;
      }, {})
  )
    .sort((left, right) => right[1] - left[1])
    .slice(0, 10)
    .map(([query, count]) => ({ query, count }));

  const bannerPerformance = db.getBanners().map((banner) => ({
    id: banner.id,
    title: banner.title,
    clicks: Number(banner.clicks || 0),
    link: banner.link || '/',
  }));

  const mostViewedProducts = Object.entries(
    analyticsEvents
      .filter((event) => event.eventType === 'product_view' && isBetweenDates(event.createdAt, dateRange.from, dateRange.to))
      .reduce<Record<string, number>>((accumulator, event) => {
        const key = String(event.entityId || '').trim();
        if (!key) return accumulator;
        accumulator[key] = (accumulator[key] || 0) + 1;
        return accumulator;
      }, {})
  )
    .map(([productId, views]) => ({
      productId,
      views,
      product: productMap.get(productId) || null,
    }))
    .sort((left, right) => right.views - left.views)
    .slice(0, 10);

  const mostWishlistedProducts = Object.entries(
    analyticsEvents
      .filter((event) => event.eventType === 'wishlist_add' && isBetweenDates(event.createdAt, dateRange.from, dateRange.to))
      .reduce<Record<string, number>>((accumulator, event) => {
        const key = String(event.entityId || '').trim();
        if (!key) return accumulator;
        accumulator[key] = (accumulator[key] || 0) + 1;
        return accumulator;
      }, {})
  )
    .map(([productId, count]) => ({
      productId,
      count,
      product: productMap.get(productId) || null,
    }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 10);

  const acquisitionChannels = Object.entries(
    analyticsEvents
      .filter((event) => isBetweenDates(event.createdAt, dateRange.from, dateRange.to))
      .reduce<Record<string, number>>((accumulator, event) => {
        const inferredSource = String(
          event.metadata?.source ||
          event.metadata?.medium ||
          event.metadata?.referrer ||
          event.metadata?.channel ||
          event.metadata?.utmMedium ||
          ''
        );
        const channel = normalizeChannel(inferredSource);
        accumulator[channel] = (accumulator[channel] || 0) + 1;
        return accumulator;
      }, {})
  )
    .map(([channel, count]) => ({
      channel,
      count,
    }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 8);

  const recentCustomers = users.filter((user) => user.role === 'customer');

  return {
    summary: {
      totalOrders: ordersInRange.length,
      ordersToday: ordersToday.length,
      revenueToday,
      revenueThisMonth,
      revenueInRange,
      averageOrderValue,
      pendingOrders: pendingOrders.length,
      shippedOrders: shippedOrders.length,
      deliveredOrders: deliveredOrders.length,
      cancelledOrders: cancelledOrders.length,
      codOrders: codOrders.length,
      returnRequestedOrders: returnRequestedOrders.length,
      returnedOrders: returnedOrders.length,
      refundedOrders: refundedOrders.length,
      totalProducts: products.length,
      totalCustomers: recentCustomers.length,
      totalSellers: sellers.length,
    },
    topSellingProducts,
    lowStockProducts,
    topCategories,
    sellerPerformance,
    payoutSummary,
    refundsReturns: {
      returnRequested: returnRequestedOrders.length,
      returned: returnedOrders.length,
      refunded: refundedOrders.length,
      refundRequested: ordersInRange.filter((order) => normalizeValue(order.refundStatus) === 'requested').length,
    },
    orderStatusBreakdown: [
      { key: 'pending', label: 'Pending', value: pendingOrders.length },
      { key: 'shipped', label: 'Shipped', value: shippedOrders.length },
      { key: 'delivered', label: 'Delivered', value: deliveredOrders.length },
      { key: 'cancelled', label: 'Cancelled', value: cancelledOrders.length },
      { key: 'returns', label: 'Returns', value: returnRequestedOrders.length + returnedOrders.length },
    ],
    acquisitionChannels,
    legacyReports: {
      totalLogins: analyticsEvents.filter((event) => event.eventType === 'login' && isBetweenDates(event.createdAt, dateRange.from, dateRange.to)).length,
      totalSearches: analyticsEvents.filter((event) => event.eventType === 'search' && isBetweenDates(event.createdAt, dateRange.from, dateRange.to)).length,
      totalProductViews: analyticsEvents.filter((event) => event.eventType === 'product_view' && isBetweenDates(event.createdAt, dateRange.from, dateRange.to)).length,
      totalWishlistAdds: analyticsEvents.filter((event) => event.eventType === 'wishlist_add' && isBetweenDates(event.createdAt, dateRange.from, dateRange.to)).length,
      topSearches,
      mostViewedProducts,
      mostWishlistedProducts,
      sellerPerformance,
      bannerPerformance,
      refundRequests: ordersInRange.filter((order) => normalizeValue(order.refundStatus) === 'requested').length,
      returnsRequested: returnRequestedOrders.length,
    },
  };
}
