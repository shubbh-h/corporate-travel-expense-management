const Button = ({ children, isLoading = false, variant = 'primary', type = 'button', className = '', ...rest }) => (
  <button type={type} className={`btn btn-${variant} ${className}`.trim()} disabled={isLoading || rest.disabled} {...rest}>
    {isLoading && <span className="btn-spinner" aria-hidden="true" />}
    {isLoading ? 'Please wait...' : children}
  </button>
);
export default Button;
