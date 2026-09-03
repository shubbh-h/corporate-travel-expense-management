import { useState } from 'react';
import Icon from './Icon';

const Input = ({ id, label, error, hint, type = 'text', ...rest }) => {
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && visible ? 'text' : type;
  return (
    <div className="form-group">
      {label && <label htmlFor={id} className="form-label">{label}</label>}
      <div className="input-wrap">
        <input id={id} type={inputType} className="form-input" aria-invalid={!!error} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined} {...rest} />
        {isPassword && (
          <button type="button" className="input-action" onClick={() => setVisible((v) => !v)} aria-label={visible ? 'Hide password' : 'Show password'}>
            <Icon name={visible ? 'eyeOff' : 'eye'} size={18} />
          </button>
        )}
      </div>
      {hint && !error && <p id={`${id}-hint`} className="form-hint">{hint}</p>}
      {error && <p id={`${id}-error`} className="form-error-text" role="alert">{error}</p>}
    </div>
  );
};
export default Input;
