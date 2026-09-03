import Icon from '../components/Icon';
import StatusBadge from '../components/StatusBadge';

const notifications = [
  { title: 'Expense approved', text: 'Your Indigo Airlines expense was approved.', time: '2 hours ago', icon: 'check', tone: 'success' },
  { title: 'Trip reminder', text: 'Your Bengaluru trip starts in 22 days.', time: 'Yesterday', icon: 'calendar', tone: 'info' },
  { title: 'Profile incomplete', text: 'Add your travel preferences to speed up future bookings.', time: '2 days ago', icon: 'user', tone: 'warning' },
];

export default function NotificationsPage() {
  return (
    <div className="module-page">
      <div className="page-heading"><div><span className="section-eyebrow">UPDATES</span><h1>Notifications</h1><p>Stay on top of travel, expense and approval activity.</p></div><button className="btn btn-secondary btn-inline">Mark all as read</button></div>
      <section className="panel notification-list">{notifications.map((n) => <div className="notification-row" key={n.title}><span className={`notification-icon ${n.tone}`}><Icon name={n.icon} size={17} /></span><div><strong>{n.title}</strong><p>{n.text}</p><small>{n.time}</small></div><StatusBadge tone={n.tone === 'warning' ? 'warning' : 'neutral'}>{n.time === '2 hours ago' ? 'New' : 'Read'}</StatusBadge></div>)}</section>
    </div>
  );
}
