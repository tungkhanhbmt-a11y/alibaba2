import React, { ReactNode } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
}

export default function Modal({ open, onClose, title, children }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      {/* base: keep compact on very small screens; sm+ expand to a much wider modal for desktop */}
      <div className="relative w-[min(96%,420px)] sm:w-[min(96%,72rem)] bg-white rounded-lg shadow-lg p-4 mx-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button className="text-gray-500" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
