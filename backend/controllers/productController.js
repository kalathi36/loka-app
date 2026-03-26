const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { withOrganization } = require('../utils/organizationScope');

const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find(withOrganization(req.user)).sort({ createdAt: -1 });

  res.json({
    success: true,
    data: products,
  });
});

const createProduct = asyncHandler(async (req, res) => {
  const { name, price, category, stock } = req.body;

  if (!name || price === undefined || !category) {
    throw new ApiError('Name, price, and category are required.', 400);
  }

  const product = await Product.create({
    organizationId: req.user.organizationId,
    name,
    price,
    category,
    stock: stock ?? 0,
  });

  res.status(201).json({
    success: true,
    message: 'Product created successfully.',
    data: product,
  });
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne(withOrganization(req.user, { _id: req.params.id }));

  if (!product) {
    throw new ApiError('Product not found.', 404);
  }

  ['name', 'price', 'category', 'stock'].forEach((field) => {
    if (req.body[field] !== undefined) {
      product[field] = req.body[field];
    }
  });

  await product.save();

  res.json({
    success: true,
    message: 'Product updated successfully.',
    data: product,
  });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne(withOrganization(req.user, { _id: req.params.id }));

  if (!product) {
    throw new ApiError('Product not found.', 404);
  }

  await product.deleteOne();

  res.json({
    success: true,
    message: 'Product deleted successfully.',
  });
});

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};
