export const parsePagination = (query, defaults = { page: 1, limit: 20 }) => {
  const page = Math.max(1, parseInt(query.page) || defaults.page);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(query.limit) || defaults.limit),
  );
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

export const buildPaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

export const paginatedResponse = (res, data, total, page, limit) => {
  res.json({
    data,
    pagination: buildPaginationMeta(total, page, limit),
  });
};
