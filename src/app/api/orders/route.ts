import { NextResponse } from 'next/server';
import { getOrders, addOrder, addInvoiceSummary } from '../../../lib/googleSheets';

export async function GET() {
  try {
    const rows = await getOrders();
    // Chuyển dữ liệu từ Google Sheets thành mảng Order
    // New schema: [invoiceId, date, branch, name, unit, quantity, price, total, note]
    const orders = rows.slice(1).map((row: string[]) => ({
      invoiceId: row[0] || '',
      date: row[1] || '',
      branch: row[2] || '',
      name: row[3] || '',
      unit: row[4] || '',
      quantity: row[5] || '',
      price: row[6] || '',
      total: row[7] || '',
      note: row[8] || '',
    }));
    return NextResponse.json(orders);
  } catch (e) {
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // generate invoiceId with structure: YYYYMMDD-XXX where XXX is a sequence for the date
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
    const existingForDate = dataRows.filter((r) => (r[dateIndex] || '') === (body.date || '')).length;
    const seq = existingForDate + 1;
    const datePart = (body.date || '').replace(/-/g, '');
    const invoiceId = `${datePart}-${String(seq).padStart(3, '0')}`;

    // helper: preserve decimal places based on price string
    function computeTotalStr(q: any, priceRaw: any) {
      const qty = Number(q || 0);
      const priceStr = (priceRaw == null) ? '' : String(priceRaw);
      const priceNum = Number(priceStr || 0);
      const decimalsMatch = priceStr.match(/\.(\d+)$/);
      const decimals = decimalsMatch ? decimalsMatch[1].length : 0;
      if (decimals > 0) {
        return (qty * priceNum).toFixed(decimals);
      }
      // integer price -> return integer product without formatting
      return String(qty * priceNum);
    }

    let invoiceTotalStr = '';
    if (Array.isArray(body.items)) {
      // append one row per item, include invoiceId as first column
      const decimalsList: number[] = [];
      let sumNum = 0;
      for (const it of body.items) {
        const totalStr = computeTotalStr(it.quantity, it.price);
        const m = String(totalStr).match(/\.(\d+)$/);
        const dec = m ? m[1].length : 0;
        decimalsList.push(dec);
        sumNum += Number(String(totalStr).replace(/[^0-9.-]+/g, '')) || 0;
        const order = [
          invoiceId,
          body.date || '',
          body.branch || '',
          it.name || '',
          it.unit || '',
          String(it.quantity || ''),
          String(it.price || ''),
          totalStr,
          it.note || body.note || '',
        ];
        await addOrder(order);
      }
      const maxDecimals = decimalsList.length ? Math.max(...decimalsList) : 0;
      invoiceTotalStr = maxDecimals > 0 ? sumNum.toFixed(maxDecimals) : String(Math.round(sumNum));
    } else {
      const totalStr = computeTotalStr(body.quantity, body.price);
      const decMatch = String(totalStr).match(/\.(\d+)$/);
      const dec = decMatch ? decMatch[1].length : 0;
      invoiceTotalStr = String(totalStr);
      const order = [
        invoiceId,
        body.date || '',
        body.branch || '',
        body.name || '',
        body.unit || '',
        String(body.quantity || ''),
        String(body.price || ''),
        totalStr,
        body.note || '',
      ];
      await addOrder(order);
    }

    // append a summary row to dshoadon: [invoiceId, branch, date, total]
    try {
      await addInvoiceSummary([invoiceId, body.branch || '', body.date || '', invoiceTotalStr]);
    } catch (e) {
      // ignore summary append errors but do not fail the whole request
      console.error('Failed to write invoice summary', e);
    }

    return NextResponse.json({ success: true, invoiceId });
  } catch (e) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
