const Organization = require('../models/Organization');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const generateToken = require('../utils/generateToken');

const normalizeOrganizationCode = (value = '') =>
  value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

const buildOrganizationCode = async (organizationName) => {
  const normalizedName = normalizeOrganizationCode(organizationName).slice(0, 5) || 'LOKA';

  for (let index = 0; index < 8; index += 1) {
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    const candidate = `${normalizedName}${suffix}`;
    const exists = await Organization.exists({ code: candidate });

    if (!exists) {
      return candidate;
    }
  }

  throw new ApiError('Could not generate a unique organization code. Please retry.', 500);
};

const serializeUser = (user) => ({
  _id: user._id,
  name: user.name,
  phone: user.phone,
  role: user.role,
  organization: user.organizationId
    ? {
        _id: user.organizationId._id || user.organizationId,
        name: user.organizationId.name,
        code: user.organizationId.code,
      }
    : null,
});

const buildAuthResponse = (user) => ({
  token: generateToken(user),
  user: serializeUser(user),
});

const registerOrganization = asyncHandler(async (req, res) => {
  const { organizationName, name, phone, password } = req.body;

  if (!organizationName || !name || !phone || !password) {
    throw new ApiError('Organization name, owner name, phone, and password are required.', 400);
  }

  const existingUser = await User.findOne({ phone });

  if (existingUser) {
    throw new ApiError('An account with this phone number already exists.', 409);
  }

  const organization = await Organization.create({
    name: organizationName.trim(),
    code: await buildOrganizationCode(organizationName),
    contactName: name.trim(),
    contactPhone: phone.trim(),
  });

  const user = await User.create({
    name,
    organizationId: organization._id,
    phone,
    password,
    role: 'admin',
  });

  organization.ownerUserId = user._id;
  await organization.save();

  const populatedUser = await User.findById(user._id)
    .populate('organizationId', 'name code');

  res.status(201).json({
    success: true,
    message: 'Organization created successfully.',
    data: buildAuthResponse(populatedUser),
  });
});

const registerUser = asyncHandler(async (req, res) => {
  const { organizationCode, name, phone, password } = req.body;

  if (!organizationCode || !name || !phone || !password) {
    throw new ApiError('Organization code, name, phone, and password are required.', 400);
  }

  const existingUser = await User.findOne({ phone });

  if (existingUser) {
    throw new ApiError('An account with this phone number already exists.', 409);
  }

  const requestedRole = req.body.role;
  const organization = await Organization.findOne({
    code: normalizeOrganizationCode(organizationCode),
  });

  if (!organization) {
    throw new ApiError('Organization not found for the provided code.', 404);
  }

  if (requestedRole === 'admin' && process.env.ALLOW_PUBLIC_ROLE_REGISTRATION !== 'true') {
    throw new ApiError('Admin accounts must be created while registering an organization.', 403);
  }

  const role =
    requestedRole === 'worker' || requestedRole === 'admin'
      ? requestedRole
      : 'customer';

  const user = await User.create({
    name,
    organizationId: organization._id,
    phone,
    password,
    role,
  });

  const populatedUser = await User.findById(user._id)
    .populate('organizationId', 'name code');

  res.status(201).json({
    success: true,
    message: 'User registered successfully.',
    data: buildAuthResponse(populatedUser),
  });
});

const login = asyncHandler(async (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    throw new ApiError('Phone and password are required.', 400);
  }

  const user = await User.findOne({ phone }).populate('organizationId', 'name code');

  if (!user || !(await user.matchPassword(password))) {
    throw new ApiError('Invalid phone number or password.', 401);
  }

  if (!user.organizationId) {
    throw new ApiError('This account is not linked to an organization.', 403);
  }

  res.json({
    success: true,
    message: 'Login successful.',
    data: buildAuthResponse(user),
  });
});

module.exports = {
  register: registerUser,
  registerOrganization,
  registerUser,
  login,
};
