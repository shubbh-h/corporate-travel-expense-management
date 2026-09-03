import Icon from './Icon';

const Alert = ({ children, variant = 'danger' }) => {
  if (!children) return null;
  const icon = variant === 'success' ? 'check' : variant === 'info' ? 'info' : 'info';
  return <div className={`alert alert-${variant}`} role="alert"><Icon name={icon} size={17} /><span>{children}</span></div>;
};
export default Alert;
