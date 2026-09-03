import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import Icon from '../components/Icon';

const navGroups = [
  { label: 'Workspace', items: [
    { to: '/dashboard', icon: 'grid', label: 'Overview' },
    { to: '/trips', icon: 'plane', label: 'My trips' },
    { to: '/expenses', icon: 'receipt', label: 'Expenses' },
    { to: '/approvals', icon: 'check', label: 'Approvals' },
  ]},
  { label: 'Manage', items: [
    { to: '/reports', icon: 'chart', label: 'Reports' },
    { to: '/team', icon: 'users', label: 'Team' },
  ]},
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || 'TW';
  const pageName = location.pathname === '/dashboard' ? 'Overview' : location.pathname.slice(1).replace('-', ' ');

  const handleLogout = async () => { await logout(); navigate('/login', { replace: true }); };

  return (
    <div className="app-shell">
      <button className={`mobile-backdrop ${open ? 'is-visible' : ''}`} onClick={() => setOpen(false)} aria-label="Close navigation" />
      <aside className={`sidebar ${open ? 'is-open' : ''}`}>
        <div className="sidebar-top">
          <NavLink to="/dashboard" className="brand sidebar-brand" onClick={() => setOpen(false)}><span className="brand-mark">T</span><span>TripWise</span></NavLink>
          <div className="workspace-switcher"><div className="workspace-icon">AC</div><div><strong>Acme Corporation</strong><span>India workspace</span></div><Icon name="chevron" size={15} /></div>
        </div>
        <nav className="sidebar-nav">
          {navGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <span className="nav-group-label">{group.label}</span>
              {group.items.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.to === '/dashboard'} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={() => setOpen(false)}>
                  <Icon name={item.icon} size={18} /><span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <NavLink to="/notifications" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={() => setOpen(false)}><Icon name="bell" size={18} /><span>Notifications</span><span className="nav-dot" /></NavLink>
          <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={() => setOpen(false)}><Icon name="settings" size={18} /><span>Settings</span></NavLink>
          <div className="sidebar-user"><div className="avatar">{initials}</div><div className="sidebar-user-copy"><strong>{user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim()}</strong><span>{user?.role?.name || 'Employee'}</span></div><button className="icon-button" onClick={handleLogout} aria-label="Log out"><Icon name="logout" size={17} /></button></div>
        </div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <div className="topbar-left"><button className="mobile-menu icon-button" onClick={() => setOpen(true)} aria-label="Open navigation"><Icon name="menu" size={21} /></button><div><span className="breadcrumb">TripWise /</span><strong>{pageName}</strong></div></div>
          <div className="topbar-actions"><button className="icon-button topbar-icon" aria-label="Search"><Icon name="search" /></button><NavLink to="/notifications" className="icon-button topbar-icon notification-button" aria-label="Notifications"><Icon name="bell" /><span /></NavLink><div className="topbar-profile"><div className="avatar avatar-small">{initials}</div><div className="topbar-profile-copy"><strong>{user?.fullName || 'User'}</strong><span>{user?.role?.name || 'Employee'}</span></div><Icon name="chevron" size={14} /></div></div>
        </header>
        <main className="page-content"><Outlet /></main>
      </div>
    </div>
  );
}
