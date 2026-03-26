const ApiError = require('./ApiError');

const getOrganizationId = (user) => {
  const organizationId = user?.organizationId?._id || user?.organizationId;

  if (!organizationId) {
    throw new ApiError('Authenticated account is not linked to an organization.', 403);
  }

  return organizationId;
};

const withOrganization = (user, query = {}) => ({
  ...query,
  organizationId: getOrganizationId(user),
});

const assertSameOrganization = (document, user, entityName = 'Resource') => {
  if (!document) {
    throw new ApiError(`${entityName} not found.`, 404);
  }

  if (String(document.organizationId) !== String(getOrganizationId(user))) {
    throw new ApiError(`${entityName} not found.`, 404);
  }

  return document;
};

module.exports = {
  getOrganizationId,
  withOrganization,
  assertSameOrganization,
};
