import PropTypes from 'prop-types';

export default function Pagination({
  page,
  totalPages,
  onPageChange,
  hasNextPage,
  hasPrevPage,
}) {
  if (totalPages <= 1) return null;

  const range = [];
  const maxButtons = 5;

  let start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + maxButtons - 1);

  if (end - start + 1 < maxButtons) {
    start = Math.max(1, end - maxButtons + 1);
  }

  for (let i = start; i <= end; i++) {
    range.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        type="button"
        disabled={!hasPrevPage}
        onClick={() => onPageChange(page - 1)}
        className="px-3 py-2 rounded-lg border border-dark-700 bg-dark-900 text-dark-300 hover:text-dark-100 hover:border-dark-600 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-1"
      >
        <span>&larr;</span> Prev
      </button>

      {start > 1 && (
        <>
          <button
            type="button"
            onClick={() => onPageChange(1)}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg border text-sm font-medium transition ${
              page === 1
                ? 'bg-primary-600 border-primary-500 text-white shadow-lg shadow-primary-900/30'
                : 'border-dark-700 bg-dark-900 text-dark-300 hover:text-dark-100 hover:border-dark-600'
            }`}
          >
            1
          </button>
          {start > 2 && (
            <span className="text-dark-500 px-1 text-sm select-none">...</span>
          )}
        </>
      )}

      {range.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPageChange(p)}
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg border text-sm font-medium transition ${
            page === p
              ? 'bg-primary-600 border-primary-500 text-white shadow-lg shadow-primary-900/30'
              : 'border-dark-700 bg-dark-900 text-dark-300 hover:text-dark-100 hover:border-dark-600'
          }`}
        >
          {p}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && (
            <span className="text-dark-500 px-1 text-sm select-none">...</span>
          )}
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg border text-sm font-medium transition ${
              page === totalPages
                ? 'bg-primary-600 border-primary-500 text-white shadow-lg shadow-primary-900/30'
                : 'border-dark-700 bg-dark-900 text-dark-300 hover:text-dark-100 hover:border-dark-600'
            }`}
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        type="button"
        disabled={!hasNextPage}
        onClick={() => onPageChange(page + 1)}
        className="px-3 py-2 rounded-lg border border-dark-700 bg-dark-900 text-dark-300 hover:text-dark-100 hover:border-dark-600 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-1"
      >
        Next <span>&rarr;</span>
      </button>
    </div>
  );
}

Pagination.propTypes = {
  page: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  hasNextPage: PropTypes.bool.isRequired,
  hasPrevPage: PropTypes.bool.isRequired,
};
