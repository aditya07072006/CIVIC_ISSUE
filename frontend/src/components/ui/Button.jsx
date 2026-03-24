import { cn } from "../../lib/utils";

const variants = {
  default: "btn-gradient text-white shadow-lg",
  outline: "border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 backdrop-blur-sm",
  ghost: "text-slate-600 hover:text-slate-800 hover:bg-slate-100",
  danger: "bg-red-500/90 hover:bg-red-500 text-white shadow-lg shadow-red-500/20",
  success: "bg-emerald-500/90 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20",
  secondary: "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base font-semibold",
};

export function Button({
  children,
  variant = "default",
  size = "md",
  className,
  loading,
  ...props
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer",
        variants[variant] || variants.default,
        sizes[size] || sizes.md,
        className
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      )}
      {children}
    </button>
  );
}
