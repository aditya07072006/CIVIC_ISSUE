import { cn } from "../../lib/utils";

const variantMap = {
  pending: "status-pending",
  in_progress: "status-in_progress",
  resolved: "status-resolved",
  rejected: "status-rejected",
  low: "sev-low",
  medium: "sev-medium",
  high: "sev-high",
  critical: "sev-critical",
  emergency: "sev-critical",
  normal: "status-in_progress",
};

export function Badge({ children, variant = "pending", className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide",
        variantMap[variant] || variantMap.pending,
        className
      )}
    >
      {children}
    </span>
  );
}
