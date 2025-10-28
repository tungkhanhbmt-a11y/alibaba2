import { NextResponse } from 'next/server';
import { getProducts, addProduct, updateProduct, deleteProduct, setProductStatus } from '../../../lib/productSheets';

export async function GET() {
  try {
    const rows = await getProducts();
    // Sheet now has columns: A=ten (name), B=don vi (unit), C=gia (price)
    const products = rows.slice(1).map((row: string[], idx: number) => ({
      id: idx + 1,
      name: row[0] || '',
      unit: row[1] || '',
      price: row[2] || '',
      status: row[3] || '',
    }));
    return NextResponse.json(products);
  } catch (e) {
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
  // body should contain: name, unit, price
  // ensure we write a 4-column row (A..D) so status exists (default empty)
  const product = [body.name || '', body.unit || '', body.price || '', body.status || ''];
    await addProduct(product);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
  // Preserve status value when updating name/unit/price: read existing rows
  const rows = await getProducts();
  const existing = rows[body.id] || [];
  const status = existing[3] || '';
  const product = [body.name || '', body.unit || '', body.price || '', status];
  // body.id is 1-based id used in UI; convert to zero-based data index
  await updateProduct(body.id - 1, product);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    await deleteProduct(body.id - 1);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    // body: { id: number, status: string }
    await setProductStatus(body.id - 1, body.status || '');
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
