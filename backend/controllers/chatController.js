const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const { getIO } = require('../services/socketService');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { buildChatRoom } = require('../utils/chat');
const { getOrganizationId, withOrganization } = require('../utils/organizationScope');

const canUsersChat = (senderRole, receiverRole) =>
  (senderRole === 'admin' && receiverRole === 'customer') ||
  (senderRole === 'customer' && receiverRole === 'admin');

const getContacts = asyncHandler(async (req, res) => {
  const query = withOrganization(req.user, req.user.role === 'admin' ? { role: 'customer' } : { role: 'admin' });
  const contacts = await User.find(query).select('name phone role').sort({ createdAt: -1 });

  res.json({
    success: true,
    data: contacts,
  });
});

const getThreads = asyncHandler(async (req, res) => {
  const messages = await ChatMessage.find({
    organizationId: getOrganizationId(req.user),
    $or: [{ sender: req.user._id }, { receiver: req.user._id }],
  })
    .sort({ createdAt: -1 })
    .populate('sender', 'name role phone')
    .populate('receiver', 'name role phone');

  const threads = [];
  const seenRoomKeys = new Set();

  messages.forEach((message) => {
    if (seenRoomKeys.has(message.roomKey)) {
      return;
    }

    const partner =
      String(message.sender._id) === String(req.user._id) ? message.receiver : message.sender;

    threads.push({
      roomKey: message.roomKey,
      partner,
      lastMessage: message,
    });
    seenRoomKeys.add(message.roomKey);
  });

  res.json({
    success: true,
    data: threads,
  });
});

const getMessages = asyncHandler(async (req, res) => {
  const partner = await User.findOne(withOrganization(req.user, { _id: req.params.partnerId })).select('name role phone');

  if (!partner) {
    throw new ApiError('Chat partner not found.', 404);
  }

  if (!canUsersChat(req.user.role, partner.role)) {
    throw new ApiError('This conversation is not allowed.', 403);
  }

  const roomKey = buildChatRoom(req.user._id, partner._id);
  const messages = await ChatMessage.find({
    roomKey,
    organizationId: getOrganizationId(req.user),
  })
    .sort({ createdAt: 1 })
    .populate('sender', 'name role')
    .populate('receiver', 'name role')
    .populate('orderId', 'status totalAmount')
    .limit(200);

  res.json({
    success: true,
    data: {
      partner,
      roomKey,
      messages,
    },
  });
});

const postMessage = asyncHandler(async (req, res) => {
  const { message, orderId } = req.body;

  if (!message?.trim()) {
    throw new ApiError('Message text is required.', 400);
  }

  const partner = await User.findOne(withOrganization(req.user, { _id: req.params.partnerId })).select('name role');

  if (!partner) {
    throw new ApiError('Chat partner not found.', 404);
  }

  if (!canUsersChat(req.user.role, partner.role)) {
    throw new ApiError('This conversation is not allowed.', 403);
  }

  const roomKey = buildChatRoom(req.user._id, partner._id);

  const savedMessage = await ChatMessage.create({
    organizationId: getOrganizationId(req.user),
    roomKey,
    sender: req.user._id,
    receiver: partner._id,
    message: message.trim(),
    orderId: orderId || null,
  });

  const populatedMessage = await ChatMessage.findById(savedMessage._id)
    .populate('sender', 'name role')
    .populate('receiver', 'name role')
    .populate('orderId', 'status totalAmount');

  const io = getIO();

  if (io) {
    io.to(roomKey).emit('chat:new', populatedMessage);
    io.to(`user:${req.user._id}`).emit('chat:new', populatedMessage);
    io.to(`user:${partner._id}`).emit('chat:new', populatedMessage);
  }

  res.status(201).json({
    success: true,
    message: 'Message sent successfully.',
    data: populatedMessage,
  });
});

module.exports = {
  getContacts,
  getThreads,
  getMessages,
  postMessage,
};
