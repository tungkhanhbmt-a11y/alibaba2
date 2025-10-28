import { NextResponse } from 'next/server';
import { getOrders, overwriteBanHang, getInvoiceSummaries, overwriteInvoiceSummaries } from '../../../../lib/googleSheets';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const p = await params;
    const id = p.id;
    const rows = await getOrders();
    const dataRows = rows.slice(1);
    const matches = dataRows.filter((r) => (r[0] || '') === id).map((r) => ({
      invoiceId: r[0] || '',
      date: r[1] || '',
      branch: r[2] || '',
      name: r[3] || '',
      unit: r[4] || '',
      quantity: r[5] || '',
      price: r[6] || '',
      total: r[7] || '',
      note: r[8] || '',
    }));
    return NextResponse.json(matches);
  } catch (e) {
    return NextResponse.json([], { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const p = await params;
    const id = p.id;
    const body = await req.json();
    // body: { date, branch, items: [{name,unit,quantity,price,total,note}] }
    const rows = await getOrders();
    const header = rows[0] || ['Mã phiếu','Ngày','Chi nhánh','Tên','ĐVT','SL','Giá','Thành tiền','Ghi chú'];
    const dataRows = rows.slice(1).filter((r) => (r[0] || '') !== id);
    // append updated rows
    for (const it of body.items) {
      const order = [
        id,
        body.date || '',
        body.branch || '',
        it.name || '',
        it.unit || '',
        String(it.quantity || ''),
        String(it.price || ''),
        String(it.total || ''),
        it.note || body.note || '',
      ];
      dataRows.push(order);
    }
    const allRows = [header, ...dataRows];
    await overwriteBanHang(allRows);

    // update dshoadon summary
    const sums = await getInvoiceSummaries();
    const sumHeader = ['Mã phiếu','Chi nhánh','Ngày','Tổng tiền'];
    const filtered = sums.filter((s) => s.invoiceId !== id);
    const newTotal = body.items.reduce((acc: number, it: any) => acc + (Number(String(it.total).replace(/[^0-9.-]+/g, '')) || 0), 0);
    // compute decimals max
    const decimals = body.items.map((it: any) => {
      const m = String(it.total).match(/\.(\d+)$/);
      return m ? m[1].length : 0;
    });
    const maxDec = decimals.length ? Math.max(...decimals) : 0;
    const totalStr = maxDec > 0 ? newTotal.toFixed(maxDec) : String(Math.round(newTotal));
    filtered.push({ invoiceId: id, branch: body.branch || '', date: body.date || '', total: totalStr });
    const sumRows = [sumHeader, ...filtered.map((s) => [s.invoiceId, s.branch, s.date, s.total])];
    await overwriteInvoiceSummaries(sumRows);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const p = await params;
    const id = p.id;
    const rows = await getOrders();
    const header = rows[0] || ['Mã phiếu','Ngày','Chi nhánh','Tên','ĐVT','SL','Giá','Thành tiền','Ghi chú'];
    const dataRows = rows.slice(1).filter((r) => (r[0] || '') !== id);
    const allRows = [header, ...dataRows];
    await overwriteBanHang(allRows);

    const sums = await getInvoiceSummaries();
    const sumHeader = ['Mã phiếu','Chi nhánh','Ngày','Tổng tiền'];
    const filtered = sums.filter((s) => s.invoiceId !== id);
    const sumRows = [sumHeader, ...filtered.map((s) => [s.invoiceId, s.branch, s.date, s.total])];
    await overwriteInvoiceSummaries(sumRows);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
