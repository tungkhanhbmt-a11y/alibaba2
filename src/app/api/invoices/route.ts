import { NextResponse } from 'next/server';
import { getInvoiceSummaries } from '../../../lib/googleSheets';

export async function GET() {
  try {
    const rows = await getInvoiceSummaries();
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json([], { status: 500 });
  }
}
