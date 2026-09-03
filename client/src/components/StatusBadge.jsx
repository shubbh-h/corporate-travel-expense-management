import Icon from './Icon';

const tones = {
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  neutral: 'badge-neutral',
  info: 'badge-info',
};

export default function StatusBadge({ children, tone = 'neutral', icon }) {
  return (
    <span className={`status-badge ${tones[tone] || tones.neutral}`}>
      {icon ? <Icon name={icon} size={12} /> : null}
      {children}
    </span>
  );
}
