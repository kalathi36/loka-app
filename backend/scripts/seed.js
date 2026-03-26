require('dotenv').config();
const connectDB = require('../config/db');
const Attendance = require('../models/Attendance');
const ChatMessage = require('../models/ChatMessage');
const GPSLog = require('../models/GPSLog');
const Order = require('../models/Order');
const Organization = require('../models/Organization');
const Payment = require('../models/Payment');
const Product = require('../models/Product');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');

const seed = async () => {
  try {
    await connectDB();

    await Attendance.deleteMany({});
    await ChatMessage.deleteMany({});
    await GPSLog.deleteMany({});
    await Order.deleteMany({});
    await Organization.deleteMany({});
    await Payment.deleteMany({});
    await User.deleteMany({});
    await Product.deleteMany({});
    await Vehicle.deleteMany({});

    console.log('Demo users removed and application data reset successfully.');
    console.log('Create a new organization and users from the mobile app signup flow.');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

seed();
