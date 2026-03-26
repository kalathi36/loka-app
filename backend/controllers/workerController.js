const Attendance = require('../models/Attendance');
const GPSLog = require('../models/GPSLog');
const User = require('../models/User');
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

const postAttendance = asyncHandler(async (req, res) => {
  const { latitude, longitude, address } = req.body;
  const organizationId = getOrganizationId(req.user);
  const date = new Date();
  date.setHours(0, 0, 0, 0);

  const attendance = await Attendance.findOneAndUpdate(
    {
      organizationId,
      workerId: req.user._id,
      date,
    },
    {
      organizationId,
      workerId: req.user._id,
      date,
      checkInTime: new Date(),
      location: {
        latitude,
        longitude,
        address,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );

  res.status(201).json({
    success: true,
    message: 'Attendance recorded successfully.',
    data: attendance,
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

module.exports = {
  getWorkers,
  postAttendance,
  postGps,
};
