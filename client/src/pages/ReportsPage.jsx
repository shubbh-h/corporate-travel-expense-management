import Icon from '../components/Icon';
import StatusBadge from '../components/StatusBadge';

const months = [
  ['Mar', 22], ['Apr', 38], ['May', 31], ['Jun', 56], ['Jul', 44], ['Aug', 63]
];

export default function ReportsPage() {
  return (
    <div className="module-page">
      <div className="page-heading"><div><span className="section-eyebrow">INSIGHTS</span><h1>Reports</h1><p>Understand travel and expense activity across your workspace.</p></div><button className="btn btn-secondary btn-inline"><Icon name="download" size={16} /> Export</button></div>
      <section className="report-grid">
        <div className="report-card report-large"><div className="report-card-head"><div><span className="section-eyebrow">SPEND TREND</span><h2>Monthly travel spend</h2></div><StatusBadge tone="success">FY 2026</StatusBadge></div><div className="chart-area">{months.map(([m, h]) => <div className="bar-col" key={m}><div className="bar-track"><div className="bar-fill" style={{ height: `${h}%` }} /></div><span>{m}</span></div>)}</div></div>
        <div className="report-card"><span className="section-eyebrow">TOTAL SPEND</span><h2 className="big-number">₹1.84L</h2><p className="muted-copy">Across approved travel and expenses.</p><div className="trend-up"><Icon name="arrow" size={14} /> 12.4% vs previous period</div></div>
        <div className="report-card"><span className="section-eyebrow">TOP CATEGORY</span><h2>Accommodation</h2><p className="muted-copy">34% of recorded travel spend.</p><div className="progress"><span style={{ width: '34%' }} /></div><div className="report-foot"><span>₹62,560</span><span>34%</span></div></div>
        <div className="report-card report-note"><div className="report-note-icon"><Icon name="chart" /></div><div><h3>Connect real reporting data</h3><p>These visual components are ready for the analytics APIs and filters to be connected as the backend reporting module is built.</p></div></div>
      </section>
    </div>
  );
}
