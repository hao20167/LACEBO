import PropTypes from 'prop-types';

export default function EmptyState({
  title,
  description = '',
  action = null,
  compact = false,
}) {
  return (
    <div
      className={`rounded-xl border border-dashed border-dark-700 bg-dark-900/60 px-5 text-center ${
        compact ? 'py-5' : 'py-10'
      }`}
    >
      <p className="text-base font-semibold text-dark-200">{title}</p>
      {description && (
        <p className="mx-auto mt-2 max-w-md text-sm text-dark-400">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

EmptyState.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  action: PropTypes.node,
  compact: PropTypes.bool,
};
