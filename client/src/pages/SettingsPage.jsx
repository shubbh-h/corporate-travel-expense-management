import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { changePassword } from '../services/authService';
import Input from '../components/Input';
import Button from '../components/Button';
import Alert from '../components/Alert';
import Icon from '../components/Icon';

export default function SettingsPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' }); const [msg, setMsg] = useState(''); const [err, setErr] = useState(''); const [loading, setLoading] = useState(false);
  const submit = async (e) => { e.preventDefault(); setMsg(''); setErr(''); setLoading(true); try { setMsg(await changePassword(form.currentPassword, form.newPassword)); setForm({ currentPassword: '', newPassword: '' }); } catch (error) { setErr(error.response?.data?.message || 'Unable to change password.'); } finally { setLoading(false); } };
  return <div className="settings-page"><div className="page-heading"><div><span className="section-eyebrow">ACCOUNT</span><h1>Settings</h1><p>Manage your profile and security preferences.</p></div></div><div className="settings-grid"><section className="panel"><div className="panel-heading"><div><h2>Profile</h2><p>Your current TripWise account details.</p></div></div><div className="profile-summary"><div className="profile-avatar">{`${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`}</div><div><strong>{user?.fullName}</strong><span>{user?.designation || 'Employee'} · {user?.role?.name || 'Employee'}</span><small>{user?.email}</small></div></div><div className="details-list"><div><span>Employee ID</span><strong>{user?.employeeId || '—'}</strong></div><div><span>Department</span><strong>{user?.department?.name || '—'}</strong></div><div><span>Employment type</span><strong>{(user?.employmentType || '—').replaceAll('_', ' ')}</strong></div></div></section><section className="panel"><div className="panel-heading"><div><h2>Security</h2><p>Keep your account protected.</p></div><div className="security-icon"><Icon name="shield" /></div></div><Alert variant="success">{msg}</Alert><Alert>{err}</Alert><form onSubmit={submit}><Input id="currentPassword" name="currentPassword" type="password" label="Current password" value={form.currentPassword} onChange={(e) => setForm((p) => ({ ...p, currentPassword: e.target.value }))} /><Input id="newPassword" name="newPassword" type="password" label="New password" hint="Use at least 8 characters." value={form.newPassword} onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))} /><Button type="submit" isLoading={loading}>Update password</Button></form></section></div></div>;
}
