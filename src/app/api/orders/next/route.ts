import { NextResponse } from 'next/server';
import { getOrders } from '../../../../lib/googleSheets';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const date = url.searchParams.get('date') || '';
    if (!date) return NextResponse.json({ invoiceId: null });

    const rows = await getOrders();
    const dataRows = rows.slice(1);
    // detect date column index: if first data row has date at index 1 assume invoiceId present
    let dateIndex = 0;
    if (dataRows.length > 0) {
      const first = dataRows[0];
      if (first.length >= 2 && /^\d{4}-\d{2}-\d{2}/.test(first[1])) {
        dateIndex = 1;
      }
    }
    const existingForDate = dataRows.filter((r) => (r[dateIndex] || '') === date).length;
    const seq = existingForDate + 1;
    const datePart = date.replace(/-/g, '');
    const invoiceId = `${datePart}-${String(seq).padStart(3, '0')}`;
    return NextResponse.json({ invoiceId });
  } catch (e) {
    return NextResponse.json({ invoiceId: null }, { status: 500 });
  }
}
