import { cn } from "../../lib/utils";
import { forwardRef } from "react";

const inputBase = [
  "w-full px-4 py-2.5 rounded-xl text-slate-100 placeholder-slate-500",
  "bg-white/5 border border-white/10",
  "focus:outline-none focus:border-cyan-400/50 focus:bg-white/8 focus:shadow-[0_0_0_3px_rgba(34,211,238,0.08)]",
  "transition-all duration-200",
].join(" ");

export const Input = forwardRef(function Input({ label, error, className, ...props }, ref) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-slate-400">{label}</label>
      )}
      <input
        ref={ref}
        className={cn(inputBase, error && "border-red-500/50", className)}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
});

export const Textarea = forwardRef(function Textarea({ label, error, className, ...props }, ref) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-slate-400">{label}</label>
      )}
      <textarea
        ref={ref}
        rows={4}
        className={cn(inputBase, "resize-none", error && "border-red-500/50", className)}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
});

export const Select = forwardRef(function Select({ label, error, children, className, ...props }, ref) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-slate-400">{label}</label>
      )}
      <select
        ref={ref}
        className={cn(inputBase, "bg-[#0a1628] cursor-pointer", error && "border-red-500/50", className)}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
});
