const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium text-sm transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
};

const Button = ({
  children,
  variant = 'primary',
  loading = false,
  className = '',
  type = 'button',
  ...props
}) => (
  <button
    type={type}
    className={`${variants[variant]} ${className}`}
    disabled={loading || props.disabled}
    {...props}
  >
    {loading ? (
      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
    ) : null}
    {children}
  </button>
);

export default Button;
