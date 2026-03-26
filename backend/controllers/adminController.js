const GPSLog = require('../models/GPSLog');
const User = require('../models/User');
const { getDashboardAnalytics } = require('../services/analyticsService');
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

module.exports = {
  getAnalytics,
  getWorkerLocations,
};
