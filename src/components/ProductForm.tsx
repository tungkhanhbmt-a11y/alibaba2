import React, { useState, useEffect } from "react";
import { Product } from "./ProductList";

interface Props {
  onSubmit: (product: Omit<Product, "id">, id?: number) => void;
  editingProduct?: Product | null;
  onCancel?: () => void;
}

export default function ProductForm({ onSubmit, editingProduct, onCancel }: Props) {
  const [form, setForm] = useState<Omit<Product, "id">>({
    name: "",
    unit: "",
    price: "",
  });

  useEffect(() => {
    if (editingProduct) {
      setForm({
        name: editingProduct.name,
        unit: editingProduct.unit,
        price: editingProduct.price,
      });
    } else {
      setForm({ name: "", unit: "", price: "" });
    }
  }, [editingProduct]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target as HTMLInputElement;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Submit price exactly as entered to preserve trailing zeros
    onSubmit(form, editingProduct?.id);
    setForm({ name: "", unit: "", price: "" });
  }

  return (
    <form className="space-y-4 mb-4 bg-white p-4 rounded-lg shadow-sm border" onSubmit={handleSubmit}>
      <div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">{editingProduct ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}</div>
            <div className="text-sm text-gray-500">Nhập thông tin sản phẩm để lưu vào kho</div>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Tên sản phẩm</label>
        <input type="text" name="name" value={form.name} onChange={handleChange} className="w-full rounded-md border px-3 py-2" required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Đơn vị</label>
          <input type="text" name="unit" value={form.unit} onChange={handleChange} className="w-full rounded-md border px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Giá (VND)</label>
          {/* Use text input so user can enter exact value (keep trailing zeros). */}
          <input type="text" name="price" value={form.price} onChange={handleChange} className="w-full rounded-md border px-3 py-2" required />
        </div>
      </div>

      <div className="flex gap-2">
        <button type="submit" className="flex-1 bg-orange-500 text-white py-2 rounded-md font-medium">{editingProduct ? "Cập nhật" : "Thêm"}</button>
        {editingProduct && (
          <button type="button" onClick={onCancel} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-md">Hủy</button>
        )}
      </div>
    </form>
  );
}
