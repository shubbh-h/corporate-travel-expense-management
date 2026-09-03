import Icon from '../components/Icon';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../hooks/useAuth';

const team = [
  { name: 'Shubh Mishra', role: 'Software Developer', dept: 'Information Technology', status: 'Active', tone: 'success', initials: 'SM' },
  { name: 'Aarav Mehta', role: 'Engineering Manager', dept: 'Information Technology', status: 'Active', tone: 'success', initials: 'AM' },
  { name: 'Priya Shah', role: 'Finance Analyst', dept: 'Finance', status: 'Active', tone: 'success', initials: 'PS' },
  { name: 'Rohan Verma', role: 'Product Manager', dept: 'Product', status: 'On leave', tone: 'warning', initials: 'RV' },
];

export default function TeamPage() {
  const { user } = useAuth();
  return (
    <div className="module-page">
      <div className="page-heading"><div><span className="section-eyebrow">PEOPLE</span><h1>Team</h1><p>People in your TripWise workspace.</p></div><button className="btn btn-primary btn-inline"><Icon name="plus" size={16} /> Invite member</button></div>
      <section className="panel team-panel">
        <div className="team-header"><div><h2>Workspace members</h2><p>{team.length} members in this preview workspace.</p></div><div className="toolbar-search"><Icon name="search" size={16} /><input placeholder="Search people..." /></div></div>
        <div className="team-grid">{team.map((member) => <article className="member-card" key={member.name}><div className="member-top"><div className="member-avatar">{member.initials}</div><StatusBadge tone={member.tone}>{member.status}</StatusBadge></div><h3>{member.name}{member.name === user?.fullName ? ' (You)' : ''}</h3><p>{member.role}</p><span>{member.dept}</span><div className="member-actions"><button className="btn btn-secondary btn-inline">View profile</button><button className="icon-button"><Icon name="more" /></button></div></article>)}</div>
      </section>
    </div>
  );
}
