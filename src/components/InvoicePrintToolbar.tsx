"use client";
import React from 'react';

export default function InvoicePrintToolbar() {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => window.print()}
        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        aria-label="In hóa đơn"
      >
        In hóa đơn
      </button>
    </div>
  );
}
