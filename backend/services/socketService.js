const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const ChatMessage = require('../models/ChatMessage');
const Order = require('../models/Order');
const User = require('../models/User');
const { buildChatRoom } = require('../utils/chat');

let io;

const extractId = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (value._id) {
    return String(value._id);
  }

  return String(value);
};

const canUsersChat = (senderRole, receiverRole) =>
  (senderRole === 'admin' && receiverRole === 'customer') ||
  (senderRole === 'customer' && receiverRole === 'admin');

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST'],
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error('Socket authentication token missing.'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('Socket user not found.'));
      }

      socket.user = user;
      return next();
    } catch (error) {
      return next(new Error('Socket authentication failed.'));
    }
  });

  io.on('connection', (socket) => {
    const userId = String(socket.user._id);

    socket.join(`user:${userId}`);
    socket.join(`role:${socket.user.role}`);

    socket.on('chat:join', ({ partnerId }) => {
      if (!partnerId) {
        return;
      }

      socket.join(buildChatRoom(userId, partnerId));
    });

    socket.on('chat:send', async ({ partnerId, message, orderId }) => {
      if (!partnerId || !message?.trim()) {
        return;
      }

      const receiver = await User.findById(partnerId).select('_id name role');

      if (!receiver || !canUsersChat(socket.user.role, receiver.role)) {
        return;
      }

      const roomKey = buildChatRoom(userId, receiver._id);
      const savedMessage = await ChatMessage.create({
        organizationId: socket.user.organizationId,
        roomKey,
        sender: socket.user._id,
        receiver: receiver._id,
        message: message.trim(),
        orderId: orderId || null,
      });

      const populatedMessage = await ChatMessage.findById(savedMessage._id)
        .populate('sender', 'name role')
        .populate('receiver', 'name role')
        .populate('orderId', 'status totalAmount');

      io.to(roomKey).emit('chat:new', populatedMessage);
      io.to(`user:${receiver._id}`).emit('chat:new', populatedMessage);
      io.to(`user:${userId}`).emit('chat:new', populatedMessage);
    });
  });

  return io;
};

const getIO = () => io;

const emitOrderUpdate = (order) => {
  if (!io) {
    return;
  }

  const customerId = extractId(order.customerId);
  const assignedWorkerId = extractId(order.assignedWorker);

  io.to('role:admin').emit('order:updated', order);
  if (customerId) {
    io.to(`user:${customerId}`).emit('order:updated', order);
  }

  if (assignedWorkerId) {
    io.to(`user:${assignedWorkerId}`).emit('order:updated', order);
  }
};

const emitGpsUpdate = async (payload) => {
  if (!io) {
    return;
  }

  io.to('role:admin').emit('gps:updated', payload);
  io.to(`user:${payload.workerId}`).emit('gps:updated', payload);

  const activeOrders = await Order.find({
    assignedWorker: payload.workerId,
    status: { $in: ['approved', 'out_for_delivery'] },
  }).select('customerId');

  const customerIds = [...new Set(activeOrders.map((order) => String(order.customerId)))];

  customerIds.forEach((customerId) => {
    io.to(`user:${customerId}`).emit('gps:updated', payload);
  });
};

module.exports = {
  initSocket,
  getIO,
  emitOrderUpdate,
  emitGpsUpdate,
};
