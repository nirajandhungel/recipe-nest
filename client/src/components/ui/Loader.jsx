const Loader = ({ fullScreen = false, size = 'md' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };

  const spinner = (
    <div className={`${sizes[size]} border-2 border-surface-200 border-t-brand-500 rounded-full animate-spin`} />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-surface-950/80 backdrop-blur-sm z-50">
        <div className="flex flex-col items-center gap-3">
          {spinner}
          <span className="text-sm text-surface-500 font-sans">Loading…</span>
        </div>
      </div>
    );
  }

  return <div className="flex justify-center py-8">{spinner}</div>;
};

export default Loader;
