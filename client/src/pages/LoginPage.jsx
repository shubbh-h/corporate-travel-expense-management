import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AuthLayout from '../layouts/AuthLayout';
import Input from '../components/Input';
import Button from '../components/Button';
import Alert from '../components/Alert';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const redirectTo = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => { const { name, value } = e.target; setFormData((p) => ({ ...p, [name]: value })); setFieldErrors((p) => ({ ...p, [name]: undefined })); setFormError(''); };
  const validate = () => { const e = {}; if (!formData.email.trim()) e.email = 'Email is required'; if (!formData.password) e.password = 'Password is required'; return e; };
  const handleSubmit = async (e) => {
    e.preventDefault(); setFormError(''); const errors = validate(); if (Object.keys(errors).length) { setFieldErrors(errors); return; }
    setIsSubmitting(true);
    try { await login(formData.email.trim(), formData.password); navigate(redirectTo, { replace: true }); }
    catch (error) { const data = error.response?.data; if (data?.errors?.length) { const mapped = {}; data.errors.forEach((item) => { mapped[item.field] = item.message; }); setFieldErrors(mapped); } else setFormError(data?.message || 'Unable to log in. Please check your credentials and try again.'); }
    finally { setIsSubmitting(false); }
  };

  return <AuthLayout mode="login">
    <div className="auth-heading"><span className="auth-kicker">WELCOME BACK</span><h1>Sign in to your workspace</h1><p>Access trips, expenses and approvals from one place.</p></div>
    <Alert>{formError}</Alert>
    <form onSubmit={handleSubmit} noValidate>
      <Input id="email" name="email" type="email" label="Work email" autoComplete="email" placeholder="you@company.com" value={formData.email} onChange={handleChange} error={fieldErrors.email} />
      <Input id="password" name="password" type="password" label="Password" autoComplete="current-password" placeholder="Enter your password" value={formData.password} onChange={handleChange} error={fieldErrors.password} />
      <div className="form-meta"><label className="check-row"><input type="checkbox" /> <span>Keep me signed in</span></label><Link to="/forgot-password" className="text-link">Forgot password?</Link></div>
      <Button type="submit" isLoading={isSubmitting}>Sign in</Button>
    </form>
    <p className="auth-switch">New to TripWise? <Link to="/register" className="text-link">Create an account</Link></p>
  </AuthLayout>;
};
export default LoginPage;
