const Attendance = require('../models/Attendance');
const GPSLog = require('../models/GPSLog');
const User = require('../models/User');
const WorkerPayment = require('../models/WorkerPayment');
const { getDashboardAnalytics, getProductInsightsAnalytics } = require('../services/analyticsService');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getOrganizationId } = require('../utils/organizationScope');

const getAnalytics = asyncHandler(async (req, res) => {
  const analytics = await getDashboardAnalytics(getOrganizationId(req.user));

  res.json({
    success: true,
    data: analytics,
  });
});

const getWorkerLocations = asyncHandler(async (req, res) => {
  const organizationId = getOrganizationId(req.user);
  const latestLocations = await GPSLog.aggregate([
    {
      $match: { organizationId },
    },
    {
      $sort: { timestamp: -1 },
    },
    {
      $group: {
        _id: '$workerId',
        latitude: { $first: '$latitude' },
        longitude: { $first: '$longitude' },
        timestamp: { $first: '$timestamp' },
      },
    },
  ]);

  const workerIds = latestLocations.map((entry) => entry._id);
  const workers = await User.find({
    _id: { $in: workerIds },
    organizationId,
  }).select('name phone');
  const workersById = workers.reduce((accumulator, worker) => {
    accumulator[String(worker._id)] = worker;
    return accumulator;
  }, {});

  const data = latestLocations.map((location) => ({
    workerId: String(location._id),
    workerName: workersById[String(location._id)]?.name || 'Unknown worker',
    phone: workersById[String(location._id)]?.phone || '',
    latitude: location.latitude,
    longitude: location.longitude,
    timestamp: location.timestamp,
  }));

  res.json({
    success: true,
    data,
  });
});

const getDashboard = asyncHandler(async (req, res) => {
  const analytics = await getDashboardAnalytics(getOrganizationId(req.user));

  res.json({
    success: true,
    data: {
      totalCustomers: analytics.totalCustomers,
      totalWorkers: analytics.totalWorkers,
      totalOrders: analytics.totalOrders,
      totalWorkerCost: analytics.totalWorkerCost,
      totalPaidToWorkers: analytics.totalPaidToWorkers,
      recentOrders: analytics.recentOrders,
      ordersByStatus: analytics.ordersByStatus,
    },
  });
});

const getProductInsights = asyncHandler(async (req, res) => {
  const insights = await getProductInsightsAnalytics(getOrganizationId(req.user));

  res.json({
    success: true,
    data: insights,
  });
});

const getCustomers = asyncHandler(async (req, res) => {
  const organizationId = getOrganizationId(req.user);
  const customers = await User.find({
    organizationId,
    role: 'customer',
  })
    .select('name phone role createdAt')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: customers,
  });
});

const getWorkerPayments = asyncHandler(async (req, res) => {
  const organizationId = getOrganizationId(req.user);
  const [workers, paymentHistory, attendanceSummary] = await Promise.all([
    User.find({ organizationId, role: 'worker' })
      .select('name phone role')
      .sort({ createdAt: -1 }),
    WorkerPayment.find({ organizationId })
      .populate('workerId', 'name phone')
      .sort({ date: -1, createdAt: -1 }),
    Attendance.aggregate([
      {
        $match: {
          organizationId,
        },
      },
      {
        $group: {
          _id: '$workerId',
          totalWages: { $sum: '$dailyWage' },
          totalDaysWorked: { $sum: 1 },
        },
      },
    ]),
  ]);

  const paymentSummary = await WorkerPayment.aggregate([
    {
      $match: { organizationId },
    },
    {
      $group: {
        _id: '$workerId',
        totalPaid: { $sum: '$amountPaid' },
      },
    },
  ]);

  const wagesByWorker = attendanceSummary.reduce((accumulator, item) => {
    accumulator[String(item._id)] = item;
    return accumulator;
  }, {});

  const paidByWorker = paymentSummary.reduce((accumulator, item) => {
    accumulator[String(item._id)] = item.totalPaid;
    return accumulator;
  }, {});

  const workerSummaries = workers.map((worker) => {
    const wageSummary = wagesByWorker[String(worker._id)] || {
      totalWages: 0,
      totalDaysWorked: 0,
    };
    const totalPaid = paidByWorker[String(worker._id)] || 0;

    return {
      worker,
      totalDaysWorked: wageSummary.totalDaysWorked,
      totalWages: wageSummary.totalWages,
      totalPaid,
      outstandingBalance: Number((wageSummary.totalWages - totalPaid).toFixed(2)),
    };
  });

  const totals = workerSummaries.reduce(
    (summary, item) => ({
      totalWages: summary.totalWages + item.totalWages,
      totalPaid: summary.totalPaid + item.totalPaid,
      outstandingBalance: summary.outstandingBalance + item.outstandingBalance,
    }),
    { totalWages: 0, totalPaid: 0, outstandingBalance: 0 },
  );

  res.json({
    success: true,
    data: {
      workerSummaries,
      paymentHistory,
      totals,
    },
  });
});

const createWorkerPayment = asyncHandler(async (req, res) => {
  const organizationId = getOrganizationId(req.user);
  const { workerId, amountPaid, notes, date } = req.body;

  if (!workerId || amountPaid === undefined) {
    throw new ApiError('workerId and amountPaid are required.', 400);
  }

  const worker = await User.findOne({
    _id: workerId,
    organizationId,
    role: 'worker',
  }).select('name phone');

  if (!worker) {
    throw new ApiError('Worker not found.', 404);
  }

  const payment = await WorkerPayment.create({
    organizationId,
    workerId,
    amountPaid: Number(amountPaid),
    notes,
    date: date ? new Date(date) : new Date(),
  });

  const populatedPayment = await WorkerPayment.findById(payment._id).populate('workerId', 'name phone');

  res.status(201).json({
    success: true,
    message: 'Worker payment recorded successfully.',
    data: populatedPayment,
  });
});

module.exports = {
  getAnalytics,
  getDashboard,
  getProductInsights,
  getWorkerLocations,
  getCustomers,
  getWorkerPayments,
  createWorkerPayment,
};
