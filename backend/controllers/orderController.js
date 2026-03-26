const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Product = require('../models/Product');
const User = require('../models/User');
const { emitOrderUpdate } = require('../services/socketService');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getOrganizationId, withOrganization } = require('../utils/organizationScope');

const populateOrder = (query) =>
  query
    .populate('customerId', 'name phone role')
    .populate('assignedWorker', 'name phone role')
    .populate('items.product', 'name category price');

const createOrder = asyncHandler(async (req, res) => {
  const { items, notes, deliveryAddress, deliveryLocation } = req.body;
  const organizationId = getOrganizationId(req.user);

  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError('At least one order item is required.', 400);
  }

  const normalizedItems = [];
  const productsToUpdate = [];
  let totalAmount = 0;

  for (const item of items) {
    if (!item.productId || !item.quantity || item.quantity < 1) {
      throw new ApiError('Each item must include a productId and quantity of at least 1.', 400);
    }

    const product = await Product.findOne({
      _id: item.productId,
      organizationId,
    });

    if (!product) {
      throw new ApiError(`Product not found for item ${item.productId}.`, 404);
    }

    if (product.stock < item.quantity) {
      throw new ApiError(`Insufficient stock for ${product.name}.`, 400);
    }

    normalizedItems.push({
      product: product._id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
    });

    totalAmount += product.price * item.quantity;
    product.stock -= item.quantity;
    productsToUpdate.push(product);
  }

  await Promise.all(productsToUpdate.map((product) => product.save()));

  const order = await Order.create({
    organizationId,
    customerId: req.user._id,
    items: normalizedItems,
    totalAmount,
    notes,
    deliveryAddress,
    deliveryLocation,
    statusHistory: [
      {
        status: 'pending',
        note: 'Order created by customer.',
        changedBy: req.user._id,
      },
    ],
  });

  await Payment.findOneAndUpdate(
    { customerId: req.user._id, organizationId },
    {
      $setOnInsert: {
        organizationId,
      },
      $inc: {
        totalDue: totalAmount,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );

  const populatedOrder = await populateOrder(Order.findById(order._id));
  emitOrderUpdate(populatedOrder.toObject());

  res.status(201).json({
    success: true,
    message: 'Order placed successfully.',
    data: populatedOrder,
  });
});

const getOrders = asyncHandler(async (req, res) => {
  const query = withOrganization(req.user);

  if (req.user.role === 'customer') {
    query.customerId = req.user._id;
  }

  if (req.user.role === 'worker') {
    query.assignedWorker = req.user._id;
  }

  const orders = await populateOrder(Order.find(query).sort({ createdAt: -1 }));

  res.json({
    success: true,
    data: orders,
  });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, notes } = req.body;

  if (!status) {
    throw new ApiError('New status is required.', 400);
  }

  const order = await Order.findOne(withOrganization(req.user, { _id: req.params.id }));

  if (!order) {
    throw new ApiError('Order not found.', 404);
  }

  const isAdmin = req.user.role === 'admin';
  const isAssignedWorker =
    req.user.role === 'worker' && String(order.assignedWorker) === String(req.user._id);

  if (!isAdmin && !isAssignedWorker) {
    throw new ApiError('Only the assigned worker or an admin can update this order.', 403);
  }

  order.status = status;
  order.notes = notes ?? order.notes;

  if (req.file) {
    order.deliveryProof = `/uploads/delivery-proofs/${req.file.filename}`;
  }

  order.statusHistory.push({
    status,
    note: notes || `Status updated to ${status}.`,
    changedBy: req.user._id,
  });

  await order.save();

  const populatedOrder = await populateOrder(Order.findById(order._id));
  emitOrderUpdate(populatedOrder.toObject());

  res.json({
    success: true,
    message: 'Order status updated successfully.',
    data: populatedOrder,
  });
});

const assignWorker = asyncHandler(async (req, res) => {
  const { workerId } = req.body;

  if (!workerId) {
    throw new ApiError('workerId is required.', 400);
  }

  const [order, worker] = await Promise.all([
    Order.findOne(withOrganization(req.user, { _id: req.params.id })),
    User.findOne(withOrganization(req.user, { _id: workerId, role: 'worker' })),
  ]);

  if (!order) {
    throw new ApiError('Order not found.', 404);
  }

  if (!worker) {
    throw new ApiError('Selected worker does not exist.', 404);
  }

  order.assignedWorker = worker._id;

  if (order.status === 'pending') {
    order.status = 'approved';
  }

  order.statusHistory.push({
    status: order.status,
    note: `Assigned to worker ${worker.name}.`,
    changedBy: req.user._id,
  });

  await order.save();

  const populatedOrder = await populateOrder(Order.findById(order._id));
  emitOrderUpdate(populatedOrder.toObject());

  res.json({
    success: true,
    message: 'Worker assigned successfully.',
    data: populatedOrder,
  });
});

module.exports = {
  createOrder,
  getOrders,
  updateOrderStatus,
  assignWorker,
};
