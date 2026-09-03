import { Link } from 'react-router-dom';
import Icon from '../components/Icon';

const content = {
  trips: { title: 'My trips', eyebrow: 'TRAVEL', description: 'Plan, track and manage your business journeys from one workspace.', icon: 'plane', action: 'Plan a trip' },
  expenses: { title: 'Expenses', eyebrow: 'FINANCE', description: 'Keep business spending organized and ready for reimbursement.', icon: 'receipt', action: 'Add expense' },
  approvals: { title: 'Approvals', eyebrow: 'WORKFLOW', description: 'Review requests that need your attention and keep decisions moving.', icon: 'check', action: 'View requests' },
  reports: { title: 'Reports', eyebrow: 'INSIGHTS', description: 'Turn travel and expense activity into clear business insights.', icon: 'chart', action: 'Explore reports' },
  team: { title: 'Team', eyebrow: 'PEOPLE', description: 'Manage your team workspace and understand who is traveling.', icon: 'users', action: 'View team' },
};

export default function PlaceholderPage({ type }) {
  const item = content[type] || content.trips;
  return <div className="placeholder-page"><div className={`placeholder-icon ${type}`}><Icon name={item.icon} size={26} /></div><span className="section-eyebrow">{item.eyebrow}</span><h1>{item.title}</h1><p>{item.description}</p><div className="coming-card"><div className="coming-card-top"><span className="status-pill">In progress</span><Icon name="more" /></div><h3>{item.action} will be available here.</h3><p>The frontend workspace is ready for the corresponding backend workflow. We’ll connect the live data as those APIs are implemented.</p><Link to="/dashboard" className="btn btn-secondary btn-inline">Back to overview</Link></div></div>;
}
