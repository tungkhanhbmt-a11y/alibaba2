import React from 'react';

export interface InvoiceSummary {
  invoiceId: string;
  branch: string;
  date: string;
  total: string;
}

interface Props {
  invoices: InvoiceSummary[];
  onEdit?: (id: string) => void;
  onView?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function InvoiceList({ invoices, onEdit, onView, onDelete }: Props) {
  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50">
            <tr className="text-sm text-gray-600">
              <th className="text-left px-4 py-3 whitespace-nowrap">Chi nhánh</th>
              <th className="text-left px-4 py-3 whitespace-nowrap">Ngày</th>
              <th className="text-right px-4 py-3 whitespace-nowrap">Tổng tiền</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv, idx) => (
              <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{inv.branch}</td>
                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{inv.date}</td>
                <td className="px-4 py-3 text-sm text-right font-semibold whitespace-nowrap">{inv.total}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2 items-center">
                    <button
                      onClick={() => onEdit && onEdit(inv.invoiceId)}
                      title="Sửa"
                      aria-label={`Sửa ${inv.invoiceId}`}
                      className="text-blue-600 p-1 rounded hover:bg-blue-50"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                        <path d="M2 16a1 1 0 001 1h3.586a1 1 0 00.707-.293l8.586-8.586a1 1 0 00-1.414-1.414L6.879 15.293A1 1 0 006.586 16H3a1 1 0 01-1-1v-2a1 1 0 112 0v2z" />
                      </svg>
                    </button>

                    <button
                      onClick={() => onView && onView(inv.invoiceId)}
                      title="Xem"
                      aria-label={`Xem ${inv.invoiceId}`}
                      className="text-gray-700 p-1 rounded hover:bg-gray-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>

                    <button
                      onClick={() => onDelete && onDelete(inv.invoiceId)}
                      title="Xóa"
                      aria-label={`Xóa ${inv.invoiceId}`}
                      className="text-red-600 p-1 rounded hover:bg-red-50"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M6 2a1 1 0 011-1h6a1 1 0 011 1v1h3a1 1 0 110 2h-1v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5H3a1 1 0 110-2h3V2zm3 4a1 1 0 00-1 1v7a1 1 0 102 0V7a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
