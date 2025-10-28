import { useState, useMemo, useEffect } from 'react';

export type OrderInput = {
  date: string;
  branch: string;
  // For multi-line invoice, items is a list of product lines
  items: Array<{
    name: string;
    unit: string;
    quantity: number;
    price: number | string;
    total: string;
    note?: string;
  }>;
  note: string;
};

interface Props {
  onSubmit: (order: OrderInput) => void;
}

export default function OrderForm({ onSubmit }: Props) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [invoiceId, setInvoiceId] = useState<string>('');
  const [branch, setBranch] = useState('');
  const [note, setNote] = useState('');
  const [branches, setBranches] = useState<string[]>([]);

  const [products, setProducts] = useState<Array<{ id: number; name: string; unit: string; price: string; status?: string }>>([]);
  const [itemDraft, setItemDraft] = useState({ name: '', unit: '', quantity: 1, price: '', total: '', note: '' });
  const [items, setItems] = useState<OrderInput['items']>([]);

  const invoiceTotalNum = useMemo(() => {
    return items.reduce((acc, it) => acc + (Number(String(it.total).replace(/[^0-9.-]+/g, '')) || 0), 0);
  }, [items]);

  const invoiceTotalDisplay = useMemo(() => {
    if (items.length === 0) return '0';
    // determine max decimals among item totals
    const decimalsList = items.map((it) => {
      const m = String(it.total).match(/\.(\d+)$/);
      return m ? m[1].length : 0;
    });
    const maxDecimals = Math.max(0, ...decimalsList);
    // format number with dot thousands and '.' decimal separator
    const s = invoiceTotalNum.toFixed(maxDecimals);
    const [intPart, fracPart] = s.split('.');
    const intWithDots = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return maxDecimals > 0 ? `${intWithDots}.${fracPart}` : intWithDots;
  }, [items, invoiceTotalNum]);

  function handleDraftChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target as HTMLInputElement;
    const newDraft: any = { ...itemDraft, [name]: name === 'quantity' ? Number(value) : value };
    if (name === 'quantity' || name === 'price') {
      const q = Number(newDraft.quantity || 0);
      const priceStr = String(newDraft.price || '');
      const p = Number(priceStr || 0);
      const decimalsMatch = priceStr.match(/\.(\d+)$/);
      const decimals = decimalsMatch ? decimalsMatch[1].length : 0;
      newDraft.total = decimals > 0 ? (q * p).toFixed(decimals) : String(q * p);
    }
    setItemDraft(newDraft);
  }

  const [filteredProducts, setFilteredProducts] = useState<typeof products>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  function handleNameInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    // update name in draft
    const newDraft: any = { ...itemDraft, name: val };
    // keep compute total if price/quantity present
    const q = Number(newDraft.quantity || 0);
    const p = Number(newDraft.price || 0);
    newDraft.total = Math.round((q * p + Number.EPSILON) * 100) / 100;
    setItemDraft(newDraft);

    if (!val) {
      setFilteredProducts([]);
      setShowSuggestions(false);
      return;
    }

    const qLower = val.toLowerCase();
    // normalize query to remove diacritics for better matching
    const normalize = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
    const qNorm = normalize(qLower);
    const matches = products.filter((p) => {
      const nameNorm = normalize(p.name || '');
      return nameNorm.includes(qNorm);
    });
    setFilteredProducts(matches.slice(0, 20));
    setShowSuggestions(true);
  }

  function handleSuggestionClick(prodId: number) {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;
    const q = Number(itemDraft.quantity || 0);
    const priceStr = String(prod.price || '');
    const pnum = Number(priceStr || 0);
    const decimalsMatch = priceStr.match(/\.(\d+)$/);
    const decimals = decimalsMatch ? decimalsMatch[1].length : 0;
    const totalStr = decimals > 0 ? (q * pnum).toFixed(decimals) : String(q * pnum);
  setItemDraft({ name: prod.name, unit: prod.unit, quantity: q || 1, price: prod.price, total: totalStr, note: '' });
    setShowSuggestions(false);
    setFilteredProducts([]);
  }

  function handleNameBlur() {
    // small delay to allow click handlers on suggestions
    setTimeout(() => setShowSuggestions(false), 150);
  }

  function addItem() {
    if (!itemDraft.name) return;
    const qty = Number(itemDraft.quantity || 0);
    const priceStr = String(itemDraft.price || '');
    const priceNum = Number(priceStr || 0);
    const decimalsMatch = priceStr.match(/\.(\d+)$/);
    const decimals = decimalsMatch ? decimalsMatch[1].length : 0;
    const totalStr = itemDraft.total ? String(itemDraft.total) : (decimals > 0 ? (qty * priceNum).toFixed(decimals) : String(qty * priceNum));
    const it = {
      name: itemDraft.name,
      unit: itemDraft.unit,
      quantity: itemDraft.quantity || 0,
      price: String(itemDraft.price || ''),
      total: totalStr,
      note: itemDraft.note || '',
    };
    setItems((prev) => [...prev, it]);
    setItemDraft({ name: '', unit: '', quantity: 1, price: '', total: '', note: itemDraft.note || '' });
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;
    onSubmit({ date, branch, items, note });
    // reset
    setDate(new Date().toISOString().slice(0, 10));
    setBranch('');
    setItems([]);
    setNote('');
  }

  useEffect(() => {
    let mounted = true;
    fetch('/api/branches')
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        if (Array.isArray(data)) setBranches(data.filter(Boolean));
      })
      .catch(() => {});
    // load products for item selector
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        if (Array.isArray(data)) {
          // normalize product fields
          const mapped = data.map((p: any) => ({
            id: p.id,
            name: (p.name || '').toString().trim(),
            unit: (p.unit || '').toString().trim(),
            price: (p.price || '').toString().trim(),
            status: p.status || '',
          }));
          setProducts(mapped as any);
        }
      })
      .catch(() => {});
    // fetch next invoice id for the selected date
    fetch(`/api/orders/next?date=${date}`)
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        if (data && data.invoiceId) setInvoiceId(data.invoiceId);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  // recalc invoiceId when date changes
  useEffect(() => {
    let mounted = true;
    fetch(`/api/orders/next?date=${date}`)
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        if (data && data.invoiceId) setInvoiceId(data.invoiceId);
        else setInvoiceId('');
      })
      .catch(() => { if (mounted) setInvoiceId(''); });
    return () => { mounted = false; };
  }, [date]);

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-4 md:p-6 grid gap-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Ngày</label>
          <input name="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Mã phiếu</label>
          <input readOnly value={invoiceId} className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2 bg-gray-50" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Chi nhánh</label>
          <select name="branch" value={branch} onChange={(e) => setBranch(e.target.value)} className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2" required>
            <option value="">-- Chọn chi nhánh --</option>
            {branches.map((b, i) => (
              <option key={i} value={b}>{b}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Ghi chú</label>
          <input name="note" value={note} onChange={(e) => setNote(e.target.value)} className="mt-1 block w-full border border-gray-200 rounded-md px-3 py-2" placeholder="Ghi chú hóa đơn" />
        </div>
      </div>

      {/* Item adder */}
      <div className="mt-2 border border-dashed border-gray-200 rounded p-3">
        <div className="text-sm font-medium text-gray-600 mb-2">Thêm sản phẩm vào hóa đơn</div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
          <div className="relative md:col-span-2">
            <label className="block text-xs text-gray-600 mb-1">Sản phẩm</label>
            <input name="name" placeholder="Nhập tên (gợi ý)" value={itemDraft.name} onChange={handleNameInput} onBlur={handleNameBlur} onFocus={() => { if (itemDraft.name) setShowSuggestions(true); }} className="border border-gray-200 rounded-md px-3 py-2 w-full" />
            {showSuggestions && filteredProducts.length > 0 && (
              <ul className="absolute z-20 left-0 right-0 bg-white border border-gray-200 rounded mt-1 max-h-48 overflow-auto shadow">
                {filteredProducts.map((p) => (
                  <li key={p.id} onMouseDown={() => handleSuggestionClick(p.id)} className="px-3 py-2 hover:bg-gray-100 cursor-pointer">
                    <div className="text-sm font-medium">{p.name}</div>
                    <div className="text-xs text-gray-500">{p.unit} — {p.price}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Ghi chú</label>
            <input name="note" placeholder="Ghi chú dòng" value={itemDraft.note} onChange={handleDraftChange} className="border border-gray-200 rounded-md px-3 py-2 w-full" />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Đơn vị</label>
            <input name="unit" placeholder="Đơn vị" value={itemDraft.unit} onChange={handleDraftChange} className="border border-gray-200 rounded-md px-3 py-2 w-full" />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Số lượng</label>
            <input name="quantity" type="number" min={1} placeholder="SL" value={itemDraft.quantity} onChange={handleDraftChange} className="border border-gray-200 rounded-md px-3 py-2 w-full" />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Giá</label>
            <input name="price" type="number" min={0} step="0.01" placeholder="Giá" value={itemDraft.price} onChange={handleDraftChange} className="border border-gray-200 rounded-md px-3 py-2 w-full" />
          </div>

          <div className="flex items-end">
            <button type="button" onClick={addItem} className="bg-orange-500 text-white px-3 py-2 rounded-md w-full">Thêm</button>
          </div>
        </div>

        {/* Items list */}
        {items.length > 0 && (
          <div className="mt-3">
            <div className="text-sm text-gray-600 mb-2">Mục trong hóa đơn</div>
            <div className="space-y-2">
              {items.map((it, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{it.name} <span className="text-xs text-gray-500">({it.unit})</span></div>
                    <div className="text-xs text-gray-600">{it.quantity} x {String(it.price)} = {String(it.total)}</div>
                  </div>
                  <div>
                    <button type="button" onClick={() => removeItem(idx)} className="text-red-600 text-sm">Xóa</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div />
        <div className="text-right">
          <div className="text-sm text-gray-500">Tổng hóa đơn</div>
          <div className="text-xl font-semibold">{invoiceTotalDisplay} VND</div>
        </div>
      </div>

      <div className="flex gap-2">
        <button type="submit" className="flex-1 bg-orange-500 text-white py-2 rounded-md">Lưu hóa đơn</button>
  <button type="button" onClick={() => { setItems([]); setItemDraft({ name: '', unit: '', quantity: 1, price: '', total: '', note: '' }); setBranch(''); setNote(''); }} className="flex-1 border border-gray-200 py-2 rounded-md">Hủy</button>
      </div>
    </form>
  );
}
