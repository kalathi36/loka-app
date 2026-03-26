const Attendance = require('../models/Attendance');
const GPSLog = require('../models/GPSLog');
const User = require('../models/User');
const WorkerPayment = require('../models/WorkerPayment');
const { emitGpsUpdate } = require('../services/socketService');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getOrganizationId, withOrganization } = require('../utils/organizationScope');

const getWorkers = asyncHandler(async (req, res) => {
  const workers = await User.find(withOrganization(req.user, { role: 'worker' }))
    .select('-password')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: workers,
  });
});

const postGps = asyncHandler(async (req, res) => {
  const { latitude, longitude } = req.body;
  const organizationId = getOrganizationId(req.user);

  if (latitude === undefined || longitude === undefined) {
    throw new ApiError('latitude and longitude are required.', 400);
  }

  const gpsLog = await GPSLog.create({
    organizationId,
    workerId: req.user._id,
    latitude,
    longitude,
    timestamp: new Date(),
  });

  const payload = {
    workerId: String(req.user._id),
    workerName: req.user.name,
    latitude,
    longitude,
    timestamp: gpsLog.timestamp,
  };

  await emitGpsUpdate(payload);

  res.status(201).json({
    success: true,
    message: 'GPS location logged successfully.',
    data: payload,
  });
});

const getWorkerEarnings = asyncHandler(async (req, res) => {
  const organizationId = getOrganizationId(req.user);
  const workerId = req.user._id;
  const [records, paymentSummary] = await Promise.all([
    Attendance.find({
      organizationId,
      workerId,
    }).sort({ date: -1 }),
    WorkerPayment.aggregate([
      {
        $match: {
          organizationId,
          workerId,
        },
      },
      {
        $group: {
          _id: '$workerId',
          totalPaid: { $sum: '$amountPaid' },
        },
      },
    ]),
  ]);

  const totalDaysWorked = records.length;
  const totalEarnings = records.reduce((sum, record) => sum + (record.dailyWage || 0), 0);
  const totalPaid = paymentSummary[0]?.totalPaid || 0;

  res.json({
    success: true,
    data: {
      totalDaysWorked,
      totalEarnings,
      totalPaid,
      outstandingBalance: Number((totalEarnings - totalPaid).toFixed(2)),
      dailyEarnings: records.map((record) => ({
        _id: record._id,
        date: record.date,
        checkInTime: record.checkInTime,
        checkOutTime: record.checkOutTime,
        dailyWage: record.dailyWage || 0,
      })),
    },
  });
});

module.exports = {
  getWorkers,
  postGps,
  getWorkerEarnings,
};
