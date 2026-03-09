import { cn } from "../../lib/utils";

export function Card({ children, className, ...props }) {
  return (
    <div
      className={cn(
        "glass rounded-2xl shadow-xl",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }) {
  return (
    <div className={cn("px-6 pt-6 pb-3", className)}>{children}</div>
  );
}

export function CardTitle({ children, className }) {
  return (
    <h3 className={cn("text-lg font-semibold text-slate-100", className)}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className }) {
  return <div className={cn("px-6 pb-6", className)}>{children}</div>;
}
