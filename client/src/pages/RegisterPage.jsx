import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import Input from '../components/Input';
import Button from '../components/Button';
import Alert from '../components/Alert';
import api from '../services/api';

const departmentId = '6a7e9e55ccf007ce35e3d1e9';
const roleId = '6a7e9f9eccf007ce35e3d1ee';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [data, setData] = useState({ firstName: '', lastName: '', email: '', password: '', employeeId: '', designation: '' });
  const [errors, setErrors] = useState({}); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  const change = (e) => { setData((p) => ({ ...p, [e.target.name]: e.target.value })); setErrors((p) => ({ ...p, [e.target.name]: '' })); setError(''); };
  const submit = async (e) => { e.preventDefault(); const next = {}; Object.entries(data).forEach(([k,v]) => { if (!v.trim()) next[k] = 'This field is required'; }); if (data.password && data.password.length < 8) next.password = 'Use at least 8 characters'; if (Object.keys(next).length) { setErrors(next); return; } setLoading(true); try { await api.post('/auth/register', { ...data, department: departmentId, role: roleId }); navigate('/login', { replace: true, state: { registered: true } }); } catch (err) { const body = err.response?.data; if (body?.errors?.length) { const mapped = {}; body.errors.forEach((x) => mapped[x.field] = x.message); setErrors(mapped); } else setError(body?.message || 'Unable to create your account.'); } finally { setLoading(false); } };
  return <AuthLayout><div className="auth-heading"><span className="auth-kicker">GET STARTED</span><h1>Create your workspace account</h1><p>Set up your employee profile to start using TripWise.</p></div><Alert>{error}</Alert><form onSubmit={submit} noValidate><div className="form-two"><Input id="firstName" name="firstName" label="First name" value={data.firstName} onChange={change} error={errors.firstName} /><Input id="lastName" name="lastName" label="Last name" value={data.lastName} onChange={change} error={errors.lastName} /></div><Input id="email" name="email" type="email" label="Work email" autoComplete="email" value={data.email} onChange={change} error={errors.email} /><div className="form-two"><Input id="employeeId" name="employeeId" label="Employee ID" value={data.employeeId} onChange={change} error={errors.employeeId} /><Input id="designation" name="designation" label="Designation" value={data.designation} onChange={change} error={errors.designation} /></div><Input id="password" name="password" type="password" label="Password" autoComplete="new-password" hint="At least 8 characters." value={data.password} onChange={change} error={errors.password} /><Button type="submit" isLoading={loading}>Create account</Button></form><p className="auth-switch">Already have an account? <Link to="/login" className="text-link">Sign in</Link></p></AuthLayout>;
}
