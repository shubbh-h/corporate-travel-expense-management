import { useState } from 'react';
import Icon from '../components/Icon';
import StatusBadge from '../components/StatusBadge';
import PageToolbar from '../components/PageToolbar';
import Modal from '../components/Modal';

const expenses = [
  { id: 'EXP-2408', merchant: 'Indigo Airlines', category: 'Airfare', date: 'Aug 12, 2026', amount: '₹8,450', status: 'Approved', tone: 'success' },
  { id: 'EXP-2407', merchant: 'Taj Hotels', category: 'Accommodation', date: 'Aug 10, 2026', amount: '₹6,200', status: 'Pending', tone: 'warning' },
  { id: 'EXP-2406', merchant: 'Uber', category: 'Local travel', date: 'Aug 09, 2026', amount: '₹780', status: 'Draft', tone: 'neutral' },
];

export default function ExpensesPage() {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const filtered = expenses.filter((e) => `${e.merchant} ${e.category} ${e.id}`.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="module-page">
      <div className="page-heading"><div><span className="section-eyebrow">FINANCE</span><h1>Expenses</h1><p>Track business spending and prepare reimbursements.</p></div><button className="btn btn-primary btn-inline" onClick={() => setOpen(true)}><Icon name="plus" size={16} /> Add expense</button></div>
      <section className="mini-stat-grid">
        <div className="mini-stat"><span>Submitted this month</span><strong>₹15,430</strong><small>3 expenses</small></div>
        <div className="mini-stat"><span>Pending review</span><strong>₹6,200</strong><small>1 expense</small></div>
        <div className="mini-stat"><span>Reimbursed</span><strong>₹8,450</strong><small>1 expense</small></div>
      </section>
      <PageToolbar search={search} onSearch={setSearch} placeholder="Search expenses..." />
      <section className="panel table-panel">
        <div className="table-wrap"><table className="data-table"><thead><tr><th>Expense</th><th>Category</th><th>Date</th><th>Amount</th><th>Status</th><th /></tr></thead><tbody>
          {filtered.map((e) => <tr key={e.id}><td><div className="table-primary"><span className="row-icon green"><Icon name="receipt" size={15} /></span><div><strong>{e.merchant}</strong><small>{e.id}</small></div></div></td><td>{e.category}</td><td>{e.date}</td><td><strong>{e.amount}</strong></td><td><StatusBadge tone={e.tone}>{e.status}</StatusBadge></td><td><button className="icon-button"><Icon name="more" /></button></td></tr>)}
        </tbody></table></div>
        <div className="table-footer"><span>{filtered.length} expenses</span><span>Receipt uploads and reimbursement APIs can be connected to this workspace.</span></div>
      </section>
      <Modal open={open} onClose={() => setOpen(false)} title="Add an expense" subtitle="Capture the expense details for your reimbursement workflow.">
        <form onSubmit={(e) => { e.preventDefault(); setOpen(false); }}>
          <div className="form-two">
            <div className="form-group"><label className="form-label">Merchant</label><input className="form-input" placeholder="Merchant name" /></div>
            <div className="form-group"><label className="form-label">Amount</label><input className="form-input" type="number" placeholder="0.00" /></div>
            <div className="form-group"><label className="form-label">Category</label><select className="form-input"><option>Airfare</option><option>Accommodation</option><option>Meals</option><option>Local travel</option><option>Other</option></select></div>
            <div className="form-group"><label className="form-label">Date</label><input className="form-input" type="date" /></div>
          </div>
          <div className="form-group"><label className="form-label">Notes</label><textarea className="form-input form-textarea" placeholder="Optional notes" /></div>
          <div className="modal-actions"><button type="button" className="btn btn-secondary btn-inline" onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-primary btn-inline">Save expense</button></div>
        </form>
      </Modal>
    </div>
  );
}
