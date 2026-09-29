"use client";

import { useEffect } from "react";
import Button from "@/components/common/Button";

export default function Modal({ open, title, onClose, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="w-full max-w-lg rounded-xl bg-white p-5 shadow-2xl dark:bg-slate-900"
      >
        <header className="mb-4 flex items-center justify-between gap-4">
          <h2 id="modal-title" className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
          <Button type="button" variant="ghost" className="min-h-9 px-3" onClick={onClose} aria-label="닫기">
            닫기
          </Button>
        </header>
        {children}
      </section>
    </div>
  );
}