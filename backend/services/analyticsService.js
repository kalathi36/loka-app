const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Product = require('../models/Product');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const WorkerPayment = require('../models/WorkerPayment');

const LOW_STOCK_THRESHOLD = 25;

const getDashboardAnalytics = async (organizationId) => {
  const scope = organizationId ? { organizationId } : {};
  const [
    totalProducts,
    totalWorkers,
    totalCustomers,
    totalOrders,
    recentOrders,
    statusBreakdown,
    deliveredRevenue,
    paymentSummary,
    workerCostSummary,
    workerPaidSummary,
  ] = await Promise.all([
    Product.countDocuments(scope),
    User.countDocuments({ ...scope, role: 'worker' }),
    User.countDocuments({ ...scope, role: 'customer' }),
    Order.countDocuments(scope),
    Order.find(scope)
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('customerId', 'name phone')
      .populate('assignedWorker', 'name phone'),
    Order.aggregate([
      {
        $match: scope,
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),
    Order.aggregate([
      { $match: { ...scope, status: 'delivered' } },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' },
        },
      },
    ]),
    Payment.aggregate([
      {
        $match: scope,
      },
      {
        $group: {
          _id: null,
          totalDue: { $sum: '$totalDue' },
          paidAmount: { $sum: '$paidAmount' },
        },
      },
    ]),
    Attendance.aggregate([
      {
        $match: scope,
      },
      {
        $group: {
          _id: null,
          totalWorkerCost: { $sum: '$dailyWage' },
        },
      },
    ]),
    WorkerPayment.aggregate([
      {
        $match: scope,
      },
      {
        $group: {
          _id: null,
          totalPaidToWorkers: { $sum: '$amountPaid' },
        },
      },
    ]),
  ]);

  const ordersByStatus = statusBreakdown.reduce(
    (accumulator, current) => ({
      ...accumulator,
      [current._id]: current.count,
    }),
    {
      pending: 0,
      approved: 0,
      out_for_delivery: 0,
      delivered: 0,
    },
  );

  const outstandingPayments = paymentSummary[0]
    ? Number((paymentSummary[0].totalDue - paymentSummary[0].paidAmount).toFixed(2))
    : 0;

  return {
    totalProducts,
    totalWorkers,
    totalCustomers,
    totalOrders,
    totalWorkerCost: workerCostSummary[0]?.totalWorkerCost || 0,
    totalPaidToWorkers: workerPaidSummary[0]?.totalPaidToWorkers || 0,
    deliveredRevenue: deliveredRevenue[0]?.total || 0,
    outstandingPayments,
    ordersByStatus,
    recentOrders,
  };
};

const normalizeCategory = (category) => {
  if (typeof category !== 'string') {
    return 'Uncategorized';
  }

  const trimmed = category.trim();

  return trimmed || 'Uncategorized';
};

const getProductInsightsAnalytics = async (organizationId) => {
  const scope = organizationId ? { organizationId } : {};

  const [
    summary,
    categoryBreakdownRaw,
    topSelling,
    lowStockProducts,
    newestProducts,
    salesTotals,
  ] = await Promise.all([
    Product.aggregate([
      { $match: scope },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalUnitsInStock: { $sum: '$stock' },
          inventoryValue: {
            $sum: {
              $multiply: ['$stock', '$price'],
            },
          },
          averagePrice: { $avg: '$price' },
          lowStockCount: {
            $sum: {
              $cond: [
                {
                  $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', LOW_STOCK_THRESHOLD] }],
                },
                1,
                0,
              ],
            },
          },
          outOfStockCount: {
            $sum: {
              $cond: [{ $lte: ['$stock', 0] }, 1, 0],
            },
          },
        },
      },
    ]),
    Product.aggregate([
      { $match: scope },
      {
        $group: {
          _id: '$category',
          productCount: { $sum: 1 },
          stockUnits: { $sum: '$stock' },
          inventoryValue: {
            $sum: {
              $multiply: ['$stock', '$price'],
            },
          },
          averagePrice: { $avg: '$price' },
        },
      },
      {
        $sort: {
          inventoryValue: -1,
          stockUnits: -1,
          productCount: -1,
        },
      },
    ]),
    Order.aggregate([
      { $match: scope },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          unitsSold: { $sum: '$items.quantity' },
          orderCount: { $sum: 1 },
          revenue: {
            $sum: {
              $multiply: ['$items.quantity', '$items.price'],
            },
          },
        },
      },
      {
        $sort: {
          unitsSold: -1,
          revenue: -1,
        },
      },
      { $limit: 5 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      {
        $unwind: {
          path: '$product',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          productId: '$_id',
          name: { $ifNull: ['$product.name', '$name'] },
          category: { $ifNull: ['$product.category', 'Uncategorized'] },
          stock: { $ifNull: ['$product.stock', 0] },
          price: { $ifNull: ['$product.price', 0] },
          imageUrl: { $ifNull: ['$product.imageUrl', ''] },
          unitsSold: 1,
          orderCount: 1,
          revenue: 1,
        },
      },
    ]),
    Product.find({
      ...scope,
      stock: { $lte: LOW_STOCK_THRESHOLD },
    })
      .select('name category price stock imageUrl updatedAt')
      .sort({ stock: 1, updatedAt: -1 })
      .limit(6),
    Product.find(scope)
      .select('name category price stock imageUrl createdAt')
      .sort({ createdAt: -1 })
      .limit(6),
    Order.aggregate([
      { $match: scope },
      { $unwind: '$items' },
      {
        $group: {
          _id: null,
          totalUnitsSold: { $sum: '$items.quantity' },
          orderedValue: {
            $sum: {
              $multiply: ['$items.quantity', '$items.price'],
            },
          },
        },
      },
    ]),
  ]);

  const categoryBreakdown = categoryBreakdownRaw.map((entry) => ({
    category: normalizeCategory(entry._id),
    productCount: entry.productCount,
    stockUnits: entry.stockUnits,
    inventoryValue: Number((entry.inventoryValue || 0).toFixed(2)),
    averagePrice: Number((entry.averagePrice || 0).toFixed(2)),
  }));

  const summaryEntry = summary[0] || {};
  const salesEntry = salesTotals[0] || {};

  return {
    summary: {
      totalProducts: summaryEntry.totalProducts || 0,
      totalCategories: categoryBreakdown.length,
      totalUnitsInStock: summaryEntry.totalUnitsInStock || 0,
      inventoryValue: Number((summaryEntry.inventoryValue || 0).toFixed(2)),
      averagePrice: Number((summaryEntry.averagePrice || 0).toFixed(2)),
      lowStockCount: summaryEntry.lowStockCount || 0,
      outOfStockCount: summaryEntry.outOfStockCount || 0,
      totalUnitsSold: salesEntry.totalUnitsSold || 0,
      orderedValue: Number((salesEntry.orderedValue || 0).toFixed(2)),
    },
    categoryBreakdown,
    topSelling: topSelling.map((entry) => ({
      ...entry,
      category: normalizeCategory(entry.category),
      revenue: Number((entry.revenue || 0).toFixed(2)),
    })),
    lowStockProducts,
    newestProducts,
  };
};

module.exports = {
  getDashboardAnalytics,
  getProductInsightsAnalytics,
};
