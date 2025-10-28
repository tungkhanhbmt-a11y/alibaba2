import { NextResponse } from 'next/server';
import { getBranches } from '../../../lib/googleSheets';

export async function GET() {
  try {
    const branches = await getBranches();
    return NextResponse.json(branches);
  } catch (e) {
    return NextResponse.json([], { status: 500 });
  }
}
