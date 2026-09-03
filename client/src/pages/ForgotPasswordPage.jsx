import { Link } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import Icon from '../components/Icon';

export default function ForgotPasswordPage() {
  return <AuthLayout><div className="auth-heading"><span className="auth-kicker">ACCOUNT ACCESS</span><h1>Forgot your password?</h1><p>Password recovery is prepared in the TripWise UI. The backend reset endpoint still needs to be wired before this form can send real recovery emails.</p></div><div className="coming-card auth-coming"><div className="coming-card-top"><span className="status-pill">Backend integration pending</span><Icon name="lock" /></div><h3>We won’t pretend this is live.</h3><p>Once the password-reset API and email flow are enabled on the server, this screen can be connected without changing the design.</p></div><Link to="/login" className="btn btn-secondary btn-inline full-btn">Back to sign in</Link></AuthLayout>;
}
