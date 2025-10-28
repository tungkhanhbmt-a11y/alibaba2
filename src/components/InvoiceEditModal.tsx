"use client";
import React, { useEffect, useState } from 'react';
import Modal from './Modal';

interface Item {
  name: string;
  unit: string;
  quantity: string | number;
  price: string;
  total: string;
  note?: string;
}

interface Props {
  invoiceId: string;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  readOnly?: boolean;
}

export default function InvoiceEditModal({ invoiceId, open, onClose, onSaved, readOnly = false }: Props) {
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState('');
  const [branch, setBranch] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [products, setProducts] = useState<Array<{ id?: number; name: string; unit: string; price: string }>>([]);
  const [filtered, setFiltered] = useState<Array<Array<{ id?: number; name: string; unit: string; price: string }>>>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean[]>([]);

  function formatCurrency(val: string | number) {
    const s = String(val ?? '').trim();
    if (s === '') return '';
    // detect decimal places from the original string (if present)
    const m = s.match(/\.(\d+)$/);
    const hasDecimalInSource = !!m;
    const dec = m ? m[1].length : 0; // if source has no decimal part, show no decimals
    const n = Number(s.replace(/[^0-9.-]+/g, ''));
    if (isNaN(n)) return s;
    // show with grouping (dot thousands) using Vietnamese locale so 15120000 -> 15.120.000
    return n.toLocaleString('vi-VN', { minimumFractionDigits: dec, maximumFractionDigits: dec, useGrouping: true });
  }

  function parseNumber(value: string | number) {
    const s = String(value ?? '').trim();
    if (s === '') return 0;
    // remove spaces
    const v = s.replace(/\s+/g, '');
    const hasDot = v.indexOf('.') !== -1;
    const hasComma = v.indexOf(',') !== -1;
    let normalized = v;
    if (hasDot && hasComma) {
      // assume the last occurring symbol is the decimal separator
      const lastDot = v.lastIndexOf('.');
      const lastComma = v.lastIndexOf(',');
      if (lastComma > lastDot) {
        // comma = decimal, remove dots (thousand sep), replace comma with dot
        normalized = v.replace(/\./g, '').replace(/,/g, '.');
      } else {
        // dot = decimal, remove commas (thousand sep)
        normalized = v.replace(/,/g, '');
      }
    } else if (hasComma && !hasDot) {
      // ambiguous: treat comma as decimal if there are 1-2 digits after it, else remove
      const parts = v.split(',');
      if (parts.length === 2 && parts[1].length <= 2) {
        normalized = v.replace(/,/g, '.');
      } else {
        normalized = v.replace(/,/g, '');
      }
    } else {
      // only dot or neither
      normalized = v;
    }
    const n = Number(normalized.replace(/[^0-9.-]+/g, ''));
    return isNaN(n) ? 0 : n;
  }

  // If your sheet stores prices in 'thousands' (e.g. 98 means 98.000 VND),
  // set this flag to true to auto-scale parsed prices by 1000.
  const PRICE_IN_THOUSANDS = true;
  const PRICE_SCALE = PRICE_IN_THOUSANDS ? 1000 : 1;

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch('/api/orders')
      .then((r) => r.json())
      .then((data) => {
        const rows = Array.isArray(data) ? data.filter((d: any) => d.invoiceId === invoiceId) : [];
        if (rows.length > 0) {
          setDate(rows[0].date || '');
          setBranch(rows[0].branch || '');
          const mapped = rows.map((r: any) => {
            const qty = Number(r.quantity || 0);
            const rawPrice = r.price ?? '';
            const parsedPrice = parseNumber(rawPrice) * PRICE_SCALE;
            const parsedTotal = (parseNumber(r.total) || qty * (parseNumber(rawPrice))) * PRICE_SCALE;
            return {
              name: r.name || '',
              unit: r.unit || '',
              quantity: qty,
              // store numeric-like strings (no grouping) so calculations are stable
              price: String(parsedPrice),
              total: String(parsedTotal),
              note: r.note || '',
            } as Item;
          });
          setItems(mapped);
          setFiltered(mapped.map(() => []));
          setShowSuggestions(mapped.map(() => false));
        } else {
          setItems([]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, invoiceId]);

  useEffect(() => {
    if (!open || readOnly) return;
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const mapped = data.map((p: any) => ({
            id: p.id,
            name: (p.name || '').toString().trim(),
            unit: (p.unit || '').toString().trim(),
            price: (p.price || '').toString().trim(),
          }));
          setProducts(mapped as any);
        }
      })
      .catch(() => {});
  }, [open, readOnly]);

  function updateItem(idx: number, patch: Partial<Item>) {
    setItems((prev) =>
      prev.map((it, i) => {
  if (i !== idx) return it;
  const next = { ...it, ...patch } as Item;
  const qty = Number(next.quantity || 0);
  const priceStr = String(next.price || '');
  // priceStr is the value shown in the input (already scaled to VND),
  // so parse it directly without re-applying PRICE_SCALE.
  const priceNum = parseNumber(priceStr);
  const m = priceStr.match(/\.(\d+)$/);
  const dec = m ? m[1].length : 0;
  const computed = qty * priceNum;
  next.total = dec > 0 ? computed.toFixed(dec) : String(Math.round(computed));
  return next;
      })
    );
  }

  function addLine() {
    setItems((p) => {
      setFiltered((f) => [...f, []]);
      setShowSuggestions((s) => [...s, false]);
      return [...p, { name: '', unit: '', quantity: 1, price: '', total: '', note: '' }];
    });
  }

  function removeLine(i: number) {
    setItems((p) => p.filter((_, idx) => idx !== i));
    setFiltered((f) => f.filter((_, idx) => idx !== i));
    setShowSuggestions((s) => s.filter((_, idx) => idx !== i));
  }

  function setFilteredFor(idx: number, list: Array<{ id?: number; name: string; unit: string; price: string }>) {
    setFiltered((prev) => {
      const copy = prev.slice();
      copy[idx] = list;
      return copy;
    });
  }

  function setShowFor(idx: number, v: boolean) {
    setShowSuggestions((prev) => {
      const copy = prev.slice();
      copy[idx] = v;
      return copy;
    });
  }

  function handleNameInput(idx: number, value: string) {
    updateItem(idx, { name: value });
    if (!value) {
      setFilteredFor(idx, []);
      setShowFor(idx, false);
      return;
    }
    // normalize value and product names (remove diacritics) for better matching
    const normalize = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
    const qNorm = normalize(value);
    const matches = products.filter((p) => normalize(p.name || '').includes(qNorm)).slice(0, 20);
    setFilteredFor(idx, matches);
    setShowFor(idx, true);
  }

  function handleSuggestionClick(idx: number, prod: { id?: number; name: string; unit: string; price: string }) {
    const currentQty = Number(items[idx]?.quantity || 0);
    const priceStr = String(prod.price || '');
    const pnum = parseNumber(priceStr) * PRICE_SCALE;
    const m = priceStr.match(/\.(\d+)$/);
    const dec = m ? m[1].length : 0;
    const totalStr = dec > 0 ? (currentQty * pnum).toFixed(dec) : String(Math.round(currentQty * pnum));
    updateItem(idx, { name: prod.name, unit: prod.unit, price: String(pnum), total: totalStr, note: items[idx]?.note || '' });
    setShowFor(idx, false);
    setFilteredFor(idx, []);
  }

  function handleNameBlur(idx: number) {
    setTimeout(() => setShowFor(idx, false), 150);
  }

  function handleSave() {
    setLoading(true);
    fetch(`/api/invoices/${invoiceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, branch, items }),
    })
      .then((r) => r.json())
      .then((res) => {
        if (res && res.success) {
          onSaved && onSaved();
          onClose();
        } else {
          alert('Cập nhật không thành công');
        }
      })
      .catch(() => alert('Lỗi khi cập nhật'))
      .finally(() => setLoading(false));
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className="w-full max-w-6xl mx-2 sm:mx-0">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 max-h-[80vh] overflow-hidden">
          {loading ? (
            <div className="py-8 text-center text-gray-500">Đang tải...</div>
          ) : readOnly ? (
            <div className="print-area p-4">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">HÓA ĐƠN BÁN HÀNG</h2>

                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Mã phiếu</div>
                  <div className="text-lg font-semibold">{invoiceId}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-xs text-gray-600">Chi nhánh</div>
                  <div className="font-medium">{branch}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">Ngày</div>
                  <div className="font-medium">{date}</div>
                </div>
              </div>

              <div className="overflow-auto border border-gray-100 rounded">
                <table className="w-full text-sm table-fixed">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Sản phẩm</th>
                      <th className="px-3 py-2 text-left">ĐVT</th>
                      <th className="px-3 py-2 text-right">SL</th>
                      <th className="px-3 py-2 text-right">Đơn giá</th>
                      <th className="px-3 py-2 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => (
                      <tr key={idx} className="border-t align-top">
                        <td className="px-2 py-2 align-top">{it.name}</td>
                        <td className="px-2 py-2 align-top">{it.unit}</td>
                        <td className="px-2 py-2 align-top text-right">{String(it.quantity)}</td>
                        <td className="px-2 py-2 align-top text-right">{formatCurrency(it.price)}</td>
                        <td className="px-2 py-2 align-top text-right font-medium">{formatCurrency(it.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 text-right">
                <div className="text-sm text-gray-600">Tổng hóa đơn</div>
                <div className="text-2xl font-semibold">{formatCurrency(items.reduce((acc, it) => {
                  const totalFromField = parseNumber(it.total);
                  if (totalFromField > 0) return acc + totalFromField;
                  const qty = Number(it.quantity || 0);
                  const price = parseNumber(it.price);
                  return acc + qty * price;
                }, 0))}</div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="text-xs text-gray-600">Người bán</div>
                <div className="text-xs text-gray-600">Người mua</div>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2">
                <button onClick={() => window.print()} className="px-3 py-2 border rounded bg-white">In</button>
                <button onClick={onClose} className="px-3 py-2 border rounded bg-white">Đóng</button>
              </div>

              <style>{"@media print { body * { visibility: hidden; } .print-area, .print-area * { visibility: visible; } .print-area { position: absolute; left: 0; top: 0; width: 100%; } }"}</style>
            </div>
          ) : (
            <div className="mt-3 space-y-4 flex-1 min-h-0">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Ngày</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border border-gray-200 rounded-md px-3 py-2 w-full" disabled={readOnly} />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Chi nhánh</label>
                  <input value={branch} onChange={(e) => setBranch(e.target.value)} className="border border-gray-200 rounded-md px-3 py-2 w-full" disabled={readOnly} />
                </div>
              </div>

              <div className="overflow-y-auto pr-2 max-h-[60vh] pb-24">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Mục hóa đơn</div>

                  {/* Mobile view: stacked cards */}
                  <div className="space-y-2 block sm:hidden">
                    {items.map((it, idx) => (
                      <div key={idx} className="bg-white rounded-lg p-3 border shadow-sm">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 pr-3">
                            <div className="relative">
                              <input className="w-full border border-transparent focus:border-gray-300 rounded px-2 py-1 text-sm font-semibold" value={it.name} onChange={(e) => handleNameInput(idx, e.target.value)} onBlur={() => handleNameBlur(idx)} placeholder="Tên sản phẩm" disabled={readOnly} />
                              {showSuggestions[idx] && filtered[idx] && filtered[idx].length > 0 && (
                                <ul className="absolute z-40 left-0 right-0 bg-white border border-gray-200 rounded mt-1 max-h-36 overflow-auto shadow">
                                  {filtered[idx].map((p, pi) => (
                                    <li key={pi} onMouseDown={() => handleSuggestionClick(idx, p)} className="px-3 py-2 hover:bg-gray-100 cursor-pointer">
                                      <div className="text-sm font-medium">{p.name}</div>
                                      <div className="text-xs text-gray-500">{p.unit} — {p.price}</div>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                            <div className="mt-2 text-xs text-gray-500">{it.note || 'Ghi chú'}</div>
                          </div>
                            <div className="flex flex-col items-end ml-3 space-y-2">
                            <div className="text-right font-semibold text-lg text-gray-900">{formatCurrency(it.total)}</div>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-3 gap-2 items-center text-sm">
                          <input className="col-span-1 border border-gray-200 rounded px-2 py-1 text-sm" value={it.unit} onChange={(e) => updateItem(idx, { unit: e.target.value })} placeholder="ĐVT" disabled={readOnly} />
                          <input type="number" className="col-span-1 text-center border border-gray-200 rounded px-2 py-1 text-sm" value={String(it.quantity)} onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })} disabled={readOnly} />
                          <input className="col-span-1 text-right border border-gray-200 rounded px-2 py-1 text-sm" value={it.price} onChange={(e) => updateItem(idx, { price: e.target.value })} placeholder="Giá" disabled={readOnly} />
                        </div>

                        <div className="mt-2 text-right">
                          {!readOnly && (
                            <div className="mt-2 text-right">
                              <button onClick={() => removeLine(idx)} className="text-red-600 text-sm px-2 py-1">Xóa</button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    <div className="text-center">
                      <button onClick={addLine} className="text-sm text-blue-600">+ Thêm dòng</button>
                    </div>
                  </div>

                  {/* Desktop / tablet view: table */}
                  <div className="hidden sm:block">
                    <div className="overflow-auto border border-gray-100 rounded">
                      <table className="w-full table-fixed text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left">Sản phẩm</th>
                            <th className="px-3 py-2 text-left">ĐVT</th>
                            <th className="px-3 py-2 text-right">SL</th>
                            <th className="px-3 py-2 text-right">Giá</th>
                            <th className="px-3 py-2 text-right">Thành tiền</th>
                            <th className="px-3 py-2" />
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((it, idx) => (
                            <tr key={idx} className="border-t align-top">
                              <td className="px-2 py-2 align-top w-1/3">
                                <div className="relative">
                                  <input className="w-full border border-transparent focus:border-gray-300 rounded px-2 py-1 text-sm" value={it.name} onChange={(e) => handleNameInput(idx, e.target.value)} onBlur={() => handleNameBlur(idx)} placeholder="Tên sản phẩm" disabled={readOnly} />
                                  {showSuggestions[idx] && filtered[idx] && filtered[idx].length > 0 && (
                                    <ul className="absolute z-30 left-0 right-0 bg-white border border-gray-200 rounded mt-1 max-h-40 overflow-auto shadow">
                                      {filtered[idx].map((p, pi) => (
                                        <li key={pi} onMouseDown={() => handleSuggestionClick(idx, p)} className="px-3 py-2 hover:bg-gray-100 cursor-pointer">
                                          <div className="text-sm font-medium">{p.name}</div>
                                          <div className="text-xs text-gray-500">{p.unit} — {p.price}</div>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                                <div className="mt-2">
                                  <input className="w-full border border-transparent focus:border-gray-300 rounded px-2 py-1 text-xs text-gray-600" value={it.note || ''} onChange={(e) => updateItem(idx, { note: e.target.value })} placeholder="Ghi chú" disabled={readOnly} />
                                </div>
                              </td>
                              <td className="px-2 py-2 align-top w-1/12"><input className="w-full border border-transparent focus:border-gray-300 rounded px-2 py-1 text-sm" value={it.unit} onChange={(e) => updateItem(idx, { unit: e.target.value })} placeholder="ĐVT" disabled={readOnly} /></td>
                              <td className="px-2 py-2 align-top w-1/12"><input type="number" className="w-full text-right border border-transparent focus:border-gray-300 rounded px-2 py-1 text-sm" value={String(it.quantity)} onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })} disabled={readOnly} /></td>
                              <td className="px-2 py-2 align-top w-1/12"><input className="w-full text-right border border-transparent focus:border-gray-300 rounded px-2 py-1 text-sm" value={it.price} onChange={(e) => updateItem(idx, { price: e.target.value })} disabled={readOnly} /></td>
                              <td className="px-2 py-2 align-top w-1/12 text-right font-medium">{formatCurrency(it.total)}</td>
                              <td className="px-2 py-2 align-top">{!readOnly && <button onClick={() => removeLine(idx)} className="text-red-600 text-lg px-2 py-1">✕</button>}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {!readOnly && <div className="mt-3 text-right"><button onClick={addLine} className="text-sm text-blue-600">+ Thêm dòng</button></div>}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div />
                <div className="text-right">
                  <div className="text-sm text-gray-500">Tổng hóa đơn</div>
                    <div className="text-lg font-semibold">{formatCurrency(items.reduce((acc, it) => {
                      const qty = Number(it.quantity || 0);
                      const price = parseNumber(it.price);
                      return acc + qty * price;
                    }, 0))}</div>
                </div>
              </div>

              {/* Fixed footer so Save/Add are always visible on mobile */}
              <div className="fixed left-1/2 -translate-x-1/2 bottom-4 z-50 w-[calc(100%-2rem)] sm:w-[min(96rem,calc(100%-2rem))]">
                <div className="bg-white/95 backdrop-blur-sm border rounded-md px-3 py-2 flex items-center justify-between shadow-sm">
                  <div>
                    {!readOnly && <button onClick={addLine} className="text-sm text-blue-600">+ Thêm dòng</button>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={onClose} className="px-3 py-2 border rounded">{readOnly ? 'Đóng' : 'Hủy'}</button>
                    {!readOnly && <button onClick={handleSave} className="px-4 py-2 bg-orange-500 text-white rounded">Lưu</button>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
