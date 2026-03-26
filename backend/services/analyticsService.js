const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Product = require('../models/Product');
const User = require('../models/User');

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
    deliveredRevenue: deliveredRevenue[0]?.total || 0,
    outstandingPayments,
    ordersByStatus,
    recentOrders,
  };
};

module.exports = {
  getDashboardAnalytics,
};
