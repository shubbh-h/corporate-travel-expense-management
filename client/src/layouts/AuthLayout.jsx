import { Link } from 'react-router-dom';
import Icon from '../components/Icon';

const AuthLayout = ({ children, mode = 'login' }) => (
  <div className="auth-layout">
    <aside className="auth-visual">
      <Link to="/login" className="brand brand-on-dark"><span className="brand-mark">T</span><span>TripWise</span></Link>
      <div className="auth-visual-content">
        <div className="eyebrow"><span className="eyebrow-dot" /> CORPORATE TRAVEL, SIMPLIFIED</div>
        <h2>Move people,<br /><em>not paperwork.</em></h2>
        <p>One intelligent workspace for business travel, expenses, approvals and everything in between.</p>
        <div className="auth-stat-row">
          <div><strong>24/7</strong><span>Travel visibility</span></div>
          <div><strong>1 place</strong><span>For every trip</span></div>
        </div>
      </div>
      <div className="auth-visual-footer"><span>Secure enterprise workspace</span><span>•</span><span>TripWise</span></div>
    </aside>
    <main className="auth-panel">
      <div className="auth-mobile-brand"><span className="brand-mark">T</span><span>TripWise</span></div>
      <div className="auth-form-shell">
        {children}
        <div className="auth-footer-note"><Icon name="shield" size={14} /> Your information is protected with enterprise-grade security.</div>
      </div>
    </main>
  </div>
);
export default AuthLayout;
