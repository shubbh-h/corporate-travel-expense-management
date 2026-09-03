import Icon from './Icon';

export default function PageToolbar({ search, onSearch, placeholder = 'Search...', action, actionLabel, actionIcon = 'plus' }) {
  return (
    <div className="page-toolbar">
      <div className="toolbar-search">
        <Icon name="search" size={16} />
        <input value={search} onChange={(e) => onSearch?.(e.target.value)} placeholder={placeholder} />
      </div>
      <div className="toolbar-actions">
        <button className="btn btn-secondary btn-inline"><Icon name="filter" size={16} /> Filters</button>
        {action ? (
          <button className="btn btn-primary btn-inline" onClick={action}>
            <Icon name={actionIcon} size={16} /> {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
