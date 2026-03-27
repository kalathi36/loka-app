const Attendance = require('../models/Attendance');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getOrganizationId, withOrganization } = require('../utils/organizationScope');

const startOfDay = (value = new Date()) => {
  const nextDate = new Date(value);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
};

const endOfDay = (value = new Date()) => {
  const nextDate = new Date(value);
  nextDate.setHours(23, 59, 59, 999);
  return nextDate;
};

const populateAttendance = (query) => query.populate('workerId', 'name phone role');

const findAttendanceForDay = ({ organizationId, workerId, value = new Date() }) =>
  Attendance.findOne({
    organizationId,
    workerId,
    date: {
      $gte: startOfDay(value),
      $lte: endOfDay(value),
    },
  }).sort({ date: -1, createdAt: -1 });

const checkIn = asyncHandler(async (req, res) => {
  const organizationId = getOrganizationId(req.user);
  const date = startOfDay();
  const { latitude, longitude, address } = req.body;
  const existingAttendance = await findAttendanceForDay({
    organizationId,
    workerId: req.user._id,
  });

  if (existingAttendance?.checkOutTime) {
    throw new ApiError('Attendance already completed for today.', 400);
  }

  if (existingAttendance?.checkInTime) {
    throw new ApiError('You have already checked in today.', 400);
  }

  const attendance = await Attendance.findOneAndUpdate(
    existingAttendance
      ? { _id: existingAttendance._id }
      : {
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
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    },
  );

  res.status(201).json({
    success: true,
    message: 'Checked in successfully.',
    data: attendance,
  });
});

const checkOut = asyncHandler(async (req, res) => {
  const organizationId = getOrganizationId(req.user);
  const attendance = await findAttendanceForDay({
    organizationId,
    workerId: req.user._id,
  });

  if (!attendance?.checkInTime) {
    throw new ApiError('You must check in before checking out.', 400);
  }

  if (attendance.checkOutTime) {
    throw new ApiError('You have already checked out today.', 400);
  }

  attendance.checkOutTime = new Date();
  await attendance.save();

  res.json({
    success: true,
    message: 'Checked out successfully.',
    data: attendance,
  });
});

const getWorkerAttendance = asyncHandler(async (req, res) => {
  const organizationId = getOrganizationId(req.user);
  const targetWorkerId = req.params.id;

  if (
    req.user.role === 'worker' &&
    String(req.user._id) !== String(targetWorkerId)
  ) {
    throw new ApiError('You can only view your own attendance.', 403);
  }

  const worker = await User.findOne(
    withOrganization(req.user, { _id: targetWorkerId }),
  ).select('name phone role');

  if (!worker) {
    throw new ApiError('Worker not found.', 404);
  }

  const query = {
    organizationId,
    workerId: targetWorkerId,
  };

  if (req.query.from || req.query.to) {
    query.date = {};

    if (req.query.from) {
      query.date.$gte = startOfDay(new Date(req.query.from));
    }

    if (req.query.to) {
      query.date.$lte = endOfDay(new Date(req.query.to));
    }
  }

  const records = await populateAttendance(
    Attendance.find(query).sort({ date: -1, createdAt: -1 }),
  );

  res.json({
    success: true,
    data: {
      worker,
      records,
    },
  });
});

const getAttendanceRecords = asyncHandler(async (req, res) => {
  const organizationId = getOrganizationId(req.user);
  const query = { organizationId };

  if (req.query.workerId) {
    query.workerId = req.query.workerId;
  }

  if (req.query.from || req.query.to) {
    query.date = {};

    if (req.query.from) {
      query.date.$gte = startOfDay(new Date(req.query.from));
    }

    if (req.query.to) {
      query.date.$lte = endOfDay(new Date(req.query.to));
    }
  }

  const records = await populateAttendance(
    Attendance.find(query).sort({ date: -1, createdAt: -1 }),
  );

  const totalCost = records.reduce((sum, record) => sum + (record.dailyWage || 0), 0);

  res.json({
    success: true,
    data: {
      records,
      totalCost,
    },
  });
});

const updateAttendanceRecord = asyncHandler(async (req, res) => {
  const attendance = await Attendance.findOne(
    withOrganization(req.user, { _id: req.params.id }),
  );

  if (!attendance) {
    throw new ApiError('Attendance record not found.', 404);
  }

  const { dailyWage, checkInTime, checkOutTime } = req.body;

  if (dailyWage !== undefined) {
    attendance.dailyWage = Number(dailyWage) || 0;
  }

  if (checkInTime) {
    attendance.checkInTime = new Date(checkInTime);
  }

  if (checkOutTime) {
    attendance.checkOutTime = new Date(checkOutTime);
  }

  await attendance.save();

  const populatedAttendance = await populateAttendance(
    Attendance.findById(attendance._id),
  );

  res.json({
    success: true,
    message: 'Attendance updated successfully.',
    data: populatedAttendance,
  });
});

module.exports = {
  checkIn,
  checkOut,
  getWorkerAttendance,
  getAttendanceRecords,
  updateAttendanceRecord,
};
