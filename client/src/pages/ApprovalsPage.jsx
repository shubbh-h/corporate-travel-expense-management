import Icon from '../components/Icon';
import StatusBadge from '../components/StatusBadge';

const requests = [
  { title: 'Client strategy meeting', requester: 'Aarav Mehta', type: 'Trip request', amount: '₹32,500', date: 'Aug 17, 2026', tone: 'warning' },
  { title: 'Accommodation reimbursement', requester: 'Priya Shah', type: 'Expense', amount: '₹7,850', date: 'Aug 16, 2026', tone: 'warning' },
  { title: 'Airport transfer', requester: 'Rohan Verma', type: 'Expense', amount: '₹1,240', date: 'Aug 15, 2026', tone: 'warning' },
];

export default function ApprovalsPage() {
  return (
    <div className="module-page">
      <div className="page-heading"><div><span className="section-eyebrow">WORKFLOW</span><h1>Approvals</h1><p>Review requests that need your attention.</p></div></div>
      <section className="approval-summary"><div><span>Needs review</span><strong>3</strong></div><div><span>Total value</span><strong>₹41,590</strong></div><div><span>Average turnaround</span><strong>1.8 days</strong></div></section>
      <section className="panel approval-list">
        <div className="panel-heading"><div><h2>Pending requests</h2><p>Requests assigned to your approval queue.</p></div><StatusBadge tone="warning" icon="info">3 pending</StatusBadge></div>
        {requests.map((r) => <div className="approval-row" key={r.title}><div className="approval-main"><span className="row-icon amber"><Icon name={r.type === 'Expense' ? 'receipt' : 'plane'} size={16} /></span><div><strong>{r.title}</strong><span>{r.requester} · {r.type}</span><small>{r.date}</small></div></div><div className="approval-amount"><strong>{r.amount}</strong><span>Requested</span></div><div className="approval-actions"><button className="btn btn-secondary btn-inline">View</button><button className="btn btn-primary btn-inline">Review</button></div></div>)}
      </section>
    </div>
  );
}
