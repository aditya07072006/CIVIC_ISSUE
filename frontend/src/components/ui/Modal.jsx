import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

export function Modal({ open, onClose, title, children, size = "md" }) {
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previousFocusRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement;
      document.body.style.overflow = "hidden";
      // Move focus into the modal for keyboard and screen-reader users.
      requestAnimationFrame(() => {
        closeButtonRef.current?.focus();
      });
    } else {
      document.body.style.overflow = "";
      previousFocusRef.current?.focus?.();
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const sizeMap = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`glass-strong rounded-2xl shadow-2xl w-full ${sizeMap[size]} max-h-[90vh] overflow-y-auto animate-fade-up`}
        style={{ border: "1px solid rgba(15,61,145,0.14)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(15,61,145,0.12)" }}>
          <h2 id={titleId} className="text-lg font-semibold text-slate-800">{title}</h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close dialog"
            className="text-slate-500 hover:text-slate-700 transition-colors p-1.5 rounded-lg hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
