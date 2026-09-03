import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Icon from '../components/Icon';

const stats = [
  { label: 'Upcoming trips', value: '—', meta: 'No trips booked yet', icon: 'plane', tone: 'blue' },
  { label: 'This month', value: '₹0', meta: 'No expenses submitted', icon: 'wallet', tone: 'green' },
  { label: 'Pending approvals', value: '—', meta: 'Nothing needs your attention', icon: 'check', tone: 'amber' },
  { label: 'Travel budget', value: '₹0', meta: 'Budget not configured', icon: 'chart', tone: 'violet' },
];

const DashboardPage = () => {
  const { user } = useAuth();
  const firstName = user?.firstName || 'there';
  return <div className="dashboard-page">
    <section className="welcome-row"><div><span className="section-eyebrow">YOUR WORKSPACE</span><h1>Good to see you, {firstName}.</h1><p>Here’s a quick view of your travel and expense workspace.</p></div><Link className="btn btn-primary btn-inline" to="/trips"><Icon name="plus" size={17} /> Plan a trip</Link></section>
    <section className="stat-grid">{stats.map((stat) => <article className="stat-card" key={stat.label}><div className={`stat-icon ${stat.tone}`}><Icon name={stat.icon} size={19} /></div><div><span>{stat.label}</span><strong>{stat.value}</strong><small>{stat.meta}</small></div></article>)}</section>
    <section className="dashboard-grid">
      <article className="panel activity-panel"><div className="panel-heading"><div><span className="section-eyebrow">ACTIVITY</span><h2>Recent activity</h2></div><Link to="/expenses" className="panel-link">View all <Icon name="arrow" size={15} /></Link></div><div className="empty-state"><div className="empty-icon"><Icon name="receipt" size={22} /></div><h3>No recent activity</h3><p>Your trips, expenses and approvals will appear here as you use TripWise.</p><Link to="/trips" className="text-link">Explore trips <Icon name="arrow" size={14} /></Link></div></article>
      <article className="panel quick-panel"><div className="panel-heading"><div><span className="section-eyebrow">SHORTCUTS</span><h2>Quick actions</h2></div></div><div className="quick-list"><Link to="/trips" className="quick-action"><span className="quick-action-icon blue"><Icon name="plane" /></span><span><strong>Plan a trip</strong><small>Start a new business journey</small></span><Icon name="arrow" size={16} /></Link><Link to="/expenses" className="quick-action"><span className="quick-action-icon green"><Icon name="receipt" /></span><span><strong>Add an expense</strong><small>Track a business expense</small></span><Icon name="arrow" size={16} /></Link><Link to="/settings" className="quick-action"><span className="quick-action-icon violet"><Icon name="settings" /></span><span><strong>Update profile</strong><small>Manage your preferences</small></span><Icon name="arrow" size={16} /></Link></div></article>
    </section>
    <section className="info-banner"><div className="info-banner-icon"><Icon name="shield" size={18} /></div><div><strong>Your workspace is ready.</strong><p>TripWise will keep your travel, expenses and approvals organized in one secure place.</p></div></section>
  </div>;
};
export default DashboardPage;
