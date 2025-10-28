"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

type Invoice = { invoiceId: string; branch: string; date: string; total: string };

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetch('/api/invoices')
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        if (Array.isArray(data)) setInvoices(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => { mounted = false; };
  }, []);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Danh sách hóa đơn</h1>
        <Link href="/" className="text-sm text-gray-600 hover:underline">Quay về bán hàng</Link>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-8">Đang tải...</div>
      ) : (
        <div className="space-y-3">
          {invoices.length === 0 && (
            <div className="text-center text-gray-500 py-8">Chưa có hóa đơn nào.</div>
          )}

          {invoices.map((inv) => (
            <div key={inv.invoiceId} className="bg-white rounded shadow p-3 flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm text-gray-500">Chi nhánh</div>
                <div className="font-medium">{inv.branch}</div>
                <div className="text-xs text-gray-500 mt-1">Ngày: {inv.date}</div>
              </div>

              <div className="text-right mr-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">Tổng</div>
                <div className="text-lg font-semibold">{inv.total} VND</div>
              </div>

              <div className="flex items-center gap-2">
                <Link href={`/invoices/${encodeURIComponent(inv.invoiceId)}`} className="px-3 py-1 bg-indigo-600 text-white rounded text-sm">Xem</Link>
                <button className="px-3 py-1 bg-yellow-500 text-white rounded text-sm">Sửa</button>
                <button className="px-3 py-1 bg-red-500 text-white rounded text-sm">Xóa</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
