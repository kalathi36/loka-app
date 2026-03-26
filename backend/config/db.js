const mongoose = require('mongoose');

const connectDB = async () => {
  mongoose.set('strictQuery', true);

  const connection = await mongoose.connect(process.env.MONGO_URI);

  return connection;
};

module.exports = connectDB;
