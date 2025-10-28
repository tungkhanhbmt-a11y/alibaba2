import React from 'react';
import Link from 'next/link';
import { getOrders, getInvoiceSummaries } from '../../../lib/googleSheets';
import InvoicePrintToolbar from '../../../components/InvoicePrintToolbar';

type Item = { name: string; unit: string; quantity: string | number; price: string; total: string; note?: string };

export default async function InvoiceDetail({ params, searchParams }: { params: { id: string }, searchParams?: { [key: string]: string | string[] | undefined } }) {
  // params can be a Promise in some Next.js setups — await to be safe
  const resolvedParams: any = await params;
  const invoiceId = resolvedParams?.id || params?.id;

  // fetch data server-side directly from helper (avoids client-side params issues)
  const invRows = await getInvoiceSummaries();
  const inv = Array.isArray(invRows) ? invRows.find((i: any) => i.invoiceId === invoiceId) : null;

  const orders = await getOrders();
  // getOrders() returns raw sheet rows (array of arrays). Map to objects like the API does.
  const mappedOrders = Array.isArray(orders)
    ? orders.slice(1).map((row: string[]) => ({
        invoiceId: row[0] || '',
        date: row[1] || '',
        branch: row[2] || '',
        name: row[3] || '',
        unit: row[4] || '',
        quantity: row[5] || '',
        price: row[6] || '',
        total: row[7] || '',
        note: row[8] || '',
      }))
    : [];
  const rows = mappedOrders.filter((o) => o.invoiceId === invoiceId);

  const meta = { branch: inv?.branch || '', date: inv?.date || '', total: inv?.total || '' };
  const formatDate = (d: string) => {
    if (!d) return '';
    const iso = d.replace(/\//g, '-');
    const parts = iso.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const nd = new Date(d);
    if (!isNaN(nd.getTime())) {
      const dd = String(nd.getDate()).padStart(2, '0');
      const mm = String(nd.getMonth() + 1).padStart(2, '0');
      const yy = nd.getFullYear();
      return `${dd}/${mm}/${yy}`;
    }
    return d;
  };

  const screenshotMode = Boolean(searchParams && (searchParams.screenshot === '1' || searchParams.raw === '1' || searchParams.print === '1'));

  return (
    <div className="p-0" style={screenshotMode ? { background: '#fff', padding: 0 } : undefined}>
      {screenshotMode ? (
        <style>{`
          /* Screenshot mode: hide app chrome and center invoice for clean capture */
          header, nav, .no-print, .site-header, .sm\:hidden { display: none !important; }
          html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
          .invoice-a4 { margin: 8mm auto !important; box-shadow: none !important; width: 210mm !important; max-width: 210mm !important; padding: 12mm !important; }
        `}</style>
      ) : null}
      <div className="max-w-[210mm] mx-auto">
        <div className="mb-4 no-print flex items-center justify-center gap-3">
          <InvoicePrintToolbar />
          <Link href="/invoices" className="text-sm text-gray-600 hover:underline">Quay lại</Link>
        </div>
        

        <div className="bg-white rounded shadow p-4 invoice-a4" style={{ width: '210mm', padding: '16mm', boxSizing: 'border-box' }}>
          <div className="text-center mb-4">
            <h1 className="text-3xl font-extrabold">Hóa đơn bán hàng</h1>
            <div className="text-base text-gray-700 mt-1 font-medium">{invoiceId}</div>
          </div>
          {/* toolbar placed outside invoice for better layout */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-xs text-gray-500">Chi nhánh</div>
              <div className="font-medium">{meta.branch}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Ngày</div>
              <div className="font-medium">{formatDate(meta.date)}</div>
            </div>
          </div>

          <div className="overflow-auto border rounded">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">Sản phẩm</th>
                  <th className="px-3 py-2 text-left">Đơn vị</th>
                  <th className="px-3 py-2 text-right">SL</th>
                  <th className="px-3 py-2 text-right">Giá</th>
                  <th className="px-3 py-2 text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((it: any, idx: number) => (
                  <tr key={idx} className="border-t">
                    <td className="px-3 py-2">{it.name}{it.note ? ` (${it.note})` : ''}</td>
                    <td className="px-3 py-2">{it.unit}</td>
                    <td className="px-3 py-2 text-right">{it.quantity}</td>
                    <td className="px-3 py-2 text-right">{it.price}</td>
                    <td className="px-3 py-2 text-right">{it.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-right mt-4">
            <div className="text-sm text-gray-500">Tổng: <span className="font-semibold">{meta.total} VND</span></div>
          </div>

          {/* signatures removed per user request; title and invoice id are shown at top centered */}
        </div>
      </div>
    </div>
  );
}
