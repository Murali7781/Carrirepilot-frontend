export default function DashboardListPanel({ title, items, emptyMessage, renderItem }) {
  return (
    <div className="panel-card">
      <div className="panel-header">
        <h3>{title}</h3>
      </div>
      <div className="stack-list">
        {items.length ? items.map(renderItem) : <p className="muted-empty">{emptyMessage}</p>}
      </div>
    </div>
  );
}
