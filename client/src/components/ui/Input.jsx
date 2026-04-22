import { forwardRef } from 'react';

const Input = forwardRef(({ label, error, className = '', ...props }, ref) => (
  <div className="flex flex-col gap-1">
    {label && (
      <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
        {label}
      </label>
    )}
    <input
      ref={ref}
      className={`input-base ${error ? 'border-red-400 focus:ring-red-300' : ''} ${className}`}
      {...props}
    />
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
));

Input.displayName = 'Input';
export default Input;
