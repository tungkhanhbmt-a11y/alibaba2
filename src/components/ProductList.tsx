import React, { useMemo, useState } from "react";

export interface Product {
  id: number;
  name: string;
  unit: string;
  price: string;
  status?: string;
}

interface Props {
  products: Product[];
  onEdit: (product: Product) => void;
  // onDelete becomes toggle lock/unlock handler receiving full product
  onDelete: (product: Product) => void;
}

function formatPrice(v?: string) {
  // Preserve exact string from the sheet. Trim whitespace but don't alter digits (keep trailing zeros).
  if (v === undefined || v === null) return "";
  return String(v).trim();
}

export default function ProductList({ products, onEdit, onDelete }: Props) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(s) || p.unit.toLowerCase().includes(s)
    );
  }, [products, q]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm kiếm sản phẩm..."
          className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-200"
        />
      </div>

      {/* Mobile: cards */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {filtered.length === 0 && <div className="text-gray-500">Chưa có sản phẩm</div>}
        {filtered.map((p) => (
          <div key={p.id} className="bg-white rounded-lg p-3 shadow-sm border">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-base font-semibold text-gray-800">{p.name}</div>
                <div className="text-sm text-gray-500 mt-1">{p.unit} • {formatPrice(p.price)}</div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex gap-2">
                  <button className="px-3 py-1 rounded bg-yellow-100 text-yellow-800 text-sm" onClick={() => onEdit(p)}>Sửa</button>
                  <button
                    className={`px-3 py-1 rounded text-sm ${p.status === 'locked' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                    onClick={() => onDelete(p)}
                  >
                    {p.status === 'locked' ? 'Mở' : 'Khóa'}
                  </button>
                </div>
              </div>
            </div>
            {/* mobile card */}
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block">
        <div className="overflow-x-auto bg-white rounded-lg border shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3">Tên</th>
                <th className="text-left px-4 py-3">Đơn vị</th>
                <th className="text-right px-4 py-3">Giá</th>
                <th className="px-4 py-3">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-3">{p.name}</td>
                  <td className="px-4 py-3">{p.unit}</td>
                  <td className="px-4 py-3 text-right">{formatPrice(p.price)}</td>
                  <td className="px-4 py-3 text-center">
                    <button className="mr-2 text-yellow-600" onClick={() => onEdit(p)}>Sửa</button>
                    <button className={`${p.status === 'locked' ? 'text-green-600' : 'text-red-600'}`} onClick={() => onDelete(p)}>{p.status === 'locked' ? 'Mở' : 'Khóa'}</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500">Chưa có sản phẩm</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
