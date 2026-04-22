import { cn } from "../../lib/utils";
import { forwardRef, useId } from "react";

const inputBase = [
  "w-full px-4 py-2.5 rounded-xl text-slate-800 placeholder-slate-500",
  "bg-white border border-slate-300/80",
  "focus:outline-none focus:border-[#0f3d91]/50 focus:bg-white focus:shadow-[0_0_0_3px_rgba(15,61,145,0.1)]",
  "transition-all duration-200",
].join(" ");

export const Input = forwardRef(function Input({ label, error, className, ...props }, ref) {
  const generatedId = useId();
  const inputId = props.id || generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-600">{label}</label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={cn(inputBase, error && "border-red-500/50", className)}
        {...props}
      />
      {error && <p id={errorId} className="text-xs text-red-400">{error}</p>}
    </div>
  );
});

export const Textarea = forwardRef(function Textarea({ label, error, className, ...props }, ref) {
  const generatedId = useId();
  const textareaId = props.id || generatedId;
  const errorId = `${textareaId}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={textareaId} className="text-sm font-medium text-slate-600">{label}</label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        rows={4}
        className={cn(inputBase, "resize-none", error && "border-red-500/50", className)}
        {...props}
      />
      {error && <p id={errorId} className="text-xs text-red-400">{error}</p>}
    </div>
  );
});

export const Select = forwardRef(function Select({ label, error, children, className, ...props }, ref) {
  const generatedId = useId();
  const selectId = props.id || generatedId;
  const errorId = `${selectId}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-slate-600">{label}</label>
      )}
      <select
        ref={ref}
        id={selectId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={cn(inputBase, "bg-white cursor-pointer", error && "border-red-500/50", className)}
        {...props}
      >
        {children}
      </select>
      {error && <p id={errorId} className="text-xs text-red-400">{error}</p>}
    </div>
  );
});
